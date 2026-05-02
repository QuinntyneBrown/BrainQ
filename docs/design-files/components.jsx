// BrainQ — shared primitives & UI atoms.
// Type system: Newsreader (display serif), Inter Tight (UI), JetBrains Mono (meta).

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Iconography (hairline strokes) ──────────────────────────────
function Icon({ name, size = 20, stroke = 1.4 }) {
  const s = size;
  const sw = stroke;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "today":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
    case "capture":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "brain":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="2" />
          <circle cx="17" cy="7" r="2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M9 7h6M9 17h6M7 9v6M17 9v6M8.5 8.5l2 2M15.5 8.5l-2 2M8.5 15.5l2-2M15.5 15.5l-2-2" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.6-3.6" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4.5 4.5L19 7" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "dot":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 4v6M12 14v6M4 12h6M14 12h6" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
          <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="18" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Glyph for entity type (small, monochrome) ───────────────────
function TypeGlyph({ type, size = 14 }) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (type) {
    case "Person":
      return (
        <svg {...common}>
          <circle cx="8" cy="6" r="2.6" />
          <path d="M3 14c1.2-2.4 3-3.5 5-3.5s3.8 1.1 5 3.5" />
        </svg>
      );
    case "Project":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="10" height="9" rx="1.2" />
          <path d="M6 7.5h4M6 10.5h3" />
        </svg>
      );
    case "Commitment":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5" />
          <path d="M8 5v3l2 1.5" />
        </svg>
      );
    case "Note":
      return (
        <svg {...common}>
          <path d="M4 3h6l3 3v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M10 3v3h3" />
        </svg>
      );
    case "Idea":
      return (
        <svg {...common}>
          <path d="M8 2v1.5M3 5l1 1M13 5l-1 1M5 9a3 3 0 1 1 6 0c0 1.5-1 2-1 3H6c0-1-1-1.5-1-3Z" />
          <path d="M6.5 13.5h3" />
        </svg>
      );
    default:
      return null;
  }
}

const TYPE_LABEL = {
  Person: "person",
  Project: "project",
  Commitment: "commitment",
  Note: "note",
  Idea: "idea",
};

const EDGE_LABEL = {
  mentions: "mentions",
  blocks: "blocks",
  fulfills: "fulfills",
  relatesTo: "relates to",
};

// ── Chip ────────────────────────────────────────────────────────
function Chip({ children, active, onClick, glyph, as = "button" }) {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      className={"bq-chip" + (active ? " is-active" : "")}
      type={as === "button" ? "button" : undefined}
    >
      {glyph ? <span className="bq-chip-glyph"><TypeGlyph type={glyph} size={12} /></span> : null}
      <span>{children}</span>
    </Tag>
  );
}

// ── Section header ──────────────────────────────────────────────
function SectionLabel({ children, count, action }) {
  return (
    <div className="bq-section-label">
      <span className="bq-meta">{children}</span>
      {count != null ? <span className="bq-meta bq-meta-dim">{count}</span> : null}
      {action ? <span className="bq-section-action">{action}</span> : null}
    </div>
  );
}

// ── Entity row (list item) ──────────────────────────────────────
function EntityRow({ entity, onOpen, dense }) {
  return (
    <button
      className={"bq-entity-row" + (dense ? " is-dense" : "")}
      onClick={() => onOpen(entity.id)}
      type="button"
    >
      <span className="bq-entity-glyph"><TypeGlyph type={entity.type} size={14} /></span>
      <span className="bq-entity-body">
        <span className="bq-entity-title">{entity.title}</span>
        <span className="bq-entity-sub bq-meta bq-meta-dim">
          {TYPE_LABEL[entity.type]} · {entity.subtitle}
        </span>
      </span>
      <span className="bq-entity-chev"><Icon name="arrow" size={14} stroke={1.2} /></span>
    </button>
  );
}

// ── Progress ring ───────────────────────────────────────────────
function Ring({ value, size = 36, stroke = 2.4, accented }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg width={size} height={size} className={"bq-ring" + (accented ? " is-accent" : "")}>
      <circle cx={size / 2} cy={size / 2} r={r} className="bq-ring-track" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="bq-ring-fill"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ── Heatmap (commitment activity) ───────────────────────────────
function Heatmap({ data }) {
  return (
    <div className="bq-heatmap" aria-hidden="true">
      {data.map((col, i) => (
        <div key={i} className="bq-heatmap-col">
          {col.map((v, j) => (
            <div key={j} className={"bq-heatmap-cell bq-h-" + v} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Edge chip (typed relationship) ──────────────────────────────
function EdgeChip({ kind, target, onOpen }) {
  const t = window.entityById[target];
  if (!t) return null;
  return (
    <button className="bq-edge-chip" onClick={() => onOpen(t.id)} type="button">
      <span className="bq-meta bq-meta-dim">{EDGE_LABEL[kind]}</span>
      <span className="bq-edge-arrow">→</span>
      <span className="bq-edge-glyph"><TypeGlyph type={t.type} size={11} /></span>
      <span className="bq-edge-title">{t.title}</span>
    </button>
  );
}

Object.assign(window, {
  Icon,
  TypeGlyph,
  Chip,
  SectionLabel,
  EntityRow,
  Ring,
  Heatmap,
  EdgeChip,
  TYPE_LABEL,
  EDGE_LABEL,
});
