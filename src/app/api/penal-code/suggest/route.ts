import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Groq retires models over time: when the configured one is gone, pick an available chat model.
let fallbackModel: string | null = null;
const MODEL_PREFERENCES = [/gpt-oss-120b/i, /llama.*70b/i, /llama-4/i, /qwen/i, /gpt-oss/i, /llama/i];
const NON_CHAT_MODEL = /whisper|tts|guard|embed|playai|orpheus|distil|compound/i;

async function findAvailableModel(apiKey: string): Promise<string | null> {
  const res = await fetch(GROQ_API_URL.replace(/\/chat\/completions$/, "/models"), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const ids: string[] = ((await res.json())?.data || [])
    .filter((m: any) => m?.id && m.active !== false && !NON_CHAT_MODEL.test(m.id))
    .map((m: any) => m.id);
  for (const pref of MODEL_PREFERENCES) {
    const match = ids.find((id) => pref.test(id));
    if (match) return match;
  }
  return ids[0] || null;
}

// POST { facts: string } -> { suggestions: [{ item, count, reason }] }
// The AI only returns article codes; fines/jail/sanctions always come from the database.
export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Assistant IA non configuré : ajoutez GROQ_API_KEY dans les variables d'environnement." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const facts = typeof body.facts === "string" ? body.facts.trim() : "";
    if (facts.length < 5) {
      return NextResponse.json({ error: "Décrivez les faits constatés (au moins quelques mots)." }, { status: 400 });
    }
    if (facts.length > 3000) {
      return NextResponse.json({ error: "Texte trop long (3000 caractères maximum)." }, { status: 400 });
    }

    const items = await prisma.penalCodeItem.findMany({ orderBy: { orderIndex: "asc" } });
    // Code + title only: with descriptions the prompt (~6k tokens) exceeds Groq's free-tier tokens/minute.
    const catalog = items.map((i) => `${i.code} | ${i.title}`).join("\n");

    const callGroq = (model: string) => fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Tu es l'assistant juridique du MDT de la police de Los Santos (jeu de rôle GTA RP). " +
              "À partir des faits décrits par un agent, choisis UNIQUEMENT parmi les articles du code pénal fournis ceux qui s'appliquent. " +
              "N'invente jamais d'article. Ne retiens que les infractions clairement caractérisées par les faits ; évite les doublons (ex. ne cumule pas un délit et sa version aggravée). " +
              'Réponds en JSON : {"suggestions":[{"code":"CP 210","count":1,"reason":"justification courte en français"}]}. ' +
              "count = nombre de fois où l'infraction est commise (1 par défaut).\n\nCODE PÉNAL (code | intitulé) :\n" +
              catalog,
          },
          { role: "user", content: facts },
        ],
      }),
    });

    let groqRes = await callGroq(fallbackModel || GROQ_MODEL);
    if ((groqRes.status === 404 || groqRes.status === 400) && !fallbackModel) {
      const detail = await groqRes.clone().text().catch(() => "");
      if (/model/i.test(detail) && /(not exist|not found|decommission|access)/i.test(detail)) {
        fallbackModel = await findAvailableModel(apiKey);
        console.warn(`Groq model "${GROQ_MODEL}" unavailable, falling back to "${fallbackModel}"`);
        if (fallbackModel) groqRes = await callGroq(fallbackModel);
      }
    }

    if (!groqRes.ok) {
      const detail = await groqRes.text().catch(() => "");
      console.error("Groq API error:", groqRes.status, detail.slice(0, 500));
      let groqMessage = "";
      try {
        groqMessage = JSON.parse(detail)?.error?.message || "";
      } catch {}
      const msg =
        groqRes.status === 429 || groqRes.status === 413
          ? "Limite de requêtes Groq atteinte, réessayez dans une minute."
          : groqRes.status === 401
          ? "Clé GROQ_API_KEY invalide."
          : "Le service d'IA est indisponible pour le moment.";
      // Groq's own message (never contains the key) makes production failures diagnosable.
      return NextResponse.json(
        { error: groqMessage ? `${msg} (Groq ${groqRes.status} : ${groqMessage.slice(0, 200)})` : msg },
        { status: 502 }
      );
    }

    const completion = await groqRes.json();
    let parsed: any = {};
    try {
      parsed = JSON.parse(completion?.choices?.[0]?.message?.content || "{}");
    } catch {
      return NextResponse.json({ error: "Réponse de l'IA illisible, reformulez les faits." }, { status: 502 });
    }

    const byCode = new Map(items.map((i) => [i.code.toUpperCase().replace(/\s+/g, " "), i]));
    const seen = new Set<string>();
    const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
      .map((s: any) => {
        const item = byCode.get(String(s?.code || "").toUpperCase().replace(/\s+/g, " ").trim());
        if (!item || seen.has(item.id)) return null; // drop invented or duplicate codes
        seen.add(item.id);
        const count = Math.min(10, Math.max(1, Math.round(Number(s.count) || 1)));
        return { item, count, reason: typeof s.reason === "string" ? s.reason.slice(0, 300) : "" };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("POST /api/penal-code/suggest error:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse des faits." }, { status: 500 });
  }
}
