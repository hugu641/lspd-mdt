"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "../../context/OfficerContext";
import Link from "next/link";
import {
  Calculator,
  Loader2,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  DollarSign,
  FileCheck,
  Search,
  Percent,
  Receipt,
  ListOrdered,
  Phone,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  X,
  Check,
  Shield,
  Scale,
  Copy,
  Gavel,
  Siren,
  CheckSquare,
  Square,
  FileText,
  BadgeAlert,
  Info,
} from "lucide-react";

interface PenalItem {
  id: string;
  code: string;
  title: string;
  category: string;
  fine: number;
  jailTime: number;
  secondarySanction: string | null;
  description: string | null;
  section: string | null;
  orderIndex: number;
}

interface AiSuggestion {
  item: PenalItem;
  count: number;
  reason: string;
  checked: boolean;
}

export default function CalculatorPage() {
  const { currentOfficer } = useOfficer();
  const [penalCode, setPenalCode] = useState<PenalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("Tous");
  const [aiFacts, setAiFacts] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitizenId, setSelectedCitizenId] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [citizenFirstName, setCitizenFirstName] = useState("");
  const [citizenLastName, setCitizenLastName] = useState("");
  const [detectedCitizen, setDetectedCitizen] = useState<any | null>(null);
  const [matchReason, setMatchReason] = useState<string | null>(null);
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");

  const [location, setLocation] = useState("Los Santos");
  const [notes, setNotes] = useState("");
  const [probationModifier, setProbationModifier] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Prison & Miranda rights states
  const [manualPrisonChecked, setManualPrisonChecked] = useState<boolean | null>(null);
  const [mirandaNotified, setMirandaNotified] = useState(false);
  const [copiedMiranda, setCopiedMiranda] = useState(false);

  // Mobile View Toggle: "catalog" (infractions) vs "ticket" (recap)
  const [mobileView, setMobileView] = useState<"catalog" | "ticket">("catalog");

  useEffect(() => {
    async function loadData() {
      try {
        const [penalRes, citizensRes] = await Promise.all([
          fetch("/api/penal-code"),
          fetch("/api/citizens"),
        ]);
        const penalData = await penalRes.json();
        const citizensData = await citizensRes.json();
        setPenalCode(Array.isArray(penalData) ? penalData : []);
        setCitizens(Array.isArray(citizensData) ? citizensData : []);
      } catch (err) {
        console.error("Error loading data", err);
      }
    }
    loadData();
  }, []);

  // Pre-selection if URL contains ?citizenId=...
  useEffect(() => {
    if (typeof window !== "undefined" && citizens.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get("citizenId");
      if (cId) {
        const found = citizens.find((c) => c.id === cId);
        if (found) {
          selectCitizen(found, "Dossier citoyen sélectionné");
        }
      }
    }
  }, [citizens]);

  const selectCitizen = (c: any, reason = "Sélection manuelle") => {
    setDetectedCitizen(c);
    setSelectedCitizenId(c.id);
    setCitizenFirstName(c.firstName || "");
    setCitizenLastName(c.lastName || "");
    setCitizenPhone(c.phone || "");
    setMatchReason(reason);
    setShowDirectoryPicker(false);
  };

  const clearCitizenSelection = () => {
    setDetectedCitizen(null);
    setSelectedCitizenId("");
    setCitizenFirstName("");
    setCitizenLastName("");
    setCitizenPhone("");
    setMatchReason(null);
  };

  // Real-time Auto-Detection: Phone (primary identifier in this city) or Name
  useEffect(() => {
    const cleanPhone = citizenPhone.trim().toLowerCase();
    const cleanFirst = citizenFirstName.trim().toLowerCase();
    const cleanLast = citizenLastName.trim().toLowerCase();

    // 1. Check primary unique identifier: Phone number
    if (cleanPhone && cleanPhone !== "555-" && cleanPhone.length >= 3) {
      const match = citizens.find((c) => {
        const p = (c.phone || "").toLowerCase().trim();
        return (
          p &&
          (p === cleanPhone ||
            p.replace(/\D/g, "") === cleanPhone.replace(/\D/g, ""))
        );
      });

      if (match) {
        if (detectedCitizen?.id !== match.id) {
          setDetectedCitizen(match);
          setSelectedCitizenId(match.id);
          setMatchReason("Numéro de téléphone correspondant");
          if (!citizenFirstName.trim()) setCitizenFirstName(match.firstName);
          if (!citizenLastName.trim()) setCitizenLastName(match.lastName);
        }
        return;
      }
    }

    // 2. Fallback check: First Name + Last Name
    if (cleanFirst.length >= 2 && cleanLast.length >= 2) {
      const match = citizens.find(
        (c) =>
          c.firstName.toLowerCase().trim() === cleanFirst &&
          c.lastName.toLowerCase().trim() === cleanLast
      );

      if (match) {
        if (detectedCitizen?.id !== match.id) {
          setDetectedCitizen(match);
          setSelectedCitizenId(match.id);
          setMatchReason("Même Nom & Prénom détectés");
          if (!citizenPhone.trim() && match.phone) setCitizenPhone(match.phone);
        }
        return;
      }
    }

    // If fields no longer match the detected citizen, unlink
    if (detectedCitizen) {
      const cPhone = (detectedCitizen.phone || "").toLowerCase().trim();
      const cFirst = (detectedCitizen.firstName || "").toLowerCase().trim();
      const cLast = (detectedCitizen.lastName || "").toLowerCase().trim();

      const phoneOk =
        cleanPhone &&
        (cPhone === cleanPhone ||
          cPhone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, ""));
      const nameOk = cleanFirst === cFirst && cleanLast === cLast;

      if (!phoneOk && !nameOk) {
        setDetectedCitizen(null);
        setSelectedCitizenId("");
        setMatchReason(null);
      }
    }
  }, [citizenPhone, citizenFirstName, citizenLastName, citizens, detectedCitizen]);

  const categories = [
    { label: "Toutes", value: "Toutes", icon: "📋", color: "bg-purple-600 text-white" },
    { label: "Contraventions", value: "Contraventions", icon: "🟢", color: "bg-emerald-950 text-emerald-300 border-emerald-500/40" },
    { label: "Délits", value: "Délits", icon: "🟡", color: "bg-amber-950 text-amber-300 border-amber-500/40" },
    { label: "Crimes", value: "Crimes", icon: "🔴", color: "bg-rose-950 text-rose-300 border-rose-500/40" },
    { label: "Crimes fédéraux", value: "Crimes fédéraux", icon: "🟣", color: "bg-indigo-950 text-indigo-300 border-indigo-500/40" },
  ];

  // Quantity controllers
  const incrementItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const decrementItem = (id: string) => {
    setSelectedItems((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const clearBasket = () => {
    setSelectedItems({});
    setProbationModifier(0);
    setNotes("");
    setManualPrisonChecked(null);
    setMirandaNotified(false);
  };

  // Calculations
  const rawTotalFine = Object.entries(selectedItems).reduce((sum, [id, count]) => {
    const item = penalCode.find((p) => p.id === id);
    return sum + (item ? item.fine * count : 0);
  }, 0);

  const rawTotalJail = Object.entries(selectedItems).reduce((sum, [id, count]) => {
    const item = penalCode.find((p) => p.id === id);
    return sum + (item ? item.jailTime * count : 0);
  }, 0);

  const modifierMultiplier = 1 + probationModifier / 100;
  const totalFine = Math.max(0, Math.round(rawTotalFine * modifierMultiplier));
  const totalJail = Math.max(0, Math.round(rawTotalJail * modifierMultiplier));
  const totalCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  // Check if any selected item is crime or has jail time
  const hasSelectedCrimeOrJail = Object.entries(selectedItems).some(([id, count]) => {
    if (count <= 0) return false;
    const item = penalCode.find((p) => p.id === id);
    if (!item) return false;
    return (
      item.jailTime > 0 ||
      item.category === "Crimes" ||
      item.category === "Crimes fédéraux"
    );
  });

  // Effective Prison Active: auto-checked if there is jail time or crime, or overridden by manual toggle
  const isPrisonActive =
    manualPrisonChecked !== null ? manualPrisonChecked : hasSelectedCrimeOrJail;

  // Generate dynamic Miranda rights text with the suspect's name
  const getMirandaText = () => {
    let civilTitle = "Madame/Monsieur";
    if (detectedCitizen) {
      if (detectedCitizen.gender === "F") {
        civilTitle = detectedCitizen.lastName ? `Madame ${detectedCitizen.lastName}` : "Madame";
      } else if (detectedCitizen.gender === "M") {
        civilTitle = detectedCitizen.lastName ? `Monsieur ${detectedCitizen.lastName}` : "Monsieur";
      } else if (detectedCitizen.lastName) {
        civilTitle = `Madame/Monsieur ${detectedCitizen.lastName}`;
      }
    } else if (citizenLastName.trim()) {
      civilTitle = `Madame/Monsieur ${citizenLastName.trim()}`;
    } else if (citizenFirstName.trim()) {
      civilTitle = `Madame/Monsieur ${citizenFirstName.trim()}`;
    }

    return `${civilTitle}, vous êtes placé en état d'arrestation par le Los Santos Police Department, durant votre garde à vue, vous avez le droit de garder le silence, si vous renoncez à ce droit, tout ce que vous direz pourra être et sera utilisé contre vous devant une cour de justice. Vous avez le droit à un avocat et d’avoir un avocat présent lors de l’interrogatoire. Si vous n’en avez pas les moyens, un avocat vous sera fourni gratuitement. Vous avez également droit à des soins médicaux et à une visite médicale au poste de police. Durant chaque interrogatoire, et durant toute votre garde à vue, vous pourrez décider à n’importe quel moment d'exercer ces droits, de ne répondre à aucune question ou de ne faire aucune déposition. Avez-vous compris les droits que je viens de vous lire ? En ayant ces droits à l’esprit, voulez-vous utiliser l’un de ces droits ?`;
  };

  const handleCopyMiranda = () => {
    navigator.clipboard.writeText(getMirandaText());
    setCopiedMiranda(true);
    setTimeout(() => setCopiedMiranda(false), 2500);
  };

  const handleInsertMirandaIntoNotes = () => {
    const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const noteLine = `[⚖️ DROITS MIRANDA NOTIFIÉS AU SUSPECT À ${timeStr}]`;
    if (!notes.includes("[⚖️ DROITS MIRANDA")) {
      setNotes((prev) => (prev ? `${prev}\n${noteLine}` : noteLine));
    }
    setMirandaNotified(true);
  };

  // Collect secondary sanctions
  const activeSanctions = Object.entries(selectedItems)
    .map(([id]) => penalCode.find((p) => p.id === id))
    .filter((item): item is PenalItem => Boolean(item && item.secondarySanction))
    .map((item) => ({ code: item.code, sanction: item.secondarySanction }));

  // Filter penal items
  const sections = Array.from(new Set(penalCode.map((p) => p.section).filter(Boolean))) as string[];

  const filteredItems = penalCode.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesCat = activeCategory === "Toutes" || item.category === activeCategory;
    const matchesSection = activeSection === "Tous" || item.section === activeSection;
    const matchesQuery =
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q);
    return matchesCat && matchesSection && matchesQuery;
  });

  // AI legal assistant (Groq): suggests articles from the facts, agent validates them
  const handleAnalyzeFacts = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSuggestions(null);
    try {
      const res = await fetch("/api/penal-code/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts: aiFacts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Erreur lors de l'analyse.");
        return;
      }
      setAiSuggestions(
        (data.suggestions || []).map((s: Omit<AiSuggestion, "checked">) => ({ ...s, checked: true }))
      );
    } catch {
      setAiError("Impossible de contacter l'assistant IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!aiSuggestions) return;
    setSelectedItems((prev) => {
      const next = { ...prev };
      for (const s of aiSuggestions) {
        if (s.checked) next[s.item.id] = (next[s.item.id] || 0) + s.count;
      }
      return next;
    });
    if (!notes.trim()) setNotes(`Faits constatés : ${aiFacts.trim()}`);
    setAiSuggestions(null);
    setAiFacts("");
  };

  // Submit Citation (Procès-Verbal)
  const handleSubmitCitation = async () => {
    const hasCitizen =
      selectedCitizenId ||
      (citizenFirstName.trim() && citizenLastName.trim()) ||
      citizenPhone.trim();

    if (!hasCitizen) {
      alert("Veuillez renseigner le nom, prénom ou numéro de téléphone du citoyen pour dresser le procès-verbal.");
      return;
    }
    if (Object.keys(selectedItems).length === 0) {
      alert("Veuillez sélectionner au moins une infraction.");
      return;
    }
    if (!currentOfficer) {
      alert("Aucun officier actif connecté.");
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = Object.entries(selectedItems).map(([id, count]) => {
        const item = penalCode.find((p) => p.id === id)!;
        return {
          penalCodeItemId: item.id,
          count,
          fine: item.fine * count,
          jailTime: item.jailTime * count,
        };
      });

      let finalNotes = notes.trim();
      if (probationModifier > 0) {
        finalNotes = `[Probation / Circonstance aggravante: +${probationModifier}%] ${finalNotes}`;
      } else if (probationModifier < 0) {
        finalNotes = `[Plaidoyer coupable / Coopération: ${probationModifier}%] ${finalNotes}`;
      }
      if (isPrisonActive && mirandaNotified && !finalNotes.includes("DROITS MIRANDA")) {
        finalNotes = `[⚖️ Droits Miranda dûment notifiés et compris] ${finalNotes}`;
      }

      const res = await fetch("/api/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenId: selectedCitizenId || undefined,
          citizen: !selectedCitizenId
            ? {
                firstName: citizenFirstName.trim() || "Inconnu",
                lastName: citizenLastName.trim() || "Inconnu",
                phone: citizenPhone.trim() || null,
              }
            : undefined,
          officerId: currentOfficer.id,
          location,
          notes: finalNotes || null,
          totalFine,
          totalJailTime: totalJail,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setSuccessMessage(`Procès-Verbal enregistré avec succès sous le n° ${created.citationNumber} !`);
        clearBasket();
        clearCitizenSelection();
        setMobileView("catalog");

        // Refresh citizens list in background
        try {
          const citRes = await fetch("/api/citizens");
          const citData = await citRes.json();
          if (Array.isArray(citData)) setCitizens(citData);
        } catch (_) {}

        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Erreur : ${errData.error || "Impossible d'enregistrer le procès-verbal."}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erreur : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8 max-w-7xl mx-auto">
      {/* =====================================================================
          TOP HEADER & STATS BAR
          ===================================================================== */}
      <div className="p-5 rounded-3xl bg-[#090b17] border border-[#1a1f3c] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-900/40">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-mono uppercase">
                CODE PÉNAL & CALCULATEUR LSPD
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {penalCode.length} infractions répertoriées
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Rédaction de Procès-Verbal & Calculateur de Peines
            </h1>
            <p className="text-xs text-slate-300">
              Sélectionnez les infractions du code pénal, identifiez le citoyen et générez le procès-verbal officiel.
            </p>
          </div>
        </div>

        {/* Live Top Summary Counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#0d1024] border border-[#222954] text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Infractions</div>
            <div className="text-sm font-black text-purple-300 font-mono">
              {totalCount} retenue(s)
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#0d1024] border border-amber-500/30 text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Amende Totale</div>
            <div className="text-sm font-black text-amber-400 font-mono">
              ${totalFine.toLocaleString()}
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-left ${
              totalJail > 0
                ? "bg-red-950/60 border-red-500/40 animate-pulse"
                : "bg-[#0d1024] border-[#222954]"
            }`}
          >
            <div className="text-[10px] text-slate-400 font-bold uppercase">Temps de Prison</div>
            <div className={`text-sm font-black font-mono ${totalJail > 0 ? "text-red-400" : "text-slate-400"}`}>
              {totalJail > 0 ? `${totalJail} min` : "0 min"}
            </div>
          </div>

          {totalCount > 0 && (
            <button
              onClick={clearBasket}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Vider la sélection"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl bg-[#090b17] border border-[#1b2146]">
        <button
          onClick={() => setMobileView("catalog")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mobileView === "catalog"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Catalogue Infractions ({filteredItems.length})</span>
        </button>

        <button
          onClick={() => setMobileView("ticket")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mobileView === "ticket"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Procès-Verbal ({totalCount})</span>
        </button>
      </div>

      {/* =====================================================================
          MAIN SPLIT VIEW: CATALOGUE (LEFT) & PROCÈS-VERBAL (RIGHT)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===================================================================
            LEFT COLUMN: CATALOGUE DU CODE PÉNAL (7 COLS)
            =================================================================== */}
        <div
          className={`lg:col-span-7 space-y-3.5 ${
            mobileView === "ticket" ? "hidden lg:block" : "block"
          }`}
        >
          {/* AI Legal Assistant (Groq) */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-[#090b17] border border-purple-500/30 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Assistant juridique IA</span>
            </div>
            <textarea
              rows={3}
              placeholder="Décrivez les faits constatés. Ex : Individu contrôlé avec une arme illégale sur lui, sans autorisation de port."
              value={aiFacts}
              onChange={(e) => setAiFacts(e.target.value)}
              maxLength={3000}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#070814] border border-[#21274d] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-y"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                L&apos;IA propose, l&apos;agent valide. Montants et peines issus du code pénal officiel.
              </span>
              <button
                type="button"
                onClick={handleAnalyzeFacts}
                disabled={aiLoading || aiFacts.trim().length < 5}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none transition-all flex-shrink-0"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{aiLoading ? "Analyse..." : "Analyser les faits"}</span>
              </button>
            </div>

            {aiError && (
              <div className="text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {aiError}
              </div>
            )}

            {aiSuggestions && (
              <div className="space-y-2">
                {aiSuggestions.length === 0 ? (
                  <div className="text-xs text-slate-400">Aucune infraction identifiée. Précisez les faits.</div>
                ) : (
                  aiSuggestions.map((s, idx) => (
                    <label
                      key={s.item.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        s.checked ? "bg-purple-950/40 border-purple-500/50" : "bg-[#070814] border-[#1f254e] opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={s.checked}
                        onChange={() =>
                          setAiSuggestions((prev) =>
                            prev ? prev.map((p, i) => (i === idx ? { ...p, checked: !p.checked } : p)) : prev
                          )
                        }
                        className="mt-0.5 accent-purple-500"
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-black text-purple-300">{s.item.code}</span>
                          <span className="text-xs font-bold text-white">{s.item.title}</span>
                          {s.count > 1 && <span className="text-[10px] font-mono text-purple-300">x{s.count}</span>}
                        </div>
                        <div className="text-[11px] font-mono text-amber-400">
                          ${s.item.fine.toLocaleString()}
                          {s.item.jailTime > 0 && <span className="text-red-300"> · {s.item.jailTime} min</span>}
                          {s.item.secondarySanction && (
                            <span className="text-amber-300 font-sans"> · {s.item.secondarySanction}</span>
                          )}
                        </div>
                        {s.reason && <div className="text-[11px] text-slate-400">{s.reason}</div>}
                      </div>
                    </label>
                  ))
                )}
                {aiSuggestions.some((s) => s.checked) && (
                  <button
                    type="button"
                    onClick={handleApplySuggestions}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Ajouter la sélection au procès-verbal</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-[#090b17] border border-[#1a1f3c] shadow-lg space-y-3">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par code (CP 100), mot-clé ou description (Vitesse, Arme, Refus...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#070814] border border-[#21274d] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills with Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => {
                const countInCat =
                  cat.value === "Toutes"
                    ? penalCode.length
                    : penalCode.filter((p) => p.category === cat.value).length;
                const isSelected = activeCategory === cat.value;

                return (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                        : "bg-[#0f1228] text-slate-400 hover:text-white hover:bg-[#171b3c] border border-[#1f254e]"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {countInCat}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Thematic section filter */}
            {sections.length > 0 && (
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                aria-label="Filtrer par thème"
                className="w-full px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Tous">Tous les thèmes</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec} ({penalCode.filter((p) => p.section === sec).length})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* List of Penal Articles */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const selectedCount = selectedItems[item.id] || 0;
              const isSelected = selectedCount > 0;

              const isCrime = item.category === "Crimes" || item.category === "Crimes fédéraux";
              const isDelit = item.category === "Délits";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-[#0d1025] border-purple-500 shadow-xl shadow-purple-950/30 ring-1 ring-purple-500/40"
                      : "bg-[#090b17] border-[#181d3d] hover:border-purple-500/40 hover:bg-[#0b0e20]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Item Information */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-purple-950/90 text-purple-300 border border-purple-500/40">
                          {item.code}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            item.category === "Contraventions"
                              ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
                              : isDelit
                              ? "bg-amber-950/70 text-amber-300 border-amber-500/30"
                              : isCrime
                              ? "bg-rose-950/70 text-rose-300 border-rose-500/30"
                              : "bg-purple-950/70 text-purple-300 border-purple-500/30"
                          }`}
                        >
                          {item.category}
                        </span>

                        {item.jailTime > 0 && (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-red-400" />
                            <span>{item.jailTime} min de cellule</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[11px] text-slate-400 leading-snug">{item.description}</p>
                      )}

                      {item.section && (
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.section}</div>
                      )}

                      {item.secondarySanction && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400" />
                          <span className="truncate">{item.secondarySanction}</span>
                        </div>
                      )}
                    </div>

                    {/* Fine Amount & Quantity Controller */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-mono font-black text-amber-400 leading-none">
                          ${item.fine.toLocaleString()}
                        </div>
                        {selectedCount > 0 && (
                          <div className="text-[10px] font-mono text-purple-300 font-semibold mt-0.5">
                            Total : ${(item.fine * selectedCount).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Touch-Friendly Add/Remove Buttons */}
                      <div className="flex items-center gap-1.5 bg-[#060814] border border-[#222954] rounded-xl p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => decrementItem(item.id)}
                          disabled={!isSelected}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a2046] disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
                          title="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-7 text-center text-xs font-mono font-black text-white">
                          {selectedCount}
                        </span>

                        <button
                          type="button"
                          onClick={() => incrementItem(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white transition-all active:scale-95 shadow-md shadow-purple-900/40"
                          title="Ajouter au procès-verbal"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="p-12 text-center rounded-3xl bg-[#090b17] border border-[#1a1f3c] space-y-2">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-bold text-white">Aucune infraction trouvée</div>
                <div className="text-xs text-slate-400">
                  Essayez d&apos;ajuster vos mots-clés ou réinitialisez le filtre de catégorie.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN: DOSSIER DU PROCÈS-VERBAL OFFICIEL (5 COLS)
            =================================================================== */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileView === "catalog" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="p-5 sm:p-6 rounded-3xl bg-[#090b17] border border-[#1a1f3c] shadow-2xl space-y-5">
            {/* Ticket Official Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1a1f3c]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    POLICE REPORT • LSPD
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                    Procès-Verbal d&apos;Infraction
                  </h2>
                </div>
              </div>

              <span className="text-xs font-mono font-black text-purple-300 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/30">
                {totalCount} retenue(s)
              </span>
            </div>

            {/* =================================================================
                SECTION 1: IDENTIFICATION DU CITOYEN & DÉTECTION EN DIRECT
                ================================================================= */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#070916] border border-[#1a1f3c]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    1. Citoyen / Contrevenant *
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDirectoryPicker(!showDirectoryPicker)}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-all"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>{showDirectoryPicker ? "Masquer" : "Choisir dans l'annuaire"}</span>
                </button>
              </div>

              {/* Directory Quick Picker Dropdown */}
              {showDirectoryPicker && (
                <div className="p-3 rounded-2xl bg-[#0c0f24] border border-[#232b5e] space-y-2 animate-fade-in shadow-xl">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filtrer par nom ou téléphone..."
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#070916] border border-[#1a1f3c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {citizens
                      .filter((c) => {
                        const q = directorySearch.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                          (c.phone && c.phone.includes(q))
                        );
                      })
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCitizen(c, "Sélectionné depuis l'annuaire")}
                          className="w-full px-2.5 py-2 rounded-xl bg-[#090b17] hover:bg-[#161a38] text-left text-xs text-white flex items-center justify-between transition-all"
                        >
                          <span className="font-bold">
                            {c.firstName} {c.lastName}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-400">
                            {c.phone || "Sans téléphone"}
                          </span>
                        </button>
                      ))}
                    {citizens.length === 0 && (
                      <div className="text-[11px] text-slate-500 text-center py-2">
                        Aucun citoyen enregistré pour le moment.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input Fields: Phone + Nom & Prénom */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Numéro de Téléphone</span>
                  </label>
                  <input
                    type="text"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="ex: 555-0188"
                    className="w-full px-3 py-2 rounded-xl bg-[#050711] border border-[#21274d] text-xs font-mono font-bold text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={citizenFirstName}
                      onChange={(e) => setCitizenFirstName(e.target.value)}
                      placeholder="ex: Hugo"
                      className="w-full px-3 py-2 rounded-xl bg-[#050711] border border-[#21274d] text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nom de Famille
                    </label>
                    <input
                      type="text"
                      value={citizenLastName}
                      onChange={(e) => setCitizenLastName(e.target.value)}
                      placeholder="ex: Derma"
                      className="w-full px-3 py-2 rounded-xl bg-[#050711] border border-[#21274d] text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* AUTOMATIC IDENTITY CARD DISPLAY WHEN CITIZEN DETECTED */}
              {detectedCitizen && (
                <div className="p-3.5 rounded-2xl bg-[#080b18] border-2 border-emerald-500/60 shadow-xl space-y-3 relative overflow-hidden animate-fade-in">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header: Citizen Found & Match reason */}
                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex-shrink-0 shadow-md">
                        <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-950 flex items-center justify-center text-white font-black text-sm">
                          {detectedCitizen.photoUrl ? (
                            <img
                              src={detectedCitizen.photoUrl}
                              alt={detectedCitizen.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {detectedCitizen.firstName?.[0]}
                              {detectedCitizen.lastName?.[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 uppercase flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Fiche Citoyen Identifiée</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-0.5">
                          {detectedCitizen.firstName} {detectedCitizen.lastName}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearCitizenSelection}
                      title="Dissocier ce citoyen"
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Warrant Alert Banner if any! */}
                  {detectedCitizen.warrants && detectedCitizen.warrants.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold flex items-center gap-2 animate-pulse">
                      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <div className="leading-tight">
                        <span className="uppercase tracking-wider font-black">
                          🚨 Mandat d&apos;arrêt actif :
                        </span>{" "}
                        {detectedCitizen.warrants[0]?.reason || "Individu recherché par les forces de l'ordre !"}
                      </div>
                    </div>
                  )}

                  {/* Citizen Identity Data Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Téléphone</div>
                      <div className="font-mono font-bold text-emerald-300 truncate">
                        {detectedCitizen.phone || "Non renseigné"}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Profession</div>
                      <div className="font-bold text-white truncate">
                        {detectedCitizen.job || "Sans emploi"}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Permis de conduire</div>
                      <div className="font-bold">
                        <span
                          className={
                            detectedCitizen.driverLicense === "Valide"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {detectedCitizen.driverLicense || "Valide"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Antécédents</div>
                      <div className="font-mono font-bold text-amber-300">
                        {detectedCitizen._count?.citations ?? 0} PV au casier
                      </div>
                    </div>
                  </div>

                  {/* Link to Full Citizen Profile */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 italic">
                      {matchReason}
                    </span>
                    <Link
                      href={`/citizens/${detectedCitizen.id}`}
                      target="_blank"
                      className="text-[11px] font-bold text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Voir le dossier</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* NOTICE WHEN NO CITIZEN MATCHED YET BUT FIELDS TYPED */}
              {!detectedCitizen && (citizenPhone || citizenFirstName || citizenLastName) && (
                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Nouveau citoyen non répertorié</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Aucune fiche existante trouvée. Ce citoyen sera automatiquement créé dans le Fichier Central avec le numéro{" "}
                    <strong className="text-emerald-300 font-mono">{citizenPhone.trim() || "N/A"}</strong> et le nom{" "}
                    <strong className="text-white">
                      {citizenFirstName.trim() || "Prénom"} {citizenLastName.trim() || "Nom"}
                    </strong>{" "}
                    dès que vous validerez ce procès-verbal.
                  </p>
                </div>
              )}
            </div>

            {/* =================================================================
                SECTION 2: INFRACTIONS RETENUES DANS LE PV
                ================================================================= */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-[#070916] border border-[#1a1f3c]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-purple-400" />
                  <span>2. Infractions Retenues</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Object.keys(selectedItems).length} article(s)
                </span>
              </div>

              {Object.keys(selectedItems).length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 border border-dashed border-[#1f254e] rounded-xl px-4">
                  Cliquez sur &quot;+&quot; sur une infraction dans le catalogue à gauche pour l&apos;ajouter au procès-verbal.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {Object.entries(selectedItems).map(([id, count]) => {
                    const item = penalCode.find((p) => p.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0f24] border border-[#1e254e] text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            <span className="font-mono text-purple-300">{item.code}</span>
                            <span className="truncate">{item.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Qté : {count} × ${item.fine.toLocaleString()}</span>
                            {item.jailTime > 0 && (
                              <span className="text-red-400 font-mono">
                                • {item.jailTime * count} min prison
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            ${(item.fine * count).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(id)}
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                            title="Retirer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =================================================================
                SECTION 3: PEINE DE PRISON & DROITS MIRANDA (USER REQUIREMENT)
                ================================================================= */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#070916] border border-[#1a1f3c]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. Détention & Droits Miranda</span>
                </span>
                {totalJail > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40 font-black animate-pulse">
                    ⏱ {totalJail} min cellule
                  </span>
                )}
              </div>

              {/* Case à cocher Prison / Détention */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#0b0e22] border border-[#202754] hover:border-purple-500/50 cursor-pointer transition-all group">
                <input
                  type="checkbox"
                  checked={isPrisonActive}
                  onChange={(e) => setManualPrisonChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-[#070916]"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                    <Siren className="w-3.5 h-3.5 text-red-400" />
                    <span>Placement en détention / Prison (Garde à vue & Cellule)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Cochez cette case pour activer la procédure d&apos;arrestation formelle et la notification obligatoire des droits Miranda.
                  </div>
                </div>
              </label>

              {/* BLOC DES DROITS MIRANDA OFFICIELS QUAND IL Y A DE LA PRISON */}
              {isPrisonActive && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#121633] to-[#0a0d20] border-2 border-amber-500/60 shadow-xl space-y-3 relative overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Droits Miranda • Procédure d&apos;Arrestation LSPD
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyMiranda}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      title="Copier le texte complet des droits Miranda"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedMiranda ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>

                  <p className="text-xs text-amber-100/90 leading-relaxed font-serif italic bg-[#060814]/70 p-3 rounded-xl border border-amber-500/20 select-all">
                    &ldquo;{getMirandaText()}&rdquo;
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mirandaNotified}
                        onChange={(e) => setMirandaNotified(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-[#070916]"
                      />
                      <span>Droits Miranda lus et compris par le suspect</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleInsertMirandaIntoNotes}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                    >
                      <span>Insérer au rapport</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================================
                SECTION 4: SANCTIONS ET PROBATION
                ================================================================= */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#070916] border border-[#1a1f3c]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>4. Sanctions et probation</span>
              </span>

              {/* Secondary Sanctions Alert Box if any */}
              {activeSanctions.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Sanctions Complémentaires Obligatoires</span>
                  </div>
                  <ul className="text-xs text-amber-200/90 space-y-1 list-disc list-inside">
                    {activeSanctions.map((s, idx) => (
                      <li key={idx}>
                        <span className="font-mono font-bold">{s.code}</span> : {s.sanction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sanctions & Probation Modifier Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sanctions et probation</span>
                  </span>
                  <span className={`text-[11px] font-mono font-bold ${
                    probationModifier > 0
                      ? "text-rose-400"
                      : probationModifier < 0
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }`}>
                    {probationModifier > 0
                      ? `+${probationModifier}% (Majoration / Probation)`
                      : probationModifier < 0
                      ? `${probationModifier}% (Plaidoyer coupable)`
                      : "Peine standard (0%)"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "0", sub: "Standard" },
                    { value: 25, label: "+ 25", sub: "Probation" },
                    { value: -25, label: "- 25", sub: "Plaidoyer" },
                  ].map((opt) => {
                    const isSelected = probationModifier === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProbationModifier(opt.value)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center border ${
                          isSelected
                            ? opt.value === 25
                              ? "bg-rose-950/80 text-rose-200 border-rose-500 shadow-md shadow-rose-950/50"
                              : opt.value === -25
                              ? "bg-emerald-950/80 text-emerald-200 border-emerald-500 shadow-md shadow-emerald-950/50"
                              : "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40"
                            : "bg-[#0c0f24] text-slate-400 border-[#1f2650] hover:bg-[#15193d] hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-black font-mono">{opt.label}</span>
                        <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* =================================================================
                SECTION 5: LIEU & CIRCONSTANCES DE L'INTERPELLATION
                ================================================================= */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#070916] border border-[#1a1f3c]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>5. Lieu & Notes d&apos;Interpellation</span>
              </span>

              {/* Location Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Lieu du contrôle / infraction
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Boulevard Del Perro, Vinewood..."
                  className="w-full px-3 py-2 rounded-xl bg-[#050711] border border-[#21274d] text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Circonstances & Observations
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Comportement du suspect, aveux, saisies matérielles..."
                  className="w-full px-3 py-2 rounded-xl bg-[#050711] border border-[#21274d] text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            {/* =================================================================
                SECTION 6: TOTAUX & VALIDATION OFFICIELLE
                ================================================================= */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0c0f24] to-[#070916] border border-[#21274d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Amende</div>
                  <div className="text-2xl font-mono font-black text-amber-400">
                    ${totalFine.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Peine Cellule</div>
                  <div className={`text-base font-mono font-black ${totalJail > 0 ? "text-red-400" : "text-slate-400"}`}>
                    {totalJail > 0 ? `${totalJail} minutes` : "Aucune"}
                  </div>
                </div>
              </div>

              {/* Officier Signataire Info */}
              {currentOfficer && (
                <div className="text-[10px] text-slate-400 border-t border-[#181d3d] pt-2 flex items-center justify-between">
                  <span>Officier : <strong>{currentOfficer.name}</strong></span>
                  <span className="font-mono">#{currentOfficer.badgeNumber} • {currentOfficer.rank}</span>
                </div>
              )}

              {/* Bouton de soumission du Procès-Verbal */}
              <button
                type="button"
                onClick={handleSubmitCitation}
                disabled={submitting || totalCount === 0 || (!selectedCitizenId && !citizenPhone.trim() && !citizenFirstName.trim())}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-purple-900/40 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>
                  {submitting
                    ? "Enregistrement en cours..."
                    : `Dresser le Procès-Verbal (${totalCount} infraction${totalCount > 1 ? "s" : ""})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FLOATING MOBILE BOTTOM ACTION BAR (Sticky on small screens)
          ===================================================================== */}
      {mobileView === "catalog" && totalCount > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <div className="p-3.5 rounded-2xl bg-[#090b17]/95 border border-[#21274d] shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
            <div>
              <div className="text-[11px] text-slate-400">
                {totalCount} infraction(s) • {totalJail > 0 ? `${totalJail} min` : "0 min"}
              </div>
              <div className="text-lg font-mono font-black text-amber-400">
                ${totalFine.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => setMobileView("ticket")}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-900/50"
            >
              <Receipt className="w-4 h-4" />
              <span>Voir le PV ({totalCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
