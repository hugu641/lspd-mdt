"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "../../context/OfficerContext";
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
  Bot,
  MessageSquare,
  RefreshCw,
  Send,
  Check,
  ExternalLink,
  Info,
  Key,
  Server,
  Zap,
} from "lucide-react";

export default function AdminPage() {
  const { currentOfficer, allOfficers, refreshOfficers } = useOfficer();
  const [penalCode, setPenalCode] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"officers" | "penal" | "discord">("officers");
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

  // Discord states
  const [discordSettings, setDiscordSettings] = useState({
    botToken: "",
    guildId: "",
    clientId: "",
    clientSecret: "",
    welcomeChannelId: "",
    autoSyncRoles: true,
    sendWelcomeDm: true,
    authRequired: true,
    allowedRoles: "LSPD,Police,Rookie,Officier I,Officier II,Officier III,SLO,Sergent,Sergent-Chef,Lieutenant,Capitaine,Commandant,Deputy-Chief,Assistant-Chief,Chief of Police",
    isConfigured: false,
    isConfiguredOAuth: false,
    hasToken: false,
    hasSecret: false,
  });
  const [tokenInput, setTokenInput] = useState("");
  const [guildIdInput, setGuildIdInput] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");
  const [allowedRolesInput, setAllowedRolesInput] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [discordTestResult, setDiscordTestResult] = useState<any>(null);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [isSavingDiscord, setIsSavingDiscord] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [editingDiscordId, setEditingDiscordId] = useState<{ [officerId: string]: string }>({});
  const [officerSyncStatus, setOfficerSyncStatus] = useState<{ [officerId: string]: string }>({});
  const [testDmInput, setTestDmInput] = useState("");
  const [sendingTestDm, setSendingTestDm] = useState(false);
  const [testDmFeedback, setTestDmFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (typeof window !== "undefined") {
        setOriginUrl(window.location.origin);
      }
      const [penalRes, discordRes] = await Promise.all([
        fetch("/api/penal-code"),
        fetch("/api/discord/settings"),
      ]);

      const penalData = await penalRes.json();
      const discordData = await discordRes.json();

      setPenalCode(Array.isArray(penalData) ? penalData : []);
      if (discordData && !discordData.error) {
        setDiscordSettings(discordData);
        setGuildIdInput(discordData.guildId || "");
        setClientIdInput(discordData.clientId || "");
        setAllowedRolesInput(discordData.allowedRoles || "");
      }
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

  // Send Welcome DM for single officer
  const handleSendOfficerWelcomeDm = async (officerId: string) => {
    try {
      setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "Envoi MP en cours..." }));
      const res = await fetch("/api/discord/send-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: "✓ MP de bienvenue envoyé !" }));
      } else {
        setOfficerSyncStatus((prev) => ({ ...prev, [officerId]: `✕ ${data.error || "Échec MP"}` }));
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

  // Save Discord Settings
  const handleSaveDiscordSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDiscord(true);
    setSyncFeedback(null);
    try {
      const payload: any = {
        guildId: guildIdInput,
        clientId: clientIdInput.trim(),
        autoSyncRoles: discordSettings.autoSyncRoles,
        sendWelcomeDm: discordSettings.sendWelcomeDm,
        authRequired: discordSettings.authRequired,
        allowedRoles: allowedRolesInput.trim() || discordSettings.allowedRoles,
      };
      if (tokenInput.trim()) {
        payload.botToken = tokenInput.trim();
      }
      if (clientSecretInput.trim()) {
        payload.clientSecret = clientSecretInput.trim();
      }

      const res = await fetch("/api/discord/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscordSettings((prev) => ({ ...prev, ...data }));
        setTokenInput("");
        setClientSecretInput("");
        setSyncFeedback("✓ Paramètres Discord & Passerelle d'authentification enregistrés avec succès !");
      } else {
        setSyncFeedback(`✕ Erreur : ${data.error || "Impossible d'enregistrer"}`);
      }
    } catch (err: any) {
      setSyncFeedback(`✕ Erreur : ${err.message}`);
    } finally {
      setIsSavingDiscord(false);
    }
  };

  // Test Discord Connection
  const handleTestDiscordConnection = async () => {
    setIsTestingDiscord(true);
    setDiscordTestResult(null);
    try {
      const payload: any = {};
      if (tokenInput.trim()) payload.botToken = tokenInput.trim();
      if (guildIdInput.trim()) payload.guildId = guildIdInput.trim();

      const res = await fetch("/api/discord/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setDiscordTestResult(data);
    } catch (err: any) {
      setDiscordTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingDiscord(false);
    }
  };

  // Sync All Discord Roles
  const handleSyncAllRoles = async () => {
    setIsSyncingAll(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/discord/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncFeedback(`✓ Synchronisation terminée : ${data.syncedCount || 0} agents mis à jour sur ${data.totalCount || 0} !`);
      } else {
        setSyncFeedback(`✕ Erreur lors de la synchronisation : ${data.error || "Échec"}`);
      }
    } catch (err: any) {
      setSyncFeedback(`✕ Erreur : ${err.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Send Test DM
  const handleSendTestDm = async () => {
    if (!testDmInput.trim()) return;
    setSendingTestDm(true);
    setTestDmFeedback(null);
    try {
      const res = await fetch("/api/discord/send-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: testDmInput.trim(),
          customMessage: "🔔 **Test LSPD MDT Bot** : Le système de notification directe en Message Privé (MP) fonctionne parfaitement !",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestDmFeedback("✓ Message Privé (MP) envoyé avec succès ! Vérifiez votre Discord.");
      } else {
        setTestDmFeedback(`✕ Échec d'envoi du MP : ${data.error || "Vérifiez que le bot partage un serveur avec cet utilisateur et que ses MP sont ouverts."}`);
      }
    } catch (err: any) {
      setTestDmFeedback(`✕ Erreur : ${err.message}`);
    } finally {
      setSendingTestDm(false);
    }
  };

  // Create Penal Article
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
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>État-Major LSPD & Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Administration & Code Pénal</h1>
          <p className="text-xs text-slate-300">
            Gestion des effectifs, attribution automatique des rôles Discord, envoi de MP et barème pénal.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          {activeTab === "officers" && (
            <button
              onClick={() => setShowOfficerModal(true)}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Enrôler Agent</span>
            </button>
          )}

          {activeTab === "penal" && (
            <button
              onClick={() => setShowArticleModal(true)}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Article</span>
            </button>
          )}

          {activeTab === "discord" && (
            <button
              onClick={handleSyncAllRoles}
              disabled={isSyncingAll}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>{isSyncingAll ? "Synchronisation..." : "Sync Tous les Rôles Discord"}</span>
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
          onClick={() => setActiveTab("discord")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "discord"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
              : "text-slate-400 hover:text-white hover:bg-[#12152b]"
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>Bot Discord & Rôles Auto</span>
          <span
            className={`w-2 h-2 rounded-full ml-1 ${
              discordSettings.isConfigured ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-amber-400"
            }`}
          />
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSyncSingleOfficer(o.id)}
                      className="flex-1 py-1 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Sync Rôles</span>
                    </button>
                    <button
                      onClick={() => handleSendOfficerWelcomeDm(o.id)}
                      className="flex-1 py-1 px-2 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-2.5 h-2.5" />
                      <span>Envoyer MP</span>
                    </button>
                  </div>

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
                          <button
                            onClick={() => handleSendOfficerWelcomeDm(o.id)}
                            title="Envoyer ou renvoyer le MP de bienvenue"
                            className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-[11px] font-bold text-purple-300 flex items-center gap-1 transition-all"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Envoyer MP</span>
                          </button>
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
          TAB 2: CONFIGURATION DU BOT DISCORD & RÔLES AUTOMATIQUES
          ========================================================================= */}
      {activeTab === "discord" && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#12152f] via-[#0d1024] to-[#090b18] border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Passerelle Discord Bot • LSPD Automation
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                      discordSettings.isConfigured
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                        : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        discordSettings.isConfigured ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span>{discordSettings.isConfigured ? "Bot Configuré" : "Configuration Requise"}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestion instantanée des rôles Discord lors des promotions et envoi automatique de Message Privé (MP) aux recrues.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestDiscordConnection}
                disabled={isTestingDiscord}
                className="px-3.5 py-2 rounded-xl bg-[#141838] hover:bg-[#1d2352] text-xs font-bold text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-all shadow-md"
              >
                <Zap className={`w-3.5 h-3.5 ${isTestingDiscord ? "animate-pulse" : ""}`} />
                <span>{isTestingDiscord ? "Test en cours..." : "Tester la connexion"}</span>
              </button>
            </div>
          </div>

          {/* Test Result Display */}
          {discordTestResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                discordTestResult.success
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/30 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {discordTestResult.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Connexion Discord réussie !</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Échec de connexion Discord</span>
                  </>
                )}
              </div>

              {discordTestResult.success ? (
                <div className="space-y-1 text-slate-300 text-xs">
                  <div>
                    🤖 Bot identifié : <strong>{discordTestResult.bot?.username}#{discordTestResult.bot?.discriminator}</strong> (ID: {discordTestResult.bot?.id})
                  </div>
                  {discordTestResult.guild && (
                    <div>
                      🏰 Serveur lié : <strong>{discordTestResult.guild?.name}</strong> ({discordTestResult.roles?.length || 0} rôles détectés)
                    </div>
                  )}
                </div>
              ) : (
                <div className="font-mono text-rose-300">{discordTestResult.error}</div>
              )}
            </div>
          )}

          {/* Feedback banner */}
          {syncFeedback && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs font-semibold">
              {syncFeedback}
            </div>
          )}

          {/* Configuration Form Card */}
          <div className="p-5 rounded-2xl bg-[#0a0c1a] border border-[#181c38] space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-[#181c38]">
              <Key className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Configuration de la Passerelle d&apos;Accès & du Bot Discord
              </h3>
            </div>

            <form onSubmit={handleSaveDiscordSettings} className="space-y-6">
              {/* SECTION A: PASSERELLE DE CONNEXION DISCORD (OAUTH2) */}
              <div className="p-4 rounded-xl bg-[#0e1124] border border-[#1d2242] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      1. Passerelle OAuth2 (Connexion exclusive aux agents LSPD)
                    </span>
                  </div>
                  {discordSettings.isConfiguredOAuth ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      OAuth2 Actif
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                      Non configuré
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Client ID Discord (Application ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 133984920492810293"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#090b16] border border-[#1d2242] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[9px] text-slate-400">
                      Trouvé dans Discord Developer Portal &gt; Votre Application &gt; General Information &gt; Application ID.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Client Secret Discord *</span>
                      {discordSettings.hasSecret && (
                        <span className="text-[9px] text-emerald-400 font-mono">✓ Secret actif</span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder={discordSettings.clientSecret || "Collez le Client Secret..."}
                      value={clientSecretInput}
                      onChange={(e) => setClientSecretInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#090b16] border border-[#1d2242] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[9px] text-slate-400">
                      Trouvé dans Discord Developer Portal &gt; OAuth2 &gt; Client Secret &gt; Reset Secret.
                    </p>
                  </div>
                </div>

                {/* Redirect URI copy box */}
                <div className="p-2.5 rounded-lg bg-[#070812] border border-[#181c38] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-purple-300">URL de Redirection OAuth2 (À copier dans Discord) :</span>
                    <span className="text-[9px] text-slate-500">OAuth2 &gt; Redirects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 rounded bg-[#0a0c18] border border-[#1a1f3c] text-[11px] text-cyan-300 font-mono select-all">
                      {(originUrl || "https://ruby-mdt.onrender.com") + "/api/auth/discord/callback"}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = (originUrl || "https://ruby-mdt.onrender.com") + "/api/auth/discord/callback";
                        navigator.clipboard.writeText(targetUrl);
                        alert(`URL copiée :\n${targetUrl}\n\nCollez-la dans Discord Developer Portal > OAuth2 > Redirects.`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-500/40"
                    >
                      Copier
                    </button>
                  </div>
                </div>

                {/* Security Gate Toggle & Allowed Roles */}
                <div className="pt-2 space-y-2 border-t border-[#181c38]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={discordSettings.authRequired}
                      onChange={(e) =>
                        setDiscordSettings({ ...discordSettings, authRequired: e.target.checked })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">
                      Verrouillage Total : Exiger une connexion Discord pour accéder au terminal MDT
                    </span>
                  </label>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">
                      Rôles Discord autorisés à franchir la passerelle (séparés par des virgules) :
                    </label>
                    <input
                      type="text"
                      placeholder="LSPD, Police, Rookie, Officier I, Officier II, Sergent, Capitaine, Chief of Police..."
                      value={allowedRolesInput}
                      onChange={(e) => setAllowedRolesInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#090b16] border border-[#1d2242] text-xs font-mono text-indigo-300 focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[9px] text-slate-400">
                      Toute personne ne possédant pas au moins l&apos;un de ces rôles sur votre serveur sera bloquée à la passerelle.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B: BOT DISCORD & SYNCHRONISATION DES RÔLES */}
              <div className="p-4 rounded-xl bg-[#0e1124] border border-[#1d2242] space-y-3.5">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    2. Bot Discord (Attribution automatique des rôles & Envoi de MP)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Bot Token */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Token du Bot Discord (DISCORD_BOT_TOKEN) *</span>
                      {discordSettings.hasToken && (
                        <span className="text-[9px] text-emerald-400 font-mono">✓ Token actif</span>
                      )}
                    </label>
                    <input
                      type="password"
                      placeholder={discordSettings.botToken || "Collez le token du bot..."}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#090b16] border border-[#1d2242] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[9px] text-slate-400">
                      Trouvé dans Discord Developer Portal &gt; Applications &gt; Bot &gt; Reset Token.
                    </p>
                  </div>

                  {/* Guild ID */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      ID du Serveur Discord (DISCORD_GUILD_ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1109283746582910293"
                      value={guildIdInput}
                      onChange={(e) => setGuildIdInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#090b16] border border-[#1d2242] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[9px] text-slate-400">
                      Clic droit sur l&apos;icône de votre serveur Discord &gt; Copier l&apos;identifiant du serveur.
                    </p>
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#090b16] border border-[#1b1f3c] cursor-pointer hover:border-indigo-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={discordSettings.autoSyncRoles}
                      onChange={(e) =>
                        setDiscordSettings({ ...discordSettings, autoSyncRoles: e.target.checked })
                      }
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Mise à jour automatique des rôles</div>
                      <div className="text-[10px] text-slate-400">
                        Attribue et retire les grades sur Discord dès qu&apos;une promotion a lieu.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#090b16] border border-[#1b1f3c] cursor-pointer hover:border-purple-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={discordSettings.sendWelcomeDm}
                      onChange={(e) =>
                        setDiscordSettings({ ...discordSettings, sendWelcomeDm: e.target.checked })
                      }
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Message Privé (MP) automatique</div>
                      <div className="text-[10px] text-slate-400">
                        Envoie la convocation et le matricule en MP Discord dès l&apos;enrôlement.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingDiscord}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingDiscord ? "Enregistrement..." : "Enregistrer la Configuration Complète"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick MP Testing Tool */}
          <div className="p-5 rounded-2xl bg-[#0a0c1a] border border-[#181c38] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#181c38]">
              <Send className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Tester l&apos;envoi d&apos;un Message Privé (MP) en direct
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Entrez votre ID Discord (ex: 284394029482910293)"
                value={testDmInput}
                onChange={(e) => setTestDmInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendTestDm}
                disabled={sendingTestDm || !testDmInput.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTestDm ? "Envoi..." : "Envoyer MP Test"}</span>
              </button>
            </div>

            {testDmFeedback && (
              <div
                className={`text-xs font-semibold p-2.5 rounded-xl border ${
                  testDmFeedback.startsWith("✓")
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                }`}
              >
                {testDmFeedback}
              </div>
            )}
          </div>

          {/* Tutorial & Discord Best Practices */}
          <div className="p-5 rounded-2xl bg-[#0d0f22] border border-[#1e2344] space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Guide d&apos;installation & Règle cruciale des rôles Discord</span>
            </div>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong>Créer le Bot :</strong> Rendez-vous sur le{" "}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 underline font-semibold"
                >
                  Discord Developer Portal
                </a>
                , créez une application puis un <strong>Bot</strong>.
              </li>
              <li>
                <strong>Activer les Intents :</strong> Dans l&apos;onglet <em>Bot</em>, activez{" "}
                <code>Privileged Gateway Intents &gt; Server Members Intent</code>.
              </li>
              <li>
                <strong>Inviter le Bot :</strong> Dans <em>OAuth2 &gt; URL Generator</em>, cochez <code>bot</code> avec les permissions{" "}
                <code>Manage Roles (Gérer les rôles)</code> et <code>Send Messages</code>.
              </li>
              <li className="text-amber-300">
                ⚠️ <strong>RÈGLE DE HIÉRARCHIE DISCORD ABSOLUE :</strong> Dans les paramètres de votre serveur Discord (
                <em>Paramètres &gt; Rôles</em>), glissez le rôle du Bot <strong>au-dessus</strong> de tous les rôles de police (Rookie, Officier, Sergent, etc.). Si le rôle du Bot est en-dessous, Discord refusera qu&apos;il attribue ces rôles !
              </li>
            </ol>
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
              <div key={item.id} className="p-3 rounded-xl bg-[#0a0c1a] border border-[#181c38] space-y-1.5">
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
                      placeholder="Ex: hugu641"
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
          MODAL: AJOUTER UN ARTICLE DE CODE PÉNAL
          ========================================================================= */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b0e20] border border-purple-500/30 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b1f3c]">
              <h2 className="text-base sm:text-lg font-black text-white">Ajouter un Article</h2>
              <button
                onClick={() => setShowArticleModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
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
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141834] text-slate-300 text-xs font-semibold hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/30"
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
