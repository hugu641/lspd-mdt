"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useOfficer, Officer } from "../../context/OfficerContext";
import { isHighCommand } from "../../lib/ranks";
import {
  Users,
  Search,
  Phone,
  Shield,
  Copy,
  Check,
  Camera,
  Edit3,
  ExternalLink,
  Award,
  Filter,
  CheckCircle2,
  Clock,
  Radio,
  X,
  Sparkles,
  Bot,
  FileText,
} from "lucide-react";

export default function TrombinoscopePage() {
  const { currentOfficer, allOfficers, setCurrentOfficer, refreshOfficers, updateStatus } = useOfficer();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "10_8" | "BUSY" | "10_10" | "MARSHAL" | "HIGH_COMMAND" | "FTO">("ALL");
  const [sortBy, setSortBy] = useState<"RANK" | "BADGE" | "NAME">("RANK");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Edit Officer Modal state (for avatar URL and in-game phone number)
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canManageOthers = isHighCommand(currentOfficer);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}: ${text}`);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const openEditModal = (officer: Officer) => {
    setEditingOfficer(officer);
    setEditPhone(officer.phone || "");
    setEditAvatarUrl(officer.avatarUrl || "");
  };

  const handleSaveOfficerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/officers/${editingOfficer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editPhone.trim() || null,
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (currentOfficer?.id === editingOfficer.id) {
          setCurrentOfficer({
            ...currentOfficer,
            phone: editPhone.trim() || null,
            avatarUrl: editAvatarUrl.trim() || null,
          });
        }
        await refreshOfficers();
        setEditingOfficer(null);
      } else {
        alert("Erreur lors de la mise à jour des coordonnées.");
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Rank sorting priority
  const rankPriority: Record<string, number> = {
    "directeur us marshal": 1,
    "us marshal - superviseur légal": 2,
    "us marshal": 3,
    "chief of police": 4,
    "assistant-chief": 5,
    "deputy-chief": 6,
    "commandant": 7,
    "capitaine": 8,
    "lieutenant-chef": 9,
    "lieutenant": 10,
    "sergent-chef": 11,
    "sergent": 12,
    "slo": 13,
    "officier iii": 14,
    "officier ii": 15,
    "officier i": 16,
    "rookie": 17,
  };

  const getRankScore = (rankName: string) => {
    const clean = (rankName || "").toLowerCase().trim();
    for (const [key, val] of Object.entries(rankPriority)) {
      if (clean.includes(key)) return val;
    }
    return 99;
  };

  // Filtered and sorted officers
  const filteredOfficers = useMemo(() => {
    let list = [...allOfficers];

    // Filter
    if (filterMode === "10_8") {
      list = list.filter((o) => o.status === "10-8");
    } else if (filterMode === "BUSY") {
      list = list.filter((o) => o.status === "10-6" || o.status === "10-7");
    } else if (filterMode === "10_10") {
      list = list.filter((o) => o.status === "10-10");
    } else if (filterMode === "MARSHAL") {
      list = list.filter(
        (o) =>
          o.department === "US Marshal" ||
          o.rank.toLowerCase().includes("marshal") ||
          o.rank.toLowerCase().includes("marshall")
      );
    } else if (filterMode === "HIGH_COMMAND") {
      list = list.filter((o) => isHighCommand(o));
    } else if (filterMode === "FTO") {
      list = list.filter((o) => o.isInstructor);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.badgeNumber.toLowerCase().includes(q) ||
          o.callsign.toLowerCase().includes(q) ||
          o.rank.toLowerCase().includes(q) ||
          (o.phone && o.phone.toLowerCase().includes(q)) ||
          (o.discordTag && o.discordTag.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "RANK") {
        const scoreA = getRankScore(a.rank);
        const scoreB = getRankScore(b.rank);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "BADGE") {
        return parseInt(a.badgeNumber || "0", 10) - parseInt(b.badgeNumber || "0", 10);
      }
      if (sortBy === "NAME") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [allOfficers, filterMode, searchQuery, sortBy]);

  // Counts
  const onDutyCount = allOfficers.filter((o) => o.status === "10-8").length;
  const breakCount = allOfficers.filter((o) => o.status === "10-6" || o.status === "10-7").length;
  const offDutyCount = allOfficers.filter((o) => o.status === "10-10").length;
  const marshalCount = allOfficers.filter(
    (o) => o.department === "US Marshal" || o.rank.toLowerCase().includes("marshal")
  ).length;

  return (
    <div className="space-y-5 pb-10">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#090b17] border border-[#1a1f3c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-900/40">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 font-mono">
                ANNUAIRE OFFICIEL
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {allOfficers.length} Agents enregistrés
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Trombinoscope des Effectifs
            </h1>
            <p className="text-xs text-slate-400">
              Annuaire photo, coordonnées téléphoniques en ville (in-game) et statuts radio des agents LSPD & US Marshal.
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#0d1024] border border-emerald-500/30 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-semibold leading-none">10-8 En Service</div>
              <div className="text-xs font-black text-emerald-300">{onDutyCount}</div>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#0d1024] border border-amber-500/30 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-semibold leading-none">Pause / Occupé</div>
              <div className="text-xs font-black text-amber-300">{breakCount}</div>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#0d1024] border border-purple-500/30 flex items-center gap-2 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-semibold leading-none">US Marshal</div>
              <div className="text-xs font-black text-purple-300">{marshalCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0a0c1a] border border-[#181c38] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule (#88), téléphone (555-), callsign ou grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#070814] border border-[#1e2344] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trier par :
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#070814] border border-[#1e2344] text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="RANK">Hiérarchie (Grade)</option>
              <option value="BADGE">Matricule (Croissant)</option>
              <option value="NAME">Nom (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setFilterMode("ALL")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "ALL"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "bg-[#10132b] text-slate-400 hover:text-white hover:bg-[#181c3d]"
            }`}
          >
            Tous ({allOfficers.length})
          </button>
          <button
            onClick={() => setFilterMode("10_8")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "10_8"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "bg-[#10132b] text-slate-400 hover:text-emerald-300 hover:bg-[#181c3d]"
            }`}
          >
            🟢 10-8 En Service ({onDutyCount})
          </button>
          <button
            onClick={() => setFilterMode("BUSY")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "BUSY"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                : "bg-[#10132b] text-slate-400 hover:text-amber-300 hover:bg-[#181c3d]"
            }`}
          >
            🟡 Pause / Occupé ({breakCount})
          </button>
          <button
            onClick={() => setFilterMode("10_10")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "10_10"
                ? "bg-slate-700 text-white shadow-md"
                : "bg-[#10132b] text-slate-400 hover:text-white hover:bg-[#181c3d]"
            }`}
          >
            ⚫ 10-10 Fin de Service ({offDutyCount})
          </button>
          <button
            onClick={() => setFilterMode("MARSHAL")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "MARSHAL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "bg-[#10132b] text-slate-400 hover:text-indigo-300 hover:bg-[#181c3d]"
            }`}
          >
            ⚖️ US Marshal ({marshalCount})
          </button>
          <button
            onClick={() => setFilterMode("HIGH_COMMAND")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "HIGH_COMMAND"
                ? "bg-pink-600 text-white shadow-md shadow-pink-900/40"
                : "bg-[#10132b] text-slate-400 hover:text-pink-300 hover:bg-[#181c3d]"
            }`}
          >
            ❖ Haut Commandement
          </button>
          <button
            onClick={() => setFilterMode("FTO")}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === "FTO"
                ? "bg-yellow-600 text-white shadow-md shadow-yellow-900/40"
                : "bg-[#10132b] text-slate-400 hover:text-yellow-300 hover:bg-[#181c3d]"
            }`}
          >
            ★ Formateurs FTO
          </button>
        </div>
      </div>

      {/* Trombinoscope Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredOfficers.map((officer) => {
          const isMe = currentOfficer?.id === officer.id;
          const isMarshal =
            officer.department === "US Marshal" ||
            officer.rank.toLowerCase().includes("marshal") ||
            officer.rank.toLowerCase().includes("marshall");
          const isHCmd = isHighCommand(officer);

          return (
            <div
              key={officer.id}
              className={`rounded-2xl bg-[#090b17] border transition-all flex flex-col justify-between overflow-hidden shadow-lg relative group ${
                isMe
                  ? "border-purple-500/80 shadow-purple-950/40"
                  : isMarshal
                  ? "border-indigo-500/40 hover:border-indigo-400"
                  : "border-[#181c38] hover:border-purple-500/50"
              }`}
            >
              {/* Card Top Header */}
              <div className="p-3 pb-0 flex items-center justify-between gap-2">
                {/* Status Indicator */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      officer.status === "10-8"
                        ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"
                        : officer.status === "10-7"
                        ? "bg-amber-400"
                        : officer.status === "10-6"
                        ? "bg-yellow-400"
                        : "bg-slate-600"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold font-mono uppercase ${
                      officer.status === "10-8"
                        ? "text-emerald-300"
                        : officer.status === "10-7"
                        ? "text-amber-300"
                        : officer.status === "10-6"
                        ? "text-yellow-300"
                        : "text-slate-400"
                    }`}
                  >
                    {officer.status}
                  </span>
                </div>

                {/* Badges: Mon Compte / US Marshal */}
                <div className="flex items-center gap-1">
                  {isMe && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-500/40 uppercase">
                      Vous
                    </span>
                  )}
                  {isMarshal ? (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 uppercase">
                      US Marshal
                    </span>
                  ) : (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 uppercase">
                      LSPD
                    </span>
                  )}
                </div>
              </div>

              {/* Photo & Identity Center Area */}
              <div className="p-4 flex flex-col items-center text-center space-y-3">
                {/* Photo Frame */}
                <div className="relative group/avatar">
                  <div
                    className={`w-24 h-24 rounded-2xl p-0.5 shadow-xl transition-all ${
                      isMarshal
                        ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"
                        : isHCmd
                        ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                        : "bg-gradient-to-tr from-[#2a3160] to-[#1a1f3c]"
                    }`}
                  >
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#070814] flex items-center justify-center relative">
                      {officer.avatarUrl ? (
                        <img
                          src={officer.avatarUrl}
                          alt={officer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl bg-gradient-to-tr from-indigo-950 to-purple-900">
                          {officer.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo Edit quick-button for self or high command */}
                  {(isMe || canManageOthers) && (
                    <button
                      onClick={() => openEditModal(officer)}
                      title="Modifier la photo"
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg border border-white/20 transition-all opacity-90 hover:opacity-100"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Name & Callsign */}
                <div>
                  <h3 className="text-sm font-black text-white leading-snug group-hover:text-purple-300 transition-colors">
                    {officer.name}
                  </h3>
                  <div className="text-[11px] font-mono text-purple-400 font-bold mt-0.5">
                    Matricule #{officer.badgeNumber}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isMarshal
                          ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/40"
                          : isHCmd
                          ? "bg-purple-950/80 text-purple-300 border-purple-500/40"
                          : "bg-[#0f132c] text-slate-300 border-[#1e254e]"
                      }`}
                    >
                      {officer.rank}
                    </span>
                  </div>
                </div>

                {/* Badges / Extras */}
                {officer.isInstructor && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Instructeur FTO</span>
                  </span>
                )}
              </div>

              {/* Contact Information & Action Bar */}
              <div className="p-3 pt-2 bg-[#070814]/80 border-t border-[#151833] space-y-2">
                {/* In-Game Phone Number */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tél in-game :</span>
                  </span>

                  {officer.phone ? (
                    <button
                      onClick={() => handleCopy(officer.phone!, "Téléphone")}
                      className="font-mono text-xs font-bold text-emerald-300 hover:text-white px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 flex items-center gap-1 transition-all"
                      title="Cliquer pour copier le numéro"
                    >
                      <span>{officer.phone}</span>
                      <Copy className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ) : (
                    <button
                      onClick={() => (isMe || canManageOthers ? openEditModal(officer) : null)}
                      className={`text-[10px] font-semibold italic ${
                        isMe || canManageOthers
                          ? "text-amber-400 hover:underline cursor-pointer"
                          : "text-slate-500"
                      }`}
                    >
                      {isMe ? "+ Ajouter mon numéro" : "Non renseigné"}
                    </button>
                  )}
                </div>

                {/* Discord Identity */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Discord :</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-300 truncate max-w-[120px]">
                    @{officer.discordTag || officer.discordId || "Inconnu"}
                  </span>
                </div>

                {/* Card Action Buttons: View Profile + Edit */}
                <div className="pt-2 border-t border-[#151833] space-y-1.5">
                  <Link
                    href={`/trombinoscope/${officer.id}`}
                    className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/40 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-300" />
                    <span>Consulter le Dossier</span>
                  </Link>

                  {(isMe || canManageOthers) && (
                    <button
                      onClick={() => openEditModal(officer)}
                      className="w-full py-1 px-2 rounded-xl bg-[#12152d] hover:bg-[#1b2046] border border-[#21274d] text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3 text-purple-400" />
                      <span>{isMe ? "Modifier coordonnées" : "Gérer coordonnées"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOfficers.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-[#090b17] border border-[#181c38] space-y-3">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Aucun agent trouvé</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Aucun effectif ne correspond à votre recherche &quot;{searchQuery}&quot; avec les filtres sélectionnés.
          </p>
        </div>
      )}

      {/* Copy Notification Toast */}
      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-xl bg-purple-950 text-purple-200 border border-purple-500/50 shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Copié dans le presse-papier : <strong className="text-white font-mono">{copiedText}</strong></span>
        </div>
      )}

      {/* Edit Photo / Phone Modal */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0c0e1e] border border-purple-500/40 shadow-2xl p-6 space-y-5 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#181c3b]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Modifier Coordonnées
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {editingOfficer.name} (#{editingOfficer.badgeNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingOfficer(null)}
                className="w-7 h-7 rounded-lg bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficerDetails} className="space-y-4">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Numéro de téléphone en ville (In-Game)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    placeholder="ex: 555-0188"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Numéro utilisé pour vous joindre sur les communications radio et téléphone.
                </p>
              </div>

              {/* Avatar URL Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Lien URL de la Photo de Profil (Avatar)
                </label>
                <div className="relative">
                  <Camera className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="url"
                    placeholder="https://.../photo.png"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Lien direct vers votre photo d&apos;identité (Discord CDN, Imgur, ou hébergeur d&apos;image).
                </p>
              </div>

              {/* Image Preview */}
              {editAvatarUrl.trim() && (
                <div className="p-3 rounded-xl bg-[#070814] border border-[#1e2344] flex items-center gap-3">
                  <img
                    src={editAvatarUrl}
                    alt="Aperçu"
                    className="w-12 h-12 rounded-xl object-cover border border-purple-500/40"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="text-xs">
                    <div className="font-bold text-white">Aperçu de la photo</div>
                    <div className="text-[10px] text-emerald-400">Image valide</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#181c3b]">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  className="px-4 py-2 rounded-xl bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white text-xs font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Sauvegarde..." : "Enregistrer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
