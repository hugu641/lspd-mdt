"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crosshair,
  Search,
  Plus,
  AlertTriangle,
  User,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function WeaponsPage() {
  const [weapons, setWeapons] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    serialNumber: "",
    modelName: "",
    weaponType: "Arme de poing",
    status: "En règle",
    notes: "",
    ownerId: "",
  });

  const fetchWeapons = async () => {
    try {
      const res = await fetch(`/api/weapons?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setWeapons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeapons();
  }, [searchQuery]);

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
    try {
      const res = await fetch("/api/weapons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          serialNumber: "",
          modelName: "",
          weaponType: "Arme de poing",
          status: "En règle",
          notes: "",
          ownerId: "",
        });
        fetchWeapons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/weapons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchWeapons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: Record<string, string> = {
    "En règle": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "Recherche": "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse",
    "Volée": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "Confisquée": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Crosshair className="w-4 h-4" />
            <span>Registre Balistique & Armement LSPD</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Registre des Armes Déclarées</h1>
          <p className="text-xs text-slate-300">
            Contrôle des numéros de série, vérification des permis de port d&apos;arme (PPA) et suivi des saisies.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer une Arme</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="police-card p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro de série (ex: SN-998241), modèle (ex: Combat Pistol), type ou propriétaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-theme-primary font-medium"
          />
        </div>
      </div>

      {/* Weapons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weapons.length === 0 ? (
          <div className="col-span-3 police-card p-12 text-center text-xs text-slate-400">
            Aucune arme répertoriée dans le registre.
          </div>
        ) : (
          weapons.map((wp) => (
            <div
              key={wp.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                wp.status.includes("Recherche") || wp.status.includes("Volée")
                  ? "bg-red-950/20 border-red-800/60 shadow-lg shadow-red-950/20"
                  : "police-card border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-black text-theme-primary px-2.5 py-1 rounded-lg bg-theme-primary-light border border-theme-primary inline-block tracking-wider">
                    {wp.serialNumber}
                  </span>
                  <div className="text-sm font-bold text-white pt-1">
                    {wp.modelName}
                  </div>
                  <div className="text-xs text-slate-400">
                    Type : <span className="text-slate-300 font-semibold">{wp.weaponType}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[wp.status] || statusColors["En règle"]}`}>
                  {wp.status}
                </span>
              </div>

              {/* Owner info & PPA Status */}
              <div className="pt-2 border-t border-slate-800 text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-theme-primary" />
                    <span>Propriétaire :</span>
                  </div>
                  {wp.owner ? (
                    <Link href={`/citizens/${wp.owner.id}`} className="font-bold text-theme-primary hover:underline">
                      {wp.owner.firstName} {wp.owner.lastName}
                    </Link>
                  ) : (
                    <span className="text-slate-500 italic">Non attribuée / Saisie</span>
                  )}
                </div>

                {wp.owner && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Statut PPA du tireur :</span>
                    <span
                      className={`font-semibold ${
                        wp.owner.weaponLicense === "Valide" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {wp.owner.weaponLicense}
                    </span>
                  </div>
                )}
              </div>

              {wp.notes && (
                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {wp.notes}
                </div>
              )}

              {/* Status Action Selector */}
              <div className="pt-2 border-t border-slate-800/80">
                <select
                  value={wp.status}
                  onChange={(e) => handleUpdateStatus(wp.id, e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-200 focus:outline-none"
                >
                  <option value="En règle">Statut: En règle (Légale)</option>
                  <option value="Recherche">Statut: Recherchée (Scène de crime)</option>
                  <option value="Volée">Statut: Déclarée Volée</option>
                  <option value="Confisquée">Statut: Confisquée au scellé</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Enregistrer une Arme au Registre</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Numéro de Série *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SN-998241"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Modèle de l&apos;Arme *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Combat Pistol 9mm"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Catégorie d&apos;Arme</label>
                  <select
                    value={formData.weaponType}
                    onChange={(e) => setFormData({ ...formData, weaponType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="Arme de poing">Arme de poing (Pistolet)</option>
                    <option value="Fusil à pompe">Fusil à pompe</option>
                    <option value="Arme automatique">Pistolet mitrailleur</option>
                    <option value="Fusil d'assaut">Fusil d&apos;assaut</option>
                    <option value="Fusil de précision">Fusil de précision</option>
                    <option value="Arme blanche">Arme blanche</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Propriétaire Déclaré</label>
                  <select
                    value={formData.ownerId}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Aucun / Scellé LSPD --</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} (PPA: {c.weaponLicense})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Statut de l&apos;Arme</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="En règle">En règle</option>
                    <option value="Recherche">Recherche (Scène de crime)</option>
                    <option value="Volée">Volée</option>
                    <option value="Confisquée">Confisquée</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes & Balistique</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Rayures de canon, traceurs balistiques..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Enregistrer l&apos;Arme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
