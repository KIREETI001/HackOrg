"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Search,
  ChevronDown,
  Calendar,
  MapPin,
  Trophy,
  Users,
  ArrowUpRight,
  CircleDot,
  Activity,
  Clock,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Zap,
  Filter,
  ArrowUpDown,
  Sparkles,
  AlertCircle,
  DollarSign,
  Info,
} from "lucide-react";

/* ============================================================
   CONFIG — design tokens & constants
   ============================================================ */
const TODAY = new Date("2026-05-05"); // pin for predictable countdowns

const MANIFESTOS = [
  "EVERY OPPORTUNITY IS A POSSIBLE TURNING POINT.",
  "THE NEXT DOOR YOU WALK THROUGH COULD REWRITE THE NEXT DECADE.",
  "MORE PEOPLE ARE QUIETLY BUILDING THAN YOU THINK. JOIN THEM.",
  "SHOWING UP BEATS WAITING TO BE READY.",
  "MOST GATEKEEPERS ARE WAITING FOR YOU TO SHOW UP.",
  "THE BEST LINE ON A RÉSUMÉ IS THE ONE NOBODY TOLD YOU TO ADD.",
  "A WEEKEND IS LONG ENOUGH TO BUILD SOMETHING THAT CHANGES YOUR TRAJECTORY.",
];

/* ============================================================
   FILTER OPTION DEFINITIONS — canonical taxonomies
   ============================================================ */
const FILTER_DIMS = [
  {
    key: "level",
    label: "Level",
    options: ["Primary", "Secondary", "Pre-University", "Tertiary", "Open / Professional"],
  },
  {
    key: "timeline",
    label: "Timeline",
    options: ["Single-day", "Multi-day (4-7d)", "Multi-week (1-3mo)", "Multi-month (3-6mo)", "Annual / ongoing"],
  },
  {
    key: "scope",
    label: "Scope",
    options: ["Local (Singapore)", "Regional (Asia)", "Global"],
  },
  {
    key: "domains",
    label: "Domain",
    isArray: true,
    options: [
      "Computer Science",
      "Sciences (STEM)",
      "Mathematics",
      "Business / Economics",
      "Humanities",
    ],
  },
  {
    key: "fields",
    label: "Field",
    isArray: true,
    options: [
      "AI / Machine Learning",
      "Cybersecurity",
      "FinTech",
      "Web3 / Blockchain",
      "Sustainability",
      "Healthcare",
      "General Tech",
    ],
  },
];

/* ============================================================
   UTILITIES
   ============================================================ */
