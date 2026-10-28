"use client";

import React, { useState, useEffect } from "react";
import { useOfficer } from "@/context/OfficerContext";
import {
  GraduationCap,
  Calendar,
  Award,
  Plus,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Zap,
  Plane,
  ShieldAlert,
  Dog,
  BookOpen,
} from "lucide-react";

export default function TrainingsPage() {
  const { currentOfficer, allOfficers, refreshOfficers } = useOfficer();
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"planning" | "catalogue" | "matrice">("planning");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "Conduite",
    badgeName: "",
    badgeIcon: "Award",
    prerequisiteRank: "Rookie",
  });

  const [sessionForm, setSessionForm] = useState({
    courseId: "",
    scheduledAt: "",
    location: "Aérodrome de Sandy Shores",
    maxSeats: 4,
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        fetch("/api/trainings/courses"),
        fetch("/api/trainings/sessions"),
      ]);
      const coursesData = await coursesRes.json();
      const sessionsData = await sessionsRes.json();
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Register current officer
  const handleRegister = async (sessionId: string) => {
    if (!currentOfficer) {
      alert("Veuillez sélectionner un agent connecté.");
      return;
    }
    try {
      const res = await fetch("/api/trainings/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          officerId: currentOfficer.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || "Erreur lors de l'inscription.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Instructor validation
  const handleEvaluate = async (registrationId: string, status: string) => {
    try {
      const res = await fetch("/api/trainings/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          status,
          evaluatedBy: currentOfficer ? `${currentOfficer.rank} ${currentOfficer.name}` : "Instructeur",
        }),
      });
      if (res.ok) {
        fetchData();
        refreshOfficers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/trainings/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...courseForm,
          creatorId: currentOfficer?.id,
        }),
      });
      if (res.ok) {
        setShowCourseModal(false);
        setCourseForm({
          title: "",
          description: "",
          category: "Conduite",
          badgeName: "",
          badgeIcon: "Award",
          prerequisiteRank: "Rookie",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) return;
    try {
      const res = await fetch("/api/trainings/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sessionForm,
          instructorId: currentOfficer.id,
        }),
      });
      if (res.ok) {
        setShowSessionModal(false);
        setSessionForm({
          courseId: "",
          scheduledAt: "",
          location: "Aérodrome de Sandy Shores",
          maxSeats: 4,
          notes: "",
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap": return <Zap className="w-4 h-4 text-amber-400" />;
      case "Plane": return <Plane className="w-4 h-4 text-sky-400" />;
      case "ShieldAlert": return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case "Dog": return <Dog className="w-4 h-4 text-emerald-400" />;
      default: return <Award className="w-4 h-4 text-theme-primary" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Académie de Police LSPD • Formations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">Plannings & Certifications</h1>
          <p className="text-xs text-slate-300">
            Inscrivez-vous aux sessions d&apos;entraînement. La validation par les instructeurs attribue directement les badges de qualification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          {currentOfficer?.isInstructor && (
            <>
              <button
                onClick={() => setShowCourseModal(true)}
                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Créer Formation</span>
              </button>
              <button
                onClick={() => setShowSessionModal(true)}
                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl btn-theme-primary text-xs font-bold shadow-lg transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Planifier Session</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Officer's Own Badges Showcase */}
      {currentOfficer && (
        <div className="police-card p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-theme-primary-light border border-theme-primary flex items-center justify-center text-theme-primary flex-shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">Vos Habilitations</div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {currentOfficer.name} • {currentOfficer.rank}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {!currentOfficer.badges || currentOfficer.badges.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                Aucune certification validée. Inscrivez-vous à une session ci-dessous !
              </span>
            ) : (
              currentOfficer.badges.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-primary-light border border-theme-primary text-theme-primary text-[11px] font-bold shadow-sm"
                >
                  {getBadgeIcon(b.course.badgeIcon)}
                  <span>{b.course.badgeName}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tabs (Scrollable on small screens) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("planning")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "planning"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Planning ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("catalogue")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "catalogue"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catalogue ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("matrice")}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "matrice"
              ? "btn-theme-primary shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Matrice des Habilitations</span>
        </button>
      </div>

      {/* Planning Tab */}
      {activeTab === "planning" && (
        <div className="space-y-3 sm:space-y-4">
          {sessions.length === 0 ? (
            <div className="police-card p-12 text-center text-xs text-slate-400">
              Aucune session de formation planifiée pour le moment.
            </div>
          ) : (
            sessions.map((sess) => {
              const isRegistered = sess.registrations?.some((r: any) => r.officerId === currentOfficer?.id);
              const seatsLeft = sess.maxSeats - (sess.registrations?.length || 0);

              return (
                <div
                  key={sess.id}
                  className="police-card p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 space-y-3 sm:space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] sm:text-xs font-bold text-theme-primary px-2 py-0.5 rounded bg-theme-primary-light border border-theme-primary">
                          {sess.course?.category}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-400">
                          Instructeur : {sess.instructor?.rank} {sess.instructor?.name}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">{sess.course?.title}</h3>
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(sess.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{sess.location}</span>
                        </div>
                        <span>•</span>
                        <div className="text-xs font-bold text-slate-300">
                          Places : <span className={seatsLeft > 0 ? "text-emerald-400" : "text-red-400"}>{sess.registrations?.length || 0} / {sess.maxSeats}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1 sm:pt-0">
                      {isRegistered ? (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Vous êtes inscrit</span>
                        </div>
                      ) : seatsLeft > 0 ? (
                        <button
                          onClick={() => handleRegister(sess.id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl btn-theme-primary text-xs font-bold shadow-md transition-all text-center"
                        >
                          S&apos;inscrire à la session
                        </button>
                      ) : (
                        <span className="block text-center px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
                          Session complète
                        </span>
                      )}
                    </div>
                  </div>

                  {sess.notes && (
                    <div className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      Consignes : {sess.notes}
                    </div>
                  )}

                  {/* Registered Officers List & Evaluation Panel */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Inscrits ({sess.registrations?.length || 0})</span>
                      {currentOfficer?.isInstructor && (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Évaluation instructeur
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sess.registrations?.map((reg: any) => (
                        <div
                          key={reg.id}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={reg.officer?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                              alt={reg.officer?.name}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">
                                {reg.officer?.name} (#{reg.officer?.badgeNumber})
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{reg.officer?.rank}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                reg.status === "Validé"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : reg.status === "Échoué"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-theme-primary-light text-theme-primary border border-theme-primary"
                              }`}
                            >
                              {reg.status}
                            </span>

                            {/* Instructor controls */}
                            {currentOfficer?.isInstructor && reg.status === "Inscrit" && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEvaluate(reg.id, "Validé")}
                                  title="Valider l'officier et lui décerner le badge"
                                  className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/40"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEvaluate(reg.id, "Échoué")}
                                  title="Marquer comme recalé"
                                  className="p-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/40"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Catalogue Tab */}
      {activeTab === "catalogue" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {courses.map((c) => (
            <div
              key={c.id}
              className="police-card p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-theme-primary space-y-3 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-theme-primary px-2 py-0.5 rounded bg-theme-primary-light border border-theme-primary">
                    {c.category}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                    Grade : {c.prerequisiteRank || "Rookie"}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white">{c.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  {getBadgeIcon(c.badgeIcon)}
                  <span>{c.badgeName}</span>
                </div>

                <span className="text-[10px] sm:text-[11px] text-slate-500">
                  {c._count?.awardedBadges || 0} qualifié(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Matrice Tab (Responsive: Cards on Mobile, Table on Desktop) */}
      {activeTab === "matrice" && (
        <div className="space-y-3">
          {/* Mobile Card View (md:hidden) */}
          <div className="md:hidden space-y-2.5">
            {allOfficers.map((o) => (
              <div key={o.id} className="police-card p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={o.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={o.name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">{o.name} (#{o.badgeNumber})</div>
                      <div className="text-[10px] text-slate-400">{o.rank} • Unité {o.unitType}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Qualifications :</div>
                  {!o.badges || o.badges.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Aucune habilitation validée</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {o.badges.map((b) => (
                        <span
                          key={b.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-theme-primary-light border border-theme-primary text-[10px] font-bold text-theme-primary"
                        >
                          <Award className="w-3 h-3" />
                          {b.course.badgeName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block police-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Registre des Habilitations par Agent
              </h2>
              <span className="text-xs text-slate-400">
                Vérification des accréditations opérationnelles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Unité</th>
                    <th className="p-3">Habilitations & Badges Validés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allOfficers.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <img
                          src={o.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                          alt={o.name}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                        />
                        <span>{o.name} (#{o.badgeNumber})</span>
                      </td>
                      <td className="p-3 text-slate-300 font-medium">{o.rank}</td>
                      <td className="p-3 text-theme-primary font-mono">{o.unitType}</td>
                      <td className="p-3">
                        {!o.badges || o.badges.length === 0 ? (
                          <span className="text-slate-500 italic">Aucune habilitation</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {o.badges.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-theme-primary-light border border-theme-primary text-[10px] font-bold text-theme-primary"
                              >
                                <Award className="w-3 h-3" />
                                {b.course.badgeName}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-white">Nouveau Module de Formation</h2>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Intitulé du Module *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: EVOC - Conduite Haute Vitesse"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Catégorie</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="Conduite">Conduite (EVOC)</option>
                    <option value="Tactique">Tactique (SWAT)</option>
                    <option value="Aérien">Aérien (Air Support)</option>
                    <option value="Spécialité">Spécialité (K9)</option>
                    <option value="Pédagogique">Pédagogique (FTO)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Grade Minimum</label>
                  <select
                    value={courseForm.prerequisiteRank}
                    onChange={(e) => setCourseForm({ ...courseForm, prerequisiteRank: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="Rookie">Rookie</option>
                    <option value="Officier I">Officier I</option>
                    <option value="Officier II">Officier II</option>
                    <option value="Officier III">Officier III</option>
                    <option value="Sergent">Sergent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nom du Badge Débloqué *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pilote EVOC"
                    value={courseForm.badgeName}
                    onChange={(e) => setCourseForm({ ...courseForm, badgeName: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Icône</label>
                  <select
                    value={courseForm.badgeIcon}
                    onChange={(e) => setCourseForm({ ...courseForm, badgeIcon: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  >
                    <option value="Award">Étoile / Badge</option>
                    <option value="Zap">Éclair (Vitesse)</option>
                    <option value="Plane">Hélico (Aérien)</option>
                    <option value="ShieldAlert">Bouclier (SWAT)</option>
                    <option value="Dog">Chien (K9)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Objectifs et épreuves..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Créer le Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-black text-white">Programmer une Session</h2>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕ Fermer
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Module *</label>
                <select
                  required
                  value={sessionForm.courseId}
                  onChange={(e) => setSessionForm({ ...sessionForm, courseId: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                >
                  <option value="">-- Choisir le module --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Date & Heure *</label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionForm.scheduledAt}
                    onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Places Max</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={sessionForm.maxSeats}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxSeats: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Lieu de Rendez-vous</label>
                <input
                  type="text"
                  placeholder="Ex: Aérodrome de Sandy Shores"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Consignes</label>
                <textarea
                  rows={2}
                  placeholder="Véhicules requis, tenue..."
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm sm:text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 rounded-lg btn-theme-primary text-xs font-bold"
                >
                  Publier la Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
