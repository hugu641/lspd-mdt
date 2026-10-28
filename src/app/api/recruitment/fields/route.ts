import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const DEFAULT_FORM_FIELDS = [
  {
    name: "availability",
    label: "Vos disponibilités horaires & présence en ville",
    type: "text",
    placeholder: "Ex: Soirs en semaine (20h-00h), week-ends...",
    helpText: "Indiquez vos créneaux réguliers de connexion RP.",
    options: null,
    required: true,
    orderIndex: 1,
    enabled: true,
    isSystem: true,
  },
  {
    name: "experience",
    label: "Expériences antérieures (Services d'urgence, sécurité, légal)",
    type: "textarea",
    placeholder: "Ex: Ancien agent de sécurité, aucune sanction, permis valides...",
    helpText: "Détaillez vos antécédents professionnels et vos compétences.",
    options: null,
    required: false,
    orderIndex: 2,
    enabled: true,
    isSystem: false,
  },
  {
    name: "motivation",
    label: "Lettre de motivation pour intégrer le LSPD",
    type: "textarea",
    placeholder: "Expliquez pourquoi vous souhaitez porter l'uniforme du Los Santos Police Department...",
    helpText: "Présentez vos motivations réelles et ce que vous apporterez au service.",
    options: null,
    required: true,
    orderIndex: 3,
    enabled: true,
    isSystem: true,
  },
  {
    name: "hasRecord",
    label: "Avez-vous déjà eu des démêlés judiciaires ou un casier ?",
    type: "radio",
    placeholder: null,
    helpText: "Une vérification sera effectuée auprès du casier judiciaire central.",
    options: "Non (Casier vierge), Oui (Anciennes condamnations)",
    required: true,
    orderIndex: 4,
    enabled: true,
    isSystem: false,
  },
  {
    name: "gunLicense",
    label: "Êtes-vous titulaire du PPA (Permis de Port d'Arme) ?",
    type: "select",
    placeholder: "Sélectionnez votre situation",
    helpText: "Statut de votre port d'arme civil.",
    options: "Oui - PPA Valide, Non - Pas encore passé, En cours de passage",
    required: false,
    orderIndex: 5,
    enabled: true,
    isSystem: false,
  },
];

// GET: List all configured recruitment form fields
export async function GET() {
  try {
    let fields = await prisma.recruitmentFormField.findMany({
      orderBy: { orderIndex: "asc" },
    });

    // Seed defaults if empty
    if (fields.length === 0) {
      for (const field of DEFAULT_FORM_FIELDS) {
        await prisma.recruitmentFormField.create({
          data: field,
        });
      }
      fields = await prisma.recruitmentFormField.findMany({
        orderBy: { orderIndex: "asc" },
      });
    }

    return NextResponse.json(fields);
  } catch (error: any) {
    console.error("GET /api/recruitment/fields error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les champs du formulaire" },
      { status: 500 }
    );
  }
}

// POST: Add a new recruitment form field
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.label || !body.label.trim()) {
      return NextResponse.json(
        { error: "L'intitulé de la question est obligatoire." },
        { status: 400 }
      );
    }

    // Generate unique name identifier
    const baseName =
      body.name?.trim() ||
      body.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 30) ||
      `field_${Date.now()}`;

    // Ensure uniqueness
    let uniqueName = baseName;
    let counter = 1;
    while (await prisma.recruitmentFormField.findFirst({ where: { name: uniqueName } })) {
      uniqueName = `${baseName}_${counter}`;
      counter++;
    }

    // Get highest orderIndex
    const lastField = await prisma.recruitmentFormField.findFirst({
      orderBy: { orderIndex: "desc" },
    });
    const nextOrder = (lastField?.orderIndex ?? 0) + 1;

    const newField = await prisma.recruitmentFormField.create({
      data: {
        name: uniqueName,
        label: body.label.trim(),
        type: body.type || "text",
        placeholder: body.placeholder?.trim() || null,
        helpText: body.helpText?.trim() || null,
        options: body.options?.trim() || null,
        required: Boolean(body.required),
        orderIndex: body.orderIndex !== undefined ? body.orderIndex : nextOrder,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
        isSystem: false,
      },
    });

    return NextResponse.json(newField, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/recruitment/fields error:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de créer le champ" },
      { status: 500 }
    );
  }
}
