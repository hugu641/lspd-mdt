"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useOfficer } from "@/context/OfficerContext";
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  Car,
  User,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
} from "lucide-react";

export default function WarrantsPage() {
  const { currentOfficer } = useOfficer();
  const [warrants, setWarrants] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("Actif");
  const [showModal, setShowModal] = useState(false);

  // New warrant form
  const [formData, setFormData] = useState({
    type: "WARRANT",
    title: "",
    description: "",
    dangerLevel: "Dangereux",
    citizenId: "",
    vehiclePlate: "",
  });

  const fetchWarrants = async () => {
    try {
      const res = await fetch(`/api/warrants?status=${filterStatus === "ALL" ? "" : filterStatus}`);
      const data = await res.json();
      setWarrants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWarrants();
  }, [filterStatus]);

  useEffect(() => {
    async function loadCitizens() {
      try {
        const res = await fetch("/api/citizens");
        const data = await res.json();
        setCitizens(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    }
    loadCitizens();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) {
      alert("Aucun officier connecté.");
      return;
    }
    try {
      const res = await fetch("/api/warrants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          officerId: currentOfficer.id,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          type: "WARRANT",
          title: "",
          description: "",
          dangerLevel: "Dangereux",
          citizenId: "",
          vehiclePlate: "",
        });
        fetchWarrants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/warrants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchWarrants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredWarrants = warrants.filter((w) => {
    if (filterType === "ALL") return true;
    return w.type === filterType;
  });

  const dangerColors: Record<string, string> = {
    "Modéré": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "Dangereux": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "Armé et dangereux": "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Mandats & Avis de Recherche (BOLO)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Mandats & BOLO Actifs</h1>
          <p className="text-xs text-slate-300">
            Émission, suivi et exécution des mandats d&apos;arrêt et avis de recherche prioritaires.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all border border-red-400/40"
        >
          <Plus className="w-4 h-4" />
          <span>Émettre un Mandat / BOLO</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="police-card p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "ALL", label: "Tous" },
            { id: "WARRANT", label: "Mandats d'arrêt" },
            { id: "BOLO_PERSON", label: "BOLO Individus" },
            { id: "BOLO_VEHICLE", label: "BOLO Véhicules" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Statut :</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="Actif">Actif uniquement</option>
            <option value="Exécuté">Exécuté</option>
            <option value="Annulé">Annulé</option>
            <option value="ALL">Tous les statuts</option>
          </select>
        </div>
      </div>

      {/* Grid of Warrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filteredWarrants.length === 0 ? (
          <div className="col-span-2 police-card p-12 text-center text-xs text-slate-400">
            Aucun avis correspondant aux critères sélectionnés.
          </div>
        ) : (
          filteredWarrants.map((w) => (
            <div
              key={w.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                w.status === "Actif"
                  ? "bg-slate-900/90 border-red-800/70 shadow-lg shadow-red-950/20"
                  : "bg-slate-900/40 border-slate-800 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-red-400 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                      {w.warrantNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {w.type === "WARRANT" ? "Mandat" : w.type === "BOLO_VEHICLE" ? "BOLO Véhic." : "BOLO Indiv."}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{w.title}</h3>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border flex-shrink-0 ${dangerColors[w.dangerLevel] || dangerColors["Dangereux"]}`}>
                  {w.dangerLevel}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                {w.description}
              </p>

              {/* Target info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {w.citizen && (
                  <div className="flex items-center gap-2 text-slate-300 truncate">
                    <User className="w-3.5 h-3.5 text-theme-primary flex-shrink-0" />
                    <span className="text-slate-400">Suspect : </span>
                    <Link href={`/citizens/${w.citizen.id}`} className="font-bold text-theme-primary hover:underline truncate">
                      {w.citizen.firstName} {w.citizen.lastName}
                    </Link>
                  </div>
                )}
                {w.vehiclePlate && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Car className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-400">Plaque : </span>
                    <span className="font-mono font-bold text-amber-400">{w.vehiclePlate}</span>
                  </div>
                )}
              </div>

              {/* Footer and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400 text-[11px]">
                  Émis par : <span className="text-slate-300 font-semibold">{w.officer?.rank} {w.officer?.name}</span>
                </div>

                {w.status === "Actif" ? (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto w-full sm:w-auto">
                    <button
                      onClick={() => handleUpdateStatus(w.id, "Annulé")}
                      className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 text-center"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(w.id, "Exécuté")}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1 text-center"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Exécuté</span>
                    </button>
                  </div>
                ) : (
                  <span className="font-bold font-mono text-emerald-400 self-end sm:self-auto">{w.status}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-white">Émettre un Avis / Mandat</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Type d&apos;avis</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="WARRANT">Mandat d&apos;arrêt</option>
                    <option value="BOLO_PERSON">BOLO Individu</option>
                    <option value="BOLO_VEHICLE">BOLO Véhicule</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Danger</label>
                  <select
                    value={formData.dangerLevel}
                    onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="Modéré">Modéré</option>
                    <option value="Dangereux">Dangereux</option>
                    <option value="Armé et dangereux">Armé et dangereux</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Titre de l&apos;avis *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mandat d'arrêt : Braquage"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Suspect relié</label>
                  <select
                    value={formData.citizenId}
                    onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="">-- Aucun / Inconnu --</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Plaque d&apos;immat.</label>
                  <input
                    type="text"
                    placeholder="Ex: 82VOR099"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Faits, signalement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                >
                  Diffuser le Mandat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
