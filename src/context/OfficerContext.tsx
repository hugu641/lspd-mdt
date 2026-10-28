"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface OfficerBadge {
  id: string;
  course: {
    id: string;
    title: string;
    badgeName: string;
    badgeIcon: string;
    category: string;
  };
  awardedAt: string;
  awardedBy: string | null;
}

export interface Officer {
  id: string;
  badgeNumber: string;
  name: string;
  callsign: string;
  rank: string;
  department: string;
  avatarUrl: string | null;
  phone: string | null;
  status: string; // 10-8, 10-7, 10-6, 10-10
  unitType: string;
  isInstructor: boolean;
  isAdmin: boolean;
  badges?: OfficerBadge[];
}

interface OfficerContextType {
  currentOfficer: Officer | null;
  allOfficers: Officer[];
  setCurrentOfficer: (officer: Officer) => void;
  updateStatus: (status: string) => Promise<void>;
  updateUnitType: (unitType: string) => Promise<void>;
  refreshOfficers: () => Promise<void>;
  isLoading: boolean;
}

const OfficerContext = createContext<OfficerContextType | undefined>(undefined);

export function OfficerProvider({ children }: { children: React.ReactNode }) {
  const [currentOfficer, setCurrentOfficerState] = useState<Officer | null>(null);
  const [allOfficers, setAllOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOfficers = async () => {
    try {
      const res = await fetch("/api/officers");
      if (res.ok) {
        const data = await res.json();
        setAllOfficers(data);

        // Load saved officer or default to Chief
        const savedId = localStorage.getItem("lspd_active_officer_id");
        if (savedId) {
          const found = data.find((o: Officer) => o.id === savedId);
          if (found) {
            setCurrentOfficerState(found);
            return;
          }
        }
        if (data.length > 0 && !currentOfficer) {
          setCurrentOfficerState(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load officers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const setCurrentOfficer = (officer: Officer) => {
    setCurrentOfficerState(officer);
    localStorage.setItem("lspd_active_officer_id", officer.id);
  };

  const updateStatus = async (status: string) => {
    if (!currentOfficer) return;
    try {
      const res = await fetch(`/api/officers/${currentOfficer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentOfficerState((prev) => (prev ? { ...prev, status: updated.status } : null));
        setAllOfficers((prev) =>
          prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
        );
      }
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const updateUnitType = async (unitType: string) => {
    if (!currentOfficer) return;
    try {
      const res = await fetch(`/api/officers/${currentOfficer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitType }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentOfficerState((prev) => (prev ? { ...prev, unitType: updated.unitType } : null));
        setAllOfficers((prev) =>
          prev.map((o) => (o.id === updated.id ? { ...o, unitType: updated.unitType } : o))
        );
      }
    } catch (err) {
      console.error("Error updating unit", err);
    }
  };

  return (
    <OfficerContext.Provider
      value={{
        currentOfficer,
        allOfficers,
        setCurrentOfficer,
        updateStatus,
        updateUnitType,
        refreshOfficers: fetchOfficers,
        isLoading,
      }}
    >
      {children}
    </OfficerContext.Provider>
  );
}

export function useOfficer() {
  const context = useContext(OfficerContext);
  if (!context) {
    throw new Error("useOfficer must be used within an OfficerProvider");
  }
  return context;
}
