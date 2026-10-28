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

// Official 13 Ranks of the LSPD in hierarchical order
const LSPD_RANKS = [
  { id: "rookie", name: "Rookie", level: 1, category: "Période Probatoire", stars: "★", description: "Cadet en formation probatoire sur le terrain" },
  { id: "officier_1", name: "Officier I", level: 2, category: "Corps de Patrouille", stars: "★★", description: "Agent titulaire de patrouille" },
  { id: "officier_2", name: "Officier II", level: 3, category: "Corps de Patrouille", stars: "★★★", description: "Agent de patrouille confirmé, habilité aux interventions" },
  { id: "officier_3", name: "Officier III", level: 4, category: "Corps de Patrouille", stars: "★★★★", description: "Agent de patrouille senior, référent d'équipe" },
  { id: "slo", name: "SLO", level: 5, category: "Senior Lead Officer", stars: "★★★★★", description: "Officier de liaison communautaire et tactique" },
  { id: "sergent", name: "Sergent", level: 6, category: "Supervision de Terrain", stars: "◆", description: "Superviseur d'opérations et de patrouilles" },
  { id: "sergent_chef", name: "Sergent-Chef", level: 7, category: "Supervision de Terrain", stars: "◆◆", description: "Superviseur principal de quart de brigade" },
  { id: "lieutenant", name: "Lieutenant", level: 8, category: "Supervision Supérieure", stars: "◆◆◆", description: "Commandant de quart et responsable d'enquête" },
  { id: "capitaine", name: "Capitaine", level: 9, category: "État-Major", stars: "◈", description: "Chef de division opérationnelle" },
  { id: "commandant", name: "Commandant", level: 10, category: "État-Major", stars: "◈◈", description: "Responsable des effectifs et coordinateur de district" },
  { id: "deputy_chief", name: "Deputy-Chief", level: 11, category: "Haut Commandement", stars: "❖", description: "Adjoint au Haut Commandement LSPD" },
  { id: "assistant_chief", name: "Assistant-Chief", level: 12, category: "Haut Commandement", stars: "❖❖", description: "Chef adjoint de la police métropolitaine" },
  { id: "chief", name: "Chief of Police", level: 13, category: "Commandement Suprême", stars: "✪✪✪", description: "Directeur général du Los Santos Police Department" },
];

