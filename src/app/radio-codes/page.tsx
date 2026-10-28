"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Radio,
  Search,
  Shield,
  Copy,
  Check,
  AlertTriangle,
  Siren,
  Users,
  Volume2,
  FileText,
  X,
} from "lucide-react";

interface CodeItem {
  id?: string;
  code: string;
  title: string;
  description?: string;
  codeType: "TEN_CODE" | "URGENCY_CODE" | "UNIT_CALLSIGN";
  orderIndex?: number;
}

// Fallback high-speed local data if API is loading or network latency occurs
const DEFAULT_TEN_CODES: { code: string; title: string; category?: string; urgent?: boolean; warning?: boolean }[] = [
  { code: "10-1", title: "Officier à terre / en danger", urgent: true },
  { code: "10-3", title: "Silence Radio", warning: true },
  { code: "10-4", title: "Affirmatif / Bien reçu" },
  { code: "10-5", title: "Négatif / Refus" },
  { code: "10-6", title: "Officier Occupé", warning: true },
  { code: "10-7", title: "Pause de Service" },
  { code: "10-8", title: "Pris de Service / Disponible" },
  { code: "10-9", title: "Répéter le message" },
  { code: "10-10", title: "Fin de Service" },
  { code: "10-14", title: "Prise d'otage", urgent: true },
  { code: "10-17", title: "En Route Vers" },
  { code: "10-19", title: "Retour Commissariat (PDP)" },
  { code: "10-20", title: "Demande de Localisation" },
  { code: "10-22", title: "Annulez le dernier message" },
  { code: "10-30", title: "Coups de feu signalés", urgent: true },
  { code: "10-33", title: "Suspect appréhendé" },
  { code: "10-35", title: "Demande de Renforts", urgent: true },
  { code: "10-37", title: "Véhicule Suspect", warning: true },
  { code: "10-38", title: "Contrôle Routier en cours" },
  { code: "10-40", title: "En Attente d'Affectation" },
  { code: "10-41", title: "Début de Patrouille" },
  { code: "10-42", title: "Fin de Patrouille" },
  { code: "10-43", title: "Rapport de Situation" },
  { code: "10-44", title: "Demande de Quitter Patrouille" },
  { code: "10-45", title: "Braquage en cours", urgent: true },
  { code: "10-50", title: "Accident de la Route" },
  { code: "10-52", title: "Demande d'Assistance Médicale", warning: true },
  { code: "10-60", title: "Vente de Stupéfiants" },
  { code: "10-80", title: "Refus d'Obtempérer / Poursuite", urgent: true },
  { code: "10-99", title: "Urgence Absolue / Tous sur Zone", urgent: true },
];

const DEFAULT_URGENCY_CODES = [
  { code: "CODE 1", title: "Non Urgent", desc: "Déplacement standard (aucun avertisseur)", color: "emerald" },
  { code: "CODE 2", title: "Urgence", desc: "Gyrophares seuls sans avertisseur sonore", color: "amber" },
  { code: "CODE 3", title: "Urgence Grave", desc: "Gyrophares + sirènes deux-tons", color: "rose" },
  { code: "CODE 4", title: "Intervention Terminée", desc: "Situation sous contrôle, retour patrouille", color: "slate" },
];

const DEFAULT_UNITS = [
  { code: "Lincoln", title: "Patrouille Seul", desc: "1 agent véhiculé" },
  { code: "Adam", title: "Patrouille à Deux", desc: "2 agents véhiculés" },
  { code: "Tango", title: "Patrouille à Trois", desc: "3 agents" },
  { code: "XRay", title: "Patrouille à Quatre", desc: "4 agents" },
  { code: "Mary", title: "Patrouille à Moto", desc: "Brigade motorisée" },
  { code: "Henry", title: "Patrouille en Hélico", desc: "Air Support LSPD" },
  { code: "David", title: "Patrouille SWAT", desc: "Intervention lourde" },
  { code: "Nora", title: "Patrouille DOA / Enquête", desc: "Banalisé / Détectives" },
];

