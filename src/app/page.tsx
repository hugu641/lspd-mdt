"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useOfficer } from "../context/OfficerContext";
import {
  Shield,
  Users,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
  Plane,
  ShieldAlert,
  Dog,
  GraduationCap,
  Heart,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  Sparkles,
  MapPin,
  Radio,
  Phone,
  UserCheck,
  ChevronDown,
  Check,
  Star,
  ExternalLink,
  Camera,
  Layers,
} from "lucide-react";

// Official 14 Ranks of the LSPD in hierarchical order
const LSPD_RANKS = [
  { id: "rookie", name: "Rookie", level: 1, category: "Période Probatoire", stars: "★", description: "Cadet en formation probatoire sur le terrain" },
  { id: "officier_1", name: "Officier I", level: 2, category: "Corps de Patrouille", stars: "★★", description: "Agent titulaire de patrouille" },
  { id: "officier_2", name: "Officier II", level: 3, category: "Corps de Patrouille", stars: "★★★", description: "Agent de patrouille confirmé, habilité aux interventions" },
  { id: "officier_3", name: "Officier III", level: 4, category: "Corps de Patrouille", stars: "★★★★", description: "Agent de patrouille senior, référent d'équipe" },
  { id: "slo", name: "SLO", level: 5, category: "Senior Lead Officer", stars: "★★★★★", description: "Officier de liaison communautaire et tactique" },
  { id: "sergent", name: "Sergent", level: 6, category: "Supervision de Terrain", stars: "◆", description: "Superviseur d'opérations et de patrouilles" },
  { id: "sergent_chef", name: "Sergent-Chef", level: 7, category: "Supervision de Terrain", stars: "◆◆", description: "Superviseur principal de quart de brigade" },
  { id: "lieutenant", name: "Lieutenant", level: 8, category: "Supervision Supérieure", stars: "◆◆◆", description: "Commandant de quart et responsable d'enquête" },
  { id: "lieutenant_chef", name: "Lieutenant-Chef", level: 9, category: "Supervision Supérieure", stars: "◆◆◆◆", description: "Commandant principal de brigade" },
  { id: "capitaine", name: "Capitaine", level: 10, category: "État-Major", stars: "◈", description: "Chef de division opérationnelle" },
  { id: "commandant", name: "Commandant", level: 11, category: "État-Major", stars: "◈◈", description: "Responsable des effectifs et coordinateur de district" },
  { id: "deputy_chief", name: "Deputy-Chief", level: 12, category: "Haut Commandement", stars: "❖", description: "Adjoint au Haut Commandement LSPD" },
  { id: "assistant_chief", name: "Assistant-Chief", level: 13, category: "Haut Commandement", stars: "❖❖", description: "Chef adjoint de la police métropolitaine" },
  { id: "chief", name: "Chief of Police", level: 14, category: "Commandement Suprême", stars: "✪✪✪", description: "Directeur général du Los Santos Police Department" },
];

