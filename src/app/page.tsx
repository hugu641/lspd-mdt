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
  TrendingUp,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const { currentOfficer, allOfficers } = useOfficer();
  const [warrants, setWarrants] = useState<any[]>([]);
  const [recentCitations, setRecentCitations] = useState<any[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState("MER 28");

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Weekly calendar days (matching screenshot LUN 26 -> DIM 1)
  const weekDays = [
    { day: "LUN", date: "26", id: "LUN 26" },
    { day: "MAR", date: "27", id: "MAR 27" },
    { day: "MER", date: "28", id: "MER 28", isToday: true },
    { day: "JEU", date: "29", id: "JEU 29" },
    { day: "VEN", date: "30", id: "VEN 30" },
    { day: "SAM", date: "31", id: "SAM 31" },
    { day: "DIM", date: "1", id: "DIM 1" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* =========================================================================
          SECTION 1: PERMANENCE & PERSONNEL EN LIGNE (Inspired by Permanence ADS)
          ========================================================================= */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/40">
            +
          </div>
          <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
            Permanence Opérationnelle
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0a1e16] text-emerald-400 border border-emerald-500/30">
            {allOfficers.length} en ligne
          </span>
        </div>

        {/* Green Outer Container Card */}
        <div className="rounded-2xl bg-[#090b14] border border-[#161a2e] overflow-hidden">
          {/* Top Banner with Green AD Pill & Green Dot */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#0d1f17] via-[#091510] to-[#090b14] border-b border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-black text-xs shadow-md">
                OP
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">
                  Personnel en patrouille & permanence
                </div>
                <div className="text-[11px] text-emerald-400/80 font-medium">
                  Agents connectés au réseau sécurisé et mobilisables immédiatement
                </div>
              </div>
            </div>

            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>

          {/* Personnel Items List */}
          <div className="p-3 sm:p-4 divide-y divide-[#151829]">
            {allOfficers.slice(0, 3).map((officer) => (
              <div
                key={officer.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#0e1022]/40 transition-colors rounded-xl px-2 -mx-2"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar Circle with initials */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-800 via-teal-700 to-cyan-700 flex items-center justify-center text-white font-black text-xs shadow-md border border-emerald-500/30 flex-shrink-0">
                    {getInitials(officer.name)}
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-black text-white">
                      {officer.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      #{officer.badgeNumber} • <span className="text-slate-300 font-sans">{officer.rank}</span> • {officer.phone || "555-0100"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0f241a] text-emerald-300 border border-emerald-500/40">
                    Intranet LSPD
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {officer.unitType || "Lincoln"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: PLANNING DES CRÉNEAUX (Inspired by Planning ADS 48h à venir)
          ========================================================================= */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
            Planning Opérationnel (48h à venir)
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#24170a] text-amber-400 border border-amber-500/40">
            2 créneaux pourvus
          </span>
        </div>

        {/* Orange Outer Container Card */}
        <div className="rounded-2xl bg-[#090b14] border border-[#161a2e] overflow-hidden">
          {/* Date Banner (MERCREDI 28 OCTOBRE) */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#21150a] via-[#1a1007] to-[#090b14] border-b border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider text-amber-500 uppercase">
              <Calendar className="w-3.5 h-3.5" />
              <span>Mercredi 28 Octobre</span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono">Journée Active</span>
          </div>

          {/* Time Slots Rows */}
          <div className="divide-y divide-[#151829]">
            {/* Slot 1: 18:00 -> 19:00 */}
            <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#111326]/40 transition-colors">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-24 text-left">
                  <div className="text-xs sm:text-sm font-black text-white font-mono">18:00</div>
                  <div className="text-[10px] text-slate-500 font-mono">→ 19:00</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#2e1d0c] text-amber-400 border border-amber-600/50">
                    SUD
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141629] text-slate-400">
                    1/2
                  </span>
                </div>

                {/* Assigned Person Pill [MD] Marvin Dialo */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1122] border border-[#1d213d]">
                  <div className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400 font-black text-[9px]">
                    MV
                  </div>
                  <span className="text-xs font-bold text-slate-200">Marcus Vance</span>
                  <span className="text-[10px] text-slate-500 font-mono">#01 • LSPD</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/trainings"
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-[#141629] hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border border-[#222644] hover:border-purple-600/50 transition-all"
                >
                  Détails du créneau
                </Link>
              </div>
            </div>

            {/* Slot 2: 23:00 -> 00:00 */}
            <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#111326]/40 transition-colors">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-24 text-left">
                  <div className="text-xs sm:text-sm font-black text-white font-mono">23:00</div>
                  <div className="text-[10px] text-slate-500 font-mono">→ 00:00</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#2e1d0c] text-amber-400 border border-amber-600/50">
                    CENTRE
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141629] text-slate-400">
                    1/2
                  </span>
                </div>

                {/* Assigned Person Pill [SC] Sarah Connor */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1122] border border-[#1d213d]">
                  <div className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400 font-black text-[9px]">
                    SC
                  </div>
                  <span className="text-xs font-bold text-slate-200">Sarah Connor</span>
                  <span className="text-[10px] text-slate-500 font-mono">#12 • LSPD</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/trainings"
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-[#141629] hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border border-[#222644] hover:border-purple-600/50 transition-all"
                >
                  Détails du créneau
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PLANNING HEBDOMADAIRE (Weekly Calendar Grid)
          ========================================================================= */}
      <section className="space-y-3">
        {/* Section Header with week selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
              Planning Hebdomadaire
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Semaine du 26 octobre au 1 novembre 2026</span>
            <div className="flex items-center gap-1">
              <button
                title="Semaine précédente"
                className="p-1 rounded-lg bg-[#0e1020] border border-[#1d2038] text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                title="Semaine suivante"
                className="p-1 rounded-lg bg-[#0e1020] border border-[#1d2038] text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 7 Columns Grid */}
        <div className="rounded-2xl bg-[#090a14] border border-[#161a2e] overflow-hidden">
          {/* Header Row: Days */}
          <div className="grid grid-cols-7 border-b border-[#161a2e] divide-x divide-[#161a2e] text-center">
            {weekDays.map((d) => (
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

          {/* Body Row: Events per Column */}
          <div className="grid grid-cols-7 divide-x divide-[#161a2e] min-h-[140px] p-2 bg-[#080913]">
            {/* LUN 26 (Event chip matching screenshot) */}
            <div className="p-1 space-y-2">
              <div className="p-2 rounded-xl bg-[#111326] border border-[#1e2240] hover:border-purple-500/50 transition-all text-left">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>Formation</span>
                  <span className="px-1 py-0.2 rounded bg-slate-800 text-[8px] text-slate-300">Fin</span>
                </div>
                <div className="text-[11px] font-bold text-white mt-1 truncate">
                  Formation MTT
                </div>
                <div className="text-[9px] font-mono text-purple-400 mt-0.5">
                  20:00 - 21:30
                </div>
              </div>
            </div>

            {/* MAR 27 */}
            <div className="p-1 space-y-2">
              <div className="p-2 rounded-xl bg-[#111326] border border-[#1e2240] text-left">
                <div className="text-[9px] font-bold text-slate-400">Briefing</div>
                <div className="text-[11px] font-bold text-white mt-1 truncate">Opération Nord</div>
                <div className="text-[9px] font-mono text-amber-400 mt-0.5">18:00 - 19:30</div>
              </div>
            </div>

            {/* MER 28 (Active Day) */}
            <div className="p-1 space-y-2 bg-[#14122b]/40 rounded-lg">
              <div className="p-2 rounded-xl bg-[#1f1947] border border-purple-500/50 shadow-sm text-left">
                <div className="flex items-center justify-between text-[9px] font-bold text-purple-300">
                  <span>Session</span>
                  <span className="px-1 py-0.2 rounded bg-purple-900/80 text-[8px] text-purple-200">En cours</span>
                </div>
                <div className="text-[11px] font-bold text-white mt-1 truncate">
                  Tir & Tactique
                </div>
                <div className="text-[9px] font-mono text-purple-300 mt-0.5">
                  18:00 - 20:00
                </div>
              </div>
            </div>

            {/* JEU 29 */}
            <div className="p-1 text-center text-[10px] text-slate-600 pt-4">-</div>

            {/* VEN 30 */}
            <div className="p-1 space-y-2">
              <div className="p-2 rounded-xl bg-[#111326] border border-[#1e2240] text-left">
                <div className="text-[9px] font-bold text-slate-400">Contrôle</div>
                <div className="text-[11px] font-bold text-white mt-1 truncate">Barrage Vinewood</div>
                <div className="text-[9px] font-mono text-emerald-400 mt-0.5">21:00 - 23:00</div>
              </div>
            </div>

            {/* SAM 31 */}
            <div className="p-1 text-center text-[10px] text-slate-600 pt-4">-</div>

            {/* DIM 1 */}
            <div className="p-1 text-center text-[10px] text-slate-600 pt-4">-</div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: ACCÈS RAPIDE - PV & AVIS DE RECHERCHE
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
                      ${cit.totalFine.toLocaleString()}
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