function daysUntil(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const diffMs = d.getTime() - TODAY.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function urgencyColor(days) {
  if (days === null) return null;
  if (days < 0) return "expired";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "ok";
}

function statusMeta(status) {
  switch (status) {
    case "ongoing":
      return { label: "ONGOING", color: "var(--accent)", Icon: Activity };
    case "upcoming":
      return { label: "UPCOMING", color: "#7DB9FF", Icon: Clock };
    case "completed":
      return { label: "CLOSED FOR 2026", color: "#7A7568", Icon: CheckCircle2 };
    default:
      return { label: "ACTIVE", color: "var(--accent)", Icon: CircleDot };
  }
}

function difficultyTier(diff) {
  switch (diff) {
    case "Beginner-Friendly":
      return { dots: 1, color: "#86EFAC", label: "BEGINNER" };
    case "Intermediate":
      return { dots: 2, color: "#FCD34D", label: "INTERMEDIATE" };
    case "Advanced":
      return { dots: 3, color: "#FB923C", label: "ADVANCED" };
    case "Elite/Selective":
      return { dots: 4, color: "#F87171", label: "ELITE" };
    default:
      return { dots: 2, color: "#FCD34D", label: "INTERMEDIATE" };
  }
}

/* ============================================================
   ROTATING MANIFESTO
   ============================================================ */
function RotatingManifesto() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MANIFESTOS.length), 5500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-7 sm:h-9 overflow-hidden">
      {MANIFESTOS.map((m, i) => (
        <div
          key={i}
          className="absolute inset-0 flex items-center transition-all duration-700 ease-out"
          style={{
            opacity: i === idx ? 1 : 0,
            transform: i === idx ? "translateY(0)" : "translateY(0.5rem)",
          }}
        >
          <span className="font-mono text-[10px] sm:text-xs tracking-[0.18em] text-[var(--accent)]">
            ▸ {m}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   DEADLINE DOOM — top-of-page urgency widget
   ============================================================ */
function DeadlineDoom({ events, onSelect }) {
  const upcoming = useMemo(() => {
    return events
      .filter((e) => e.application_deadline)
      .map((e) => ({ ...e, _days: daysUntil(e.application_deadline) }))
      .filter((e) => e._days !== null && e._days >= 0 && e.status !== "completed")
      .sort((a, b) => a._days - b._days)
      .slice(0, 3);
  }, [events]);

  if (upcoming.length === 0) return null;

  return (
    <div className="border-y border-[#1F1D1A] bg-gradient-to-b from-[#0B0A08] to-[#0F0E0C]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-[#FF5F56]" strokeWidth={2.5} />
          <span className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-[#FF8B86]">
            DEADLINE WATCH — DOORS CLOSING SOON
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {upcoming.map((e) => {
            const urgency = urgencyColor(e._days);
            const colors = {
              urgent: { border: "#FF5F56", bg: "rgba(255, 95, 86, 0.08)", text: "#FF8B86" },
              soon: { border: "#FFB347", bg: "rgba(255, 179, 71, 0.06)", text: "#FFCB7F" },
              ok: { border: "#D8FF3D", bg: "rgba(216, 255, 61, 0.04)", text: "#D8FF3D" },
            }[urgency] || { border: "#7A7568", bg: "rgba(122, 117, 104, 0.05)", text: "#A8A299" };

            return (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="text-left group p-3 sm:p-4 border transition-all hover:scale-[1.01]"
                style={{ borderColor: colors.border, backgroundColor: colors.bg }}
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span
                    className="font-display text-3xl sm:text-4xl leading-none tabular-nums"
                    style={{ color: colors.text, fontWeight: 600 }}
                  >
                    {e._days}
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] text-[#A8A299]">
                    DAYS LEFT — {formatDate(e.application_deadline)}
                  </span>
                </div>
                <div className="font-display text-base sm:text-lg leading-tight text-[var(--paper)] mb-1 group-hover:underline decoration-[var(--accent)] underline-offset-4">
                  {e.name}
                </div>
                <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.1em] text-[#7A7568]">
                  {e.organizer}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPACT FILTER DROPDOWN
   ============================================================ */
function FilterDropdown({ dim, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const isArray = dim.isArray;
  const display = isArray
    ? value && value.length > 0
      ? `${value.length} SELECTED`
      : "ALL"
    : value || "ALL";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-[#2A2722] hover:border-[#4A453B] bg-[#13110E] text-[var(--paper)] font-mono text-[10px] tracking-[0.1em] uppercase transition-colors w-full sm:w-auto"
      >
        <span className="text-[#7A7568]">{dim.label}:</span>
        <span>{display}</span>
        <ChevronDown
          className="w-3 h-3 ml-auto sm:ml-1 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-full sm:min-w-[200px] bg-[#0B0A08] border border-[#2A2722] py-1 max-h-72 overflow-y-auto shadow-2xl">
          {!isArray && (
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase ${
                !value ? "text-[var(--accent)] bg-[#13110E]" : "text-[#A8A299] hover:bg-[#13110E]"
              }`}
            >
              {!value ? "▸ " : "  "}ALL
            </button>
          )}
          {dim.options.map((opt) => {
            const selected = isArray ? (value || []).includes(opt) : value === opt;
            return (
              <button
                key={opt}
                onClick={() => {
                  if (isArray) {
                    const cur = value || [];
                    const next = cur.includes(opt)
                      ? cur.filter((v) => v !== opt)
                      : [...cur, opt];
                    onChange(next.length ? next : null);
                  } else {
                    onChange(selected ? null : opt);
                    setOpen(false);
                  }
                }}
                className={`w-full text-left px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase ${
                  selected ? "text-[var(--accent)] bg-[#13110E]" : "text-[#A8A299] hover:bg-[#13110E]"
                }`}
              >
                {selected ? "▸ " : "  "}{opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SORT MENU
   ============================================================ */
function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const options = [
    { key: "deadline", label: "BY DEADLINE (URGENT FIRST)" },
    { key: "prestige", label: "BY PRIZE VALUE" },
    { key: "alpha", label: "ALPHABETICAL" },
    { key: "newest", label: "DEFAULT (CURATED)" },
  ];
  const cur = options.find((o) => o.key === value) || options[3];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-[#2A2722] hover:border-[#4A453B] bg-[#13110E] text-[var(--paper)] font-mono text-[10px] tracking-[0.1em] uppercase transition-colors w-full sm:w-auto"
      >
        <ArrowUpDown className="w-3 h-3" />
        <span className="text-[#7A7568]">SORT:</span>
        <span className="hidden sm:inline">{cur.label}</span>
        <span className="sm:hidden">{cur.key.toUpperCase()}</span>
        <ChevronDown
          className="w-3 h-3 ml-auto sm:ml-1 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-full sm:min-w-[260px] right-0 sm:right-auto bg-[#0B0A08] border border-[#2A2722] py-1 shadow-2xl">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase ${
                value === o.key ? "text-[var(--accent)] bg-[#13110E]" : "text-[#A8A299] hover:bg-[#13110E]"
              }`}
            >
              {value === o.key ? "▸ " : "  "}{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EVENT CARD
   ============================================================ */
function EventCard({ event, onSelect, isBookmarked, onToggleBookmark }) {
  const meta = statusMeta(event.status);
  const StatusIcon = meta.Icon;
  const days = daysUntil(event.application_deadline);
  const urgency = urgencyColor(days);
  const tier = difficultyTier(event.difficulty);

  const urgencyStyle = {
    expired: { bg: "rgba(122, 117, 104, 0.1)", text: "#7A7568", border: "#2A2722" },
    urgent: { bg: "rgba(255, 95, 86, 0.12)", text: "#FF8B86", border: "#FF5F56" },
    soon: { bg: "rgba(255, 179, 71, 0.1)", text: "#FFCB7F", border: "#FFB347" },
    ok: { bg: "rgba(216, 255, 61, 0.05)", text: "#D8FF3D", border: "rgba(216, 255, 61, 0.3)" },
  }[urgency];

  return (
    <button
      onClick={() => onSelect(event)}
      className="text-left group relative bg-[#13110E] border border-[#1F1D1A] hover:border-[#3A3530] transition-all p-5 flex flex-col h-full focus:outline-none focus:border-[var(--accent)]"
      style={{ opacity: event.status === "completed" ? 0.55 : 1 }}
    >
      {/* Bookmark in top right */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark(event.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            onToggleBookmark(event.id);
          }
        }}
        className="absolute top-3 right-3 p-1.5 rounded hover:bg-[#1F1D1A] transition-colors z-10 cursor-pointer"
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
        ) : (
          <Bookmark className="w-4 h-4 text-[#7A7568]" strokeWidth={2} />
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mb-3 font-mono text-[9px] tracking-[0.18em]">
        <StatusIcon
          className="w-2.5 h-2.5"
          style={{
            color: meta.color,
            animation: event.status === "ongoing" ? "pulse 2s infinite" : "none",
          }}
          fill={event.status === "ongoing" ? meta.color : "none"}
        />
        <span style={{ color: meta.color }}>{meta.label}</span>
      </div>

      {/* Title */}
      <h3 className="font-display text-xl leading-tight text-[var(--paper)] mb-2 pr-6 group-hover:text-[var(--accent)] transition-colors">
        {event.name}
      </h3>

      {/* Organizer */}
      <div className="font-mono text-[10px] tracking-[0.1em] text-[#7A7568] uppercase mb-3">
        {event.organizer}
      </div>

      {/* Summary preview */}
      <p className="text-[13px] text-[#B8B0A0] leading-relaxed mb-4 line-clamp-3 flex-grow">
        {event.summary}
      </p>

      {/* Badge row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {/* Beginner badge */}
        {event.beginner_friendly && (
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 bg-[rgba(134,239,172,0.1)] text-[#86EFAC] border border-[rgba(134,239,172,0.3)]">
            ★ BEGINNER
          </span>
        )}
        {/* Cost badge */}
        {event.cost === "Free" && (
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 bg-[rgba(216,255,61,0.06)] text-[var(--accent)] border border-[rgba(216,255,61,0.2)]">
            FREE
          </span>
        )}
        {event.cost === "Paid" && (
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 bg-[#1F1D1A] text-[#A8A299] border border-[#2A2722]">
            PAID
          </span>
        )}
        {/* Difficulty pill */}
        <span
          className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 border flex items-center gap-1"
          style={{ color: tier.color, borderColor: `${tier.color}40` }}
        >
          <span className="flex gap-0.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: n <= tier.dots ? tier.color : "#2A2722" }}
              />
            ))}
          </span>
          {tier.label}
        </span>
        {/* Prize value badge */}
        {event.prize_value_usd && event.prize_value_usd >= 10000 && (
          <span className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 bg-[rgba(216,255,61,0.04)] text-[#A8A299] border border-[rgba(216,255,61,0.15)]">
            {event.prize_value_usd >= 1000000
              ? `$${(event.prize_value_usd / 1000000).toFixed(1)}M+`
              : event.prize_value_usd >= 100000
              ? `$${Math.round(event.prize_value_usd / 1000)}K`
              : `$${(event.prize_value_usd / 1000).toFixed(0)}K`}
          </span>
        )}
      </div>

      {/* Deadline bar */}
      {urgencyStyle && days !== null && days >= 0 && event.status !== "completed" && (
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 mb-3 border"
          style={{
            backgroundColor: urgencyStyle.bg,
            borderColor: urgencyStyle.border,
          }}
        >
          <Clock className="w-3 h-3" style={{ color: urgencyStyle.text }} strokeWidth={2.5} />
          <span
            className="font-mono text-[10px] tracking-[0.1em] uppercase"
            style={{ color: urgencyStyle.text }}
          >
            {days === 0 ? "DEADLINE TODAY" : days === 1 ? "1 DAY LEFT" : `${days} DAYS LEFT`}
          </span>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1F1D1A]">
        <div className="font-mono text-[10px] tracking-[0.08em] text-[#7A7568]">
          {event.scope?.replace(" (Singapore)", "").replace(" (Asia)", "").toUpperCase()} ·{" "}
          {(event.fields?.[0] || "GENERAL").toUpperCase()}
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-[#7A7568] group-hover:text-[var(--accent)] transition-colors"
          strokeWidth={2}
        />
      </div>
    </button>
  );
}

/* ============================================================
   DETAIL PANEL
   ============================================================ */
function DetailPanel({ event, onClose, isBookmarked, onToggleBookmark }) {
  const meta = statusMeta(event.status);
  const StatusIcon = meta.Icon;
  const days = daysUntil(event.application_deadline);
  const urgency = urgencyColor(days);
  const tier = difficultyTier(event.difficulty);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handle(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      style={{ backgroundColor: "rgba(11, 10, 8, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:w-[640px] h-full bg-[#0F0E0C] overflow-y-auto border-l border-[#1F1D1A] animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status banner */}
        <div
          className="px-6 sm:px-10 py-3 flex items-center gap-2 border-b"
          style={{
            borderColor: meta.color + "40",
            backgroundColor: meta.color + "10",
          }}
        >
          <StatusIcon
            className="w-3.5 h-3.5"
            style={{
              color: meta.color,
              animation: event.status === "ongoing" ? "pulse 2s infinite" : "none",
            }}
            fill={event.status === "ongoing" ? meta.color : "none"}
          />
          <span
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-[#1F1D1A] rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#A8A299]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-10 py-8">
          {/* Top metadata */}
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#7A7568] uppercase mb-3">
            DOSSIER · {event.id.toUpperCase().split("-").slice(0, 2).join(" · ")}
          </div>

          {/* Title + Bookmark */}
          <div className="flex items-start gap-4 mb-4">
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--paper)] leading-tight flex-grow">
              {event.name}
            </h2>
            <button
              onClick={() => onToggleBookmark(event.id)}
              className="p-2 hover:bg-[#1F1D1A] rounded transition-colors flex-shrink-0"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
              ) : (
                <Bookmark className="w-5 h-5 text-[#7A7568] hover:text-[var(--paper)]" strokeWidth={2} />
              )}
            </button>
          </div>

          {/* Organizer */}
          <div className="font-mono text-[11px] tracking-[0.15em] text-[var(--accent)] uppercase mb-6">
            {event.organizer}
          </div>

          {/* Hero deadline (if active) */}
          {days !== null && days >= 0 && event.status !== "completed" && (
            <div
              className="mb-6 p-4 border"
              style={{
                borderColor:
                  urgency === "urgent"
                    ? "#FF5F56"
                    : urgency === "soon"
                    ? "#FFB347"
                    : "rgba(216, 255, 61, 0.4)",
                backgroundColor:
                  urgency === "urgent"
                    ? "rgba(255, 95, 86, 0.08)"
                    : urgency === "soon"
                    ? "rgba(255, 179, 71, 0.06)"
                    : "rgba(216, 255, 61, 0.04)",
              }}
            >
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className="font-display text-5xl tabular-nums leading-none"
                  style={{
                    color:
                      urgency === "urgent" ? "#FF8B86" : urgency === "soon" ? "#FFCB7F" : "#D8FF3D",
                    fontWeight: 600,
                  }}
                >
                  {days}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#A8A299]">
                  {days === 0 ? "DAYS — TODAY" : days === 1 ? "DAY LEFT" : "DAYS LEFT"}
                </span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[#7A7568]">
                APPLICATION DEADLINE — {formatDate(event.application_deadline)}
              </div>
            </div>
          )}

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
            <Stat icon={Calendar} label="DATE" value={event.date} />
            <Stat icon={MapPin} label="LOCATION" value={event.location} />
            <Stat icon={Users} label="LEVEL" value={event.level} />
            <Stat
              icon={Sparkles}
              label="DIFFICULTY"
              value={
                <span style={{ color: tier.color }}>
                  {tier.label}
                </span>
              }
            />
            <Stat
              icon={DollarSign}
              label="COST"
              value={
                <span style={{ color: event.cost === "Free" ? "var(--accent)" : "var(--paper)" }}>
                  {event.cost?.toUpperCase()}
                </span>
              }
            />
            <Stat icon={Trophy} label="PRIZE" value={event.prize} />
          </div>

          {/* Tags row */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[9px] tracking-[0.1em] uppercase px-2 py-1 bg-[#13110E] text-[#7A7568] border border-[#1F1D1A]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          <Section label="SUMMARY">
            <p className="text-[15px] text-[#D9D2C2] leading-relaxed">{event.summary}</p>
          </Section>

          {/* Eligibility */}
          {event.eligibility && (
            <Section label="ELIGIBILITY">
              <p className="text-[14px] text-[#D9D2C2] leading-relaxed">{event.eligibility}</p>
            </Section>
          )}

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <Section label="WHY THIS MATTERS">
              <ul className="space-y-2">
                {event.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[var(--accent)] font-mono text-[10px] mt-1 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-[#D9D2C2] leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Companies */}
          {event.companies && event.companies.length > 0 && (
            <Section label="ASSOCIATED">
              <div className="flex flex-wrap gap-2">
                {event.companies.map((c, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] tracking-[0.05em] px-3 py-1 bg-[#13110E] text-[#D9D2C2] border border-[#1F1D1A]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Apply / Visit links */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {event.application_url && (
              <a
                href={event.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[var(--accent)] text-[#0F0E0C] font-mono text-[11px] tracking-[0.15em] uppercase font-semibold hover:bg-[#E5FF55] transition-colors"
              >
                <span>APPLY · OFFICIAL SITE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {event.url && event.url !== event.application_url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 border border-[#2A2722] text-[var(--paper)] font-mono text-[11px] tracking-[0.15em] uppercase hover:border-[#4A453B] transition-colors"
              >
                <span>MORE INFO</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] text-[#7A7568] uppercase mb-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className="text-[13px] text-[var(--paper)] leading-snug">{value}</div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-6">
      <div className="font-mono text-[10px] tracking-[0.18em] text-[#7A7568] uppercase mb-3 pb-2 border-b border-[#1F1D1A]">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function CompetitionScanner({ events: rawEvents = [], meta = {} }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [statusFilter, setStatusFilter] = useState("all"); // all | ongoing | upcoming | completed | bookmarked
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [showAbout, setShowAbout] = useState(false);

  const events = rawEvents;

  function toggleBookmark(id) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAllFilters() {
    setSearch("");
    setFilters({});
    setStatusFilter("all");
    setBeginnerOnly(false);
    setFreeOnly(false);
  }

  function surpriseMe() {
    const pool = events.filter((e) => e.status !== "completed");
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelected(pick);
  }

  /* ---------- filter + sort logic ---------- */
  const filtered = useMemo(() => {
    let r = events;

    if (statusFilter === "bookmarked") {
      r = r.filter((e) => bookmarked.has(e.id));
    } else if (statusFilter !== "all") {
      r = r.filter((e) => e.status === statusFilter);
    }

    if (beginnerOnly) r = r.filter((e) => e.beginner_friendly);
    if (freeOnly) r = r.filter((e) => e.cost === "Free");

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          (e.summary || "").toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (e.companies || []).some((c) => c.toLowerCase().includes(q))
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const dim = FILTER_DIMS.find((d) => d.key === key);
      if (dim?.isArray) {
        r = r.filter((e) => Array.isArray(e[key]) && (value || []).every((v) => e[key].includes(v)));
      } else {
        r = r.filter((e) => e[key] === value);
      }
    });

    /* sort */
    r = [...r];
    if (sort === "deadline") {
      r.sort((a, b) => {
        const da = daysUntil(a.application_deadline);
        const db = daysUntil(b.application_deadline);
        // Open events (with deadline in future) first; closed/null at end
        const ka = da !== null && da >= 0 ? da : Number.POSITIVE_INFINITY;
        const kb = db !== null && db >= 0 ? db : Number.POSITIVE_INFINITY;
        return ka - kb;
      });
    } else if (sort === "prestige") {
      r.sort((a, b) => (b.prize_value_usd || 0) - (a.prize_value_usd || 0));
    } else if (sort === "alpha") {
      r.sort((a, b) => a.name.localeCompare(b.name));
    }

    return r;
  }, [events, search, filters, statusFilter, beginnerOnly, freeOnly, sort, bookmarked]);

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length +
    (beginnerOnly ? 1 : 0) +
    (freeOnly ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const counts = useMemo(() => {
    return {
      all: events.length,
      ongoing: events.filter((e) => e.status === "ongoing").length,
      upcoming: events.filter((e) => e.status === "upcoming").length,
      completed: events.filter((e) => e.status === "completed").length,
      bookmarked: bookmarked.size,
    };
  }, [events, bookmarked]);

  return (
    <div
      className="min-h-screen text-[var(--paper)]"
      style={{
        backgroundColor: "#0F0E0C",
        "--paper": "#ECE4D2",
        "--accent": "#D8FF3D",
        fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* === HERO === */}
      <header className="border-b border-[#1F1D1A]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Top mini-bar */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#A8A299]">
                FIELD STATION · LAST SWEEP {meta.last_sweep || "05 MAY 2026"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAbout(true)}
                className="font-mono text-[10px] tracking-[0.15em] text-[#7A7568] hover:text-[var(--paper)] uppercase"
              >
                ABOUT
              </button>
              <span className="font-mono text-[10px] tracking-[0.15em] text-[#3A3530]">
                v{meta.version || "2.0"}
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-display text-[clamp(2.75rem,8vw,5.75rem)] leading-[0.95] text-[var(--paper)] mb-5 tracking-tight">
            <span className="block">A field guide to</span>
            <span className="block italic font-light text-[var(--accent)]">
              every door<span className="text-[var(--paper)]"> you didn't know existed.</span>
            </span>
          </h1>

          {/* Sub-line */}
          <p className="text-[15px] sm:text-base text-[#B8B0A0] max-w-2xl leading-relaxed mb-6">
            {meta.total_events || 124} live competitions, hackathons, accelerators, fellowships and
            olympiads — surveyed daily across 4 continents. Singapore, ASEAN, US universities, online
            events, school olympiads, founder fellowships. Updated every morning at 09:00 SGT.
          </p>

          {/* Rotating manifesto */}
          <div className="border-l-2 border-[var(--accent)] pl-4 py-2 mb-6">
            <RotatingManifesto />
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.15em] text-[#7A7568] uppercase">
            <span>
              <span className="text-[var(--paper)] text-base font-display tabular-nums">
                {counts.ongoing}
              </span>{" "}
              ONGOING
            </span>
            <span>
              <span className="text-[var(--paper)] text-base font-display tabular-nums">
                {counts.upcoming}
              </span>{" "}
              UPCOMING
            </span>
            <span>
              <span className="text-[var(--paper)] text-base font-display tabular-nums">
                {meta.beginner_friendly_count || 39}
              </span>{" "}
              BEGINNER-FRIENDLY
            </span>
            <span>
              <span className="text-[var(--paper)] text-base font-display tabular-nums">
                {meta.free_events_count || 113}
              </span>{" "}
              FREE TO ENTER
            </span>
          </div>
        </div>
      </header>

      {/* === DEADLINE DOOM WIDGET === */}
      <DeadlineDoom events={events} onSelect={setSelected} />

      {/* === MAIN === */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status pills row */}
        <div className="flex flex-wrap gap-2 mb-5">
          <PillBtn
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            label="ALL"
            count={counts.all}
          />
          <PillBtn
            active={statusFilter === "ongoing"}
            onClick={() => setStatusFilter("ongoing")}
            label="ONGOING"
            count={counts.ongoing}
            color="var(--accent)"
            pulse
          />
          <PillBtn
            active={statusFilter === "upcoming"}
            onClick={() => setStatusFilter("upcoming")}
            label="UPCOMING"
            count={counts.upcoming}
            color="#7DB9FF"
          />
          <PillBtn
            active={statusFilter === "completed"}
            onClick={() => setStatusFilter("completed")}
            label="CLOSED"
            count={counts.completed}
            color="#7A7568"
          />
          {bookmarked.size > 0 && (
            <PillBtn
              active={statusFilter === "bookmarked"}
              onClick={() => setStatusFilter("bookmarked")}
              label="BOOKMARKED"
              count={counts.bookmarked}
              color="var(--accent)"
            />
          )}
          <button
            onClick={surpriseMe}
            className="ml-auto flex items-center gap-2 px-3 py-2 border border-[var(--accent)] text-[var(--accent)] font-mono text-[10px] tracking-[0.15em] uppercase hover:bg-[var(--accent)] hover:text-[#0F0E0C] transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>FEELING LUCKY</span>
          </button>
        </div>

        {/* Search + sort row */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7568]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH BY NAME, ORG, COMPANY, OR TAG…"
              className="w-full pl-10 pr-3 py-2 bg-[#13110E] border border-[#2A2722] text-[var(--paper)] placeholder-[#7A7568] focus:border-[var(--accent)] focus:outline-none font-mono text-[11px] tracking-[0.05em] uppercase"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7A7568] hover:text-[var(--paper)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <SortMenu value={sort} onChange={setSort} />
        </div>

        {/* Quick toggles row */}
        <div className="flex flex-wrap gap-2 mb-3">
          <ToggleBtn
            active={beginnerOnly}
            onClick={() => setBeginnerOnly((v) => !v)}
            label="BEGINNER ONLY"
            icon="★"
          />
          <ToggleBtn
            active={freeOnly}
            onClick={() => setFreeOnly((v) => !v)}
            label="FREE ONLY"
            icon="$"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] text-[#7A7568] uppercase pr-1">
            <Filter className="w-3 h-3" />
            FILTERS:
          </span>
          {FILTER_DIMS.map((dim) => (
            <FilterDropdown
              key={dim.key}
              dim={dim}
              value={filters[dim.key]}
              onChange={(v) => setFilters((f) => ({ ...f, [dim.key]: v }))}
            />
          ))}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 font-mono text-[10px] tracking-[0.1em] uppercase text-[#FF8B86] hover:text-[#FFB3B0]"
            >
              ✕ CLEAR ALL ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="font-mono text-[10px] tracking-[0.15em] text-[#7A7568] uppercase mb-4 pb-3 border-b border-[#1F1D1A]">
          {filtered.length === 0
            ? "NO MATCHES — TRY ADJUSTING FILTERS"
            : `SHOWING ${filtered.length} OF ${events.length} OPPORTUNITIES`}
          {sort !== "newest" && ` · SORTED BY ${sort.toUpperCase()}`}
        </div>

        {/* Results grid OR empty state */}
        {filtered.length === 0 ? (
          <EmptyState onReset={clearAllFilters} onSurprise={surpriseMe} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onSelect={setSelected}
                isBookmarked={bookmarked.has(e.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* === FOOTER === */}
      <Footer meta={meta} />

      {/* === DETAIL PANEL === */}
      {selected && (
        <DetailPanel
          event={selected}
          onClose={() => setSelected(null)}
          isBookmarked={bookmarked.has(selected.id)}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {/* === ABOUT MODAL === */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} meta={meta} />}

      {/* === KEYFRAMES === */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.35s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .font-display {
          font-family: 'Fraunces', Georgia, serif;
          font-feature-settings: 'ss01' on, 'ss02' on;
        }
        .font-mono {
          font-family: 'JetBrains Mono', Menlo, monospace;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function PillBtn({ active, onClick, label, count, color = "#7A7568", pulse = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 border font-mono text-[10px] tracking-[0.15em] uppercase transition-colors"
      style={{
        borderColor: active ? color : "#2A2722",
        backgroundColor: active ? color + "15" : "transparent",
        color: active ? color : "#A8A299",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: color,
          animation: pulse && active ? "pulse 2s infinite" : "none",
        }}
      />
      <span>{label}</span>
      <span className="text-[#7A7568]">·</span>
      <span style={{ color: active ? color : "#A8A299" }}>{count}</span>
    </button>
  );
}

function ToggleBtn({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 border font-mono text-[10px] tracking-[0.15em] uppercase transition-all"
      style={{
        borderColor: active ? "var(--accent)" : "#2A2722",
        backgroundColor: active ? "rgba(216, 255, 61, 0.08)" : "#13110E",
        color: active ? "var(--accent)" : "#A8A299",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ onReset, onSurprise }) {
  return (
    <div className="py-16 text-center max-w-md mx-auto">
      <div className="font-mono text-[10px] tracking-[0.2em] text-[#7A7568] uppercase mb-4">
        TRANSMISSION QUIET
      </div>
      <h3 className="font-display text-3xl text-[var(--paper)] mb-3">
        Nothing matches that combination —
      </h3>
      <p className="text-[14px] text-[#B8B0A0] mb-8">
        — but loosening the filters often surfaces something better than what you were looking for.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onReset}
          className="px-5 py-2.5 border border-[var(--accent)] text-[var(--accent)] font-mono text-[10px] tracking-[0.15em] uppercase hover:bg-[var(--accent)] hover:text-[#0F0E0C] transition-colors"
        >
          CLEAR ALL FILTERS
        </button>
        <button
          onClick={onSurprise}
          className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#2A2722] text-[#A8A299] font-mono text-[10px] tracking-[0.15em] uppercase hover:border-[#4A453B] transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          SURPRISE ME INSTEAD
        </button>
      </div>
    </div>
  );
}

function Footer({ meta }) {
  return (
    <footer className="border-t border-[#1F1D1A] mt-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Manifesto */}
        <div className="max-w-3xl mb-12">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)] uppercase mb-4">
            ▸ MANIFESTO
          </div>
          <h3 className="font-display text-2xl sm:text-3xl text-[var(--paper)] leading-snug mb-4">
            The truth most people never figure out:
          </h3>
          <p className="text-[15px] sm:text-base text-[#B8B0A0] leading-relaxed mb-3">
            Almost nobody is gatekeeping you. The vast majority of these competitions, accelerators,
            and fellowships are <em className="text-[var(--paper)] not-italic font-semibold">actively trying to find you</em>.
            They have prize budgets that need to be spent. They have application portals
            with empty seats. They have organizers losing sleep over whether anyone will show up.
          </p>
          <p className="text-[15px] sm:text-base text-[#B8B0A0] leading-relaxed mb-3">
            Most people don't apply because they assume they're not ready. The people who do apply
            usually weren't ready either — they just applied anyway, then figured it out. That's the
            whole secret.
          </p>
          <p className="text-[15px] sm:text-base text-[#B8B0A0] leading-relaxed">
            One application takes 30 minutes. Submit it.
          </p>
        </div>

        {/* CTA cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 border border-[#1F1D1A] hover:border-[#3A3530] transition-colors group"
          >
            <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--accent)] uppercase mb-2">
              ▸ MISSING AN EVENT?
            </div>
            <div className="font-display text-xl text-[var(--paper)] mb-1 group-hover:text-[var(--accent)] transition-colors">
              Submit it for the next sweep →
            </div>
            <div className="text-[13px] text-[#7A7568]">
              Open a PR or issue on the GitHub. Drop a link, we add it.
            </div>
          </a>
          <a
            href="#top"
            className="block p-5 border border-[#1F1D1A] hover:border-[#3A3530] transition-colors group"
          >
            <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--accent)] uppercase mb-2">
              ▸ STILL LOST?
            </div>
            <div className="font-display text-xl text-[var(--paper)] mb-1 group-hover:text-[var(--accent)] transition-colors">
              Try the BEGINNER + FREE filter →
            </div>
            <div className="text-[13px] text-[#7A7568]">
              {meta.beginner_friendly_count || 39} events explicitly welcome first-timers. Cost-free entry.
            </div>
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-8 border-t border-[#1F1D1A]">
          <div className="font-mono text-[9px] tracking-[0.15em] text-[#7A7568] uppercase">
            FIELD STATION · {meta.total_events || 124} OPPORTUNITIES · UPDATED{" "}
            {meta.last_sweep || "05 MAY 2026"}
          </div>
          <div className="font-mono text-[9px] tracking-[0.15em] text-[#3A3530] uppercase">
            EVERYTHING HERE IS A POSSIBLE TURNING POINT.
          </div>
        </div>
      </div>
    </footer>
  );
}

function AboutModal({ onClose, meta }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(11, 10, 8, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#0F0E0C] border border-[#1F1D1A] max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 sm:px-10 py-3 flex items-center border-b border-[#1F1D1A]">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#7A7568] uppercase">
            ABOUT THIS FIELD STATION
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-[#1F1D1A] rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#A8A299]" />
          </button>
        </div>
        <div className="px-6 sm:px-10 py-8">
          <h2 className="font-display text-3xl text-[var(--paper)] mb-4">
            What this is, briefly.
          </h2>
          <p className="text-[14px] text-[#B8B0A0] mb-4 leading-relaxed">
            A daily-updated index of competitions, hackathons, accelerators, fellowships, and
            olympiads — focused on opportunities that might actually change a young person's
            trajectory. It runs on a Python scraper that surveys Devpost, dev.events, lablab.ai,
            university hackathon pages, accelerator portals, and government innovation programs every
            morning at 09:00 SGT.
          </p>
          <p className="text-[14px] text-[#B8B0A0] mb-4 leading-relaxed">
            Each entry is normalized into a structured dossier with deadline urgency, difficulty
            tier, cost transparency, and beginner-friendliness. Built as an antidote to the standard
            internet experience of "I keep hearing about cool opportunities but I never know about
            them in time."
          </p>

          <div className="grid grid-cols-2 gap-4 my-6 py-4 border-y border-[#1F1D1A]">
            <Stat icon={Calendar} label="LAST SWEEP" value={meta.last_sweep || "05 MAY 2026"} />
            <Stat icon={Trophy} label="VERSION" value={meta.version || "2.0"} />
            <Stat icon={Activity} label="TOTAL EVENTS" value={meta.total_events || 124} />
            <Stat
              icon={Sparkles}
              label="NEW THIS SWEEP"
              value={meta.new_this_run || 91}
            />
          </div>

          <div className="font-mono text-[10px] tracking-[0.18em] text-[#7A7568] uppercase mb-3">
            ▸ WHAT'S TRACKED
          </div>
          <ul className="space-y-2 text-[13px] text-[#B8B0A0] mb-6">
            <li>· Singapore school olympiads (math, physics, chem, bio, astronomy, informatics)</li>
            <li>· Singapore tertiary hackathons (NUS, NTU, SMU, polytechnic)</li>
            <li>· Major League Hacking season (200+ student events globally)</li>
            <li>· ETHGlobal Web3 stops (Cannes, NYC, Lisbon, Tokyo, Mumbai)</li>
            <li>· LabLab.ai online AI hackathons (rolling)</li>
            <li>· Top US college hackathons (TreeHacks, HackMIT, HackPrinceton, Cal Hacks)</li>
            <li>· Climate, healthcare, women-in-tech specialty events</li>
            <li>· Founder fellowships (YC, Thiel, Rhodes, Knight-Hennessy, a16z)</li>
            <li>· Singapore government programs (MAS, IMDA, GovTech)</li>
          </ul>

          <div className="font-mono text-[10px] tracking-[0.18em] text-[#7A7568] uppercase mb-3">
            ▸ HOW TO USE
          </div>
          <ul className="space-y-2 text-[13px] text-[#B8B0A0]">
            <li>1. Check DEADLINE WATCH at the top — anything urgent gets surfaced first.</li>
            <li>2. Hit BEGINNER ONLY if you're new — narrows to 39 explicit beginner events.</li>
            <li>3. Hit FREE ONLY to remove paid registrations — 113 events stay.</li>
            <li>4. Bookmark anything interesting, then filter to BOOKMARKED to revisit.</li>
            <li>5. When stuck: hit FEELING LUCKY for a random open opportunity.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
