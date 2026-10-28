"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useOfficer, Officer } from "../../../context/OfficerContext";
import { isHighCommand } from "../../../lib/ranks";
import {
  ChevronLeft,
  Shield,
  Phone,
  Crosshair,
  FileText,
  DollarSign,
  Copy,
  Check,
  Award,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Camera,
  Bot,
  User,
  X,
  ExternalLink,
} from "lucide-react";

interface ServiceWeapon {
  id: string;
  model: string;
  serialNumber: string;
  category: string;
  assignedAt?: string;
}

export default function OfficerProfilePage() {
  const params = useParams();
  const officerId = params?.id as string;
  const { currentOfficer, refreshOfficers } = useOfficer();

  const [officer, setOfficer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal to add a service weapon
  const [showAddWeaponModal, setShowAddWeaponModal] = useState(false);
  const [weaponModel, setWeaponModel] = useState("Glock 17 (Combat Pistol)");
  const [weaponSerial, setWeaponSerial] = useState("");
  const [weaponCategory, setWeaponCategory] = useState("Arme de poing");
  const [savingWeapon, setSavingWeapon] = useState(false);

  // Modal to edit profile coordinates (phone, photo, identity)
  const [showEditModal, setShowEditModal] = useState(false);
  const [matriculeInput, setMatriculeInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchOfficer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/officers/${officerId}`);
      if (res.ok) {
        const data = await res.json();
        setOfficer(data);
      }
    } catch (err) {
      console.error("Error loading officer profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (officerId) {
      fetchOfficer();
    }
  }, [officerId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}: ${text}`);
    setTimeout(() => setCopiedText(null), 1800);
  };

  // Parse service weapons from JSON column
  const parsedWeapons: ServiceWeapon[] = React.useMemo(() => {
    if (!officer?.serviceWeapons) return [];
    try {
      const data = JSON.parse(officer.serviceWeapons);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, [officer?.serviceWeapons]);

  // Add a new service weapon
  const handleAddWeapon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weaponSerial.trim() || !officer) return;
    setSavingWeapon(true);

    const newWeapon: ServiceWeapon = {
      id: `wpn-${Date.now()}`,
      model: weaponModel.trim(),
      serialNumber: weaponSerial.trim().toUpperCase(),
      category: weaponCategory,
      assignedAt: new Date().toLocaleDateString("fr-FR"),
    };

    const updatedList = [...parsedWeapons, newWeapon];

    try {
      const res = await fetch(`/api/officers/${officer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceWeapons: JSON.stringify(updatedList),
        }),
      });

      if (res.ok) {
        setOfficer((prev: any) => ({
          ...prev,
          serviceWeapons: JSON.stringify(updatedList),
        }));
        setWeaponSerial("");
        setShowAddWeaponModal(false);
      } else {
        alert("Erreur lors de l'enregistrement de l'arme de service.");
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setSavingWeapon(false);
    }
  };

  // Remove a service weapon
  const handleRemoveWeapon = async (weaponId: string) => {
    if (!confirm("Voulez-vous retirer cette arme de la dotation de l'agent ?")) return;
    const updatedList = parsedWeapons.filter((w) => w.id !== weaponId);

    try {
      const res = await fetch(`/api/officers/${officer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceWeapons: JSON.stringify(updatedList),
        }),
      });

      if (res.ok) {
        setOfficer((prev: any) => ({
          ...prev,
          serviceWeapons: JSON.stringify(updatedList),
        }));
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  // Open Edit Profile modal
  const openEditProfile = () => {
    if (!officer) return;
    const parts = (officer.name || "").split("|");
    if (parts.length === 2) {
      setMatriculeInput(parts[0].trim());
      const nameParts = parts[1].trim().split(" ");
      setFirstNameInput(nameParts[0] || "");
      setLastNameInput(nameParts.slice(1).join(" ") || "");
    } else {
      setMatriculeInput(officer.badgeNumber || "");
      const nameParts = (officer.name || "").trim().split(" ");
      setFirstNameInput(nameParts[0] || "");
      setLastNameInput(nameParts.slice(1).join(" ") || "");
    }
    setPhoneInput(officer.phone || "");
    setAvatarUrlInput(officer.avatarUrl || "");
    setShowEditModal(true);
  };

  // Save Edit Profile (updates name, matricule, phone, avatar and renames Discord member)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officer) return;
    setSavingProfile(true);

    const cleanBadge = matriculeInput.trim();
    const cleanFirst = firstNameInput.trim();
    const cleanLast = lastNameInput.trim();
    const formattedName = cleanLast
      ? `${cleanBadge} | ${cleanFirst} ${cleanLast}`
      : `${cleanBadge} | ${cleanFirst}`;

    try {
      const res = await fetch(`/api/officers/${officer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formattedName,
          badgeNumber: cleanBadge,
          callsign: `${officer.rank.toUpperCase()}-${cleanBadge}`,
          phone: phoneInput.trim() || null,
          avatarUrl: avatarUrlInput.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOfficer((prev: any) => ({
          ...prev,
          name: formattedName,
          badgeNumber: cleanBadge,
          callsign: `${officer.rank.toUpperCase()}-${cleanBadge}`,
          phone: phoneInput.trim() || null,
          avatarUrl: avatarUrlInput.trim() || null,
        }));
        await refreshOfficers();

        let msg = `Profil mis à jour : ${formattedName}`;
        if (data.discordNicknameResult?.success) {
          msg += " • Pseudo Discord mis à jour !";
        }
        alert(msg);
        setShowEditModal(false);
      } else {
        alert(`Erreur : ${data.error || "Impossible de mettre à jour le profil"}`);
      }
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const isMe = currentOfficer?.id === officer?.id;
  const canEdit = isMe || isHighCommand(currentOfficer);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Chargement du dossier agent...
        </div>
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="p-10 text-center rounded-3xl bg-[#090b17] border border-[#181c38] space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Agent introuvable</h2>
        <p className="text-xs text-slate-400">
          Ce profil d&apos;agent n&apos;existe pas ou a été retiré des effectifs.
        </p>
        <Link
          href="/trombinoscope"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour au Trombinoscope</span>
        </Link>
      </div>
    );
  }

  const isMarshal =
    officer.department === "US Marshal" ||
    officer.rank.toLowerCase().includes("marshal") ||
    officer.rank.toLowerCase().includes("marshall");

  const totalFines = (officer.citations || []).reduce(
    (acc: number, c: any) => acc + (c.totalFine || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/trombinoscope"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1124] hover:bg-[#181d3d] border border-[#21274d] text-xs font-bold text-slate-300 hover:text-white transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour au Trombinoscope</span>
        </Link>

        {canEdit && (
          <button
            onClick={openEditProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modifier Fiche & Matricule</span>
          </button>
        )}
      </div>

      {/* Hero Service Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#090b17] border border-[#1b2042] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Photo */}
          <div className="relative group/avatar flex-shrink-0">
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-3xl p-1 shadow-2xl ${
                isMarshal
                  ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"
                  : "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500"
              }`}
            >
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#070814] flex items-center justify-center relative">
                {officer.avatarUrl ? (
                  <img
                    src={officer.avatarUrl}
                    alt={officer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl bg-gradient-to-tr from-indigo-950 to-purple-900">
                    {officer.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </div>
            </div>

            {canEdit && (
              <button
                onClick={openEditProfile}
                title="Modifier la photo"
                className="absolute bottom-1 right-1 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-xl border border-white/20 transition-all"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile Identity Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  isMarshal
                    ? "bg-indigo-950 text-indigo-300 border-indigo-500/50"
                    : "bg-blue-950 text-blue-300 border-blue-500/40"
                }`}
              >
                {isMarshal ? "US Marshal Service" : "Central Police LSPD"}
              </span>

              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40">
                Matricule #{officer.badgeNumber}
              </span>

              {officer.isInstructor && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Instructeur FTO</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {officer.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-300">
              <span className="font-bold text-white px-2.5 py-1 rounded-xl bg-[#121633] border border-[#232b5e]">
                {officer.rank}
              </span>
              <span className="font-mono text-purple-300">
                Indicatif : <strong>{officer.callsign}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Affectation : <strong>Unité {officer.unitType || "Adam"}</strong>
              </span>
            </div>

            {/* Quick Contact Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {/* Phone IG */}
              <div
                onClick={() =>
                  officer.phone && handleCopy(officer.phone, "Téléphone")
                }
                className="p-2.5 rounded-xl bg-[#0c0e20] border border-[#1a1f3c] hover:border-purple-500/50 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Téléphone In-Game</div>
                    <div className="font-mono text-xs font-black text-emerald-300">
                      {officer.phone || "Non renseigné"}
                    </div>
                  </div>
                </div>
                {officer.phone && <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
              </div>

              {/* Discord Tag */}
              <div
                onClick={() =>
                  officer.discordTag && handleCopy(`@${officer.discordTag}`, "Discord")
                }
                className="p-2.5 rounded-xl bg-[#0c0e20] border border-[#1a1f3c] hover:border-indigo-500/50 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Identité Discord</div>
                    <div className="font-mono text-xs font-bold text-indigo-300 truncate max-w-[120px]">
                      @{officer.discordTag || officer.discordId || "Non lié"}
                    </div>
                  </div>
                </div>
                {officer.discordTag && <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
              </div>

              {/* Radio Status */}
              <div className="p-2.5 rounded-xl bg-[#0c0e20] border border-[#1a1f3c] flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    officer.status === "10-8"
                      ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"
                      : officer.status === "10-7"
                      ? "bg-amber-400"
                      : officer.status === "10-6"
                      ? "bg-yellow-400"
                      : "bg-slate-600"
                  }`}
                />
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Statut Radio</div>
                  <div className="text-xs font-black text-white font-mono">
                    {officer.status === "10-8"
                      ? "10-8 • En Service"
                      : officer.status === "10-7"
                      ? "10-7 • En Pause"
                      : officer.status === "10-6"
                      ? "10-6 • Occupé"
                      : "10-10 • Fin de service"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Toast */}
      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-xl bg-purple-950 text-purple-200 border border-purple-500/50 shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Copié dans le presse-papier : <strong className="text-white font-mono">{copiedText}</strong></span>
        </div>
      )}

      {/* SECTION 1: ARMES DE SERVICE & NUMÉROS DE SÉRIE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#090b17] border border-[#1b2042] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#181c3b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Armes de Service & Numéros de Série
              </h2>
              <p className="text-xs text-slate-400">
                Numéros de série des armes en dotation officielle attribuées à cet agent.
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={() => setShowAddWeaponModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Déclarer une arme</span>
            </button>
          )}
        </div>

        {parsedWeapons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {parsedWeapons.map((wpn) => (
              <div
                key={wpn.id}
                className="p-3.5 rounded-2xl bg-[#0c0e20] border border-[#1a1f3c] hover:border-cyan-500/40 transition-all space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase">
                    {wpn.category || "Arme de Service"}
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveWeapon(wpn.id)}
                      title="Retirer cette arme"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="font-bold text-white text-sm">{wpn.model}</div>

                <div
                  onClick={() => handleCopy(wpn.serialNumber, "Numéro de série")}
                  className="p-2 rounded-xl bg-[#070814] border border-[#1a1f3c] flex items-center justify-between cursor-pointer hover:border-cyan-400 transition-all group/serial"
                >
                  <div className="text-[11px] font-mono text-cyan-300 font-bold tracking-wider">
                    SN: {wpn.serialNumber}
                  </div>
                  <Copy className="w-3 h-3 text-slate-500 group-hover/serial:text-white" />
                </div>

                {wpn.assignedAt && (
                  <div className="text-[10px] text-slate-400">
                    Enregistrée le : {wpn.assignedAt}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#070814] border border-[#161a33] space-y-2">
            <Crosshair className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs text-slate-300 font-bold">Aucune arme de service enregistrée</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Cet agent n&apos;a pas encore renseigné les numéros de série de son arme de poing, fusil ou taser.
            </p>
            {canEdit && (
              <button
                onClick={() => setShowAddWeaponModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un numéro de série</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: HISTORIQUE DES CONTRAVENTIONS DRESSÉES */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#090b17] border border-[#1b2042] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#181c3b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Historique des Contraventions Dressées ({officer.citations?.length || 0})
              </h2>
              <p className="text-xs text-slate-400">
                Amendes et procès-verbaux (PV) émis par cet officier sur le terrain.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Amendes Dressées</div>
            <div className="text-base font-black font-mono text-amber-400">
              ${totalFines.toLocaleString()}
            </div>
          </div>
        </div>

        {officer.citations && officer.citations.length > 0 ? (
          <div className="space-y-2.5">
            {officer.citations.map((c: any) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-[#0c0e20] border border-[#1a1f3c] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-purple-300 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30">
                      {c.citationNumber}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Citoyen : {c.citizen ? `${c.citizen.firstName} ${c.citizen.lastName}` : "Inconnu"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === "Payée"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(c.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {c.location && <span>• Lieu : {c.location}</span>}
                  </div>

                  {c.items && c.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.items.map((item: any) => (
                        <span
                          key={item.id}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#131633] border border-[#21274d] text-slate-300"
                        >
                          {item.penalCodeItem?.code} : {item.penalCodeItem?.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono font-black text-amber-400">
                    ${c.totalFine?.toLocaleString()}
                  </div>
                  {c.totalJailTime > 0 && (
                    <div className="text-[10px] text-rose-400 font-bold">
                      {c.totalJailTime} min de garde à vue
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#070814] border border-[#161a33] space-y-1">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs text-slate-300 font-bold">Aucune contravention dressée</div>
            <p className="text-[11px] text-slate-500">
              Cet agent n&apos;a émis aucun procès-verbal d&apos;infraction pour le moment.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: ADD SERVICE WEAPON */}
      {showAddWeaponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0c0e1e] border border-cyan-500/40 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#181c3b]">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Déclarer une Arme de Service
                </h3>
              </div>
              <button
                onClick={() => setShowAddWeaponModal(false)}
                className="w-7 h-7 rounded-lg bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWeapon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Catégorie de l&apos;arme
                </label>
                <select
                  value={weaponCategory}
                  onChange={(e) => setWeaponCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Arme de poing">Arme de poing (Pistolet de service)</option>
                  <option value="Arme non létale">Arme non létale (Taser X26P)</option>
                  <option value="Fusil à pompe">Fusil à pompe (Remington 870)</option>
                  <option value="Fusil d'assaut">Fusil d&apos;assaut / Carabine (AR-15)</option>
                  <option value="Arme spéciale / Sniper">Arme spéciale / Fusil de précision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Modèle de l&apos;arme
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Glock 17, Taser X26P, Remington 870..."
                  value={weaponModel}
                  onChange={(e) => setWeaponModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Numéro de Série Officiel (Gravé sur l&apos;arme)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: LSPD-99214 ou GLK-44810"
                  value={weaponSerial}
                  onChange={(e) => setWeaponSerial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#181c3b]">
                <button
                  type="button"
                  onClick={() => setShowAddWeaponModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingWeapon || !weaponSerial.trim()}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingWeapon ? "Enregistrement..." : "Ajouter à ma dotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE & MATRICULE */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#0c0e1e] border border-purple-500/40 shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#181c3b]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Modifier Matricule & Coordonnées
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-lg bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Matricule (Badge)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 04"
                    value={matriculeInput}
                    onChange={(e) => setMatriculeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Téléphone In-Game
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 555-0188"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Prénom RP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Hugo"
                    value={firstNameInput}
                    onChange={(e) => setFirstNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nom RP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Derma"
                    value={lastNameInput}
                    onChange={(e) => setLastNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Lien URL de la Photo (Avatar)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#070814] border border-[#1e2344] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Nouveau pseudo :</span>
                <span className="font-mono font-black text-purple-300">
                  {matriculeInput.trim()} | {firstNameInput.trim()} {lastNameInput.trim()}
                </span>
              </div>

              <p className="text-[10px] text-slate-400">
                La validation synchronisera automatiquement le pseudo sur Discord et mettra à jour la fiche matricule.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#181c3b]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !matriculeInput.trim() || !firstNameInput.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingProfile ? "Enregistrement..." : "Enregistrer & Renommer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