export default function RadioCodesPage() {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showMirandaModal, setShowMirandaModal] = useState(false);
  const [filterMode, setFilterMode] = useState<"ALL" | "URGENT" | "10_CODES" | "CODES" | "UNITS">("ALL");

  useEffect(() => {
    async function loadCodes() {
      try {
        const res = await fetch("/api/radio-codes");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCodes(data);
        }
      } catch (err) {
        console.error("Error loading radio codes:", err);
      }
    }
    loadCodes();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Merge DB 10-codes or fallback to default
  const activeTenCodes = useMemo(() => {
    const dbTenCodes = codes.filter((c) => c.codeType === "TEN_CODE");
    if (dbTenCodes.length > 0) {
      return dbTenCodes.map((c) => {
        const isUrgent = ["10-1", "10-14", "10-30", "10-35", "10-45", "10-80", "10-99"].includes(c.code);
        const isWarning = ["10-3", "10-6", "10-37", "10-52"].includes(c.code);
        return {
          code: c.code,
          title: c.title,
          urgent: isUrgent,
          warning: isWarning,
        };
      });
    }
    return DEFAULT_TEN_CODES;
  }, [codes]);

  // Filtered 10-codes
  const filteredTenCodes = useMemo(() => {
    let list = activeTenCodes;
    if (filterMode === "URGENT") {
      list = list.filter((c) => c.urgent);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTenCodes, searchQuery, filterMode]);

  // Split into 2 columns for high-density, no-scroll side-by-side view
  const midpoint = Math.ceil(filteredTenCodes.length / 2);
  const leftColTenCodes = filteredTenCodes.slice(0, midpoint);
  const rightColTenCodes = filteredTenCodes.slice(midpoint);

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto pb-4">
      {/* Top Tactical Command Strip */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-[#090b17] border border-[#1a1f3c] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Fiches Mémo • Transmissions Radio LSPD
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 font-mono">
                TABLEAU DIRECT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Vue condensée sans défilement • Cliquez sur n&apos;importe quel code pour le copier instantanément
            </p>
          </div>
        </div>

        {/* Search & Fast Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Recherche rapide (10-80, tir, radio...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#0e1124] border border-[#21274d] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowMirandaModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-purple-500/40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition-all flex-shrink-0"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Droits Miranda</span>
          </button>
        </div>
      </div>

      {/* Main Single-Screen Tactical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* =========================================================================
            SECTION 1 & 2: 10-CODES EN 2 COLONNES ULTRA-CONDENSÉES (8 COLS)
            ========================================================================= */}
        <div className="lg:col-span-8 p-3 rounded-2xl bg-[#090b17] border border-[#181c3b] shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161a35]">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Tableau des 10-Codes ({filteredTenCodes.length})</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterMode(filterMode === "URGENT" ? "ALL" : "URGENT")}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                  filterMode === "URGENT"
                    ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                    : "bg-[#10142b] text-slate-400 border-[#1d2347] hover:text-white"
                }`}
              >
                Urgences seules
              </button>
              <button
                onClick={() => setFilterMode("ALL")}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                  filterMode === "ALL"
                    ? "bg-purple-950/80 text-purple-300 border-purple-500/50"
                    : "bg-[#10142b] text-slate-400 border-[#1d2347] hover:text-white"
                }`}
              >
                Tous
              </button>
            </div>
          </div>

          {/* 2 Side-by-side Dense Table Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
            {/* Left Column Table */}
            <div className="space-y-1">
              {leftColTenCodes.map((item) => (
                <div
                  key={item.code}
                  onClick={() => handleCopy(item.code)}
                  title="Cliquer pour copier le code"
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    item.urgent
                      ? "bg-rose-950/25 border-rose-900/40 hover:border-rose-500 hover:bg-rose-950/40"
                      : item.warning
                      ? "bg-amber-950/20 border-amber-900/40 hover:border-amber-500 hover:bg-amber-950/35"
                      : "bg-[#0b0e20] border-[#151934] hover:border-purple-500/60 hover:bg-[#121633]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono text-xs font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                        item.urgent
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : item.warning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-purple-950/80 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {item.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2 flex-shrink-0">
                    {copiedCode === item.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column Table */}
            <div className="space-y-1">
              {rightColTenCodes.map((item) => (
                <div
                  key={item.code}
                  onClick={() => handleCopy(item.code)}
                  title="Cliquer pour copier le code"
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    item.urgent
                      ? "bg-rose-950/25 border-rose-900/40 hover:border-rose-500 hover:bg-rose-950/40"
                      : item.warning
                      ? "bg-amber-950/20 border-amber-900/40 hover:border-amber-500 hover:bg-amber-950/35"
                      : "bg-[#0b0e20] border-[#151934] hover:border-purple-500/60 hover:bg-[#121633]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono text-xs font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                        item.urgent
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : item.warning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-purple-950/80 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {item.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2 flex-shrink-0">
                    {copiedCode === item.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: CODES D'URGENCE & INDICATIFS D'UNITÉS (4 COLS)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-3">
          {/* Table: Codes d'Urgence */}
          <div className="p-3 rounded-2xl bg-[#090b17] border border-[#181c3b] shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider pb-1 border-b border-[#161a35]">
              <Siren className="w-3.5 h-3.5 text-rose-400" />
              <span>Codes d&apos;Urgence</span>
            </div>

            <div className="space-y-1">
              {DEFAULT_URGENCY_CODES.map((u) => (
                <div
                  key={u.code}
                  onClick={() => handleCopy(u.code)}
                  className="group flex items-center justify-between p-2 rounded-xl bg-[#0b0e20] border border-[#151934] hover:border-purple-500/50 hover:bg-[#121633] transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[11px] font-black px-1.5 py-0.5 rounded ${
                          u.color === "rose"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : u.color === "amber"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : u.color === "emerald"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {u.code}
                      </span>
                      <span className="text-xs font-bold text-white">{u.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{u.desc}</div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2 flex-shrink-0">
                    {copiedCode === u.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table: Indicatifs d'Unités de Patrouille */}
          <div className="p-3 rounded-2xl bg-[#090b17] border border-[#181c3b] shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider pb-1 border-b border-[#161a35]">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Indicatifs d&apos;Unités</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_UNITS.map((unit) => (
                <div
                  key={unit.code}
                  onClick={() => handleCopy(unit.code)}
                  className="group p-1.5 rounded-xl bg-[#0b0e20] border border-[#151934] hover:border-indigo-500/50 hover:bg-[#121633] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-black text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      {unit.code}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400">
                      {copiedCode === unit.code ? "✓" : "copier"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-white mt-1 leading-tight">{unit.title}</div>
                  <div className="text-[9px] text-slate-400 leading-none mt-0.5">{unit.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Miranda Quick Box */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#110e24] to-[#0c0d1c] border border-purple-500/30 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-purple-400" />
                <span>Droits Miranda (Direct)</span>
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    "Vous avez le droit de garder le silence. Tout ce que vous direz pourra être retenu contre vous. Vous avez le droit à un avocat. Avez-vous bien compris vos droits ?"
                  )
                }
                className="text-[10px] font-bold text-purple-300 hover:text-white px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 transition-all flex items-center gap-1"
              >
                {copiedCode?.startsWith("Vous avez") ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copier</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
              1. Droit au silence • 2. Retenu contre vous • 3. Droit à un avocat • 4. Avez-vous compris ?
            </p>
          </div>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedCode && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-xl bg-purple-950 text-purple-200 border border-purple-500/50 shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Code copié dans le presse-papier : <strong className="text-white font-mono">{copiedCode}</strong></span>
        </div>
      )}

      {/* Miranda Rights Complete Modal */}
      {showMirandaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c0e1e] border border-purple-500/40 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#181c38]">
              <div className="flex items-center gap-2.5 text-purple-400">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Droits Miranda • Énonciation Officielle
                </h3>
              </div>
              <button
                onClick={() => setShowMirandaModal(false)}
                className="w-7 h-7 rounded-lg bg-[#141730] hover:bg-[#1e2348] text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#070814] border border-[#1a1f3a] text-xs text-slate-200 font-mono space-y-2.5 leading-relaxed">
              <p className="text-purple-300 font-bold">
                &quot;Monsieur / Madame, je vous place en état d&apos;arrestation.&quot;
              </p>
              <p>1. &quot;Vous avez le droit de garder le silence.&quot;</p>
              <p>2. &quot;Tout ce que vous direz pourra être et sera retenu contre vous devant une cour de justice.&quot;</p>
              <p>3. &quot;Vous avez le droit à un avocat. Si vous n&apos;en avez pas les moyens, un avocat commis d&apos;office vous sera désigné.&quot;</p>
              <p className="text-amber-300 font-bold">4. &quot;Avez-vous bien compris vos droits ?&quot;</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Attention procédurale :</strong> Les droits Miranda doivent impérativement être prononcés dès l&apos;interpellation avant tout interrogatoire.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#181c38]">
              <button
                onClick={() => {
                  handleCopy(
                    "Monsieur / Madame, je vous place en état d'arrestation. 1. Vous avez le droit de garder le silence. 2. Tout ce que vous direz pourra être et sera retenu contre vous devant une cour de justice. 3. Vous avez le droit à un avocat. 4. Avez-vous bien compris vos droits ?"
                  );
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier le texte intégral</span>
              </button>
              <button
                onClick={() => setShowMirandaModal(false)}
                className="px-4 py-2 rounded-xl bg-[#141730] hover:bg-[#1e2348] text-slate-300 text-xs font-bold transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
