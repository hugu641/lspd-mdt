"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useOfficer } from "../../context/OfficerContext";
import { hasRecruitmentAccess } from "../../lib/recruitmentAuth";
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Phone,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  Sparkles,
  Bot,
  ExternalLink,
  Lock,
  ChevronRight,
  Shield,
  Star,
  Check,
  XCircle,
  UserCheck,
  Copy,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  discordTag?: string | null;
  discordId?: string | null;
  discordAvatar?: string | null;
  age?: number | null;
  availability?: string | null;
  motivation?: string | null;
  experience?: string | null;
  status: "En attente" | "Entretien prévu" | "Accepté" | "Refusé";
  interviewDate?: string | null;
  interviewNotes?: string | null;
  decisionReason?: string | null;
  discordRoleGranted?: boolean;
  discordNotified?: boolean;
  recruiterId?: string | null;
  recruiter?: {
    id: string;
    name: string;
    badgeNumber: string;
    rank: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface OfficerRecruiter {
  id: string;
  name: string;
  badgeNumber: string;
  rank: string;
  department: string;
  avatarUrl?: string | null;
  isRecruiter: boolean;
  isAdmin: boolean;
  discordId?: string | null;
}

export default function RecruitmentPage() {
  const { currentOfficer } = useOfficer();

  const [activeTab, setActiveTab] = useState<"candidates" | "recruiters">("candidates");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [officers, setOfficers] = useState<OfficerRecruiter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tous");

  // Bot & Role actions state
  const [botLoading, setBotLoading] = useState(false);
  const [botFeedback, setBotFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Candidate creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    firstName: "",
    lastName: "",
    phone: "555-",
    discordTag: "",
    discordId: "",
    age: "",
    motivation: "",
    experience: "",
    availability: "",
    status: "En attente",
  });
  const [savingCandidate, setSavingCandidate] = useState(false);

  // Candidate detail/edit modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editStatus, setEditStatus] = useState<string>("En attente");
  const [editInterviewDate, setEditInterviewDate] = useState<string>("");
  const [editInterviewNotes, setEditInterviewNotes] = useState<string>("");
  const [editDecisionReason, setEditDecisionReason] = useState<string>("");
  const [editRecruiterId, setEditRecruiterId] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [discordAccepting, setDiscordAccepting] = useState(false);

  // Recruiter toggle state
  const [togglingOfficerId, setTogglingOfficerId] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/recruitment/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch("/api/recruitment/recruiters");
      if (res.ok) {
        const data = await res.json();
        setOfficers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchCandidates(), fetchOfficers()]).finally(() => setLoading(false));
  }, []);

  // Copy Public Application Link
  const handleCopyApplicationLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/recruitment/apply`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Request bot to create or verify recruiter role on Discord
  const handleTriggerBotRole = async () => {
    setBotLoading(true);
    setBotFeedback(null);
    try {
      const res = await fetch("/api/recruitment/setup-role", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBotFeedback({
          text: data.message || "Rôle Discord vérifié / créé avec succès !",
          success: true,
        });
      } else {
        setBotFeedback({
          text: data.error || "Impossible de contacter l'API Discord Bot",
          success: false,
        });
      }
    } catch (err: any) {
      setBotFeedback({
        text: err?.message || "Erreur de connexion au serveur",
        success: false,
      });
    } finally {
      setBotLoading(false);
    }
  };

  // Accept candidate and grant Discord role + send DM notification
  const handleAcceptAndNotifyDiscord = async (cand: Candidate) => {
    setDiscordAccepting(true);
    try {
      const res = await fetch(`/api/recruitment/candidates/${cand.id}/accept-discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterOfficer: currentOfficer,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBotFeedback({
          text: data.message || "Candidat accepté ! Rôle Discord attribué et notification MP envoyée.",
          success: true,
        });
        setSelectedCandidate(null);
        fetchCandidates();
      } else {
        setBotFeedback({
          text: data.error || "Erreur lors de l'attribution du rôle ou de l'envoi du MP Discord.",
          success: false,
        });
      }
    } catch (err: any) {
      setBotFeedback({
        text: err?.message || "Erreur réseau avec l'API Discord",
        success: false,
      });
    } finally {
      setDiscordAccepting(false);
    }
  };

  // Submit new candidate manually
  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.firstName.trim() || !newCandidate.lastName.trim()) return;

    setSavingCandidate(true);
    try {
      const res = await fetch("/api/recruitment/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCandidate,
          recruiterId: currentOfficer?.id || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCandidate({
          firstName: "",
          lastName: "",
          phone: "555-",
          discordTag: "",
          discordId: "",
          age: "",
          motivation: "",
          experience: "",
          availability: "",
          status: "En attente",
        });
        fetchCandidates();
      } else {
        alert("Erreur lors de l'enregistrement de la candidature.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCandidate(false);
    }
  };

  // Save candidate evaluation & status
  const handleUpdateCandidate = async () => {
    if (!selectedCandidate) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/recruitment/candidates/${selectedCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          interviewDate: editInterviewDate || null,
          interviewNotes: editInterviewNotes,
          decisionReason: editDecisionReason,
          recruiterId: editRecruiterId || currentOfficer?.id || null,
        }),
      });

      if (res.ok) {
        // If status was changed to Accepté and candidate has Discord ID, trigger Discord grant
        if (editStatus === "Accepté" && selectedCandidate.discordId && !selectedCandidate.discordRoleGranted) {
          handleAcceptAndNotifyDiscord(selectedCandidate);
        } else {
          setSelectedCandidate(null);
          fetchCandidates();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete candidate
  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement le dossier de ${name} ?`)) return;
    try {
      const res = await fetch(`/api/recruitment/candidates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedCandidate?.id === id) setSelectedCandidate(null);
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle recruiter flag on officer
  const handleToggleRecruiter = async (officerId: string, currentStatus: boolean) => {
    setTogglingOfficerId(officerId);
    try {
      const res = await fetch("/api/recruitment/recruiters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officerId,
          isRecruiter: !currentStatus,
        }),
      });

      if (res.ok) {
        fetchOfficers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingOfficerId(null);
    }
  };

  // Permission check
  const isAuthorized = hasRecruitmentAccess(currentOfficer);

  // ACCESS DENIED VIEW
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="police-card max-w-lg w-full p-8 rounded-3xl border border-red-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-red-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Division Restreinte • Pôle Recrutement</span>
            </div>
            <h1 className="text-2xl font-black text-white">Accès Réservé aux Recruteurs</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              L'accès à la catégorie <strong>Recrutement</strong> est strictement restreint aux membres accrédités du service.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">
              Habilitations requises pour accéder à cet espace :
            </div>
            <ul className="space-y-1 list-disc list-inside text-slate-400">
              <li><strong className="text-purple-300">Rôle Recruteur LSPD</strong> (Ressources Humaines)</li>
              <li><strong className="text-white">Chief of Police</strong></li>
              <li><strong className="text-white">Assistant-Chief & Deputy-Chief</strong></li>
              <li><strong className="text-amber-300">US Marshal</strong> (Supervision Fédérale)</li>
            </ul>
          </div>

          {currentOfficer && (
            <div className="text-[11px] text-slate-500 font-mono">
              Agent identifié : {currentOfficer.name} (#{currentOfficer.badgeNumber}) • Grade : {currentOfficer.rank}
            </div>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-theme-primary text-xs font-bold"
          >
            <span>Retour au Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Filtered candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesStatus = statusFilter === "Tous" || c.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const discord = (c.discordTag || "").toLowerCase();

    const matchesQuery =
      !query ||
      fullName.includes(query) ||
      phone.includes(query) ||
      discord.includes(query);

    return matchesStatus && matchesQuery;
  });

  const countPending = candidates.filter((c) => c.status === "En attente").length;
  const countInterview = candidates.filter((c) => c.status === "Entretien prévu").length;
  const countAccepted = candidates.filter((c) => c.status === "Accepté").length;
  const countRecruiters = officers.filter((o) => o.isRecruiter).length;

  return (
    <div className="space-y-6">
      {/* Bot Feedback Banner */}
      {botFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-fade-in ${
            botFeedback.success
              ? "bg-purple-950/80 border-purple-500/60 text-purple-200"
              : "bg-red-950/80 border-red-500/60 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {botFeedback.success ? (
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span>{botFeedback.text}</span>
          </div>

          <button
            onClick={() => setBotFeedback(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            <UserPlus className="w-4 h-4" />
            <span>Division du Recrutement & RH • Los Santos Police Department</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Pôle Recrutement & Candidatures</h1>
          <p className="text-xs text-slate-300">
            Gestion des postulants, organisation des entretiens d'embauche et habilitations des officiers recruteurs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Copy Application Link Button */}
          <button
            type="button"
            onClick={handleCopyApplicationLink}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
              copiedLink
                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white"
            }`}
            title="Copie le lien du formulaire public que vous pouvez envoyer directement aux candidats"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-purple-400" />}
            <span>{copiedLink ? "Lien copié !" : "🔗 Lien Candidature pour postulants"}</span>
          </button>

          {/* Bot Role Creation Action */}
          <button
            type="button"
            disabled={botLoading}
            onClick={handleTriggerBotRole}
            className="px-3.5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/70 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
            title="Envoie une requête à l'API Discord Bot pour créer ou vérifier le rôle Recruteur sur le serveur Discord"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>{botLoading ? "Requête Bot..." : "⚡ Rôle Discord Recruteur"}</span>
          </button>

          {/* New Candidate Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Candidat</span>
          </button>
        </div>
      </div>

      {/* Share Application Link Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-600/50 flex items-center justify-center text-purple-300 flex-shrink-0">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Formulaire de Candidature Public LSPD</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-600/60 font-mono">
                /recruitment/apply
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Transmettez ce lien aux joueurs désireux de rejoindre la police. Ils vérifient leur Discord, remplissent leur dossier, et recevront leur rôle Discord automatiquement dès que vous les accepterez.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyApplicationLink}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Copié !" : "Copier le lien"}</span>
          </button>

          <Link
            href="/recruitment/apply"
            target="_blank"
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Ouvrir la page de candidature dans un nouvel onglet"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="police-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Total Candidatures</div>
          <div className="text-2xl font-black text-white font-mono">{candidates.length}</div>
        </div>

        <div className="police-card p-4 rounded-2xl border border-amber-800/40 bg-amber-950/10 space-y-1">
          <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>En attente</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{countPending}</div>
        </div>

        <div className="police-card p-4 rounded-2xl border border-blue-800/40 bg-blue-950/10 space-y-1">
          <div className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Entretiens prévus</span>
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">{countInterview}</div>
        </div>

        <div className="police-card p-4 rounded-2xl border border-emerald-800/40 bg-emerald-950/10 space-y-1">
          <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Acceptés / Recrutés</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">{countAccepted}</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("candidates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "candidates"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Dossiers Candidatures ({candidates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recruiters")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "recruiters"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Équipe des Recruteurs ({countRecruiters})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: CANDIDATURES
          ===================================================================== */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          {/* Search & Status Filter Bar */}
          <div className="police-card p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, pseudo Discord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["Tous", "En attente", "Entretien prévu", "Accepté", "Refusé"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    statusFilter === st
                      ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40"
                      : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Candidates List Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Chargement des dossiers de recrutement...</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="police-card p-12 rounded-2xl text-center space-y-3 border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-purple-950/50 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white">Aucun dossier de candidature trouvé</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Partagez le lien de candidature ou enregistrez manuellement un candidat.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyApplicationLink}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copier le lien public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau candidat</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((c) => {
                const statusBadge =
                  c.status === "Accepté"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/60"
                    : c.status === "Refusé"
                    ? "bg-rose-950/80 text-rose-300 border-rose-600/60"
                    : c.status === "Entretien prévu"
                    ? "bg-blue-950/80 text-blue-300 border-blue-600/60"
                    : "bg-amber-950/80 text-amber-300 border-amber-600/60";

                return (
                  <div
                    key={c.id}
                    className="police-card p-5 rounded-2xl border border-slate-800 hover:border-purple-500/60 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {c.discordAvatar ? (
                            <img
                              src={c.discordAvatar}
                              alt="Avatar"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <UserPlus className="w-5 h-5 text-purple-400" />
                            </div>
                          )}

                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                              {c.firstName} {c.lastName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              {c.age && <span>{c.age} ans</span>}
                              {c.age && c.phone && <span>•</span>}
                              {c.phone && (
                                <span className="font-mono text-amber-400 flex items-center gap-1 font-bold">
                                  <Phone className="w-3 h-3" />
                                  {c.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Discord Verification & Role Status */}
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{c.discordTag || "Discord non lié"}</span>
                          </span>

                          {c.discordId ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              <span>Vérifié</span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-semibold">Non vérifié</span>
                          )}
                        </div>

                        {/* Discord Role Granted / DM Sent Status Badges */}
                        {(c.discordRoleGranted || c.discordNotified) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
                            {c.discordRoleGranted && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-600/50 flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                <span>Rôle Discord Actif</span>
                              </span>
                            )}
                            {c.discordNotified && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>MP Envoyé</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Motivation Preview */}
                      {c.motivation && (
                        <div className="text-xs text-slate-300 italic line-clamp-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                          "{c.motivation}"
                        </div>
                      )}

                      {/* Interview Date if set */}
                      {c.interviewDate && (
                        <div className="text-[11px] text-blue-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            Entretien :{" "}
                            {new Date(c.interviewDate).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Recruiter Assigned */}
                      {c.recruiter && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-400" />
                          <span>
                            Examiné par {c.recruiter.rank} {c.recruiter.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(c);
                          setEditStatus(c.status);
                          setEditInterviewDate(
                            c.interviewDate ? new Date(c.interviewDate).toISOString().slice(0, 16) : ""
                          );
                          setEditInterviewNotes(c.interviewNotes || "");
                          setEditDecisionReason(c.decisionReason || "");
                          setEditRecruiterId(c.recruiterId || currentOfficer?.id || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Évaluer / Statut</span>
                      </button>

                      {/* Direct Accept & Grant Discord Action if not yet accepted */}
                      {c.status !== "Accepté" && c.discordId && (
                        <button
                          type="button"
                          onClick={() => handleAcceptAndNotifyDiscord(c)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
                          title="Accepter immédiatement et attribuer le rôle Discord + MP"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accepter & Rôle</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteCandidate(c.id, `${c.firstName} ${c.lastName}`)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        title="Supprimer la candidature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: ÉQUIPE DES RECRUTEURS
          ===================================================================== */}
      {activeTab === "recruiters" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Gestion des Officiers Habilités au Recrutement</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Attribuez ou retirez le rôle de recruteur aux officiers du service. La modification synchronise automatiquement le rôle Discord de l'agent.
              </p>
            </div>

            <button
              type="button"
              disabled={botLoading}
              onClick={handleTriggerBotRole}
              className="px-3.5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-200 hover:text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Vérifier Rôle Discord</span>
            </button>
          </div>

          <div className="police-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#090b17] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Officier</th>
                    <th className="p-3.5">Grade</th>
                    <th className="p-3.5">Département</th>
                    <th className="p-3.5">Statut Recruteur</th>
                    <th className="p-3.5 text-right">Action Habilitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {officers.map((officer) => (
                    <tr key={officer.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={officer.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={officer.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white">{officer.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">#{officer.badgeNumber}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-300">{officer.rank}</td>
                      <td className="p-3.5 text-slate-400">{officer.department}</td>

                      <td className="p-3.5">
                        {officer.isRecruiter ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950 border border-purple-600 text-purple-200 inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current text-purple-400" />
                            <span>Recruteur Actif</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-semibold">Non habilité</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          disabled={togglingOfficerId === officer.id}
                          onClick={() => handleToggleRecruiter(officer.id, officer.isRecruiter)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                            officer.isRecruiter
                              ? "bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300"
                              : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40"
                          }`}
                        >
                          {togglingOfficerId === officer.id
                            ? "Mise à jour..."
                            : officer.isRecruiter
                            ? "Retirer Recruteur"
                            : "Nommer Recruteur"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: CRÉER UNE NOUVELLE CANDIDATURE (MANUELLE)
          ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCandidate}
            className="police-card w-full max-w-lg p-6 rounded-2xl border border-purple-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Nouveau Dossier de Candidature</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Prénom *</label>
                <input
                  type="text"
                  required
                  value={newCandidate.firstName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                  placeholder="Ex: John"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nom *</label>
                <input
                  type="text"
                  required
                  value={newCandidate.lastName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                  placeholder="Ex: Doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Téléphone (In-Game)</label>
                <input
                  type="text"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  placeholder="555-0182"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Âge</label>
                <input
                  type="number"
                  value={newCandidate.age}
                  onChange={(e) => setNewCandidate({ ...newCandidate, age: e.target.value })}
                  placeholder="24"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Pseudo Discord</label>
                <input
                  type="text"
                  value={newCandidate.discordTag}
                  onChange={(e) => setNewCandidate({ ...newCandidate, discordTag: e.target.value })}
                  placeholder="Ex: johndoe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ID Discord (17-19 chiffres)</label>
                <input
                  type="text"
                  value={newCandidate.discordId}
                  onChange={(e) => setNewCandidate({ ...newCandidate, discordId: e.target.value })}
                  placeholder="Ex: 853291..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Expérience préalable</label>
              <textarea
                rows={2}
                value={newCandidate.experience}
                onChange={(e) => setNewCandidate({ ...newCandidate, experience: e.target.value })}
                placeholder="Ex-agent BCSO, agent de sécurité..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Motivations du candidat</label>
              <textarea
                rows={3}
                value={newCandidate.motivation}
                onChange={(e) => setNewCandidate({ ...newCandidate, motivation: e.target.value })}
                placeholder="Pourquoi souhaite-t-il rejoindre le LSPD ?"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingCandidate}
                className="px-5 py-2 rounded-xl btn-theme-primary text-xs font-black uppercase tracking-wider shadow-lg disabled:opacity-50"
              >
                {savingCandidate ? "Enregistrement..." : "Créer le dossier"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: ÉVALUER LE CANDIDAT & RENDRE UNE DÉCISION
          ===================================================================== */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="police-card w-full max-w-xl p-6 rounded-2xl border border-purple-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  Évaluation : {selectedCandidate.firstName} {selectedCandidate.lastName}
                </h3>
                <div className="text-[11px] text-slate-400">
                  Dossier créé le {new Date(selectedCandidate.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Summary */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-3">
                {selectedCandidate.phone && (
                  <span className="font-mono text-amber-400 font-bold">📞 {selectedCandidate.phone}</span>
                )}
                {selectedCandidate.discordTag && (
                  <span className="font-mono text-indigo-300 font-bold">💬 {selectedCandidate.discordTag}</span>
                )}
                {selectedCandidate.discordId && (
                  <span className="font-mono text-slate-400 text-[10px]">ID: {selectedCandidate.discordId}</span>
                )}
                {selectedCandidate.age && <span>🎂 {selectedCandidate.age} ans</span>}
              </div>

              {selectedCandidate.availability && (
                <div className="text-[11px] text-slate-300">
                  <strong>Disponibilités :</strong> {selectedCandidate.availability}
                </div>
              )}

              {selectedCandidate.experience && (
                <div className="text-[11px] text-slate-300">
                  <strong>Expérience :</strong> {selectedCandidate.experience}
                </div>
              )}

              {selectedCandidate.motivation && (
                <div className="pt-1 text-slate-400 italic">
                  <strong>Motivation :</strong> {selectedCandidate.motivation}
                </div>
              )}
            </div>

            {/* Discord Role & Notification Quick Banner */}
            {selectedCandidate.discordId ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-700/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>Intégration Discord Automatique</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {selectedCandidate.discordRoleGranted
                      ? "✅ Rôle Cadet attribué sur Discord"
                      : "Le candidat recevra le rôle Cadet et une notification en MP lors de l'acceptation."}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={discordAccepting}
                  onClick={() => handleAcceptAndNotifyDiscord(selectedCandidate)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{discordAccepting ? "Attribution..." : "⚡ Accepter & Notifier Discord"}</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Ce candidat n'a pas vérifié son compte Discord. Le rôle et la notification ne pourront pas être envoyés automatiquement.</span>
              </div>
            )}

            {/* Decision Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Statut de la Candidature</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "En attente", color: "border-amber-500 text-amber-300 bg-amber-950/60" },
                  { value: "Entretien prévu", color: "border-blue-500 text-blue-300 bg-blue-950/60" },
                  { value: "Accepté", color: "border-emerald-500 text-emerald-300 bg-emerald-950/60" },
                  { value: "Refusé", color: "border-rose-500 text-rose-300 bg-rose-950/60" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setEditStatus(s.value as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      editStatus === s.value ? `${s.color} shadow-lg scale-95` : "bg-slate-900 border-slate-700 text-slate-400"
                    }`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Date Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Date & Heure de l'Entretien</label>
              <input
                type="datetime-local"
                value={editInterviewDate}
                onChange={(e) => setEditInterviewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            {/* Interview Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Observations & Compte-rendu d'Entretien</label>
              <textarea
                rows={3}
                value={editInterviewNotes}
                onChange={(e) => setEditInterviewNotes(e.target.value)}
                placeholder="Ressenti du recruteur, tests de mise en situation, points forts/faibles..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            {/* Decision Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Motif de la Décision finale</label>
              <textarea
                rows={2}
                value={editDecisionReason}
                onChange={(e) => setEditDecisionReason(e.target.value)}
                placeholder="Ex: Candidat retenu pour la prochaine promotion de Rookie / Refus pour profil inadapté."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteCandidate(selectedCandidate.id, `${selectedCandidate.firstName} ${selectedCandidate.lastName}`)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le dossier</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleUpdateCandidate}
                  className="px-5 py-2 rounded-xl btn-theme-primary text-xs font-black uppercase tracking-wider shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? "Enregistrement..." : "Sauvegarder"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
