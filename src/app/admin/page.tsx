"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "../../context/OfficerContext";
import {
  Settings,
  Shield,
  Users,
  Plus,
  BookOpen,
  Bot,
  RefreshCw,
  Send,
  Check,
  Trash2,
  Edit,
  ShieldAlert,
} from "lucide-react";
import { isHighCommand } from "../../lib/ranks";

export default function AdminPage() {
  const { currentOfficer, allOfficers, refreshOfficers } = useOfficer();
  const canManageRoles = isHighCommand(currentOfficer);
  const [penalCode, setPenalCode] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"officers" | "penal">("officers");
  const [loading, setLoading] = useState(true);

  // Officer creation modal
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);

  // Official Ranks list including US Marshal (Admins du serveur)
  const ranksList = [
    "Directeur US Marshal",
    "US Marshal - Superviseur Légal",
    "US Marshal",
    "Chief of Police",
    "Assistant-Chief",
    "Deputy-Chief",
    "Commandant",
    "Capitaine",
    "Lieutenant-Chef",
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
    discordId: "",
    discordTag: "",
  });

  const [newArticleForm, setNewArticleForm] = useState({
    code: "",
    title: "",
    category: "Contraventions",
    fine: 5000,
    jailTime: 0,
    secondarySanction: "",
  });

    const [officerSyncStatus, setOfficerSyncStatus] = useState<{ [officerId: string]: string }>({});
  const [editingDiscordId, setEditingDiscordId] = useState<{ [officerId: string]: string }>({});
  const [scanningDiscordCertifications, setScanningDiscordCertifications] = useState(false);

  const handleScanAllDiscordCertifications = async () => {
    setScanningDiscordCertifications(true);
    try {
      const res = await fetch("/api/discord/sync-certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(
          `✓ Scan Discord terminé avec succès !\n• ${data.totalScanned} agents scannés\n• ${data.updatedCount} profils actualisés\n\nTous les rôles, grades et certifications sont désormais synchronisés.`
        );
        refreshOfficers();
        fetchData();
      } else {
        alert(`✕ Erreur : ${data.error || "Impossible de scanner les certifications"}`);
      }
    } catch (err: any) {
      alert(`Erreur : ${err?.message || "Erreur de connexion"}`);
    } finally {
      setScanningDiscordCertifications(false);
    }
  };

  const fetchData = async () => {
    try {
      const penalRes = await fetch("/api/penal-code");
      const penalData = await penalRes.json();
      setPenalCode(Array.isArray(penalData) ? penalData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Officer
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOfficerForm),
      });
      const data = await res.json();
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
          discordId: "",
          discordTag: "",
        });
        refreshOfficers();

        let alertMsg = `Agent ${data.name} (#${data.badgeNumber}) créé avec succès !`;
        if (data.discordIntegration?.dm?.success) {
          alertMsg += "\n✉️ Message Privé (MP) de bienvenue envoyé sur Discord !";
        }
        if (data.discordIntegration?.roles?.success) {
          alertMsg += `\n⭐ Rôles Discord mis à jour : ${data.discordIntegration.roles.addedRoles?.join(", ")}`;
        }
        alert(alertMsg);
      } else {
        alert(`Erreur : ${data.error || "Impossible de créer l'agent"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Officer Rank
  const handleUpdateOfficerRank = async (officerId: string, rank: string) => {
    try {
      setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "Synchronisation Discord..." }));
      const res = await fetch(`/api/officers/${officerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank }),
      });
      const data = await res.json();
      if (res.ok) {
        refreshOfficers();
        if (data.discordSync?.success) {
          setOfficerSyncStatus((prev) => ({
            ...prev,
            [officerId]: `✓ Discord: +${data.discordSync.addedRoles?.join(", ") || rank}`,
          }));
        } else {
          setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "Grade mis à jour." }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Discord ID for existing officer
  const handleSaveDiscordId = async (officerId: string) => {
    const discordId = editingDiscordId[officerId];
    if (discordId === undefined) return;

    try {
      setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "Enregistrement..." }));
      const res = await fetch(`/api/officers/${officerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId }),
      });
      const data = await res.json();
      if (res.ok) {
        refreshOfficers();
        setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "✓ ID Discord enregistré" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync Discord Roles for single officer
  const handleSyncSingleOfficer = async (officerId: string) => {
    try {
      setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "Sync rôles en cours..." }));
      const res = await fetch("/api/discord/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const result = data.results?.[0];
        setOfficerSyncStatus((prev) => ({
          ...prev,
          [officerId]: `✓ Rôles synchronisés : ${result?.addedRoles?.join(", ") || "À jour"}`,
        }));
      } else {
        setOfficerSyncStatus((prev) => ({
          ...prev,
          [officerId]: `✕ Erreur : ${data.error || "Échec sync"}`,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle instructor
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

  // Strip Roles (High Command action)
  const handleStripOfficerRoles = async (officer: any) => {
    if (
      !confirm(
        `Confirmez-vous le retrait de TOUS les rôles Discord et de police pour l'agent ${officer.name} (#${officer.badgeNumber}) ?`
      )
    ) {
      return;
    }

    try {
      setOfficerSyncStatus((prev) => ({
        ...prev,
        [officer.id]: "Retrait des rôles en cours...",
      }));
      const res = await fetch(`/api/officers/${officer.id}/strip-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOfficerSyncStatus((prev) => ({
          ...prev,
          [officer.id]: `✓ Rôles retirés (${data.removedRoles?.length || 0} sur Discord)`,
        }));
        refreshOfficers();
      } else {
        setOfficerSyncStatus((prev) => ({
          ...prev,
          [officer.id]: `✕ Échec : ${data.error || "Impossible de retirer"}`,
        }));
      }
    } catch (err: any) {
      setOfficerSyncStatus((prev) => ({
        ...prev,
        [officer.id]: `✕ Erreur : ${err.message}`,
      }));
    }
  };

  // Delete Officer (High Command action)
  const handleDeleteOfficer = async (officer: any) => {
    if (currentOfficer?.id === officer.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    if (
      !confirm(
        `⚠️ ACTION IRRÉVERSIBLE :\nÊtes-vous sûr de vouloir supprimer définitivement l'agent ${officer.name} (#${officer.badgeNumber}) du site ?\nSes rôles Discord seront également révoqués.`
      )
    ) {
      return;
    }

    try {
      setOfficerSyncStatus((prev) => ({
        ...prev,
        [officer.id]: "Suppression en cours...",
      }));
      const res = await fetch(`/api/officers/${officer.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ Agent ${officer.name} (#${officer.badgeNumber}) supprimé avec succès du site.`);
        refreshOfficers();
      } else {
        alert(`✕ Erreur : ${data.error || "Échec de la suppression"}`);
        setOfficerSyncStatus((prev) => ({
          ...prev,
          [officer.id]: `✕ ${data.error || "Échec suppression"}`,
        }));
      }
    } catch (err: any) {
      alert(`✕ Erreur : ${err.message}`);
    }
  };

  // Penal Code Actions (Create, Edit, Delete)
  const handleOpenCreateArticle = () => {
    setEditingArticle(null);
    setNewArticleForm({
      code: "",
      title: "",
      category: "Contraventions",
      fine: 5000,
      jailTime: 0,
      secondarySanction: "",
    });
    setShowArticleModal(true);
  };

  const handleOpenEditArticle = (item: any) => {
    setEditingArticle(item);
    setNewArticleForm({
      code: item.code,
      title: item.title,
      category: item.category,
      fine: item.fine,
      jailTime: item.jailTime,
      secondarySanction: item.secondarySanction || "",
    });
    setShowArticleModal(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingArticle(true);
    try {
      if (editingArticle) {
        // PATCH existing article
        const res = await fetch(`/api/penal-code/${editingArticle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newArticleForm),
        });
        const data = await res.json();
        if (res.ok) {
          setShowArticleModal(false);
          setEditingArticle(null);
          await fetchData();
        } else {
          alert(data.error || "Erreur lors de la modification de l'article");
        }
      } else {
        // POST new article
        const res = await fetch("/api/penal-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newArticleForm),
        });
        const data = await res.json();
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
          await fetchData();
        } else {
          alert(data.error || "Erreur lors de la création de l'article");
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`✕ Erreur : ${err?.message || "Erreur serveur"}`);
    } finally {
      setSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (item: any) => {
    if (!confirm(`Supprimer définitivement l'article ${item.code} - ${item.title} du code pénal ?`)) return;
    try {
      const res = await fetch(`/api/penal-code/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
      } else {
        alert(data.error || "Impossible de supprimer l'article");
      }
    } catch (err: any) {
      alert(`Erreur : ${err?.message || "Erreur de connexion"}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>État-Major LSPD & Administration</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Administration & Code Pénal</h1>
            {canManageRoles ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono">
                DROITS HAUT COMMANDEMENT
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                CONSULTATION
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            Gestion des effectifs, attribution automatique des rôles Discord, envoi de MP et barème pénal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          {activeTab === "officers" && (
            <>
              <button
                onClick={handleScanAllDiscordCertifications}
                disabled={scanningDiscordCertifications}
                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/70 text-purple-200 hover:text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all disabled:opacity-50"
                title="Scanne tous les rôles Discord de tous les agents et applique leurs certifications et grades automatiquement"
              >
                <RefreshCw className={`w-4 h-4 text-purple-400 ${scanningDiscordCertifications ? "animate-spin" : ""}`} />
                <span>{scanningDiscordCertifications ? "Scan en cours..." : "⚡ Scanner Rôles & Certifs Discord"}</span>
              </button>

              <button
                onClick={() => setShowOfficerModal(true)}
                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Enrôler Agent</span>
              </button>
            </>
          )}

          {activeTab === "penal" && (
            <button
              onClick={handleOpenCreateArticle}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1b1f3a] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("officers")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "officers"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
              : "text-slate-400 hover:text-white hover:bg-[#12152b]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Effectifs & Grades ({allOfficers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("penal")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "penal"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
              : "text-slate-400 hover:text-white hover:bg-[#12152b]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Code Pénal ({penalCode.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: EFFECTIFS & GESTION DES GRADES + LIAISON DISCORD
          ========================================================================= */}
      {activeTab === "officers" && (
        <div className="space-y-3">
          {/* Mobile Officers Card View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {allOfficers.map((o) => (
              <div key={o.id} className="p-4 rounded-2xl bg-[#0a0c1a] border border-[#181c38] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={o.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={o.name}
                      className="w-10 h-10 rounded-xl object-cover border border-purple-500/30 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{o.name}</span>
                        <span className="text-[10px] font-mono text-purple-400">#{o.badgeNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.callsign} • {o.unitType}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/40 flex-shrink-0">
                    {o.department}
                  </span>
                </div>

                {/* Grade and Instructor controls */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#161a33] items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Grade :</label>
                    <select
                      value={o.rank}
                      onChange={(e) => handleUpdateOfficerRank(o.id, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#0e1124] border border-[#1b1f3c] text-xs font-semibold text-white focus:outline-none"
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
                          : "bg-[#0e1124] text-slate-500 border-[#1b1f3c]"
                      }`}
                    >
                      {o.isInstructor ? "★ Instructeur" : "Standard"}
                    </button>
                  </div>
                </div>

                {/* Discord ID & Actions */}
                <div className="pt-2 border-t border-[#161a33] space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Bot className="w-3 h-3 text-indigo-400" />
                      <span>ID Discord :</span>
                    </span>
                    {o.discordId ? (
                      <span className="font-mono text-indigo-300 font-bold">{o.discordId}</span>
                    ) : (
                      <span className="text-amber-400/80">Non renseigné</span>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => handleSyncSingleOfficer(o.id)}
                      className="w-full py-1 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Sync Rôles Discord</span>
                    </button>
                  </div>

                  {canManageRoles && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#161a33]">
                      <button
                        onClick={() => handleStripOfficerRoles(o)}
                        className="flex-1 py-1 px-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1 transition-all"
                      >
                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                        <span>Retirer rôles</span>
                      </button>
                      <button
                        onClick={() => handleDeleteOfficer(o)}
                        className="flex-1 py-1 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-[10px] font-bold text-rose-300 flex items-center justify-center gap-1 transition-all"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}

                  {officerSyncStatus[o.id] && (
                    <div className="text-[10px] text-purple-300 font-mono bg-purple-950/40 p-1.5 rounded-lg border border-purple-500/30">
                      {officerSyncStatus[o.id]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block rounded-2xl overflow-hidden bg-[#0a0c1a] border border-[#181c38] shadow-lg">
            <div className="p-4 bg-[#0d1024] border-b border-[#181c38] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Hiérarchie des Effectifs & Synchronisation Discord
                </h2>
                <p className="text-[11px] text-slate-400">
                  Chaque changement de grade applique immédiatement les rôles correspondants sur votre serveur Discord.
                </p>
              </div>
              <span className="text-xs text-purple-400 font-mono font-bold">
                {allOfficers.length} Agents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070812] text-slate-400 font-mono uppercase border-b border-[#181c38]">
                  <tr>
                    <th className="p-3">Matricule & Nom</th>
                    <th className="p-3">Grade Actuel (Modifier)</th>
                    <th className="p-3">ID Discord</th>
                    <th className="p-3">Statut Instructeur</th>
                    <th className="p-3 text-right">Actions Discord</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151833]">
                  {allOfficers.map((o) => (
                    <tr key={o.id} className="hover:bg-[#0f1228] transition-colors">
                      {/* Name & Photo */}
                      <td className="p-3 font-bold text-white flex items-center gap-2.5">
                        <img
                          src={o.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                          alt={o.name}
                          className="w-9 h-9 rounded-xl object-cover border border-purple-500/30 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{o.name}</span>
                            <span className="text-[11px] font-mono text-purple-400">#{o.badgeNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{o.callsign} • {o.unitType}</div>
                        </div>
                      </td>

                      {/* Rank Selector */}
                      <td className="p-3">
                        <select
                          value={o.rank}
                          onChange={(e) => handleUpdateOfficerRank(o.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0f1228] border border-[#22284e] text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                        >
                          {ranksList.map((rk) => (
                            <option key={rk} value={rk}>
                              {rk}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Discord ID & Tag inline edit */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="ID Discord (18 chiffres)"
                              value={
                                editingDiscordId[o.id] !== undefined
                                  ? editingDiscordId[o.id]
                                  : o.discordId || ""
                              }
                              onChange={(e) =>
                                setEditingDiscordId({ ...editingDiscordId, [o.id]: e.target.value })
                              }
                              className="px-2 py-1 rounded-lg bg-[#0a0c18] border border-[#1e2344] text-[11px] font-mono text-indigo-300 w-36 focus:outline-none focus:border-indigo-500"
                            />
                            {editingDiscordId[o.id] !== undefined &&
                              editingDiscordId[o.id] !== o.discordId && (
                                <button
                                  onClick={() => handleSaveDiscordId(o.id)}
                                  className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px]"
                                  title="Enregistrer l'ID"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                          </div>
                          {o.discordTag && (
                            <div className="text-[10px] text-slate-400 font-mono">@{o.discordTag}</div>
                          )}
                        </div>
                      </td>

                      {/* Instructor status toggle */}
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleInstructor(o.id, o.isInstructor)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            o.isInstructor
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                              : "bg-[#0e1124] text-slate-500 border-[#1c213d] hover:text-slate-300"
                          }`}
                        >
                          {o.isInstructor ? "★ Instructeur Actif" : "Non Instructeur"}
                        </button>
                      </td>

                      {/* Discord Actions & live feedback */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSyncSingleOfficer(o.id)}
                            title="Synchroniser ses rôles Discord"
                            className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 flex items-center gap-1 transition-all"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Sync Rôles</span>
                          </button>
                          {canManageRoles && (
                            <>
                              <button
                                onClick={() => handleStripOfficerRoles(o)}
                                title="Retirer tous ses rôles Discord et de police"
                                className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-[11px] font-bold text-amber-300 flex items-center gap-1 transition-all"
                              >
                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                                <span>Retirer rôles</span>
                              </button>
                              <button
                                onClick={() => handleDeleteOfficer(o)}
                                title="Supprimer définitivement l'agent du site et révoquer ses accès"
                                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-[11px] font-bold text-rose-300 flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Supprimer</span>
                              </button>
                            </>
                          )}
                        </div>
                        {officerSyncStatus[o.id] && (
                          <div className="text-[10px] text-purple-300 font-mono mt-1">
                            {officerSyncStatus[o.id]}
                          </div>
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


      {/* =========================================================================
          TAB 3: CODE PÉNAL
          ========================================================================= */}
      {activeTab === "penal" && (
        <div className="space-y-3">
          {/* Mobile Penal Code Card View (md:hidden) */}
          <div className="md:hidden space-y-2">
            {penalCode.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-[#0a0c1a] border border-[#181c38] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-purple-400 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40">
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

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#181c38]">
                  <button
                    onClick={() => handleOpenEditArticle(item)}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(item)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Supprimer l'article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block rounded-2xl overflow-hidden bg-[#0a0c1a] border border-[#181c38] shadow-lg">
            <div className="p-4 bg-[#0d1024] border-b border-[#181c38] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Barème Pénal Officiel en Vigueur
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {penalCode.length} Infractions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070812] text-slate-400 font-mono uppercase border-b border-[#181c38]">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Intitulé</th>
                    <th className="p-3 text-right">Amende ($)</th>
                    <th className="p-3 text-right">Cellule (min)</th>
                    <th className="p-3">Sanction Secondaire</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151833]">
                  {penalCode.map((item) => (
                    <tr key={item.id} className="hover:bg-[#0f1228] transition-colors">
                      <td className="p-3 font-mono font-black text-purple-400">{item.code}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#11142b] text-slate-300 border border-[#1f244a]">
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
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditArticle(item)}
                            className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Modifier l'article"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            title="Supprimer l'article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ENRÔLER UN NOUVEL AGENT (Avec Liaison Discord & MP Auto)
          ========================================================================= */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b0e20] border border-purple-500/30 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b1f3c]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-black text-white">Enrôler un Nouvel Agent</h2>
              </div>
              <button
                onClick={() => setShowOfficerModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
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
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Matricule *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 56"
                    value={newOfficerForm.badgeNumber}
                    onChange={(e) =>
                      setNewOfficerForm({ ...newOfficerForm, badgeNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Grade Initial</label>
                  <select
                    value={newOfficerForm.rank}
                    onChange={(e) => setNewOfficerForm({ ...newOfficerForm, rank: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500"
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
                    onChange={(e) =>
                      setNewOfficerForm({ ...newOfficerForm, unitType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500"
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

              {/* Discord Integration Inputs */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Liaison Discord Automatique (Rôle + MP de Bienvenue)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-300 block font-semibold">
                      ID Discord (17-19 chiffres)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 284394029482910293"
                      value={newOfficerForm.discordId}
                      onChange={(e) =>
                        setNewOfficerForm({ ...newOfficerForm, discordId: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#080a16] border border-[#1b1f3c] text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 block font-semibold">
                      Pseudo Discord (Facultatif)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Test123"
                      value={newOfficerForm.discordTag}
                      onChange={(e) =>
                        setNewOfficerForm({ ...newOfficerForm, discordTag: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#080a16] border border-[#1b1f3c] text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-indigo-200/80">
                  ✉️ Si renseigné, le bot enverra immédiatement un <strong>Message Privé (MP)</strong> avec le matricule et les accès, et attribuera le rôle du grade sur le serveur !
                </p>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newOfficerForm.isInstructor}
                    onChange={(e) =>
                      setNewOfficerForm({ ...newOfficerForm, isInstructor: e.target.checked })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span>Habilité Instructeur (FTO)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141834] text-slate-300 text-xs font-semibold hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/30"
                >
                  Enrôler l&apos;Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AJOUTER OU MODIFIER UN ARTICLE DE CODE PÉNAL
          ========================================================================= */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b0e20] border border-purple-500/30 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b1f3c]">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>{editingArticle ? `Modifier l'Article ${editingArticle.code}` : "Ajouter un Article au Code Pénal"}</span>
              </h2>
              <button
                onClick={() => {
                  setShowArticleModal(false);
                  setEditingArticle(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Numéro d&apos;Article *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CP 140"
                    value={newArticleForm.code}
                    onChange={(e) => setNewArticleForm({ ...newArticleForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Catégorie *</label>
                  <select
                    value={newArticleForm.category}
                    onChange={(e) =>
                      setNewArticleForm({ ...newArticleForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Montant Amende ($)</label>
                  <input
                    type="number"
                    value={newArticleForm.fine}
                    onChange={(e) =>
                      setNewArticleForm({ ...newArticleForm, fine: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Cellule (min)</label>
                  <input
                    type="number"
                    value={newArticleForm.jailTime}
                    onChange={(e) =>
                      setNewArticleForm({ ...newArticleForm, jailTime: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Sanction Secondaire</label>
                <input
                  type="text"
                  placeholder="Ex: Confiscation, Suspension..."
                  value={newArticleForm.secondarySanction}
                  onChange={(e) =>
                    setNewArticleForm({ ...newArticleForm, secondarySanction: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowArticleModal(false);
                    setEditingArticle(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#141834] text-slate-300 text-xs font-semibold hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingArticle}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 disabled:opacity-50 transition-all"
                >
                  {savingArticle
                    ? "Enregistrement..."
                    : editingArticle
                    ? "Sauvegarder les modifications"
                    : "Enregistrer l'article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
