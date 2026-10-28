"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "@/context/OfficerContext";
import {
  Calculator,
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
} from "lucide-react";

interface PenalItem {
  id: string;
  code: string;
  title: string;
  category: string;
  fine: number;
  jailTime: number;
  secondarySanction: string | null;
  orderIndex: number;
}

export default function CalculatorPage() {
  const { currentOfficer } = useOfficer();
  const [penalCode, setPenalCode] = useState<PenalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitizenId, setSelectedCitizenId] = useState("");
  const [location, setLocation] = useState("Los Santos");
  const [notes, setNotes] = useState("");
  const [pleaDiscount, setPleaDiscount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const categories = ["Toutes", "Contraventions", "Délits", "Crimes", "Crimes fédéraux"];

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
    setPleaDiscount(0);
    setNotes("");
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

  const totalFine = Math.round(rawTotalFine * (1 - pleaDiscount / 100));
  const totalJail = Math.round(rawTotalJail * (1 - pleaDiscount / 100));
  const totalCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  // Collect secondary sanctions
  const activeSanctions = Object.entries(selectedItems)
    .map(([id]) => penalCode.find((p) => p.id === id))
    .filter((item): item is PenalItem => Boolean(item && item.secondarySanction))
    .map((item) => ({ code: item.code, sanction: item.secondarySanction }));

  // Filter penal items
  const filteredItems = penalCode.filter((item) => {
    const matchesCat = activeCategory === "Toutes" || item.category === activeCategory;
    const matchesQuery =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Submit Citation
  const handleSubmitCitation = async () => {
    if (!selectedCitizenId) {
      alert("Veuillez sélectionner un citoyen pour dresser le procès-verbal.");
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

      const res = await fetch("/api/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenId: selectedCitizenId,
          officerId: currentOfficer.id,
          location,
          notes: pleaDiscount > 0 ? `[Plaidoyer coupable: -${pleaDiscount}%] ${notes}` : notes,
          totalFine,
          totalJailTime: totalJail,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setSuccessMessage(`Contravention enregistrée avec succès sous le numéro ${created.citationNumber} !`);
        clearBasket();
        setSelectedCitizenId("");
        setMobileView("catalog");
        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        alert("Erreur lors de l'enregistrement de la contravention.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Code Pénal & Calculateur LSPD</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Calculateur de Peines & PV</h1>
          <p className="text-xs text-slate-300">
            Sélectionnez les infractions commises. Les amendes, temps de cellule et peines se calculent en direct.
          </p>
        </div>

        {Object.keys(selectedItems).length > 0 && (
          <button
            onClick={clearBasket}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 self-start sm:self-auto transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Réinitialiser la sélection</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in shadow-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible on mobile/tablet < lg) */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
        <button
          onClick={() => setMobileView("catalog")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileView === "catalog"
              ? "btn-theme-primary shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Infractions ({penalCode.length})</span>
        </button>

        <button
          onClick={() => setMobileView("ticket")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileView === "ticket"
              ? "btn-theme-primary shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Procès-Verbal ({totalCount})</span>
        </button>
      </div>

      {/* Main Grid: Articles Selection (Left) vs Summary / Ticket Receipt (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: Penal Code Catalogue (7 cols on desktop, responsive tab on mobile) */}
        <div className={`lg:col-span-7 space-y-3 sm:space-y-4 ${mobileView === "ticket" ? "hidden lg:block" : "block"}`}>
          {/* Filter Bar */}
          <div className="police-card p-2.5 sm:p-3 rounded-xl flex flex-col gap-2.5">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher (CP 100, Conduite, Vitesse...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-theme-primary font-medium"
              />
            </div>

            {/* Category Filter Pills (Scrollable horizontally) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "btn-theme-primary shadow-sm"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Penal Articles */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const selectedCount = selectedItems[item.id] || 0;
              const isSelected = selectedCount > 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-slate-900/90 border-theme-primary shadow-lg"
                      : "police-card border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] sm:text-xs font-black text-theme-primary px-1.5 py-0.5 rounded bg-theme-primary-light border border-theme-primary">
                          {item.code}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        {item.title}
                      </h3>

                      {item.secondarySanction && (
                        <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.secondarySanction}</span>
                        </div>
                      )}
                    </div>

                    {/* Price, Jail Time & Touch Counter */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-mono font-black text-amber-400">
                          ${item.fine.toLocaleString()}
                        </div>
                        {item.jailTime > 0 && (
                          <div className="text-[10px] sm:text-[11px] font-mono font-semibold text-red-400">
                            {item.jailTime} min
                          </div>
                        )}
                      </div>

                      {/* Touch-Friendly Add/Remove Buttons */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                        <button
                          onClick={() => decrementItem(item.id)}
                          disabled={!isSelected}
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>

                        <span className="w-6 text-center text-xs font-mono font-bold text-white">
                          {selectedCount}
                        </span>

                        <button
                          onClick={() => incrementItem(item.id)}
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-theme-primary hover:bg-theme-primary-light transition-all active:scale-95"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ticket Summary & Generation (5 cols on desktop, responsive tab on mobile) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileView === "catalog" ? "hidden lg:block" : "block"}`}>
          <div className="police-card p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-theme-primary" />
                <h2 className="text-base font-bold text-white">Procès-Verbal & Contravention</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {totalCount} infraction(s)
              </span>
            </div>

            {/* Citizen Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-theme-primary" />
                <span>Citoyen / Contrevenant *</span>
              </label>
              <select
                value={selectedCitizenId}
                onChange={(e) => setSelectedCitizenId(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs font-semibold text-white focus:outline-none focus:border-theme-primary"
              >
                <option value="">-- Sélectionner un citoyen --</option>
                {citizens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.job || "Civil"})
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-theme-primary" />
                <span>Lieu de l&apos;infraction</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Boulevard Del Perro, Pillbox..."
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white focus:outline-none focus:border-theme-primary font-medium"
              />
            </div>

            {/* Selected Infractions List inside Ticket */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Infractions Retenues
              </div>

              {Object.keys(selectedItems).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  Cliquez sur &quot;+&quot; sur un article pour l&apos;ajouter au calcul.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {Object.entries(selectedItems).map(([id, count]) => {
                    const item = penalCode.find((p) => p.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-white truncate">
                            <span className="font-mono text-theme-primary mr-1.5">{item.code}</span>
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Quantité : {count} × ${item.fine.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            ${(item.fine * count).toLocaleString()}
                          </span>
                          <button
                            onClick={() => removeItem(id)}
                            className="text-slate-500 hover:text-red-400 p-1"
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

            {/* Secondary Sanctions Alert Box if any */}
            {activeSanctions.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
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

            {/* Guilty Plea Discount Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Plaidoyer Coupable / Réduction</span>
                </span>
                <span className="text-[11px] font-mono text-theme-primary font-bold">
                  {pleaDiscount > 0 ? `-${pleaDiscount}% appliquée` : "Tarif standard"}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[0, 25, 50].map((disc) => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => setPleaDiscount(disc)}
                    className={`py-2 sm:py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      pleaDiscount === disc
                        ? "btn-theme-primary"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {disc === 0 ? "0% (Normal)" : `-${disc}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Notes & Circonstances de l&apos;interpellation
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Détails du contrôle, comportement du suspect..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white focus:outline-none focus:border-theme-primary font-medium"
              />
            </div>

            {/* Total Block */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Total Amende :</span>
                <span className="text-lg font-mono font-black text-amber-400">
                  ${totalFine.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Peine de Prison :</span>
                <span className="text-sm font-mono font-bold text-red-400">
                  {totalJail > 0 ? `${totalJail} minutes de cellule` : "Aucune peine"}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleSubmitCitation}
              disabled={submitting || Object.keys(selectedItems).length === 0 || !selectedCitizenId}
              className="w-full py-3.5 sm:py-3 rounded-xl btn-theme-primary text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submitting ? "Enregistrement en cours..." : "Dresser le Procès-Verbal (PV)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FLOATING MOBILE BOTTOM ACTION BAR (Sticky on Phone screens)
          ===================================================================== */}
      {mobileView === "catalog" && totalCount > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <div className="p-3 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
            <div>
              <div className="text-[11px] text-slate-400">
                {totalCount} infraction(s) • {totalJail > 0 ? `${totalJail} min` : "0 min"}
              </div>
              <div className="text-base font-mono font-black text-amber-400">
                ${totalFine.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => setMobileView("ticket")}
              className="px-4 py-2 rounded-xl btn-theme-primary text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-black/40"
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
