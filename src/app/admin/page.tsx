"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "@/context/OfficerContext";
import {
  Settings,
  Shield,
  Users,
  Plus,
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle,
  Award,
  AlertTriangle,
} from "lucide-react";

export default function AdminPage() {
  const { currentOfficer, allOfficers, refreshOfficers } = useOfficer();
  const [penalCode, setPenalCode] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"officers" | "penal">("officers");
  const [loading, setLoading] = useState(true);

  // Officer creation modal
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);

  // The EXACT 13 ranks provided by the user:
  const ranksList = [
    "Chief of Police",
    "Assistant-Chief",
    "Deputy-Chief",
    "Commandant",
    "Capitaine",
    "Lieutenant",
    "Sergent-Chef",
    "Sergent",
    "SLO",
    "Officier III",
    "Officier II",
    "Officier I",
    "Rookie",
  ];

  const [newOfficerForm, setNewOfficerForm] = useState({
    name: "",
    badgeNumber: "",
    rank: "Rookie",
    callsign: "",
    department: "LSPD",
    phone: "555-",
    unitType: "Adam",
    isInstructor: false,
    isAdmin: false,
  });

  const [newArticleForm, setNewArticleForm] = useState({
    code: "",
    title: "",
    category: "Contraventions",
    fine: 5000,
    jailTime: 0,
    secondarySanction: "",
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/penal-code");
      const data = await res.json();
      setPenalCode(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOfficerForm),
      });
      if (res.ok) {
        setShowOfficerModal(false);
        setNewOfficerForm({
          name: "",
          badgeNumber: "",
          rank: "Rookie",
          callsign: "",
          department: "LSPD",
          phone: "555-",
          unitType: "Adam",
          isInstructor: false,
          isAdmin: false,
        });
        refreshOfficers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOfficerRank = async (officerId: string, rank: string) => {
    try {
      const res = await fetch(`/api/officers/${officerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank }),
      });
      if (res.ok) {
        refreshOfficers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleInstructor = async (officerId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/officers/${officerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isInstructor: !current }),
      });
      if (res.ok) {
        refreshOfficers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/penal-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticleForm),
      });
      if (res.ok) {
        setShowArticleModal(false);
        setNewArticleForm({
          code: "",
          title: "",
          category: "Contraventions",
          fine: 5000,
          jailTime: 0,
          secondarySanction: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>État-Major LSPD & Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Administration & Code Pénal</h1>
          <p className="text-xs text-slate-300">
            Gestion des promotions, des instructeurs, des articles du code pénal et paramétrages.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          {activeTab === "officers" ? (
            <button
              onClick={() => setShowOfficerModal(true)}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Enrôler Agent</span>
            </button>
          ) : (
            <button
              onClick={() => setShowArticleModal(true)}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("officers")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "officers"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Effectifs & Grades ({allOfficers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("penal")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "penal"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Code Pénal ({penalCode.length})</span>
        </button>
      </div>

      {/* Officers Management Tab */}
      {activeTab === "officers" && (
        <div className="space-y-3">
          {/* Mobile Officers Card View (md:hidden) */}
          <div className="md:hidden space-y-2.5">
            {allOfficers.map((o) => (
              <div key={o.id} className="police-card p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={o.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={o.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{o.name}</span>
                        <span className="text-[10px] font-mono text-theme-primary">#{o.badgeNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.callsign} • {o.unitType}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-theme-primary-light text-theme-primary border border-theme-primary flex-shrink-0">
                    {o.department}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Grade :</label>
                    <select
                      value={o.rank}
                      onChange={(e) => handleUpdateOfficerRank(o.id, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none"
                    >
                      {ranksList.map((rk) => (
                        <option key={rk} value={rk}>
                          {rk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Formateur :</label>
                    <button
                      onClick={() => handleToggleInstructor(o.id, o.isInstructor)}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        o.isInstructor
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}
                    >
                      {o.isInstructor ? "★ Instructeur" : "Standard"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block police-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Hiérarchie & Rôles des Agents
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                13 Grades (Rookie à Chief)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Matricule & Nom</th>
                    <th className="p-3">Département</th>
                    <th className="p-3">Grade Actuel (Modifier)</th>
                    <th className="p-3">Statut Instructeur</th>
                    <th className="p-3">Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allOfficers.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2.5">
                        <img
                          src={o.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                          alt={o.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{o.name}</span>
                            <span className="text-[11px] font-mono text-theme-primary">#{o.badgeNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{o.callsign}</div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-theme-primary-light text-theme-primary border border-theme-primary">
                          {o.department}
                        </span>
                      </td>

                      {/* Rank Selector */}
                      <td className="p-3">
                        <select
                          value={o.rank}
                          onChange={(e) => handleUpdateOfficerRank(o.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-theme-primary"
                        >
                          {ranksList.map((rk) => (
                            <option key={rk} value={rk}>
                              {rk}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Instructor status toggle */}
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleInstructor(o.id, o.isInstructor)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            o.isInstructor
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                              : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                          }`}
                        >
                          {o.isInstructor ? "★ Instructeur Actif" : "Non Instructeur"}
                        </button>
                      </td>

                      <td className="p-3 font-mono text-theme-primary">{o.unitType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Penal Code Management Tab */}
      {activeTab === "penal" && (
        <div className="space-y-3">
          {/* Mobile Penal Code Card View (md:hidden) */}
          <div className="md:hidden space-y-2">
            {penalCode.map((item) => (
              <div key={item.id} className="police-card p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-theme-primary px-1.5 py-0.5 rounded bg-theme-primary-light border border-theme-primary">
                      {item.code}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>

                  <div className="text-right font-mono font-bold text-amber-400 text-xs">
                    ${item.fine.toLocaleString()} {item.jailTime > 0 && <span className="text-red-400 ml-1">({item.jailTime}m)</span>}
                  </div>
                </div>

                <div className="font-bold text-xs text-white">{item.title}</div>
                {item.secondarySanction && (
                  <div className="text-[10px] text-amber-400/90 font-medium">
                    ⚠️ {item.secondarySanction}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block police-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Barème Pénal Officiel en Vigueur
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {penalCode.length} Infractions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Intitulé</th>
                    <th className="p-3 text-right">Amende ($)</th>
                    <th className="p-3 text-right">Cellule (min)</th>
                    <th className="p-3">Sanction Secondaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {penalCode.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-black text-theme-primary">{item.code}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">{item.title}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-400">
                        ${item.fine.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-red-400">
                        {item.jailTime > 0 ? `${item.jailTime} min` : "-"}
                      </td>
                      <td className="p-3 text-slate-300">
                        {item.secondarySanction ? (
                          <span className="text-amber-400 font-semibold">{item.secondarySanction}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Officer Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-white">Enrôler un Nouvel Agent</h2>
              <button onClick={() => setShowOfficerModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: John Miller"
                    value={newOfficerForm.name}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Matricule *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 56"
                    value={newOfficerForm.badgeNumber}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Grade Initial</label>
                  <select
                    value={newOfficerForm.rank}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, rank: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    {ranksList.map((rk) => (
                      <option key={rk} value={rk}>
                        {rk}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unité</label>
                  <select
                    value={newOfficerForm.unitType}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, unitType: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="Lincoln">Lincoln (Solo)</option>
                    <option value="Adam">Adam (Duo)</option>
                    <option value="Tango">Tango (Trio)</option>
                    <option value="Mary">Mary (Moto)</option>
                    <option value="Henry">Henry (Hélico)</option>
                    <option value="David">David (SWAT)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newOfficerForm.isInstructor}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, isInstructor: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span>Habilité Instructeur (FTO)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Enrôler l&apos;Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-white">Ajouter un Article</h2>
              <button onClick={() => setShowArticleModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Numéro d&apos;Article *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CP 140"
                    value={newArticleForm.code}
                    onChange={(e) => setNewArticleForm({ ...newArticleForm, code: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Catégorie *</label>
                  <select
                    value={newArticleForm.category}
                    onChange={(e) => setNewArticleForm({ ...newArticleForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="Contraventions">Contraventions</option>
                    <option value="Délits">Délits</option>
                    <option value="Crimes">Crimes</option>
                    <option value="Crimes fédéraux">Crimes fédéraux</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Intitulé *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Stationnement gênant"
                  value={newArticleForm.title}
                  onChange={(e) => setNewArticleForm({ ...newArticleForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Montant Amende ($)</label>
                  <input
                    type="number"
                    value={newArticleForm.fine}
                    onChange={(e) => setNewArticleForm({ ...newArticleForm, fine: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cellule (min)</label>
                  <input
                    type="number"
                    value={newArticleForm.jailTime}
                    onChange={(e) => setNewArticleForm({ ...newArticleForm, jailTime: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Sanction Secondaire</label>
                <input
                  type="text"
                  placeholder="Ex: Confiscation, Suspension..."
                  value={newArticleForm.secondarySanction}
                  onChange={(e) => setNewArticleForm({ ...newArticleForm, secondarySanction: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