export default function DashboardPage() {
  const { currentOfficer, allOfficers, setCurrentOfficer } = useOfficer();
  const [warrants, setWarrants] = useState<any[]>([]);
  const [recentCitations, setRecentCitations] = useState<any[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState("MER 28");
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
  const effectiveRankIndex = currentRankIndex >= 0 ? currentRankIndex : 1; // default to Officier I if unknown

  // Rank progression calculations
  const earnedRanks = LSPD_RANKS.slice(0, effectiveRankIndex + 1);
  const nextRank = effectiveRankIndex < LSPD_RANKS.length - 1 ? LSPD_RANKS[effectiveRankIndex + 1] : null;

  // Badge icon helper
  const getBadgeIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case "zap":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "plane":
        return <Plane className="w-4 h-4 text-cyan-400" />;
      case "shieldalert":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case "dog":
        return <Dog className="w-4 h-4 text-emerald-400" />;
      case "graduationcap":
        return <GraduationCap className="w-4 h-4 text-purple-400" />;
      case "heart":
        return <Heart className="w-4 h-4 text-red-400" />;
      default:
        return <Award className="w-4 h-4 text-purple-400" />;
    }
  };

  // Badge category styles
  const getBadgeCategoryStyle = (category: string) => {
    switch (category?.toLowerCase()) {
      case "conduite":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "aérien":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      case "tactique":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      case "spécialité":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "pédagogique":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      default:
        return "bg-violet-500/10 text-violet-300 border-violet-500/30";
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

  // Weekly organized training curriculum
  const weeklyTrainings = [
    {
      id: "LUN 26",
      day: "LUN",
      date: "26",
      sessionTitle: "EVOC - Conduite Haute Vitesse & Manœuvre PIT",
      shortTitle: "EVOC Conduite",
      time: "20:00 - 21:30",
      category: "Conduite",
      icon: "Zap",
      color: "amber",
      location: "Aérodrome de Sandy Shores",
      instructor: "Capt. Sarah Connor (#12)",
      seats: "4/4",
      status: "Terminée",
      badgeReward: "Pilote EVOC Interception",
    },
    {
      id: "MAR 27",
      day: "MAR",
      date: "27",
      sessionTitle: "Négociation d'Otage & Gestion de Crise",
      shortTitle: "Négociation Crise",
      time: "19:00 - 20:30",
      category: "Spécialité",
      icon: "ShieldAlert",
      color: "emerald",
      location: "Salle de crise PDP Mission Row",
      instructor: "Sgt. David Miller (#34)",
      seats: "5/6",
      status: "Terminée",
      badgeReward: "Négociateur de Crise",
    },
    {
      id: "MER 28",
      day: "MER",
      date: "28",
      isToday: true,
      sessionTitle: "SWAT - Tir Tactique & Stand Balistique",
      shortTitle: "Tir & Tactique",
      time: "18:00 - 20:00",
      category: "Tactique",
      icon: "ShieldAlert",
      color: "purple",
      location: "Stand de tir souterrain PDP",
      instructor: "Sgt. David Miller (#34)",
      seats: "5/6",
      status: "Session Active",
      badgeReward: "Opérateur SWAT Tactique",
    },
    {
      id: "JEU 29",
      day: "JEU",
      date: "29",
      sessionTitle: "Air Support - Pilotage Tactique Hélicoptère (Henry)",
      shortTitle: "Air Support (Henry)",
      time: "21:00 - 22:30",
      category: "Aérien",
      icon: "Plane",
      color: "cyan",
      location: "Héliport PDP Los Santos",
      instructor: "Chief Marcus Vance (#01)",
      seats: "2/3",
      status: "Places disponibles",
      badgeReward: "Pilote Aérien (Air Support)",
    },
    {
      id: "VEN 30",
      day: "VEN",
      date: "30",
      sessionTitle: "Contrôles Routiers & Procédures d'Interpellation",
      shortTitle: "Contrôles & Barrages",
      time: "18:30 - 20:00",
      category: "Procédure",
      icon: "Award",
      color: "violet",
      location: "Vinewood Boulevard Sector",
      instructor: "Capt. Sarah Connor (#12)",
      seats: "3/6",
      status: "Inscriptions ouvertes",
      badgeReward: "Instructeur Contrôle Routier",
    },
    {
      id: "SAM 31",
      day: "SAM",
      date: "31",
      sessionTitle: "SWAT - Assaut Bâtiment & Brèche Tactique",
      shortTitle: "Assaut SWAT Brèche",
      time: "21:00 - 23:00",
      category: "Tactique",
      icon: "ShieldAlert",
      color: "rose",
      location: "Site désaffecté Port de Los Santos",
      instructor: "Sgt. David Miller (#34)",
      seats: "4/6",
      status: "Inscriptions ouvertes",
      badgeReward: "Opérateur SWAT Assaut",
    },
    {
      id: "DIM 1",
      day: "DIM",
      date: "1",
      sessionTitle: "FTO - Pédagogie & Encadrement des Rookies",
      shortTitle: "Formation FTO",
      time: "17:00 - 18:30",
      category: "Pédagogique",
      icon: "GraduationCap",
      color: "purple",
      location: "Centre de Formation PDP",
      instructor: "Chief Marcus Vance (#01)",
      seats: "3/5",
      status: "Inscriptions ouvertes",
      badgeReward: "Instructeur FTO Certifié",
    },
  ];

  const selectedSessionData = weeklyTrainings.find((s) => s.id === selectedDay) || weeklyTrainings[2];

  // Save custom photo
  const handleSavePhoto = () => {
    if (customPhotoInput.trim()) {
      setUserAvatar(customPhotoInput.trim());
      setEditingPhoto(false);
    }
  };

  const statusInfo = getStatusStyle(currentOfficer?.status || "10-10");

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* =========================================================================
          SECTION 1: CARTE D'IDENTITÉ & CARRIÈRE DE L'AGENT
          (Nom, Prénom, Petite image de toi, Tous les grades que tu as, Toutes les formations)
          ========================================================================= */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#0e1022] via-[#090b16] to-[#070810] border border-purple-500/25 p-5 sm:p-7 shadow-[0_10px_35px_-10px_rgba(147,51,234,0.15)] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-10 w-48 h-20 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header: Official Title, Department Badge & Quick Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1b1e38] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 p-[1px] shadow-lg shadow-purple-900/40">
              <div className="w-full h-full bg-[#0b0d1b] rounded-2xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-purple-400">
                  CARTE D'IDENTITÉ PROFESSIONNELLE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono font-bold">
                  OFFICIEL LSPD
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                État de Service & Dossier d'Habilitation
              </h1>
            </div>
          </div>

          {/* Quick Officer Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowOfficerPicker(!showOfficerPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12152a] hover:bg-[#1a1f3d] border border-purple-500/30 text-xs font-bold text-purple-300 hover:text-white transition-all shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Changer d'agent</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Officer Dropdown */}
            {showOfficerPicker && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0c0e1e] border border-purple-500/40 shadow-2xl p-2 z-50 divide-y divide-[#171a33]">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sélectionner un effectif actif
                </div>
                <div className="py-1 max-h-56 overflow-y-auto space-y-1">
                  {allOfficers.map((off) => (
                    <button
                      key={off.id}
                      onClick={() => {
                        setCurrentOfficer(off);
                        setShowOfficerPicker(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
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
                        <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Identity Body: Photo + Nom/Prénom + Status Badges */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* LEFT: Photo & Quick Status Card (Col 4) */}
          <div className="lg:col-span-4 flex flex-col items-center text-center p-5 rounded-2xl bg-[#0a0c18]/80 border border-[#171a33] space-y-4">
            {/* Officer Avatar with Glowing Violet Ring */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 shadow-[0_0_25px_rgba(168,85,247,0.35)]">
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#0c0e1e] relative flex items-center justify-center">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={currentOfficer?.name || "Officer"}
                      className="w-full h-full object-cover"
                      onError={() => setUserAvatar(null)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center text-white font-black text-3xl">
                      {firstName[0]}
                      {lastName[0] || ""}
                    </div>
                  )}

                  {/* Change photo hover button */}
                  <button
                    onClick={() => setEditingPhoto(!editingPhoto)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1"
                    title="Changer votre photo"
                  >
                    <Camera className="w-5 h-5 text-purple-300" />
                    <span>Modifier photo</span>
                  </button>
                </div>
              </div>

              {/* Status Dot */}
              <span
                className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[#0a0c18] ${statusInfo.dot}`}
                title={statusInfo.label}
              />
            </div>

            {/* Custom Photo Editor Modal / Input */}
            {editingPhoto && (
              <div className="w-full space-y-2 p-2 rounded-xl bg-[#111429] border border-purple-500/40 text-left">
                <label className="text-[10px] font-bold text-purple-300 block">
                  Lien URL de votre photo :
                </label>
                <input
                  type="url"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2 py-1 rounded bg-[#090b16] border border-[#222749] text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingPhoto(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSavePhoto}
                    className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}

            {/* Operational Status Pill */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${statusInfo.border}`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
              <span>{statusInfo.label}</span>
            </div>

            {/* Callsign & Unit */}
            <div className="w-full pt-3 border-t border-[#161930] grid grid-cols-2 gap-2 text-left">
              <div className="p-2 rounded-xl bg-[#0e1124] border border-[#1b1f3c]">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Matricule</div>
                <div className="text-xs font-black font-mono text-purple-300">#{currentOfficer?.badgeNumber || "00"}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#0e1124] border border-[#1b1f3c]">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Indicatif Radio</div>
                <div className="text-xs font-black font-mono text-cyan-300 truncate">{currentOfficer?.callsign || "1-ADAM"}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Nom, Prénom, Grades Possédés & Formations (Col 8) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Row 1: Identity Cards (Nom & Prénom distinctly displayed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prénom */}
              <div className="p-3.5 rounded-2xl bg-[#0b0e1e] border border-[#181c38]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80">
                  Prénom
                </div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                  {firstName}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Agent actif assermenté LSPD
                </div>
              </div>

              {/* Nom */}
              <div className="p-3.5 rounded-2xl bg-[#0b0e1e] border border-[#181c38]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80">
                  Nom de Famille
                </div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5 uppercase tracking-wide">
                  {lastName || "NON SPÉCIFIÉ"}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Division de Patrouille & Enquêtes
                </div>
              </div>
            </div>

            {/* Row 2: Secondary info (Département, Téléphone, Unité, Habilitation) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0a0c18] border border-[#161a33]">
                <div className="text-[9px] uppercase font-bold text-slate-400">Département</div>
                <div className="font-bold text-white mt-0.5">{currentOfficer?.department || "LSPD"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a0c18] border border-[#161a33]">
                <div className="text-[9px] uppercase font-bold text-slate-400">Unité Actuelle</div>
                <div className="font-bold text-cyan-300 mt-0.5">{currentOfficer?.unitType || "Lincoln"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a0c18] border border-[#161a33]">
                <div className="text-[9px] uppercase font-bold text-slate-400">Téléphone Radio</div>
                <div className="font-bold font-mono text-slate-200 mt-0.5">{currentOfficer?.phone || "555-0100"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a0c18] border border-[#161a33]">
                <div className="text-[9px] uppercase font-bold text-slate-400">Instructeur FTO</div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {currentOfficer?.isInstructor ? "Oui (Habilité)" : "Non"}
                </div>
              </div>
            </div>

            {/* =========================================================================
                SECTION INTERNE: TOUS LES GRADES QUE TU AS (Grade Actuel + Progression)
                ========================================================================= */}
            <div className="p-4 rounded-2xl bg-[#0a0c1a] border border-[#181c38] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Tous vos Grades & Échelons de Carrière
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                    Échelon {effectiveRankIndex + 1} / 13
                  </span>
                </div>

                <button
                  onClick={() => setShowRanksExpanded(!showRanksExpanded)}
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  <span>{showRanksExpanded ? "Réduire l'arbre" : "Voir tous les 13 grades"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRanksExpanded ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Current Active Rank Spotlight */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 via-[#121630] to-[#0c0e1e] border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/60 flex items-center justify-center text-purple-200 font-black text-sm shadow-md">
                    {LSPD_RANKS[effectiveRankIndex]?.stars || "★"}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                      Grade Actuel en Exercice
                    </div>
                    <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>{currentOfficer?.rank || "Officier"}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                        {LSPD_RANKS[effectiveRankIndex]?.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {LSPD_RANKS[effectiveRankIndex]?.description}
                    </div>
                  </div>
                </div>

                {nextRank && (
                  <div className="text-right sm:border-l sm:border-[#1d2242] sm:pl-4 self-start sm:self-auto">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Prochain échelon visé</div>
                    <div className="text-xs font-bold text-purple-300 flex items-center gap-1 mt-0.5">
                      <span>{nextRank.name}</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Earned Ranks Pills (Horizontal progression ladder of all ranks acquired) */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Grades et échelons acquis au cours de votre carrière ({earnedRanks.length} validés) :
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {earnedRanks.map((r, idx) => {
                    const isCurrent = idx === effectiveRankIndex;
                    return (
                      <div
                        key={r.id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isCurrent
                            ? "bg-purple-900/70 text-purple-100 border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                            : "bg-[#111326] text-slate-300 border border-[#202544]"
                        }`}
                      >
                        <CheckCircle2 className={`w-3 h-3 ${isCurrent ? "text-purple-300" : "text-emerald-400"}`} />
                        <span>{r.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/40 text-purple-200">
                            Actuel
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Full 13 Ranks Tree Expandable */}
              {showRanksExpanded && (
                <div className="mt-3 pt-3 border-t border-[#181c38] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {LSPD_RANKS.map((r, idx) => {
                    const isEarned = idx <= effectiveRankIndex;
                    const isCurrent = idx === effectiveRankIndex;
                    return (
                      <div
                        key={r.id}
                        className={`p-2 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? "bg-purple-950/60 border-purple-500/70 text-purple-100"
                            : isEarned
                            ? "bg-[#0d1022] border-emerald-900/40 text-slate-300"
                            : "bg-[#080913] border-[#15172b] text-slate-500 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            {isEarned ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-slate-700 inline-block" />
                            )}
                            {r.name}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">{r.stars}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate">{r.category}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =========================================================================
                SECTION INTERNE: TOUTES LES FORMATIONS QUE TU AS (Brevets & Badges)
                ========================================================================= */}
            <div className="p-4 rounded-2xl bg-[#0a0c1a] border border-[#181c38] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Toutes vos Formations & Brevets Certifiés
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                    {currentOfficer?.badges?.length || 0} Brevets Validés
                  </span>
                </div>

                <Link
                  href="/trainings"
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  <span>Passer une certification</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Badges Cards Grid */}
              {!currentOfficer?.badges || currentOfficer.badges.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0d0f20] border border-[#1c203b] text-center space-y-2">
                  <div className="text-xs text-slate-400">
                    Aucun brevet officiellement validé pour cet agent.
                  </div>
                  <Link
                    href="/trainings"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-md shadow-purple-900/30"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Consulter le catalogue des formations & s'inscrire</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentOfficer.badges.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-gradient-to-r from-[#0d1024] to-[#080913] border border-[#1e2344] hover:border-purple-500/50 transition-all flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#141834] border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getBadgeIcon(b.course?.badgeIcon || "Award")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-white truncate">
                            {b.course?.badgeName || b.course?.title || "Brevet Validé"}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getBadgeCategoryStyle(
                              b.course?.category || "Spécialité"
                            )}`}
                          >
                            {b.course?.category || "Certifié"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {b.course?.title || "Formation officielle LSPD"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-medium mt-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Habilitation opérationnelle valide</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: PLANNING HEBDOMADAIRE AVEC TOUTES LES FORMATIONS ORGANISÉES
          ========================================================================= */}
      <section className="space-y-4">
        {/* Section Header with week selector & navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Planning Hebdomadaire des Formations
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  7 sessions organisées
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Toutes les sessions d'entraînement tactique et de passage de brevet planifiées
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono font-bold">
              Semaine du 26 oct. au 1 nov. 2026
            </span>
            <div className="flex items-center gap-1">
              <button
                title="Semaine précédente"
                className="p-1.5 rounded-xl bg-[#0e1020] border border-[#1d2038] text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                title="Semaine suivante"
                className="p-1.5 rounded-xl bg-[#0e1020] border border-[#1d2038] text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 7 Columns Calendar Grid */}
        <div className="rounded-2xl bg-[#090a14] border border-[#161a2e] overflow-hidden shadow-lg">
          {/* Header Row: Days selector */}
          <div className="grid grid-cols-7 border-b border-[#161a2e] divide-x divide-[#161a2e] text-center">
            {weeklyTrainings.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`py-3 px-1 transition-all ${
                  selectedDay === d.id
                    ? "bg-[#1c183a] text-purple-200"
                    : "text-slate-400 hover:bg-[#0e1022] hover:text-slate-200"
                }`}
              >
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  {d.day}
                </div>
                <div className="text-xs sm:text-base font-black text-white mt-0.5">
                  {d.date}
                </div>
                {d.isToday && (
                  <div className="flex justify-center mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Body Row: Organized Training Event Cards per Day */}
          <div className="grid grid-cols-7 divide-x divide-[#161a2e] min-h-[160px] p-2 bg-[#080913]">
            {weeklyTrainings.map((session) => {
              const isSelected = selectedDay === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedDay(session.id)}
                  className={`p-1.5 space-y-2 cursor-pointer transition-all rounded-xl ${
                    isSelected ? "bg-purple-950/20 ring-1 ring-purple-500/40" : "hover:bg-[#0d0f20]"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      session.isToday
                        ? "bg-[#1c1642] border-purple-500/60 shadow-md"
                        : "bg-[#0f1124] border-[#1b1f3c] hover:border-purple-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-slate-400 uppercase truncate">{session.category}</span>
                      <span
                        className={`px-1 py-0.2 rounded text-[8px] font-mono ${
                          session.status === "Terminée"
                            ? "bg-slate-800 text-slate-400"
                            : session.isToday
                            ? "bg-purple-900 text-purple-200"
                            : "bg-emerald-950 text-emerald-400"
                        }`}
                      >
                        {session.seats}
                      </span>
                    </div>

                    <div className="text-[11px] font-black text-white mt-1 line-clamp-2 leading-snug">
                      {session.shortTitle}
                    </div>

                    <div className="text-[9px] font-mono text-purple-300 mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{session.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Formation Details Banner & Quick Registration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#11142b] via-[#0d0f22] to-[#090b16] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center flex-shrink-0 text-purple-300 shadow-md">
              {getBadgeIcon(selectedSessionData.icon)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  {selectedSessionData.day} {selectedSessionData.date} OCTOBRE • {selectedSessionData.category}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-md bg-[#1d2242] text-slate-300 border border-[#2a305e] font-mono">
                  {selectedSessionData.time}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                  {selectedSessionData.status}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {selectedSessionData.sessionTitle}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedSessionData.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Instructeur: {selectedSessionData.instructor}
                </span>
                <span className="flex items-center gap-1 text-purple-300 font-bold">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  Brevet délivré : {selectedSessionData.badgeReward}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <Link
              href="/trainings"
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40 transition-all flex items-center gap-1.5"
            >
              <span>Accéder au module complet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: ACCÈS RAPIDE - DERNIERS PV & AVIS DE RECHERCHE
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
