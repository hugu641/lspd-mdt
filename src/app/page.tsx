"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useOfficer } from "../context/OfficerContext";
import {
  Shield,
  Radio,
  AlertTriangle,
  Car,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  ChevronRight,
  Flame,
  Award,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { currentOfficer, allOfficers } = useOfficer();
  const [stats, setStats] = useState({
    activeOfficers: 0,
    activeWarrants: 0,
    stolenVehicles: 0,
    totalCitations: 0,
  });
  const [warrants, setWarrants] = useState<any[]>([]);
  const [recentCitations, setRecentCitations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [radioCodes, setRadioCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [warrantsRes, citationsRes, vehiclesRes, codesRes] = await Promise.all([
          fetch("/api/warrants?status=Actif"),
          fetch("/api/citations?limit=5"),
          fetch("/api/vehicles"),
          fetch("/api/radio-codes?type=TEN_CODE"),
        ]);

        const warrantsData = await warrantsRes.json();
        const citationsData = await citationsRes.json();
        const vehiclesData = await vehiclesRes.json();
        const codesData = await codesRes.json();

        setWarrants(Array.isArray(warrantsData) ? warrantsData : []);
        setRecentCitations(Array.isArray(citationsData) ? citationsData : []);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setRadioCodes(Array.isArray(codesData) ? codesData.slice(0, 8) : []);

        const activeUnits = allOfficers.filter((o) => o.status === "10-8").length;
        const stolen = Array.isArray(vehiclesData)
          ? vehiclesData.filter((v: any) => v.status.includes("Recherché") || v.status.includes("Volé")).length
          : 0;

        setStats({
          activeOfficers: activeUnits,
          activeWarrants: Array.isArray(warrantsData) ? warrantsData.length : 0,
          stolenVehicles: stolen,
          totalCitations: Array.isArray(citationsData) ? citationsData.length : 0,
        });
      } catch (err) {
        console.error("Error loading dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [allOfficers]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#10131d] to-slate-950 border border-slate-800 p-4 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-theme-primary-light rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold text-theme-primary uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Terminal Central • Los Santos Police
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white mt-1">
              Bienvenue, {currentOfficer ? `${currentOfficer.rank} ${currentOfficer.name}` : "Officier"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Toutes les unités sont connectées au canal tactique. Surveillez les avis de recherche actifs et traitez les contraventions en direct.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <Link
              href="/calculator"
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Nouveau PV</span>
            </Link>
            <Link
              href="/citizens"
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <span>Citoyens</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards (2x2 on phone, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="police-card p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-white">{allOfficers.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Effectif LSPD</div>
          </div>
        </div>

        <div className="police-card p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-white">{warrants.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Mandats / BOLO</div>
          </div>
        </div>

        <div className="police-card p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Car className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-white">{stats.stolenVehicles}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Véhic. recherchés</div>
          </div>
        </div>

        <div className="police-card p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-theme-primary-light border border-theme-primary flex items-center justify-center text-theme-primary flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-white">{recentCitations.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">PV récents</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Citations & Warrants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Recent Citations List */}
        <div className="space-y-4 sm:space-y-6">
          <div className="police-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-3.5 sm:p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-theme-primary" />
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Dernières Contraventions & PV
                </h2>
              </div>
              <Link
                href="/calculator"
                className="text-xs text-theme-primary hover:opacity-80 font-semibold flex items-center gap-1"
              >
                <span>Calculateur</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/60">
              {recentCitations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Aucune contravention enregistrée récemment.
                </div>
              ) : (
                recentCitations.map((cit) => (
                  <div key={cit.id} className="p-3 sm:p-4 hover:bg-slate-900/30 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-theme-primary">{cit.citationNumber}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <Link href={`/citizens/${cit.citizen?.id}`} className="text-xs sm:text-sm font-bold text-white hover:text-theme-primary transition-colors truncate">
                          {cit.citizen?.firstName} {cit.citizen?.lastName}
                        </Link>
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                        Par {cit.officer?.rank} {cit.officer?.name} {cit.location ? `• ${cit.location}` : ""}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm font-mono font-black text-amber-400">
                        ${cit.totalFine.toLocaleString()}
                      </div>
                      {cit.totalJailTime > 0 && (
                        <div className="text-[10px] sm:text-xs font-mono text-red-400 font-semibold">
                          {cit.totalJailTime} min
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Warrants & Radio Cheat Sheet */}
        <div className="space-y-4 sm:space-y-6">
          {/* Active Warrants Widget */}
          <div className="police-card rounded-2xl overflow-hidden border border-red-900/30 bg-gradient-to-b from-red-950/20 to-slate-900/40">
            <div className="p-3.5 sm:p-4 bg-red-950/40 border-b border-red-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-xs sm:text-sm font-bold text-red-200 uppercase tracking-wider">
                  Avis de Recherche & BOLO
                </h2>
              </div>
              <Link href="/warrants" className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
                <span>Tous ({warrants.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-3 space-y-2.5 max-h-[350px] overflow-y-auto">
              {warrants.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Aucun mandat actif pour le moment.
                </div>
              ) : (
                warrants.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-red-900/40 hover:border-red-500/50 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-white leading-tight">
                        {w.title}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
                        {w.dangerLevel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      {w.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="truncate pr-1">{w.citizen ? `${w.citizen.firstName} ${w.citizen.lastName}` : w.vehiclePlate ? `Plaque: ${w.vehiclePlate}` : "Non spécifié"}</span>
                      <span className="font-mono text-red-400 flex-shrink-0">{w.warrantNumber}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick 10-Codes Widget */}
          <div className="police-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-3.5 sm:p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-theme-primary" />
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Aide-Mémoire Radio
                </h2>
              </div>
              <Link href="/radio-codes" className="text-xs text-theme-primary hover:opacity-80 font-semibold flex items-center gap-1">
                <span>Tous</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-2.5 grid grid-cols-2 gap-2">
              {radioCodes.map((rc) => (
                <div
                  key={rc.id}
                  className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-theme-primary transition-all"
                >
                  <div className="text-xs font-mono font-bold text-theme-primary">{rc.code}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-200 truncate mt-0.5">{rc.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
