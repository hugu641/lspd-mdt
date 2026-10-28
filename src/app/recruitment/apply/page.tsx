"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Bot,
  ExternalLink,
  Phone,
  Calendar,
  Send,
  FileCheck,
  Check,
  X,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function CandidateApplicationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "555-",
    age: "",
    discordTag: "",
    discordId: "",
    discordAvatar: "",
    availability: "",
    experience: "",
    motivation: "",
    hasRecord: "Non",
    honorPledge: false,
  });

  const [discordVerified, setDiscordVerified] = useState(false);
  const [isOnGuild, setIsOnGuild] = useState<boolean | null>(null);
  const [discordError, setDiscordError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Veuillez renseigner votre nom et prénom in-game.");
      return;
    }

    if (!formData.honorPledge) {
      alert("Veuillez certifier sur l'honneur l'exactitude des informations fournies.");
      return;
    }

    setSubmitting(true);
    try {
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
          availability: formData.availability.trim() || null,
          experience: formData.experience.trim() || null,
          motivation: formData.motivation.trim() || null,
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
              Merci <strong>{submittedCandidate.firstName} {submittedCandidate.lastName}</strong>. Votre candidature au poste de Cadet a été transmise à la Division du Recrutement du LSPD.
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
              1. Les officiers recruteurs examineront votre dossier dans les meilleurs délais.
              <br />
              2. Si votre profil est retenu, <strong>notre Bot vous enverra un Message Privé officiel sur Discord</strong> et vous attribuera automatiquement le rôle d'accès aux salons de recrutement.
              <br />
              3. Gardez vos messages privés ouverts sur Discord et surveillez vos notifications !
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
                  availability: "",
                  experience: "",
                  motivation: "",
                  hasRecord: "Non",
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
                  1. Vérification Discord (Obligatoire pour rôle & notification)
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

                {/* Manual Fallback if OAuth fails or blocked */}
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
              SECTION 3: DISPONIBILITÉS & EXPÉRIENCES
              ================================================================= */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>3. Disponibilités & Expériences</span>
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Vos Disponibilités (Horaires de jeu habituels, jours de présence)
              </label>
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="Ex: En soirée de 20h à 00h en semaine, disponible tout le week-end..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Expériences préalables (Services de police, sécurité, autres métiers légaux)
              </label>
              <textarea
                rows={3}
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="Détaillez vos expériences passées (BCSO, SASP, EMS, convoyeur de fonds, entreprise privée...)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* =================================================================
              SECTION 4: MOTIVATIONS & DÉCLARATION
              ================================================================= */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>4. Motivations & Engagement</span>
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Pourquoi souhaitez-vous rejoindre le Los Santos Police Department ? *
              </label>
              <textarea
                rows={4}
                required
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="Expliquez vos motivations, ce qui vous attire dans le service et ce que vous souhaitez apporter à la brigade..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Avez-vous déjà eu des condamnations au casier judiciaire ?
              </label>
              <select
                value={formData.hasRecord}
                onChange={(e) => setFormData({ ...formData, hasRecord: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="Non">Non, casier judiciaire totalement vierge</option>
                <option value="Oui">Oui, des antécédents anciens ou mineurs</option>
              </select>
            </div>

            {/* Honor Pledge */}
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
