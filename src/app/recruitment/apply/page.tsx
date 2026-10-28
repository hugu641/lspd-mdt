"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Bot,
  Calendar,
  Send,
  FileCheck,
  Check,
  X,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  Phone,
} from "lucide-react";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string; // text, textarea, number, select, radio, checkbox
  placeholder?: string | null;
  helpText?: string | null;
  options?: string | null;
  required: boolean;
  orderIndex: number;
  enabled: boolean;
}

export default function CandidateApplicationPage() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);

  // Core Identity State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "555-",
    age: "",
    discordTag: "",
    discordId: "",
    discordAvatar: "",
    honorPledge: false,
  });

  // Dynamic answers keyed by field.id
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const [discordVerified, setDiscordVerified] = useState(false);
  const [isOnGuild, setIsOnGuild] = useState<boolean | null>(null);
  const [discordError, setDiscordError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any | null>(null);

  // Load configured fields
  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await fetch("/api/recruitment/fields");
        if (res.ok) {
          const data: FormField[] = await res.json();
          const activeFields = data.filter((f) => f.enabled);
          setFields(activeFields);

          // Initialize answer defaults
          const initialAnswers: Record<string, any> = {};
          activeFields.forEach((f) => {
            if (f.type === "checkbox") {
              initialAnswers[f.id] = false;
            } else if (f.type === "radio" && f.options) {
              const opts = f.options.split(",").map((s) => s.trim()).filter(Boolean);
              initialAnswers[f.id] = opts[0] || "";
            } else {
              initialAnswers[f.id] = "";
            }
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des champs :", err);
      } finally {
        setLoadingFields(false);
      }
    }
    fetchFields();
  }, []);

  // Parse query params for Discord OAuth return
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const discordId = params.get("discordId");
      const discordTag = params.get("discordTag");
      const discordAvatar = params.get("discordAvatar");
      const onGuildParam = params.get("onGuild");
      const verified = params.get("verified");
      const error = params.get("error");

      if (error) {
        setDiscordError(decodeURIComponent(error));
      }

      if (discordId) {
        setFormData((prev) => ({
          ...prev,
          discordId,
          discordTag: discordTag || prev.discordTag,
          discordAvatar: discordAvatar || prev.discordAvatar,
        }));
        setDiscordVerified(true);
        setIsOnGuild(onGuildParam === "1");
      }
    }
  }, []);

  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Veuillez renseigner votre nom et prénom in-game.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Veuillez renseigner votre numéro de téléphone in-game.");
      return;
    }

    // Validate required dynamic fields
    for (const field of fields) {
      if (field.required) {
        const val = answers[field.id];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && !val.trim()) ||
          (field.type === "checkbox" && val !== true)
        ) {
          alert(`Le champ obligatoire "${field.label}" doit être renseigné.`);
          return;
        }
      }
    }

    if (!formData.honorPledge) {
      alert("Veuillez certifier sur l'honneur l'exactitude des informations fournies.");
      return;
    }

    setSubmitting(true);
    try {
      // Build structured answers list
      const customAnswersPayload = fields.map((f) => ({
        id: f.id,
        name: f.name,
        label: f.label,
        type: f.type,
        value: answers[f.id] !== undefined ? answers[f.id] : null,
      }));

      // Extract convenient standard columns if matched by name
      const findAnswerByName = (name: string) => {
        const f = fields.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return f && answers[f.id] ? String(answers[f.id]).trim() : null;
      };

      const availability = findAnswerByName("availability");
      const motivation = findAnswerByName("motivation");
      const experience = findAnswerByName("experience");

      const res = await fetch("/api/recruitment/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          age: formData.age ? parseInt(formData.age) : null,
          discordTag: formData.discordTag.trim() || null,
          discordId: formData.discordId.trim() || null,
          discordAvatar: formData.discordAvatar.trim() || null,
          availability: availability,
          motivation: motivation,
          experience: experience,
          customAnswers: customAnswersPayload,
          status: "En attente",
        }),
      });

      if (res.ok) {
        const candidate = await res.json();
        setSubmittedCandidate(candidate);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la transmission du dossier.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion lors de l'envoi de la candidature.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedCandidate) {
    return (
      <div className="min-h-screen bg-[#07080f] py-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full police-card p-8 rounded-3xl border border-emerald-500/50 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/50">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dossier Transmis avec Succès</span>
            </div>
            <h1 className="text-2xl font-black text-white">Candidature Enregistrée</h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Merci <strong>{submittedCandidate.firstName} {submittedCandidate.lastName}</strong>. Votre dossier a été transmis à la Division du Recrutement du LSPD.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Récapitulatif de votre dossier :
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>Identité : <strong className="text-white">{submittedCandidate.firstName} {submittedCandidate.lastName}</strong></div>
              <div>Téléphone : <span className="font-mono text-amber-400 font-bold">{submittedCandidate.phone || "Non renseigné"}</span></div>
              {submittedCandidate.discordTag && (
                <div>Discord : <span className="font-mono text-indigo-300 font-bold">{submittedCandidate.discordTag}</span></div>
              )}
              <div>Statut : <span className="text-amber-400 font-bold">En attente d'examen</span></div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-left text-xs text-purple-200 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Prochaines étapes de votre recrutement :</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              1. Les officiers recruteurs examineront votre candidature dans les meilleurs délais.
              <br />
              2. Si votre dossier est retenu, <strong>notre bot Discord vous attribuera automatiquement le rôle d'accès aux salons d'entretien</strong> et vous recevrez un MP officiel.
              <br />
              3. Vérifiez régulièrement vos messages privés sur Discord !
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSubmittedCandidate(null);
                setFormData({
                  firstName: "",
                  lastName: "",
                  phone: "555-",
                  age: "",
                  discordTag: "",
                  discordId: "",
                  discordAvatar: "",
                  honorPledge: false,
                });
                setDiscordVerified(false);
              }}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Soumettre une autre candidature
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080f] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-600/50 text-purple-200 text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-950/40">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Los Santos Police Department • Division Recrutement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Candidature d'Incorporation
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Remplissez ce formulaire officiel pour postuler au sein du LSPD. Vous serez notifié par message privé sur Discord dès validation de votre dossier.
          </p>
        </div>

        {/* Discord Error Banner if any */}
        {discordError && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{discordError}</span>
            </div>
            <button onClick={() => setDiscordError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* =================================================================
              SECTION 1: VÉRIFICATION DISCORD
              ================================================================= */}
          <div className="police-card p-6 rounded-2xl border border-purple-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  1. Vérification Discord (Recommandée pour rôle & notification)
                </h2>
              </div>

              {discordVerified && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Compte Vérifié</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              La vérification Discord permet de relier votre candidature à votre compte. En cas d'acceptation, 
              <strong> notre bot vous attribuera automatiquement votre rôle Discord</strong> pour accéder aux salons et vocaux d'entretien, et vous notifiera en MP.
            </p>

            {discordVerified ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {formData.discordAvatar ? (
                    <img
                      src={formData.discordAvatar}
                      alt="Avatar Discord"
                      className="w-12 h-12 rounded-xl object-cover border border-purple-500/60"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
                      <Bot className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{formData.discordTag}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60">
                        Certifié
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">ID: {formData.discordId}</div>
                  </div>
                </div>

                {isOnGuild === false && (
                  <div className="text-[11px] text-amber-300 p-2 rounded-lg bg-amber-950/40 border border-amber-800/40">
                    ⚠️ Pensez à rejoindre le serveur Discord LSPD pour que le rôle puisse vous être attribué.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <a
                  href="/api/recruitment/discord/login"
                  className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-lg shadow-[#5865F2]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Vérifier mon compte Discord en 1 clic</span>
                </a>

                {/* Saisie manuelle si besoin */}
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Ou saisie manuelle si nécessaire
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.discordTag}
                    onChange={(e) => setFormData({ ...formData, discordTag: e.target.value })}
                    placeholder="Pseudo Discord (ex: hugu641)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    value={formData.discordId}
                    onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                    placeholder="ID Discord (17-19 chiffres)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* =================================================================
              SECTION 2: IDENTITÉ & CONTACT IN-GAME
              ================================================================= */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>2. Identité In-Game du Personnage</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Prénom In-Game *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ex: John"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nom In-Game *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ex: Doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Numéro de Téléphone (In-Game) *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: 555-0182"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Âge du Personnage</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Ex: 25"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* =================================================================
              SECTION 3: QUESTIONS DU FORMULAIRE (CONFIGURÉES PAR LES RECRUTEURS)
              ================================================================= */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-400" />
                <span>3. Questionnaire & Profil du Candidat</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {fields.length} question{fields.length > 1 ? "s" : ""}
              </span>
            </div>

            {loadingFields ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Chargement du formulaire...</span>
              </div>
            ) : fields.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                Aucune question additionnelle configurée.
              </div>
            ) : (
              <div className="space-y-5">
                {fields.map((field) => {
                  const currentValue = answers[field.id];

                  return (
                    <div key={field.id} className="space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-200">
                          {field.label} {field.required && <span className="text-purple-400 font-bold">*</span>}
                        </label>
                        {field.required ? (
                          <span className="text-[10px] text-purple-400/80 font-mono">Obligatoire</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Facultatif</span>
                        )}
                      </div>

                      {field.helpText && (
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {field.helpText}
                        </p>
                      )}

                      {/* TEXT INPUT */}
                      {field.type === "text" && (
                        <input
                          type="text"
                          required={field.required}
                          value={currentValue ?? ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Votre réponse..."}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      )}

                      {/* TEXTAREA INPUT */}
                      {field.type === "textarea" && (
                        <textarea
                          rows={4}
                          required={field.required}
                          value={currentValue ?? ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Détaillez votre réponse ici..."}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                        />
                      )}

                      {/* NUMBER INPUT */}
                      {field.type === "number" && (
                        <input
                          type="number"
                          required={field.required}
                          value={currentValue ?? ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "0"}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      )}

                      {/* SELECT DROPDOWN */}
                      {field.type === "select" && (
                        <select
                          required={field.required}
                          value={currentValue ?? ""}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                        >
                          <option value="">
                            {field.placeholder || "-- Sélectionnez une option --"}
                          </option>
                          {field.options
                            ?.split(",")
                            .map((opt) => opt.trim())
                            .filter(Boolean)
                            .map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                        </select>
                      )}

                      {/* RADIO GROUP */}
                      {field.type === "radio" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {field.options
                            ?.split(",")
                            .map((opt) => opt.trim())
                            .filter(Boolean)
                            .map((opt) => {
                              const isSelected = currentValue === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleAnswerChange(field.id, opt)}
                                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                                    isSelected
                                      ? "bg-purple-950/80 border-purple-500 text-purple-200 shadow-md"
                                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSelected
                                        ? "border-purple-400 bg-purple-600"
                                        : "border-slate-600 bg-slate-800"
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* CHECKBOX */}
                      {field.type === "checkbox" && (
                        <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
                          <input
                            type="checkbox"
                            required={field.required}
                            checked={Boolean(currentValue)}
                            onChange={(e) => handleAnswerChange(field.id, e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-800"
                          />
                          <span className="text-xs text-slate-300 font-medium leading-relaxed">
                            {field.placeholder || "J'accepte et confirme cette condition."}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =================================================================
              SECTION 4: ENGAGEMENT SUR L'HONNEUR & ENVOI
              ================================================================= */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>4. Engagement & Validation</span>
            </h2>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                required
                checked={formData.honorPledge}
                onChange={(e) => setFormData({ ...formData, honorPledge: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-800"
              />
              <span className="text-xs text-slate-300 leading-relaxed font-medium">
                Je certifie sur l'honneur l'exactitude des renseignements fournis et m'engage à respecter scrupuleusement le code de déontologie, le règlement intérieur et la hiérarchie du Los Santos Police Department.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-purple-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Envoi du dossier en cours..." : "Soumettre ma candidature au LSPD"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
