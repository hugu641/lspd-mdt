"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOfficer } from "../../../context/OfficerContext";
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
  Camera,
  Image as ImageIcon,
  Images,
  Eye,
  Star,
  X,
  ExternalLink,
  AlertCircle,
  AlertOctagon,
  Sparkles,
  Upload,
} from "lucide-react";

export interface CitizenPhoto {
  id: string;
  url: string;
  caption?: string;
  category?: "Mugshot" | "Signe distinctif" | "Preuve" | "Autre";
  createdAt: string;
}

export default function CitizenDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { currentOfficer } = useOfficer();

  const [citizen, setCitizen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"casier" | "photos" | "mandats" | "vehicules" | "armes">("casier");
  const [notes, setNotes] = useState("");
  const [noteSavedAlert, setNoteSavedAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quick license edit state
  const [driverLicense, setDriverLicense] = useState("");
  const [weaponLicense, setWeaponLicense] = useState("");
  const [dangerLevel, setDangerLevel] = useState("");

  // Modals state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInputUrl, setAvatarInputUrl] = useState("");
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoCategory, setNewPhotoCategory] = useState<"Mugshot" | "Signe distinctif" | "Preuve" | "Autre">("Mugshot");
  const [newPhotoSetAsMain, setNewPhotoSetAsMain] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  const [lightboxPhoto, setLightboxPhoto] = useState<CitizenPhoto | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCitizen, setDeletingCitizen] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Safe parse photos JSON array
  const parsePhotos = (raw: any): CitizenPhoto[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

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
        setAvatarInputUrl(data.photoUrl || "");
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

  // Save quick license & notes
  const handleUpdateStatus = async () => {
    try {
      const res = await fetch(`/api/citizens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverLicense,
          weaponLicense,
          dangerLevel,
          notes,
        }),
      });
      if (res.ok) {
        setNoteSavedAlert(true);
        setTimeout(() => setNoteSavedAlert(false), 3000);
        showToast("Dossier citoyen mis à jour");
        fetchCitizen();
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la sauvegarde", "error");
    }
  };

  // Change primary profile avatar photo
  const handleSaveAvatar = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : avatarInputUrl).trim();
    setPhotoSaving(true);
    try {
      // If setting an avatar, also verify if it's already in the gallery; if not, optionally add it
      const currentGallery = parsePhotos(citizen.photos);
      let updatedGallery = [...currentGallery];
      if (targetUrl && !currentGallery.some((p) => p.url === targetUrl)) {
        updatedGallery.unshift({
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url: targetUrl,
          caption: "Photo d'identité (Profil)",
          category: "Mugshot",
          createdAt: new Date().toISOString(),
        });
      }

      const res = await fetch(`/api/citizens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: targetUrl || null,
          photos: updatedGallery,
        }),
      });

      if (res.ok) {
        setShowAvatarModal(false);
        showToast("Photo de profil mise à jour avec succès !");
        fetchCitizen();
      } else {
        showToast("Erreur lors de la mise à jour de la photo", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur réseau", "error");
    } finally {
      setPhotoSaving(false);
    }
  };

  // Add a new photo to the gallery
  const handleAddGalleryPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    setPhotoSaving(true);
    try {
      const currentGallery = parsePhotos(citizen.photos);
      const newPhoto: CitizenPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url: newPhotoUrl.trim(),
        caption: newPhotoCaption.trim() || undefined,
        category: newPhotoCategory,
        createdAt: new Date().toISOString(),
      };

      const updatedPhotos = [newPhoto, ...currentGallery];
      const payload: any = {
        photos: updatedPhotos,
      };

      if (newPhotoSetAsMain || !citizen.photoUrl) {
        payload.photoUrl = newPhotoUrl.trim();
      }

      const res = await fetch(`/api/citizens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddPhotoModal(false);
        setNewPhotoUrl("");
        setNewPhotoCaption("");
        setNewPhotoCategory("Mugshot");
        setNewPhotoSetAsMain(false);
        showToast("Photo ajoutée au dossier citoyen !");
        fetchCitizen();
      } else {
        showToast("Erreur lors de l'ajout de la photo", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur réseau", "error");
    } finally {
      setPhotoSaving(false);
    }
  };

  // Delete a photo from the gallery
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Voulez-vous vraiment retirer cette photo du dossier ?")) return;

    try {
      const currentGallery = parsePhotos(citizen.photos);
      const targetPhoto = currentGallery.find((p) => p.id === photoId);
      const updatedPhotos = currentGallery.filter((p) => p.id !== photoId);

      const payload: any = {
        photos: updatedPhotos,
      };

      // If the deleted photo was also the main avatar, update avatar to next photo or null
      if (targetPhoto && citizen.photoUrl === targetPhoto.url) {
        payload.photoUrl = updatedPhotos[0]?.url || null;
      }

      const res = await fetch(`/api/citizens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (lightboxPhoto?.id === photoId) setLightboxPhoto(null);
        showToast("Photo retirée du dossier");
        fetchCitizen();
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression de la photo", "error");
    }
  };

  // Delete citizen permanently
  const handleDeleteCitizen = async () => {
    setDeletingCitizen(true);
    try {
      const res = await fetch(`/api/citizens/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/citizens?deleted=true");
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Impossible de supprimer le citoyen", "error");
        setDeletingCitizen(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur réseau lors de la suppression", "error");
      setDeletingCitizen(false);
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

  const galleryPhotos = parsePhotos(citizen.photos);
  const totalFines = (citizen.citations || []).reduce((acc: number, c: any) => acc + c.totalFine, 0);
  const totalJail = (citizen.citations || []).reduce((acc: number, c: any) => acc + c.totalJailTime, 0);

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
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/citizens"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Dossiers Citoyens</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dresser PV */}
          <Link
            href={`/calculator?phone=${encodeURIComponent(citizen.phone || "")}`}
            className="px-3.5 py-2 rounded-xl btn-theme-primary text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Dresser un Procès-Verbal</span>
          </Link>

          {/* Bouton Supprimer Citoyen (pour tests et nettoyage) */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 hover:border-rose-600 text-rose-300 hover:text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer le citoyen</span>
          </button>
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
            {/* Interactive Profile Photo Container */}
            <div className="relative group flex-shrink-0">
              <img
                src={citizen.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                alt={`${citizen.firstName} ${citizen.lastName}`}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-700 shadow-xl group-hover:border-purple-500 transition-all cursor-pointer"
                onClick={() => setShowAvatarModal(true)}
              />

              {/* Overlay on hover to change photo */}
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold"
                title="Cliquer pour changer la photo"
              >
                <Camera className="w-5 h-5 text-purple-400" />
                <span>Changer photo</span>
              </button>

              {/* Photos count badge */}
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-purple-900/90 border border-purple-500/60 text-purple-200 text-[10px] font-bold shadow-lg flex items-center gap-1 hover:bg-purple-800 transition-colors"
                title="Accéder à la galerie de photos"
              >
                <Images className="w-3 h-3" />
                <span>{galleryPhotos.length}</span>
              </button>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white">
                  {citizen.firstName} {citizen.lastName}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  ID: #{citizen.id.slice(-6)}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                  citizen.gender === "F"
                    ? "bg-pink-950/60 text-pink-300 border-pink-700/50"
                    : "bg-blue-950/60 text-blue-300 border-blue-700/50"
                }`}>
                  {citizen.gender === "F" ? "Femme" : "Homme"}
                </span>
              </div>

              {/* Quick Info Line */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
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
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono text-amber-300 font-bold">{citizen.phone}</span>
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

              {/* Photo action shortcuts */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>Changer la photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("photos");
                    setShowAddPhotoModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 text-purple-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ajouter une photo</span>
                </button>
              </div>
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
              <div className={`text-sm font-mono font-bold ${totalJail > 0 ? "text-red-400" : "text-slate-400"}`}>
                {totalJail > 0 ? `${totalJail} minutes` : "Casier vierge"}
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
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
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
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
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
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
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
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("casier")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "casier"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Casier Judiciaire ({citizen.citations?.length || 0})</span>
        </button>

        {/* Onglet dédié Galerie & Photos du citoyen */}
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "photos"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Images className="w-4 h-4" />
          <span>Photos & Clichés ({galleryPhotos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("mandats")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "vehicules"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Véhicules ({citizen.vehicles?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("armes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "armes"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Armes Déclarées ({citizen.weapons?.length || 0})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: CASIER JUDICIAIRE
          ===================================================================== */}
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

      {/* =====================================================================
          TAB 2: PHOTOS & GALERIE DU CITOYEN
          ===================================================================== */}
      {activeTab === "photos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-950/20 border border-purple-900/30">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Images className="w-4 h-4 text-purple-400" />
                <span>Galerie photographique & Fiche anthropométrique</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Consultez les clichés d'identité, signes distinctifs (tatouages, cicatrices) et photos d'interpellation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(true)}
                className="px-3.5 py-2 rounded-xl btn-theme-primary text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un cliché</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Modifier photo de profil</span>
              </button>
            </div>
          </div>

          {galleryPhotos.length === 0 ? (
            <div className="police-card p-12 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-950/50 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white">Aucun cliché enregistré dans la galerie</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vous pouvez ajouter plusieurs photos pour ce citoyen (mugshots de face/profil, gros plans de tatouages, saisies ou preuves d'arrestation).
              </p>
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(true)}
                className="px-4 py-2 rounded-xl btn-theme-primary text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter la première photo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryPhotos.map((photo) => {
                const isMainAvatar = citizen.photoUrl === photo.url;

                return (
                  <div
                    key={photo.id}
                    className={`police-card rounded-2xl overflow-hidden border transition-all flex flex-col justify-between group ${
                      isMainAvatar
                        ? "border-purple-500/80 shadow-lg shadow-purple-950/40"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Image Box */}
                    <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.caption || "Cliché citoyen"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setLightboxPhoto(photo)}
                      />

                      {/* Main photo badge */}
                      {isMainAvatar && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600/95 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>Photo Principale</span>
                        </div>
                      )}

                      {/* Category tag */}
                      {photo.category && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-slate-200 text-[10px] font-bold border border-white/10">
                          {photo.category}
                        </div>
                      )}

                      {/* Quick view button */}
                      <button
                        type="button"
                        onClick={() => setLightboxPhoto(photo)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                        title="Agrandir l'image"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-white truncate" title={photo.caption || "Sans titre"}>
                          {photo.caption || "Cliché sans légende"}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {new Date(photo.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        {!isMainAvatar ? (
                          <button
                            type="button"
                            onClick={() => handleSaveAvatar(photo.url)}
                            className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Définir comme photo de profil</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                            <span>Profil actuel</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Supprimer ce cliché"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: MANDATS & BOLO
          ===================================================================== */}
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

      {/* =====================================================================
          TAB 4: VÉHICULES ENREGISTRÉS
          ===================================================================== */}
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

      {/* =====================================================================
          TAB 5: ARMES DÉCLARÉES
          ===================================================================== */}
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

      {/* =====================================================================
          MODAL 1: CHANGER LA PHOTO DE PROFIL PRINCIPALE
          ===================================================================== */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="police-card w-full max-w-lg p-6 rounded-2xl border border-purple-500/40 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Changer la photo de profil du citoyen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Section */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <img
                src={avatarInputUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                alt="Aperçu photo"
                className="w-20 h-20 rounded-xl object-cover border border-slate-700 shadow-md"
                onError={(e) => {
                  setAvatarPreviewError(true);
                  (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200";
                }}
              />
              <div className="flex-1 space-y-1">
                <div className="text-xs font-bold text-white">Aperçu en direct</div>
                <div className="text-[11px] text-slate-400">
                  {avatarInputUrl ? "Image valide et prête à être assignée." : "Avatar par défaut appliqué."}
                </div>
                {avatarPreviewError && (
                  <div className="text-[10px] text-amber-400">⚠️ Vérifiez que l'URL est accessible publiquement.</div>
                )}
              </div>
            </div>

            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                URL de l'image (Discord, Imgur, GTA snapshot, etc.)
              </label>
              <input
                type="url"
                value={avatarInputUrl}
                onChange={(e) => {
                  setAvatarInputUrl(e.target.value);
                  setAvatarPreviewError(false);
                }}
                placeholder="https://cdn.discordapp.com/attachments/... ou https://i.imgur.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Select from existing gallery if available */}
            {galleryPhotos.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Ou choisir parmi les clichés de sa galerie :
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                  {galleryPhotos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAvatarInputUrl(p.url);
                        setAvatarPreviewError(false);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        avatarInputUrl === p.url ? "border-purple-500 scale-95" : "border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <img src={p.url} alt="Miniature" className="w-full h-full object-cover" />
                      {avatarInputUrl === p.url && (
                        <div className="absolute inset-0 bg-purple-600/40 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveAvatar("")}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Réinitialiser par défaut
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={photoSaving}
                  onClick={() => handleSaveAvatar()}
                  className="px-5 py-2 rounded-xl btn-theme-primary text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{photoSaving ? "Enregistrement..." : "Appliquer la photo"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: AJOUTER UNE PHOTO À LA GALERIE DU CITOYEN
          ===================================================================== */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddGalleryPhoto}
            className="police-card w-full max-w-lg p-6 rounded-2xl border border-purple-500/40 shadow-2xl space-y-5 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Ajouter un cliché au dossier citoyen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Lien de la photo <span className="text-purple-400">*</span>
              </label>
              <input
                type="url"
                required
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://cdn.discordapp.com/attachments/... ou https://i.imgur.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Direct Image Preview if URL provided */}
            {newPhotoUrl && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <img
                  src={newPhotoUrl}
                  alt="Aperçu"
                  className="w-20 h-20 rounded-xl object-cover border border-slate-700"
                  onError={(e) => {
                    (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200";
                  }}
                />
                <div className="text-xs text-slate-300">
                  <div className="font-bold text-white">Aperçu du cliché</div>
                  <div className="text-[11px] text-slate-400">Le cliché sera archivé dans le dossier judiciaire.</div>
                </div>
              </div>
            )}

            {/* Category & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Catégorie du cliché</label>
                <select
                  value={newPhotoCategory}
                  onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="Mugshot">📸 Mugshot / Identité</option>
                  <option value="Signe distinctif">🔍 Tatouage / Cicatrice</option>
                  <option value="Preuve">🚨 Preuve / Contrôle</option>
                  <option value="Autre">📁 Autre cliché</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Légende / Titre (facultatif)</label>
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="Ex: Mugshot de profil, Tatouage bras..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Option to set as primary avatar */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={newPhotoSetAsMain}
                onChange={(e) => setNewPhotoSetAsMain(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-800"
              />
              <span className="text-xs text-slate-300 font-medium">
                Définir immédiatement comme photo de profil principale du citoyen
              </span>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={photoSaving || !newPhotoUrl.trim()}
                className="px-5 py-2 rounded-xl btn-theme-primary text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{photoSaving ? "Ajout en cours..." : "Ajouter à la galerie"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: LIGHTBOX / ZOOM PHOTO
          ===================================================================== */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || "Aperçu agrandi"}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain border border-slate-800 shadow-2xl"
            />

            <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white">
              <div>
                <div className="font-bold">{lightboxPhoto.caption || "Cliché sans légende"}</div>
                <div className="text-[11px] text-slate-400">
                  {lightboxPhoto.category || "Général"} •{" "}
                  {new Date(lightboxPhoto.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {citizen.photoUrl !== lightboxPhoto.url && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveAvatar(lightboxPhoto.url);
                      setLightboxPhoto(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Définir comme profil</span>
                  </button>
                )}

                <a
                  href={lightboxPhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(lightboxPhoto.id)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 transition-colors"
                  title="Supprimer ce cliché"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: CONFIRMATION DE SUPPRESSION DÉFINITIVE DU CITOYEN
          ===================================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="police-card w-full max-w-md p-6 rounded-2xl border border-red-600/60 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-800/80">
                <AlertOctagon className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Supprimer ce citoyen ?</h3>
                <p className="text-[11px] text-red-300">Action irréversible de nettoyage</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-slate-300 space-y-2">
              <p>
                Vous êtes sur le point de supprimer définitivement le dossier de{" "}
                <strong className="text-white font-bold">
                  {citizen.firstName} {citizen.lastName}
                </strong>{" "}
                {citizen.phone && <span className="font-mono text-amber-400">({citizen.phone})</span>}.
              </p>
              <p className="text-[11px] text-slate-400">
                • Toutes ses contraventions ({citizen.citations?.length || 0}) seront purgées.
                <br />
                • Ses mandats d'arrêt et arrestations seront archivés / retirés.
                <br />
                • Ses armes et véhicules enregistrés seront automatiquement dissociés.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={deletingCitizen}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={deletingCitizen}
                onClick={handleDeleteCitizen}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/60 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingCitizen ? "Suppression en cours..." : "Confirmer la suppression"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