export default function DashboardPage() {
  const { currentOfficer, allOfficers, setCurrentOfficer } = useOfficer();
  const [warrants, setWarrants] = useState<any[]>([]);
  const [recentCitations, setRecentCitations] = useState<any[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [showRanksExpanded, setShowRanksExpanded] = useState(false);
  const [showOfficerPicker, setShowOfficerPicker] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [warrantsRes, citationsRes, sessionsRes] = await Promise.all([
          fetch("/api/warrants?status=Actif"),
          fetch("/api/citations?limit=4"),
          fetch("/api/trainings/sessions"),
        ]);

        const warrantsData = await warrantsRes.json();
        const citationsData = await citationsRes.json();
        const sessionsData = await sessionsRes.json();

        setWarrants(Array.isArray(warrantsData) ? warrantsData : []);
        setRecentCitations(Array.isArray(citationsData) ? citationsData : []);
        setTrainingSessions(Array.isArray(sessionsData) ? sessionsData : []);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      }
    }

    loadData();
  }, []);

  // Update avatar when officer changes
  useEffect(() => {
    if (currentOfficer) {
      setUserAvatar(currentOfficer.avatarUrl || null);
      setCustomPhotoInput(currentOfficer.avatarUrl || "");
    }
  }, [currentOfficer]);

  // Extract First Name and Last Name
  const nameParts = (currentOfficer?.name || "Agent Inconnu").trim().split(" ");
  const firstName = nameParts.length > 0 ? nameParts[0] : "Agent";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Find index in rank ladder
  const currentRankIndex = LSPD_RANKS.findIndex(
    (r) => r.name.toLowerCase() === (currentOfficer?.rank || "").toLowerCase()
  );
  const effectiveRankIndex = currentRankIndex >= 0 ? currentRankIndex : 1;

  // Rank progression calculations
  const earnedRanks = LSPD_RANKS.slice(0, effectiveRankIndex + 1);
  const nextRank = effectiveRankIndex < LSPD_RANKS.length - 1 ? LSPD_RANKS[effectiveRankIndex + 1] : null;

  // Badge icon helper
  const getBadgeIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case "zap":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "plane":
        return <Plane className="w-3.5 h-3.5 text-cyan-400" />;
      case "shieldalert":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case "dog":
        return <Dog className="w-3.5 h-3.5 text-emerald-400" />;
      case "graduationcap":
        return <GraduationCap className="w-3.5 h-3.5 text-purple-400" />;
      case "heart":
        return <Heart className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Award className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  // Status badge style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "10-8":
        return { label: "10-8 • Pris de service", dot: "bg-emerald-400 shadow-[0_0_8px_#10b981]", border: "border-emerald-500/40 text-emerald-300 bg-emerald-950/40" };
      case "10-7":
        return { label: "10-7 • Pause service", dot: "bg-amber-400 shadow-[0_0_8px_#f59e0b]", border: "border-amber-500/40 text-amber-300 bg-amber-950/40" };
      case "10-6":
        return { label: "10-6 • Occupé", dot: "bg-rose-400 shadow-[0_0_8px_#f43f5e]", border: "border-rose-500/40 text-rose-300 bg-rose-950/40" };
      case "10-10":
      default:
        return { label: "10-10 • Fin de service", dot: "bg-slate-400", border: "border-slate-700 text-slate-400 bg-slate-900/50" };
    }
  };

  // Save custom photo
  const handleSavePhoto = () => {
    if (customPhotoInput.trim()) {
      setUserAvatar(customPhotoInput.trim());
      setEditingPhoto(false);
    }
  };

  const statusInfo = getStatusStyle(currentOfficer?.status || "10-10");

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-12">
      {/* =========================================================================
          SECTION 1: CARTE D'IDENTITÉ & CARRIÈRE DE L'AGENT (COMPACTE & SANS FTO)
          ========================================================================= */}
      <section className="relative rounded-2xl bg-gradient-to-b from-[#0e1022] via-[#090b16] to-[#070810] border border-purple-500/25 p-4 sm:p-5 shadow-lg shadow-purple-950/20 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-16 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Mini Header: Brand & Switcher */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#181c38] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 p-[1px] shadow-sm">
              <div className="w-full h-full bg-[#0b0d1b] rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-widest uppercase text-purple-400">
                CARTE D&apos;IDENTITÉ PROFESSIONNELLE
              </span>
              <span className="text-[9px] px-2 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono font-bold">
                LSPD
              </span>
            </div>
          </div>

          {/* Quick Officer Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowOfficerPicker(!showOfficerPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12152a] hover:bg-[#1a1f3d] border border-purple-500/30 text-[11px] font-bold text-purple-300 hover:text-white transition-all shadow-sm"
            >
              <Users className="w-3 h-3 text-purple-400" />
              <span>Changer d&apos;agent</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showOfficerPicker && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#0c0e1e] border border-purple-500/40 shadow-2xl p-2 z-50 divide-y divide-[#171a33]">
                <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Sélectionner un effectif
                </div>
                <div className="py-1 max-h-52 overflow-y-auto space-y-1">
                  {allOfficers.map((off) => (
                    <button
                      key={off.id}
                      onClick={() => {
                        setCurrentOfficer(off);
                        setShowOfficerPicker(false);
                      }}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-all ${
                        currentOfficer?.id === off.id
                          ? "bg-purple-900/40 text-purple-200 border border-purple-500/50"
                          : "text-slate-300 hover:bg-[#141730]"
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{off.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{off.badgeNumber} • {off.rank}
                        </div>
                      </div>
                      {currentOfficer?.id === off.id && (
                        <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Bar: Compact Avatar + Name + Secondary Info Strip (NO FTO) */}
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#181c38] relative z-10">
          <div className="flex items-center gap-3">
            {/* Compact Photo */}
            <div className="relative group flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 shadow-md shadow-purple-900/30">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#0c0e1e] relative flex items-center justify-center">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={currentOfficer?.name || "Officer"}
                      className="w-full h-full object-cover"
                      onError={() => setUserAvatar(null)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-indigo-900 flex items-center justify-center text-white font-black text-xl">
                      {firstName[0]}
                      {lastName[0] || ""}
                    </div>
                  )}

                  <button
                    onClick={() => setEditingPhoto(!editingPhoto)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold"
                    title="Modifier la photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-300" />
                    <span>Photo</span>
                  </button>
                </div>
              </div>

              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0c18] ${statusInfo.dot}`}
                title={statusInfo.label}
              />
            </div>

            {/* Officer Names and Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white">
                  {firstName} <span className="uppercase tracking-wide text-purple-300">{lastName}</span>
                </h1>
                <span className="text-xs font-mono font-bold text-purple-400">
                  #{currentOfficer?.badgeNumber || "00"}
                </span>

                {/* Rank Badge */}
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/40 font-semibold shadow-sm">
                  {currentOfficer?.rank || "Rookie"}
                </span>

                {currentOfficer?.isInstructor && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    ★ Instructeur FTO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${statusInfo.border}`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Photo URL editor inline popup if toggled */}
        {editingPhoto && (
          <div className="my-2 p-2.5 rounded-xl bg-[#111429] border border-purple-500/40 flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-purple-300 whitespace-nowrap">URL Photo :</span>
            <input
              type="url"
              value={customPhotoInput}
              onChange={(e) => setCustomPhotoInput(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-2 py-1 rounded bg-[#090b16] border border-[#222749] text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => setEditingPhoto(false)}
              className="px-2 py-1 rounded text-[10px] text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleSavePhoto}
              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white"
            >
              Valider
            </button>
          </div>
        )}

        {/* Two Balanced Compact Panels: Grades & Formations */}
        <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-2 gap-3.5 relative z-10">
          {/* PANEL 1: TOUS LES GRADES QUE TU AS */}
          <div className="p-3.5 rounded-xl bg-[#0a0c1a] border border-[#181c38] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Grades & Échelons Acquis
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  Échelon {effectiveRankIndex + 1}/13
                </span>
              </div>

              <button
                onClick={() => setShowRanksExpanded(!showRanksExpanded)}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <span>{showRanksExpanded ? "Fermer l&apos;arbre" : "Voir les 13"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showRanksExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Current Active Rank Bar */}
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-950/50 to-[#0e1124] border border-purple-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">
                  {LSPD_RANKS[effectiveRankIndex]?.stars || "★"}
                </span>
                <span className="text-xs font-black text-white">
                  {currentOfficer?.rank}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                  {LSPD_RANKS[effectiveRankIndex]?.category}
                </span>
              </div>

              {nextRank && (
                <div className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-400">Suivant :</span>
                  <span>{nextRank.name}</span>
                </div>
              )}
            </div>

            {/* Horizontal Compact Progression Ladder */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {earnedRanks.map((r, idx) => {
                const isCurrent = idx === effectiveRankIndex;
                return (
                  <div
                    key={r.id}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                      isCurrent
                        ? "bg-purple-900/70 text-purple-100 border border-purple-400 shadow-sm"
                        : "bg-[#101326] text-slate-300 border border-[#1b203c]"
                    }`}
                  >
                    <CheckCircle2 className={`w-2.5 h-2.5 ${isCurrent ? "text-purple-300" : "text-emerald-400"}`} />
                    <span>{r.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Expandable 13 Ranks Tree */}
            {showRanksExpanded && (
              <div className="mt-2 pt-2 border-t border-[#181c38] grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px]">
                {LSPD_RANKS.map((r, idx) => {
                  const isEarned = idx <= effectiveRankIndex;
                  const isCurrent = idx === effectiveRankIndex;
                  return (
                    <div
                      key={r.id}
                      className={`p-1.5 rounded-lg border flex items-center justify-between ${
                        isCurrent
                          ? "bg-purple-950/70 border-purple-500/60 text-purple-200 font-bold"
                          : isEarned
                          ? "bg-[#0d1020] border-emerald-900/30 text-slate-300"
                          : "bg-[#080912] border-[#151728] text-slate-500"
                      }`}
                    >
                      <span className="truncate flex items-center gap-1">
                        {isEarned ? <Check className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" /> : "•"}
                        <span className="truncate">{r.name}</span>
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 flex-shrink-0 ml-1">{r.stars}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PANEL 2: TOUTES LES FORMATIONS QUE TU AS */}
          <div className="p-3.5 rounded-xl bg-[#0a0c1a] border border-[#181c38] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Brevets & Certifications
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                  {currentOfficer?.badges?.length || 0} Validés
                </span>
              </div>
            </div>

            {/* Badges Grid (Compact) */}
            {!currentOfficer?.badges || currentOfficer.badges.length === 0 ? (
              <div className="p-3 rounded-lg bg-[#0d0f20] border border-[#1c203b] text-center space-y-1">
                <div className="text-[11px] text-slate-400">Aucun brevet enregistré pour cet agent.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {currentOfficer.badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-2 rounded-lg bg-[#0e1124] border border-[#1b1f3c] hover:border-purple-500/40 transition-all flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#141834] border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-300">
                      {getBadgeIcon(b.course?.badgeIcon || "Award")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">
                        {b.course?.badgeName || b.course?.title}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-2 h-2" />
                        <span>Validé</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 truncate">{b.course?.category || "LSPD"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ACCÈS RAPIDE - DERNIERS PV & AVIS DE RECHERCHE
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dernières Contraventions */}
        <div className="rounded-2xl bg-[#090b14] border border-[#161a2e] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Derniers Procès-Verbaux
              </h3>
            </div>
            <Link
              href="/calculator"
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
            >
              <span>Nouveau PV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#151829]">
            {recentCitations.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Aucun procès-verbal récent.
              </div>
            ) : (
              recentCitations.map((cit) => (
                <div key={cit.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">
                      {cit.citizen ? `${cit.citizen.firstName} ${cit.citizen.lastName}` : "Citoyen"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {cit.citationNumber} • {cit.location || "Los Santos"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-amber-400">
                      ${cit.totalFine?.toLocaleString()}
                    </div>
                    {cit.totalJailTime > 0 && (
                      <div className="text-[10px] text-rose-400 font-mono">
                        {cit.totalJailTime} min
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mandats & BOLO Actifs */}
        <div className="rounded-2xl bg-[#090b14] border border-[#161a2e] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Avis de Recherche & BOLO
              </h3>
            </div>
            <Link
              href="/warrants"
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
            >
              <span>Tous ({warrants.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#151829]">
            {warrants.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Aucun mandat actif actuellement.
              </div>
            ) : (
              warrants.slice(0, 3).map((w) => (
                <div key={w.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{w.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {w.citizen ? `${w.citizen.firstName} ${w.citizen.lastName}` : w.vehiclePlate || "Individu"}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-950/70 text-rose-400 border border-rose-800/40">
                    {w.dangerLevel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
