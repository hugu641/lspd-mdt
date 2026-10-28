"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOfficer } from "@/context/OfficerContext";
import {
  Users,
  Shield,
  AlertTriangle,
  Car,
  Crosshair,
  FileText,
  DollarSign,
  Clock,
  ArrowLeft,
  Calendar,
  Phone,
  Briefcase,
  MapPin,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Save,
} from "lucide-react";

export default function CitizenDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { currentOfficer } = useOfficer();

  const [citizen, setCitizen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"casier" | "vehicules" | "armes" | "mandats">("casier");
  const [notes, setNotes] = useState("");
  const [noteSavedAlert, setNoteSavedAlert] = useState(false);

  // Quick license edit state
  const [driverLicense, setDriverLicense] = useState("");
  const [weaponLicense, setWeaponLicense] = useState("");
  const [dangerLevel, setDangerLevel] = useState("");

  const fetchCitizen = async () => {
    try {
      const res = await fetch(`/api/citizens/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCitizen(data);
        setNotes(data.notes || "");
        setDriverLicense(data.driverLicense || "Valide");
        setWeaponLicense(data.weaponLicense || "Non titulaire");
        setDangerLevel(data.dangerLevel || "Faible");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCitizen();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      const res = await fetch(`/api/citizens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...citizen,
          driverLicense,
          weaponLicense,
          dangerLevel,
          notes,
        }),
      });
      if (res.ok) {
        setNoteSavedAlert(true);
        setTimeout(() => setNoteSavedAlert(false), 3000);
        fetchCitizen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Chargement du dossier citoyen...</div>;
  }

  if (!citizen) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-base font-bold text-white">Dossier citoyen introuvable.</div>
        <Link href="/citizens" className="text-xs text-theme-primary underline">Retour à la liste</Link>
      </div>
    );
  }

  const totalFines = (citizen.citations || []).reduce((acc: number, c: any) => acc + c.totalFine, 0);
  const totalJail = (citizen.citations || []).reduce((acc: number, c: any) => acc + c.totalJailTime, 0);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/citizens"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Dossiers Citoyens</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/calculator`}
            className="px-3 py-1.5 rounded-xl btn-theme-primary text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Dresser une Contravention</span>
          </Link>
        </div>
      </div>

      {noteSavedAlert && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Dossier citoyen mis à jour avec succès.</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="police-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <img
              src={citizen.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
              alt={citizen.lastName}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-700 shadow-xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">
                  {citizen.firstName} {citizen.lastName}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  ID: #{citizen.id.slice(-6)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Né(e) le {citizen.birthDate}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>{citizen.job || "Sans emploi"}</span>
                </div>
                {citizen.phone && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono">{citizen.phone}</span>
                    </div>
                  </>
                )}
              </div>

              {citizen.address && (
                <div className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{citizen.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex sm:flex-col gap-2 items-end">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-right min-w-[140px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amendes</div>
              <div className="text-base font-mono font-black text-amber-400">
                ${totalFines.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-right min-w-[140px]">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Temps de Prison</div>
              <div className="text-sm font-mono font-bold text-red-400">
                {totalJail} minutes
              </div>
            </div>
          </div>
        </div>

        {/* License & Danger Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Permis de Conduire</label>
            <select
              value={driverLicense}
              onChange={(e) => setDriverLicense(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="Valide">Valide</option>
              <option value="Suspendu">Suspendu</option>
              <option value="Révoqué">Révoqué</option>
              <option value="Non titulaire">Non titulaire</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Port d&apos;Arme (PPA)</label>
            <select
              value={weaponLicense}
              onChange={(e) => setWeaponLicense(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="Non titulaire">Non titulaire</option>
              <option value="Valide">Valide</option>
              <option value="Suspendu">Suspendu</option>
              <option value="Révoqué">Révoqué</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Niveau de Danger</label>
            <select
              value={dangerLevel}
              onChange={(e) => setDangerLevel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="Faible">Faible</option>
              <option value="Modéré">Modéré</option>
              <option value="Élevé">Élevé</option>
              <option value="Armé et dangereux">Armé et dangereux</option>
            </select>
          </div>
        </div>

        {/* Notes & Save Button */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-400">Notes d&apos;Officiers & Surveillance</label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des observations confidentielles..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
            <button
              onClick={handleUpdateStatus}
              className="px-4 rounded-xl btn-theme-primary text-xs font-bold flex items-center justify-center gap-1.5 self-stretch whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("casier")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "casier"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Casier Judiciaire ({citizen.citations?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("mandats")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "mandats"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Mandats & BOLO ({citizen.warrants?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("vehicules")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "vehicules"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Véhicules Enregistrés ({citizen.vehicles?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("armes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "armes"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Armes Déclarées ({citizen.weapons?.length || 0})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "casier" && (
        <div className="space-y-4">
          {citizen.citations?.length === 0 ? (
            <div className="police-card p-8 rounded-2xl text-center text-xs text-slate-400">
              Casier judiciaire vierge. Aucune contravention ou condamnation enregistrée.
            </div>
          ) : (
            citizen.citations.map((cit: any) => (
              <div key={cit.id} className="police-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-theme-primary">{cit.citationNumber}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-300">
                        Dressé par {cit.officer?.rank} {cit.officer?.name} (#{cit.officer?.badgeNumber})
                      </span>
                    </div>
                    {cit.location && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{cit.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-base font-mono font-black text-amber-400">
                      ${cit.totalFine.toLocaleString()}
                    </div>
                    {cit.totalJailTime > 0 && (
                      <div className="text-xs font-mono font-bold text-red-400">
                        {cit.totalJailTime} min cellule
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in citation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cit.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-theme-primary mr-1.5">
                          {item.penalCodeItem?.code}
                        </span>
                        <span className="text-white font-medium">{item.penalCodeItem?.title}</span>
                      </div>
                      <span className="font-mono text-amber-400 font-bold">
                        ${item.fine.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {cit.notes && (
                  <div className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg">
                    Notes : {cit.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "mandats" && (
        <div className="space-y-4">
          {citizen.warrants?.length === 0 ? (
            <div className="police-card p-8 rounded-2xl text-center text-xs text-slate-400">
              Aucun mandat ou avis de recherche enregistré pour ce citoyen.
            </div>
          ) : (
            citizen.warrants.map((w: any) => (
              <div
                key={w.id}
                className="police-card p-5 rounded-2xl border border-red-900/40 bg-red-950/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-400">{w.warrantNumber}</span>
                    <h3 className="text-sm font-bold text-white">{w.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {w.dangerLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{w.description}</p>
                <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                  <span>Émis par {w.officer?.rank} {w.officer?.name}</span>
                  <span className="font-bold text-amber-400">{w.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "vehicules" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {citizen.vehicles?.length === 0 ? (
            <div className="col-span-2 police-card p-8 rounded-2xl text-center text-xs text-slate-400">
              Aucun véhicule enregistré au nom de ce citoyen.
            </div>
          ) : (
            citizen.vehicles.map((v: any) => (
              <div key={v.id} className="police-card p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {v.plate}
                  </span>
                  <span className="text-xs font-bold text-slate-300">{v.status}</span>
                </div>
                <div className="text-sm font-bold text-white">{v.model} ({v.color})</div>
                {v.notes && <div className="text-xs text-slate-400 italic">{v.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "armes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {citizen.weapons?.length === 0 ? (
            <div className="col-span-2 police-card p-8 rounded-2xl text-center text-xs text-slate-400">
              Aucune arme déclarée au nom de ce citoyen.
            </div>
          ) : (
            citizen.weapons.map((wp: any) => (
              <div key={wp.id} className="police-card p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-theme-primary px-2 py-0.5 rounded bg-theme-primary-light border border-theme-primary">
                    SN: {wp.serialNumber}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">{wp.status}</span>
                </div>
                <div className="text-sm font-bold text-white">{wp.modelName} ({wp.weaponType})</div>
                {wp.notes && <div className="text-xs text-slate-400 italic">{wp.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
