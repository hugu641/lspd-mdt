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
  Trash2,
  Images,
  CheckCircle,
  AlertOctagon,
  X,
} from "lucide-react";

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quick delete modal state
  const [citizenToDelete, setCitizenToDelete] = useState<any | null>(null);
  const [deletingCitizenId, setDeletingCitizenId] = useState<string | null>(null);

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

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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

    // Check query params for deleted feedback
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("deleted") === "true") {
        showToast("Dossier citoyen supprimé avec succès.");
        // Clear param from URL without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
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
        showToast("Nouveau citoyen enregistré au fichier central.");
        fetchCitizens();
      } else {
        showToast("Erreur lors de la création du citoyen.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur de connexion.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!citizenToDelete) return;

    setDeletingCitizenId(citizenToDelete.id);
    try {
      const res = await fetch(`/api/citizens/${citizenToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`Dossier de ${citizenToDelete.firstName} ${citizenToDelete.lastName} supprimé.`);
        setCitizenToDelete(null);
        fetchCitizens();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Erreur lors de la suppression.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur réseau.", "error");
    } finally {
      setDeletingCitizenId(null);
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
              : "bg-red-950/90 text-red-300 border-red-500/50"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

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

          // Parse photos count
          let photosCount = 0;
          try {
            if (citizen.photos) {
              const p = JSON.parse(citizen.photos);
              if (Array.isArray(p)) photosCount = p.length;
            }
          } catch {
            photosCount = 0;
          }

          return (
            <div
              key={citizen.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group relative ${
                hasActiveWarrant
                  ? "bg-red-950/20 border-red-800/60 hover:border-red-500/80 shadow-lg shadow-red-950/40"
                  : "police-card border-slate-800 hover:border-purple-500/60"
              }`}
            >
              <div>
                {/* Header with Photo, Name & Danger */}
                <div className="flex items-start gap-3">
                  <Link href={`/citizens/${citizen.id}`} className="relative flex-shrink-0">
                    <img
                      src={citizen.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      alt={citizen.lastName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 group-hover:border-purple-500 transition-colors"
                    />
                    {photosCount > 0 && (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-purple-900 text-[9px] font-bold text-purple-200 border border-purple-600 flex items-center gap-0.5">
                        <Images className="w-2.5 h-2.5" />
                        {photosCount}
                      </span>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        href={`/citizens/${citizen.id}`}
                        className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate"
                      >
                        {citizen.firstName} {citizen.lastName}
                      </Link>

                      {/* Quick Delete Citizen Button (pour tests) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCitizenToDelete(citizen);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                        title="Supprimer ce citoyen (tests / ménage)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{citizen.job || "Sans emploi"}</span>
                    </div>

                    {citizen.phone && (
                      <div className="text-xs text-amber-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span className="font-bold">{citizen.phone}</span>
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

              {/* Records Counters with direct link */}
              <Link
                href={`/citizens/${citizen.id}`}
                className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-center hover:opacity-90 transition-opacity"
              >
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
              </Link>
            </div>
          );
        })}
      </div>

      {/* Quick Delete Confirmation Modal */}
      {citizenToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="police-card w-full max-w-md p-6 rounded-2xl border border-red-600/60 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-800">
                <AlertOctagon className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Supprimer ce citoyen ?</h3>
                <p className="text-[11px] text-red-300">Action immédiate de suppression</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Voulez-vous supprimer définitivement le dossier de{" "}
              <strong className="text-white font-bold">
                {citizenToDelete.firstName} {citizenToDelete.lastName}
              </strong>{" "}
              {citizenToDelete.phone && <span className="font-mono text-amber-400">({citizenToDelete.phone})</span>} ?
              Toutes ses contraventions et relations de test seront supprimées.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={!!deletingCitizenId}
                onClick={() => setCitizenToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!!deletingCitizenId}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingCitizenId ? "Suppression..." : "Supprimer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Citizen Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
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
                  <label className="text-xs font-semibold text-slate-300">
                    Numéro de Téléphone <span className="text-amber-400 font-bold">(Clé unique)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: 555-0192"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
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
                <label className="text-xs font-semibold text-slate-300">URL Photo Mugshot / Profil</label>
                <input
                  type="url"
                  placeholder="https://cdn.discordapp.com/... ou https://images.unsplash.com/..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes & Antécédents</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes de surveillance, signes particuliers..."
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
