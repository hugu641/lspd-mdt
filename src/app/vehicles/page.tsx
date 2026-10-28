"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Car,
  Search,
  Plus,
  AlertTriangle,
  User,
  ShieldCheck,
  Building,
  CheckCircle,
} from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    plate: "",
    model: "",
    color: "",
    status: "En règle",
    notes: "",
    ownerId: "",
  });

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`/api/vehicles?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
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
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          plate: "",
          model: "",
          color: "",
          status: "En règle",
          notes: "",
          ownerId: "",
        });
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: Record<string, string> = {
    "En règle": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "BOLO / Recherché": "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse",
    "Volé": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "Fourrière": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Car className="w-4 h-4" />
            <span>Registre des Immatriculations DMV & LSPD</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Registre des Véhicules</h1>
          <p className="text-xs text-slate-300">
            Recherche de plaque, vérification du propriétaire et mise en fourrière ou recherche.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer un Véhicule</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="police-card p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par plaque d'immatriculation (ex: 82VOR099), modèle, couleur ou propriétaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-theme-primary font-medium"
          />
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-3 police-card p-12 text-center text-xs text-slate-400">
            Aucun véhicule trouvé.
          </div>
        ) : (
          vehicles.map((v) => (
            <div
              key={v.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                v.status.includes("Recherché") || v.status.includes("Volé")
                  ? "bg-red-950/20 border-red-800/60 shadow-lg shadow-red-950/20"
                  : "police-card border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="font-mono text-base font-black text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 inline-block tracking-wider">
                    {v.plate}
                  </span>
                  <div className="text-sm font-bold text-white pt-1">
                    {v.model}
                  </div>
                  <div className="text-xs text-slate-400">
                    Couleur : <span className="text-slate-300 font-semibold">{v.color}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[v.status] || statusColors["En règle"]}`}>
                  {v.status}
                </span>
              </div>

              {/* Owner info */}
              <div className="pt-2 border-t border-slate-800 text-xs flex items-center justify-between">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Propriétaire :</span>
                </div>
                {v.owner ? (
                  <Link href={`/citizens/${v.owner.id}`} className="font-bold text-theme-primary hover:underline">
                    {v.owner.firstName} {v.owner.lastName}
                  </Link>
                ) : (
                  <span className="text-slate-500 italic">Non assigné</span>
                )}
              </div>

              {v.notes && (
                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {v.notes}
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                <select
                  value={v.status}
                  onChange={(e) => handleUpdateStatus(v.id, e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-200 focus:outline-none"
                >
                  <option value="En règle">Statut: En règle</option>
                  <option value="BOLO / Recherché">Statut: BOLO / Recherché</option>
                  <option value="Volé">Statut: Déclaré Volé</option>
                  <option value="Fourrière">Statut: En Fourrière</option>
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
              <h2 className="text-lg font-black text-white">Enregistrer un Nouveau Véhicule</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Plaque d&apos;immatriculation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 82VOR099"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Modèle du Véhicule *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Karin Sultan RS"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Couleur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Noir Mat, Rouge..."
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Propriétaire Citoyen</label>
                  <select
                    value={formData.ownerId}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Aucun propriétaire --</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Statut Initial</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="En règle">En règle</option>
                    <option value="BOLO / Recherché">BOLO / Recherché</option>
                    <option value="Volé">Volé</option>
                    <option value="Fourrière">Fourrière</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notes & Remarques</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Modifications esthétiques, vitres teintées..."
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
