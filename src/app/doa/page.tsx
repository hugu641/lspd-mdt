"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useOfficer } from "../../context/OfficerContext";
import { isHighCommand } from "../../lib/ranks";
import {
  Network,
  Plus,
  Search,
  User,
  Users,
  FolderOpen,
  Link2,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

// Canvas graph library touches window: client-only. next/dynamic drops `ref`,
// so the graph instance is passed through a `graphRef` prop instead.
const ForceGraph2D = dynamic(
  () =>
    import("react-force-graph-2d").then((mod) => {
      const Graph = mod.default as any;
      return function ForceGraphWithRef({ graphRef, ...props }: any) {
        return <Graph ref={graphRef} {...props} />;
      };
    }),
  { ssr: false }
) as any;

type NodeType = "CITIZEN" | "ORGANIZATION" | "INVESTIGATION";

interface Organization {
  id: string;
  name: string;
  type: string;
  dangerLevel: string;
  territory: string | null;
  description: string | null;
}

interface DoaLink {
  id: string;
  sourceType: NodeType;
  sourceId: string;
  targetType: NodeType;
  targetId: string;
  relation: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface GraphNode {
  id: string; // "TYPE:id"
  type: NodeType;
  refId: string;
  label: string;
  sub: string;
}

const TYPE_META: Record<NodeType, { label: string; color: string; icon: any }> = {
  CITIZEN: { label: "Individu", color: "#38bdf8", icon: User },
  ORGANIZATION: { label: "Organisation", color: "#f43f5e", icon: Users },
  INVESTIGATION: { label: "Affaire", color: "#f59e0b", icon: FolderOpen },
};

const ORG_TYPES = ["Gang", "Cartel", "Mafia", "MC (Motor Club)", "Groupe armé", "Entreprise écran", "Autre"];
const DANGER_LEVELS = ["Faible", "Moyen", "Élevé", "Extrême"];
const RELATIONS = [
  "Membre",
  "Chef",
  "Lieutenant",
  "Associé",
  "Famille",
  "Couple",
  "Ami",
  "Rival",
  "Ennemi",
  "Fournisseur",
  "Client",
  "Allié",
  "Suspect",
  "Impliqué",
  "Témoin",
  "Victime",
];

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-[#0e1124] border border-[#1d2242] text-xs text-white focus:outline-none focus:border-purple-500";

const emptyOrgForm = { name: "", type: "Gang", dangerLevel: "Moyen", territory: "", description: "" };
const emptyLinkForm = {
  sourceType: "CITIZEN" as NodeType,
  sourceId: "",
  targetType: "ORGANIZATION" as NodeType,
  targetId: "",
  relation: "Membre",
  notes: "",
};

export default function DoaPage() {
  const { currentOfficer } = useOfficer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [linkedCitizens, setLinkedCitizens] = useState<any[]>([]);
  const [linkedInvestigations, setLinkedInvestigations] = useState<any[]>([]);
  const [links, setLinks] = useState<DoaLink[]>([]);
  const [canEdit, setCanEdit] = useState(false);

  // Pickers for link creation (all citizens / investigations, loaded on demand)
  const [allCitizens, setAllCitizens] = useState<any[]>([]);
  const [allInvestigations, setAllInvestigations] = useState<any[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | NodeType>("ALL");

  const [orgModal, setOrgModal] = useState<{ open: boolean; editing: Organization | null }>({ open: false, editing: null });
  const [orgForm, setOrgForm] = useState(emptyOrgForm);
  const [linkModal, setLinkModal] = useState<{ open: boolean; editing: DoaLink | null }>({ open: false, editing: null });
  const [linkForm, setLinkForm] = useState(emptyLinkForm);
  const [showInvestigators, setShowInvestigators] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const graphBoxRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [graphSize, setGraphSize] = useState({ width: 600, height: 520 });

  const isHC = isHighCommand(currentOfficer as any);

  const fetchDoa = useCallback(async () => {
    try {
      const res = await fetch("/api/doa");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");
      setOrganizations(data.organizations);
      setLinkedCitizens(data.citizens);
      setLinkedInvestigations(data.investigations);
      setLinks(data.links);
      setCanEdit(Boolean(data.canEdit));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Impossible de charger la DOA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoa();
    // Deep link from a citizen / investigation page: /doa?focus=CITIZEN:<id>
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus) setSelectedId(focus);
  }, [fetchDoa]);

  useEffect(() => {
    const box = graphBoxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(([entry]) => {
      setGraphSize({ width: Math.floor(entry.contentRect.width), height: Math.max(380, Math.floor(entry.contentRect.height)) });
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [loading]);

  const loadPickers = async () => {
    if (allCitizens.length && allInvestigations.length) return;
    const [cRes, iRes] = await Promise.all([fetch("/api/citizens"), fetch("/api/investigations")]);
    if (cRes.ok) setAllCitizens(await cRes.json());
    if (iRes.ok) setAllInvestigations(await iRes.json());
  };

  // ── Graph data ────────────────────────────────────────────────────────
  const nodesById = useMemo(() => {
    const map = new Map<string, GraphNode>();
    organizations.forEach((o) =>
      map.set(`ORGANIZATION:${o.id}`, { id: `ORGANIZATION:${o.id}`, type: "ORGANIZATION", refId: o.id, label: o.name, sub: `${o.type} · Danger ${o.dangerLevel}` })
    );
    linkedCitizens.forEach((c) =>
      map.set(`CITIZEN:${c.id}`, { id: `CITIZEN:${c.id}`, type: "CITIZEN", refId: c.id, label: `${c.firstName} ${c.lastName}`, sub: `Dangerosité : ${c.dangerLevel}` })
    );
    linkedInvestigations.forEach((i) =>
      map.set(`INVESTIGATION:${i.id}`, { id: `INVESTIGATION:${i.id}`, type: "INVESTIGATION", refId: i.id, label: i.caseNumber, sub: `${i.title} · ${i.status}` })
    );
    return map;
  }, [organizations, linkedCitizens, linkedInvestigations]);

  const graphData = useMemo(() => {
    const visible = (n: GraphNode) => typeFilter === "ALL" || n.type === typeFilter;
    const nodes = Array.from(nodesById.values()).filter(visible).map((n) => ({ ...n }));
    const ids = new Set(nodes.map((n) => n.id));
    const gLinks = links
      .map((l) => ({ id: l.id, source: `${l.sourceType}:${l.sourceId}`, target: `${l.targetType}:${l.targetId}`, relation: l.relation }))
      .filter((l) => ids.has(l.source) && ids.has(l.target));
    return { nodes, links: gLinks };
  }, [nodesById, links, typeFilter]);

  const neighbours = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>([selectedId]);
    links.forEach((l) => {
      const s = `${l.sourceType}:${l.sourceId}`;
      const t = `${l.targetType}:${l.targetId}`;
      if (s === selectedId) set.add(t);
      if (t === selectedId) set.add(s);
    });
    return set;
  }, [selectedId, links]);

  const selectedNode = selectedId ? nodesById.get(selectedId) || null : null;
  const selectedLinks = selectedId
    ? links.filter((l) => `${l.sourceType}:${l.sourceId}` === selectedId || `${l.targetType}:${l.targetId}` === selectedId)
    : [];
  const selectedOrg = selectedNode?.type === "ORGANIZATION" ? organizations.find((o) => o.id === selectedNode.refId) : null;

  const searchResults = search.trim()
    ? Array.from(nodesById.values()).filter((n) =>
        `${n.label} ${n.sub}`.toLowerCase().includes(search.trim().toLowerCase())
      )
    : [];

  const focusNode = (id: string) => {
    setSelectedId(id);
    setSearch("");
    const node: any = graphData.nodes.find((n) => n.id === id);
    if (node && graphRef.current && node.x !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 600);
      graphRef.current.zoom(2.5, 600);
    }
  };

  // ── Organization CRUD ─────────────────────────────────────────────────
  const openOrgModal = (org: Organization | null) => {
    setOrgForm(
      org
        ? { name: org.name, type: org.type, dangerLevel: org.dangerLevel, territory: org.territory || "", description: org.description || "" }
        : emptyOrgForm
    );
    setOrgModal({ open: true, editing: org });
  };

  const saveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(orgModal.editing ? `/api/doa/organizations/${orgModal.editing.id}` : "/api/doa/organizations", {
        method: orgModal.editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erreur");
      setOrgModal({ open: false, editing: null });
      await fetchDoa();
      setSelectedId(`ORGANIZATION:${data.id}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteOrg = async (org: Organization) => {
    if (!confirm(`Supprimer l'organisation « ${org.name} » et toutes ses liaisons ?`)) return;
    const res = await fetch(`/api/doa/organizations/${org.id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error || "Erreur");
    setSelectedId(null);
    fetchDoa();
  };

  // ── Link CRUD ─────────────────────────────────────────────────────────
  const openLinkModal = (link: DoaLink | null) => {
    if (link) {
      setLinkForm({ ...link, notes: link.notes || "" });
    } else {
      // Pre-fill the source with the selected node
      setLinkForm(
        selectedNode ? { ...emptyLinkForm, sourceType: selectedNode.type, sourceId: selectedNode.refId } : emptyLinkForm
      );
    }
    setLinkModal({ open: true, editing: link });
    loadPickers();
  };

  const saveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const editing = linkModal.editing;
      const res = await fetch(editing ? `/api/doa/links/${editing.id}` : "/api/doa/links", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { relation: linkForm.relation, notes: linkForm.notes } : linkForm),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erreur");
      setLinkModal({ open: false, editing: null });
      await fetchDoa();
      if (!editing) setSelectedId(`${linkForm.sourceType}:${linkForm.sourceId}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (link: DoaLink) => {
    if (!confirm("Supprimer cette liaison ?")) return;
    const res = await fetch(`/api/doa/links/${link.id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error || "Erreur");
    fetchDoa();
  };

  const optionsFor = (type: NodeType) => {
    if (type === "CITIZEN") return allCitizens.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
    if (type === "INVESTIGATION") return allInvestigations.map((i) => ({ id: i.id, label: `${i.caseNumber} — ${i.title}` }));
    return organizations.map((o) => ({ id: o.id, label: o.name }));
  };

  // ── Investigators management (High Command) ───────────────────────────
  const openInvestigators = async () => {
    setShowInvestigators(true);
    const res = await fetch("/api/officers");
    if (res.ok) setOfficers(await res.json());
  };

  const toggleInvestigator = async (officer: any) => {
    const res = await fetch(`/api/officers/${officer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInvestigator: !officer.isInvestigator }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Erreur");
    setOfficers((prev) => prev.map((o) => (o.id === officer.id ? { ...o, isInvestigator: data.isInvestigator ?? !o.isInvestigator } : o)));
  };

  const nodeName = (type: NodeType, id: string) => nodesById.get(`${type}:${id}`)?.label || "Élément supprimé";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement de la DOA...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-theme-primary uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Renseignement criminel</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">DOA — Réseaux & Organisations</h1>
          <p className="text-xs text-slate-300">
            Liens entre individus, organisations criminelles et affaires.{" "}
            {canEdit ? "Vous pouvez modifier les liaisons." : "Lecture seule : modification réservée aux enquêteurs DOA."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isHC && (
            <button onClick={openInvestigators} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#141834] border border-[#262d5c] text-xs font-bold text-slate-200 hover:text-white">
              <ShieldCheck className="w-4 h-4" /> Enquêteurs
            </button>
          )}
          {canEdit && (
            <>
              <button onClick={() => openOrgModal(null)} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#141834] border border-[#262d5c] text-xs font-bold text-slate-200 hover:text-white">
                <Users className="w-4 h-4" /> Nouvelle organisation
              </button>
              <button onClick={() => openLinkModal(null)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-lg">
                <Link2 className="w-4 h-4" /> Nouvelle liaison
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}

      {/* Toolbar */}
      <div className="police-card p-3 rounded-xl flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un individu, une organisation, une affaire..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white focus:outline-none focus:border-purple-500"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl bg-[#0b0e20] border border-[#262d5c] shadow-xl">
              {searchResults.map((n) => (
                <button key={n.id} onClick={() => focusNode(n.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-[#151a3a] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_META[n.type].color }} />
                  <span className="text-white font-semibold">{n.label}</span>
                  <span className="text-slate-500 truncate">{n.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} aria-label="Filtrer par type" className="px-3 py-2 rounded-xl bg-[#070814] border border-[#21274d] text-xs text-white">
          <option value="ALL">Tous les éléments</option>
          <option value="CITIZEN">Individus</option>
          <option value="ORGANIZATION">Organisations</option>
          <option value="INVESTIGATION">Affaires</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Graph */}
        <div className="lg:col-span-8 police-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1d2242] text-[11px] text-slate-400">
            {(Object.keys(TYPE_META) as NodeType[]).map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_META[t].color }} />
                {TYPE_META[t].label}
              </span>
            ))}
            <span className="ml-auto">{graphData.nodes.length} éléments · {graphData.links.length} liaisons</span>
          </div>
          <div ref={graphBoxRef} className="h-[520px] bg-[#05060d]">
            {graphData.nodes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs gap-2 p-6">
                <Network className="w-8 h-8" />
                Aucun élément. {canEdit ? "Créez une organisation ou une liaison pour commencer." : ""}
              </div>
            ) : (
              <ForceGraph2D
                graphRef={graphRef}
                width={graphSize.width}
                height={graphSize.height}
                graphData={graphData}
                backgroundColor="#05060d"
                nodeRelSize={6}
                cooldownTicks={120}
                linkColor={(l: any) => {
                  const s = typeof l.source === "object" ? l.source.id : l.source;
                  const t = typeof l.target === "object" ? l.target.id : l.target;
                  return selectedId && (s === selectedId || t === selectedId) ? "#a78bfa" : "rgba(148,163,184,0.35)";
                }}
                linkWidth={(l: any) => {
                  const s = typeof l.source === "object" ? l.source.id : l.source;
                  const t = typeof l.target === "object" ? l.target.id : l.target;
                  return selectedId && (s === selectedId || t === selectedId) ? 2.5 : 1;
                }}
                linkLabel={(l: any) => l.relation}
                linkDirectionalParticles={0}
                onNodeClick={(n: any) => setSelectedId(n.id)}
                onBackgroundClick={() => setSelectedId(null)}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, scale: number) => {
                  const meta = TYPE_META[node.type as NodeType];
                  const dimmed = selectedId && !neighbours.has(node.id);
                  const r = node.type === "ORGANIZATION" ? 9 : 6;
                  ctx.globalAlpha = dimmed ? 0.2 : 1;
                  ctx.beginPath();
                  if (node.type === "INVESTIGATION") ctx.rect(node.x - r, node.y - r, r * 2, r * 2);
                  else ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                  ctx.fillStyle = meta.color;
                  ctx.fill();
                  if (node.id === selectedId) {
                    ctx.lineWidth = 2 / scale;
                    ctx.strokeStyle = "#ffffff";
                    ctx.stroke();
                  }
                  const fontSize = Math.max(10 / scale, 3);
                  ctx.font = `600 ${fontSize}px sans-serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "top";
                  ctx.fillStyle = "#e2e8f0";
                  ctx.fillText(node.label, node.x, node.y + r + 2);
                  ctx.globalAlpha = 1;
                }}
                nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
                  ctx.fill();
                }}
              />
            )}
          </div>
        </div>

        {/* Details panel */}
        <div className="lg:col-span-4 space-y-4">
          {!selectedNode ? (
            <div className="police-card p-4 rounded-2xl text-xs text-slate-400">
              Cliquez sur un élément du graphe (ou recherchez-le) pour afficher ses liaisons.
            </div>
          ) : (
            <div className="police-card p-4 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TYPE_META[selectedNode.type].color }}>
                    {TYPE_META[selectedNode.type].label}
                  </div>
                  <div className="text-base font-black text-white truncate">{selectedNode.label}</div>
                  <div className="text-[11px] text-slate-400">{selectedNode.sub}</div>
                </div>
                <button onClick={() => setSelectedId(null)} aria-label="Fermer" className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedOrg && (
                <div className="text-xs text-slate-300 space-y-1">
                  {selectedOrg.territory && <div><span className="text-slate-500">Territoire :</span> {selectedOrg.territory}</div>}
                  {selectedOrg.description && <div className="whitespace-pre-wrap">{selectedOrg.description}</div>}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedNode.type === "CITIZEN" && (
                  <Link href={`/citizens/${selectedNode.refId}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Fiche citoyen
                  </Link>
                )}
                {selectedNode.type === "INVESTIGATION" && (
                  <Link href="/investigations" className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Dossiers d&apos;enquête
                  </Link>
                )}
                {canEdit && selectedOrg && (
                  <>
                    <button onClick={() => openOrgModal(selectedOrg)} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white">
                      <Pencil className="w-3 h-3" /> Modifier
                    </button>
                    <button onClick={() => deleteOrg(selectedOrg)} className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-rose-200">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  </>
                )}
              </div>

              <div className="border-t border-[#1d2242] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Liaisons ({selectedLinks.length})</div>
                  {canEdit && (
                    <button onClick={() => openLinkModal(null)} className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-purple-200">
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  )}
                </div>
                {selectedLinks.length === 0 && <div className="text-[11px] text-slate-500">Aucune liaison.</div>}
                {selectedLinks.map((l) => {
                  const outgoing = `${l.sourceType}:${l.sourceId}` === selectedId;
                  const otherType = outgoing ? l.targetType : l.sourceType;
                  const otherId = outgoing ? l.targetId : l.sourceId;
                  return (
                    <div key={l.id} className="p-2.5 rounded-xl bg-[#070814] border border-[#1d2242] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">{l.relation}</span>
                        <button onClick={() => focusNode(`${otherType}:${otherId}`)} className="text-xs font-semibold text-white hover:underline truncate">
                          {nodeName(otherType, otherId)}
                        </button>
                      </div>
                      {l.notes && <div className="text-[11px] text-slate-300 whitespace-pre-wrap">{l.notes}</div>}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          {l.createdBy || "—"} · {new Date(l.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        {canEdit && (
                          <span className="flex gap-2">
                            <button onClick={() => openLinkModal(l)} aria-label="Modifier la liaison" className="hover:text-white"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => deleteLink(l)} aria-label="Supprimer la liaison" className="hover:text-rose-300"><Trash2 className="w-3 h-3" /></button>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Organizations list */}
          <div className="police-card p-4 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-white">Organisations ({organizations.length})</div>
            {organizations.length === 0 && <div className="text-[11px] text-slate-500">Aucune organisation enregistrée.</div>}
            {organizations.map((o) => {
              const count = links.filter(
                (l) => (l.sourceType === "ORGANIZATION" && l.sourceId === o.id) || (l.targetType === "ORGANIZATION" && l.targetId === o.id)
              ).length;
              return (
                <button key={o.id} onClick={() => focusNode(`ORGANIZATION:${o.id}`)} className="w-full text-left p-2 rounded-xl hover:bg-[#10132a] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">{o.name}</span>
                  <span className="text-[10px] text-slate-500 truncate">{o.type}</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-400 whitespace-nowrap">{count} liens</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Organization modal */}
      {orgModal.open && (
        <Modal title={orgModal.editing ? `Modifier ${orgModal.editing.name}` : "Nouvelle organisation"} onClose={() => setOrgModal({ open: false, editing: null })}>
          <form onSubmit={saveOrg} className="space-y-3">
            <Field label="Nom *">
              <input required value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })} className={inputCls}>
                  {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Dangerosité">
                <select value={orgForm.dangerLevel} onChange={(e) => setOrgForm({ ...orgForm, dangerLevel: e.target.value })} className={inputCls}>
                  {DANGER_LEVELS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Territoire">
              <input value={orgForm.territory} onChange={(e) => setOrgForm({ ...orgForm, territory: e.target.value })} placeholder="Ex : Grove Street, Davis..." className={inputCls} />
            </Field>
            <Field label="Description / renseignements">
              <textarea rows={4} value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} className={inputCls} />
            </Field>
            <ModalActions saving={saving} onCancel={() => setOrgModal({ open: false, editing: null })} />
          </form>
        </Modal>
      )}

      {/* Link modal */}
      {linkModal.open && (
        <Modal title={linkModal.editing ? "Modifier la liaison" : "Nouvelle liaison"} onClose={() => setLinkModal({ open: false, editing: null })}>
          <form onSubmit={saveLink} className="space-y-3">
            {linkModal.editing ? (
              <div className="text-xs text-slate-300">
                {nodeName(linkForm.sourceType, linkForm.sourceId)} ↔ {nodeName(linkForm.targetType, linkForm.targetId)}
              </div>
            ) : (
              (["source", "target"] as const).map((side) => {
                const typeKey = `${side}Type` as "sourceType" | "targetType";
                const idKey = `${side}Id` as "sourceId" | "targetId";
                return (
                  <div key={side} className="grid grid-cols-3 gap-2">
                    <Field label={side === "source" ? "Élément 1" : "Élément 2"}>
                      <select
                        value={linkForm[typeKey]}
                        onChange={(e) => setLinkForm({ ...linkForm, [typeKey]: e.target.value as NodeType, [idKey]: "" })}
                        className={inputCls}
                      >
                        {(Object.keys(TYPE_META) as NodeType[]).map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                      </select>
                    </Field>
                    <div className="col-span-2">
                      <Field label={" "}>
                        <select required value={linkForm[idKey]} onChange={(e) => setLinkForm({ ...linkForm, [idKey]: e.target.value })} className={inputCls}>
                          <option value="">— Choisir —</option>
                          {optionsFor(linkForm[typeKey]).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                );
              })
            )}
            <Field label="Type de relation *">
              <input required list="doa-relations" value={linkForm.relation} onChange={(e) => setLinkForm({ ...linkForm, relation: e.target.value })} className={inputCls} />
              <datalist id="doa-relations">{RELATIONS.map((r) => <option key={r} value={r} />)}</datalist>
            </Field>
            <Field label="Notes / renseignements">
              <textarea rows={3} value={linkForm.notes} onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })} className={inputCls} />
            </Field>
            <ModalActions saving={saving} onCancel={() => setLinkModal({ open: false, editing: null })} />
          </form>
        </Modal>
      )}

      {/* Investigators modal */}
      {showInvestigators && (
        <Modal title="Enquêteurs DOA" onClose={() => setShowInvestigators(false)}>
          <p className="text-[11px] text-slate-400 mb-3">
            Les enquêteurs et le Haut Commandement peuvent créer, modifier et supprimer les organisations et liaisons. Les autres agents ont un accès en lecture.
          </p>
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {officers.map((o) => (
              <div key={o.id} className="flex items-center gap-2 p-2 rounded-xl bg-[#070814] border border-[#1d2242]">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{o.name}</div>
                  <div className="text-[10px] text-slate-500">{o.rank} · {o.badgeNumber}</div>
                </div>
                {isHighCommand(o) ? (
                  <span className="ml-auto text-[10px] font-bold text-emerald-300">Haut Commandement</span>
                ) : (
                  <button
                    onClick={() => toggleInvestigator(o)}
                    className={`ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      o.isInvestigator ? "bg-emerald-950 text-emerald-300 border-emerald-500/40" : "bg-[#141834] text-slate-400 border-[#262d5c]"
                    }`}
                  >
                    {o.isInvestigator ? "Enquêteur ✓" : "Nommer enquêteur"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-2xl bg-[#0a0c1a] border border-[#262d5c] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-white">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-[#141834] text-slate-300 text-xs font-semibold hover:text-white">Annuler</button>
      <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl btn-theme-primary text-xs font-bold disabled:opacity-50">
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}
