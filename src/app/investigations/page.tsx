"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "@/context/OfficerContext";
import {
  FileText,
  Plus,
  Search,
  User,
  Shield,
  AlertTriangle,
  FolderOpen,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export default function InvestigationsPage() {
  const { currentOfficer } = useOfficer();
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    status: "Ouvert",
    dangerLevel: "Moyen",
    suspects: "",
    evidence: "",
    notes: "",
  });

  const fetchInvestigations = async () => {
    try {
      const res = await fetch("/api/investigations");
      const data = await res.json();
      setInvestigations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) {
      alert("Aucun officier connecté.");
      return;
    }
    try {
      const res = await fetch("/api/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          leadOfficerId: currentOfficer.id,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          title: "",
          summary: "",
          status: "Ouvert",
          dangerLevel: "Moyen",
          suspects: "",
          evidence: "",
          notes: "",
        });
        fetchInvestigations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/investigations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchInvestigations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCases = investigations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.suspects && c.suspects.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <FolderOpen className="w-4 h-4" />
            <span>Division des Enquêtes Criminelles (CID / Detective Bureau)</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Dossiers d&apos;Investigation & Affaires</h1>
          <p className="text-xs text-slate-300">
            Regroupement des preuves, suspects identifiés, pièces à conviction et transmissions à la justice.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ouvrir une Nouvelle Enquête</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="police-card p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une affaire par numéro (ex: INV-2026-08), titre ou nom de suspect..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-theme-primary font-medium"
          />
        </div>
      </div>

      {/* Cases Grid */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="police-card p-12 text-center text-xs text-slate-400">
            Aucun dossier d&apos;enquête trouvé.
          </div>
        ) : (
          filteredCases.map((c) => (
            <div
              key={c.id}
              className="police-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-theme-primary px-2.5 py-0.5 rounded bg-theme-primary-light border border-theme-primary">
                      {c.caseNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Enquêteur principal : {c.leadOfficer?.rank} {c.leadOfficer?.name}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{c.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      c.status === "Ouvert"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : c.status === "En cours"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : c.status === "Transmis Justice"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Résumé des Faits</div>
                {c.summary}
              </div>

              {/* Suspects & Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {c.suspects && (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Suspects & Personnes d&apos;Intérêt</span>
                    </div>
                    <div className="text-slate-300">{c.suspects}</div>
                  </div>
                )}

                {c.evidence && (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-theme-primary flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Pièces à Conviction & Éléments Balistiques</span>
                    </div>
                    <div className="text-slate-300">{c.evidence}</div>
                  </div>
                )}
              </div>

              {/* Status Update Quick Bar */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Modifier l&apos;état de l&apos;affaire :</span>
                <div className="flex items-center gap-1.5">
                  {["Ouvert", "En cours", "Transmis Justice", "Clos"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(c.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        c.status === st
                          ? "btn-theme-primary"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Ouvrir un Dossier d&apos;Enquête</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Titre de l&apos;Affaire *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réseau de faux billets sur Vinewood"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Résumé des Faits & Investigations *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contexte, mode opératoire, surveillance initiale..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Suspects Identifiés</label>
                <input
                  type="text"
                  placeholder="Ex: John Doe (Chef présumé), Jane Smith"
                  value={formData.suspects}
                  onChange={(e) => setFormData({ ...formData, suspects: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Pièces à Conviction & Preuves</label>
                <textarea
                  rows={2}
                  placeholder="Photos, enregistrements radios, armes saisies..."
                  value={formData.evidence}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Créer l&apos;Enquête
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
