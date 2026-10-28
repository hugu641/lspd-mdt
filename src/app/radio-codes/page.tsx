"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Search,
  Shield,
  AlertTriangle,
  Copy,
  Check,
  BookOpen,
  Volume2,
  Car,
  Users,
} from "lucide-react";

export default function RadioCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"10_codes" | "units" | "urgency" | "procedures">("10_codes");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadCodes() {
      try {
        const res = await fetch("/api/radio-codes");
        const data = await res.json();
        setCodes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    }
    loadCodes();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tenCodes = codes.filter((c) => c.codeType === "TEN_CODE");
  const unitCodes = codes.filter((c) => c.codeType === "UNIT_CALLSIGN");
  const urgencyCodes = codes.filter((c) => c.codeType === "URGENCY_CODE");

  const filteredTenCodes = tenCodes.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Transmissions & Procédures Radio • Fiches Mémo</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Fiches Mémotechniques & Codes Radio</h1>
          <p className="text-xs text-slate-300">
            Tous les 10-Codes, indicatifs d&apos;unités de patrouille, codes d&apos;urgence et procédures tactiques de référence.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("10_codes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "10_codes"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>10-Codes ({tenCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("units")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "units"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Indicatifs d&apos;Unités ({unitCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("urgency")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "urgency"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Codes d&apos;Urgence ({urgencyCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("procedures")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "procedures"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Procédures & Droits Miranda</span>
        </button>
      </div>

      {/* 10-Codes Tab */}
      {activeTab === "10_codes" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="police-card p-3 rounded-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un code (ex: 10-1, 10-4, 10-38, Renforts, Tir...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-theme-primary font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTenCodes.map((c) => {
              const isUrgent = ["10-1", "10-14", "10-30", "10-35", "10-80", "10-99"].includes(c.code);

              return (
                <div
                  key={c.id}
                  onClick={() => handleCopy(c.code)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                    isUrgent
                      ? "bg-red-950/20 border-red-900/50 hover:border-red-500"
                      : "police-card border-slate-800 hover:border-theme-primary"
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-sm font-black px-2 py-0.5 rounded ${
                          isUrgent
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-theme-primary-light text-theme-primary border border-theme-primary"
                        }`}
                      >
                        {c.code}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white group-hover:text-theme-primary transition-colors">
                      {c.title}
                    </div>

                    {c.description && (
                      <div className="text-xs text-slate-400 line-clamp-2">
                        {c.description}
                      </div>
                    )}
                  </div>

                  <button
                    className="p-1.5 rounded-lg text-slate-500 group-hover:text-white group-hover:bg-slate-800 transition-all flex-shrink-0"
                    title="Copier le code"
                  >
                    {copiedCode === c.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Units Callsigns Tab */}
      {activeTab === "units" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unitCodes.map((u) => (
            <div
              key={u.id}
              className="police-card p-5 rounded-2xl border border-slate-800 hover:border-theme-primary transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-black text-theme-primary px-3 py-1 rounded-xl bg-theme-primary-light border border-theme-primary">
                  {u.code}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Désignation
                </span>
              </div>

              <h3 className="text-base font-bold text-white pt-1">{u.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{u.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Urgency Codes Tab */}
      {activeTab === "urgency" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgencyCodes.map((urg) => {
            const isCode3 = urg.code === "CODE 3";
            const isCode2 = urg.code === "CODE 2";

            return (
              <div
                key={urg.id}
                className={`p-6 rounded-2xl border space-y-3 transition-all ${
                  isCode3
                    ? "bg-red-950/30 border-red-600/60 shadow-xl shadow-red-950/30"
                    : isCode2
                    ? "bg-amber-950/20 border-amber-600/50"
                    : "police-card border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-lg font-black px-3.5 py-1.5 rounded-xl border ${
                      isCode3
                        ? "bg-red-600 text-white border-red-400 animate-pulse"
                        : isCode2
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-slate-800 text-slate-200 border-slate-700"
                    }`}
                  >
                    {urg.code}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Priorité Radio
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{urg.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{urg.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Procedures & Miranda Tab */}
      {activeTab === "procedures" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Miranda Rights */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-theme-primary pb-2 border-b border-slate-800">
              <Shield className="w-5 h-5" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Droits Miranda (Énonciation Obligatoire)
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono space-y-2">
              <p>&quot;Monsieur / Madame, je vous place en état d&apos;arrestation.&quot;</p>
              <p>1. &quot;Vous avez le droit de garder le silence.&quot;</p>
              <p>2. &quot;Tout ce que vous direz pourra être et sera retenu contre vous devant une cour de justice.&quot;</p>
              <p>3. &quot;Vous avez le droit à un avocat. Si vous n&apos;en avez pas les moyens, un avocat commis d&apos;office vous sera désigné.&quot;</p>
              <p>4. &quot;Avez-vous bien compris vos droits ?&quot;</p>
            </div>

            <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Attention : Le non-respect de l&apos;énoncé des droits Miranda avant l&apos;interrogatoire peut annuler la procédure !
              </span>
            </div>
          </div>

          {/* Felony Stop 10-38 */}
          <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-slate-800">
              <Car className="w-5 h-5" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Protocole 10-38 Contrôle Routier à Haut Risque (Felony Stop)
              </h3>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400">1. Positionnement : </span>
                Véhicules de patrouille en quinconce à 10 mètres, phares et projecteurs braqués dans le rétroviseur du suspect.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400">2. Injonctions : </span>
                Ordonner au conducteur de couper le contact, jeter les clés par la fenêtre et lever les deux mains en évidence.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400">3. Sortie : </span>
                Faire descendre le suspect dos aux policiers, reculer lentement vers la voix des officiers, puis menottage sous couverture armée.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
