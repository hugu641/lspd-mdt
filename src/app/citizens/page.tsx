"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  Car,
  Crosshair,
  FileText,
  Phone,
  Briefcase,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New citizen form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "1995-05-15",
    gender: "M",
    phone: "555-",
    address: "",
    job: "Sans emploi",
    photoUrl: "",
    driverLicense: "Valide",
    weaponLicense: "Non titulaire",
    dangerLevel: "Faible",
    notes: "",
  });

  const fetchCitizens = async () => {
    try {
      const res = await fetch(`/api/citizens?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setCitizens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, [searchQuery]);

  const handleCreateCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/citizens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          firstName: "",
          lastName: "",
          birthDate: "1995-05-15",
          gender: "M",
          phone: "555-",
          address: "",
          job: "Sans emploi",
          photoUrl: "",
          driverLicense: "Valide",
          weaponLicense: "Non titulaire",
          dangerLevel: "Faible",
          notes: "",
        });
        fetchCitizens();
      } else {
        alert("Erreur lors de la création du citoyen.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dangerColors: Record<string, string> = {
    "Faible": "bg-slate-500/20 text-slate-300 border-slate-500/30",
    "Modéré": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Élevé": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Armé et dangereux": "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse",
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Fichier Central des Citoyens • Los Santos</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Dossiers Citoyens & Casiers</h1>
          <p className="text-xs text-slate-300">
            Consultez les antécédents, permis, mandats, véhicules et armes enregistrés pour chaque citoyen.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Dossier Citoyen</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="police-card p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, numéro de téléphone ou profession..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-theme-primary font-medium"
          />
        </div>
      </div>

      {/* Citizens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {citizens.map((citizen) => {
          const hasActiveWarrant = citizen.warrants && citizen.warrants.length > 0;

          return (
            <Link
              key={citizen.id}
              href={`/citizens/${citizen.id}`}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                hasActiveWarrant
                  ? "bg-red-950/20 border-red-800/60 hover:border-red-500/80 shadow-lg shadow-red-950/40"
                  : "police-card border-slate-800 hover:border-theme-primary"
              }`}
            >
              <div>
                {/* Header with Photo, Name & Danger */}
                <div className="flex items-start gap-3">
                  <img
                    src={citizen.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt={citizen.lastName}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0 group-hover:border-theme-primary transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base font-bold text-white group-hover:text-theme-primary transition-colors truncate">
                        {citizen.firstName} {citizen.lastName}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-theme-primary transition-colors flex-shrink-0" />
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{citizen.job || "Sans emploi"}</span>
                    </div>

                    {citizen.phone && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{citizen.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      dangerColors[citizen.dangerLevel] || dangerColors["Faible"]
                    }`}
                  >
                    Danger: {citizen.dangerLevel}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      citizen.driverLicense === "Valide"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-red-500/10 text-red-300 border-red-500/20"
                    }`}
                  >
                    Permis: {citizen.driverLicense}
                  </span>

                  {hasActiveWarrant && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      MANDAT ACTIF
                    </span>
                  )}
                </div>
              </div>

              {/* Records Counters */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-center">
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-xs font-mono font-bold text-white">
                    {citizen._count?.citations || 0}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">PV</div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-xs font-mono font-bold text-white">
                    {citizen._count?.arrestReports || 0}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Arrests</div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-xs font-mono font-bold text-white">
                    {citizen._count?.vehicles || 0}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Véhic.</div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-xs font-mono font-bold text-white">
                    {citizen._count?.weapons || 0}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Armes</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Create Citizen Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Créer un Nouveau Dossier Citoyen</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreateCitizen} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Date de Naissance</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Téléphone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Profession</label>
                  <input
                    type="text"
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Niveau de Danger</label>
                  <select
                    value={formData.dangerLevel}
                    onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Modéré">Modéré</option>
                    <option value="Élevé">Élevé</option>
                    <option value="Armé et dangereux">Armé et dangereux</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Permis de Conduire</label>
                  <select
                    value={formData.driverLicense}
                    onChange={(e) => setFormData({ ...formData, driverLicense: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="Valide">Valide</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Révoqué">Révoqué</option>
                    <option value="Non titulaire">Non titulaire</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Permis Port d&apos;Arme (PPA)</label>
                  <select
                    value={formData.weaponLicense}
                    onChange={(e) => setFormData({ ...formData, weaponLicense: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="Non titulaire">Non titulaire</option>
                    <option value="Valide">Valide</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Révoqué">Révoqué</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">URL Photo Mugshot</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes & Antécédents</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Enregistrer Citoyen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
