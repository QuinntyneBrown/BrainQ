// BrainQ — app shell, tab bar, routing.

const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "terracotta",
  "density": "cozy"
}/*EDITMODE-END*/;

const ACCENTS = {
  terracotta: { name: "terracotta", hue: 40, chroma: 0.13 },
  ink: { name: "ink", hue: 260, chroma: 0.04 },
  moss: { name: "moss", hue: 145, chroma: 0.08 },
  ochre: { name: "ochre", hue: 75, chroma: 0.13 },
  rose: { name: "rose", hue: 15, chroma: 0.12 },
};

function applyTheme(t) {
  const root = document.documentElement;
  root.dataset.theme = t.theme;
  const a = ACCENTS[t.accent] || ACCENTS.terracotta;
  root.style.setProperty("--bq-accent", `oklch(0.62 ${a.chroma} ${a.hue})`);
  root.style.setProperty("--bq-accent-soft", `oklch(0.92 ${a.chroma * 0.35} ${a.hue})`);
  root.style.setProperty("--bq-accent-ink", `oklch(0.42 ${a.chroma} ${a.hue})`);
  root.dataset.density = t.density;
}

function App() {
  const [tab, setTab] = uS("today");
  const [openId, setOpenId] = uS(null);
  const [captureOpen, setCaptureOpen] = uS(false);
  const [toast, setToast] = uS(null);
  const [tweaks, setTweak] = window.useTweaks(DEFAULT_TWEAKS);

  uE(() => {
    applyTheme(tweaks);
  }, [tweaks]);

  const openEntity = (id) => setOpenId(id);
  const closeEntity = () => setOpenId(null);

  const onCommit = (payload) => {
    setToast(`Saved as ${window.TYPE_LABEL[payload.type]} · linked to your brain`);
    setTimeout(() => setToast(null), 2400);
  };

  const onCapture = () => setCaptureOpen(true);

  return (
    <div className="bq-app" data-screen-label="BrainQ">
      {/* Desktop side rail (xl only) */}
      <SideRail tab={tab} setTab={setTab} onCapture={onCapture} />

      <div className="bq-stage">
        <div className="bq-stage-inner">
          {tab === "today" ? (
            <window.TodayScreen onOpen={openEntity} onCapture={onCapture} />
          ) : null}
          {tab === "brain" ? <window.BrainScreen onOpen={openEntity} /> : null}
          {tab === "search" ? <window.SearchScreen onOpen={openEntity} /> : null}
        </div>

        {openId ? (
          <div className="bq-detail-overlay">
            <window.DetailScreen
              id={openId}
              onBack={closeEntity}
              onOpen={(id) => setOpenId(id)}
            />
          </div>
        ) : null}

        <window.CaptureSheet
          open={captureOpen}
          onClose={() => setCaptureOpen(false)}
          onCommit={onCommit}
        />

        {toast ? (
          <div className="bq-toast">
            <window.Icon name="check" size={14} stroke={1.6} />
            <span>{toast}</span>
          </div>
        ) : null}
      </div>

      {/* Desktop context pane (xl only) — screen-aware */}
      <ContextPane tab={tab} openId={openId} onOpen={openEntity} />

      {/* Mobile tab bar (hidden on xl) */}
      <TabBar tab={tab} setTab={setTab} onCapture={onCapture} />

      <BQTweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

// ── Desktop side rail ──────────────────────────────────────────────
function SideRail({ tab, setTab, onCapture }) {
  const items = [
    { id: "today", icon: "today", label: "Today" },
    { id: "brain", icon: "brain", label: "Brain" },
    { id: "search", icon: "search", label: "Search" },
  ];
  return (
    <aside className="bq-rail" aria-label="Primary">
      <div className="bq-rail-brand">
        <span className="bq-rail-mark">BQ</span>
        <span className="bq-rail-wordmark">BrainQ</span>
      </div>

      <button className="bq-rail-capture" onClick={onCapture} type="button">
        <window.Icon name="capture" size={16} stroke={1.6} />
        <span>Capture</span>
        <span className="bq-rail-kbd">N</span>
      </button>

      <nav className="bq-rail-nav">
        {items.map((it) => (
          <button
            key={it.id}
            className={"bq-rail-item" + (tab === it.id ? " is-active" : "")}
            onClick={() => setTab(it.id)}
            type="button"
          >
            <window.Icon name={it.icon} size={18} stroke={1.4} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="bq-rail-meta">
        <div className="bq-meta bq-meta-dim">storage</div>
        <div className="bq-rail-storage">PostgreSQL · pgvector</div>
        <div className="bq-meta bq-meta-dim">18 entities · 23 edges</div>
      </div>
    </aside>
  );
}

// ── Desktop context pane ───────────────────────────────────────────
function ContextPane({ tab, openId, onOpen }) {
  // When something is open, show its graph neighbors regardless of tab
  if (openId) return <NeighborhoodPane id={openId} onOpen={onOpen} />;
  if (tab === "today") return <TodayContextPane onOpen={onOpen} />;
  if (tab === "brain") return <BrainContextPane onOpen={onOpen} />;
  if (tab === "search") return <SearchContextPane />;
  return null;
}

function TodayContextPane({ onOpen }) {
  // Aggregate stats — what the brain looks like today
  const all = window.seedEntities;
  const counts = {};
  for (const e of all) counts[e.type] = (counts[e.type] || 0) + 1;
  const totalEdges = all.reduce((acc, e) => acc + (e.edges?.length || 0), 0);
  const overdue = all.filter((e) => e.tags?.includes("overdue"));
  const ideas = all.filter((e) => e.type === "Idea" && e.meta?.heat === "warm");

  return (
    <aside className="bq-ctx" aria-label="Context">
      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">SHAPE OF YOUR BRAIN</div>
        <div className="bq-ctx-shape">
          {Object.entries(counts).map(([type, n]) => (
            <div key={type} className="bq-ctx-shape-row">
              <span className="bq-entity-glyph"><window.TypeGlyph type={type} size={12} /></span>
              <span className="bq-ctx-shape-label">{window.TYPE_LABEL[type]}s</span>
              <span className="bq-ctx-shape-bar">
                <span style={{ width: (n / 8) * 100 + "%" }} />
              </span>
              <span className="bq-meta">{n}</span>
            </div>
          ))}
        </div>
        <div className="bq-ctx-edge-count">
          <span className="bq-display-num">{totalEdges}</span>
          <span className="bq-meta bq-meta-dim">typed edges across the graph</span>
        </div>
      </div>

      {ideas.length ? (
        <div className="bq-ctx-block">
          <div className="bq-meta bq-meta-dim">WARM IDEAS</div>
          <div className="bq-rows">
            {ideas.map((e) => (
              <window.EntityRow key={e.id} entity={e} onOpen={onOpen} dense />
            ))}
          </div>
        </div>
      ) : null}

      {overdue.length ? (
        <div className="bq-ctx-block">
          <div className="bq-meta bq-meta-dim">QUIET CIRCLES</div>
          <div className="bq-rows">
            {overdue.map((e) => (
              <window.EntityRow key={e.id} entity={e} onOpen={onOpen} dense />
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function BrainContextPane({ onOpen }) {
  // Show edge type legend and a "most connected" leaderboard
  const all = window.seedEntities;
  const connections = all.map((e) => {
    const inb = (window.inboundEdges[e.id] || []).length;
    const out = e.edges?.length || 0;
    return { e, total: inb + out };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  const edgeKinds = ["mentions", "blocks", "fulfills", "relatesTo"];

  return (
    <aside className="bq-ctx" aria-label="Context">
      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">EDGE TYPES</div>
        <div className="bq-ctx-edges">
          {edgeKinds.map((k) => (
            <div key={k} className="bq-ctx-edge-row">
              <span className={"bq-edge-marker bq-em-" + k} />
              <span className="bq-ctx-edge-label">{window.EDGE_LABEL[k]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">MOST CONNECTED</div>
        <div className="bq-rows">
          {connections.map(({ e, total }) => (
            <button
              key={e.id}
              className="bq-entity-row is-dense"
              onClick={() => onOpen(e.id)}
              type="button"
            >
              <span className="bq-entity-glyph"><window.TypeGlyph type={e.type} size={14} /></span>
              <span className="bq-entity-body">
                <span className="bq-entity-title">{e.title}</span>
                <span className="bq-meta bq-meta-dim">{total} connections</span>
              </span>
              <span className="bq-entity-chev"><window.Icon name="arrow" size={14} stroke={1.2} /></span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SearchContextPane() {
  return (
    <aside className="bq-ctx" aria-label="Context">
      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">QUERY MODES</div>
        <div className="bq-ctx-mode">
          <div className="bq-ctx-mode-name">structured</div>
          <p className="bq-ctx-mode-desc">
            Direct EF Core queries against indexed columns — title, body, tags, edge kinds. Fast, deterministic, no embedding round-trip.
          </p>
        </div>
        <div className="bq-ctx-mode">
          <div className="bq-ctx-mode-name">semantic</div>
          <p className="bq-ctx-mode-desc">
            pgvector cosine similarity against the embedding column. Finds things you remember by feel rather than by word.
          </p>
        </div>
      </div>

      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">OPERATORS</div>
        <ul className="bq-ctx-ops">
          <li><span className="bq-mono-tag">type:person</span><span>filter to one entity type</span></li>
          <li><span className="bq-mono-tag">tag:work</span><span>match a tag</span></li>
          <li><span className="bq-mono-tag">~30 days</span><span>recency window</span></li>
          <li><span className="bq-mono-tag">→ project</span><span>edge to type</span></li>
        </ul>
      </div>
    </aside>
  );
}

function NeighborhoodPane({ id, onOpen }) {
  const e = window.entityById[id];
  if (!e) return null;
  const inbound = window.inboundEdges[id] || [];
  const outbound = e.edges || [];

  // Build a small radial graph SVG (deterministic layout)
  const center = { x: 110, y: 110 };
  const radius = 78;
  const nodes = [
    ...outbound.map((edge) => ({ id: edge.to, kind: edge.kind, dir: "out" })),
    ...inbound.map((inb) => ({ id: inb.from, kind: inb.kind, dir: "in" })),
  ];
  const positioned = nodes.map((n, i) => {
    const a = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      ...n,
      x: center.x + Math.cos(a) * radius,
      y: center.y + Math.sin(a) * radius,
      entity: window.entityById[n.id],
    };
  }).filter((n) => n.entity);

  return (
    <aside className="bq-ctx" aria-label="Connections">
      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">NEIGHBORHOOD</div>
        <svg className="bq-graph" viewBox="0 0 220 220" width="100%">
          {positioned.map((n, i) => (
            <line
              key={"l" + i}
              x1={center.x} y1={center.y}
              x2={n.x} y2={n.y}
              className={"bq-graph-edge bq-em-" + n.kind}
            />
          ))}
          <circle cx={center.x} cy={center.y} r="22" className="bq-graph-center" />
          <text x={center.x} y={center.y + 4} textAnchor="middle" className="bq-graph-center-text">
            {e.title.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </text>
          {positioned.map((n, i) => (
            <g key={"n" + i} className="bq-graph-node" onClick={() => onOpen(n.id)}>
              <circle cx={n.x} cy={n.y} r="14" />
              <text x={n.x} y={n.y + 3} textAnchor="middle" className="bq-graph-node-text">
                {n.entity.title.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="bq-ctx-block">
        <div className="bq-meta bq-meta-dim">NEIGHBORS</div>
        <div className="bq-rows">
          {positioned.map((n, i) => (
            <button
              key={i}
              className="bq-entity-row is-dense"
              onClick={() => onOpen(n.id)}
              type="button"
            >
              <span className="bq-entity-glyph"><window.TypeGlyph type={n.entity.type} size={14} /></span>
              <span className="bq-entity-body">
                <span className="bq-entity-title">{n.entity.title}</span>
                <span className="bq-meta bq-meta-dim">
                  {n.dir === "out" ? "→" : "←"} {window.EDGE_LABEL[n.kind]}
                </span>
              </span>
              <span className="bq-entity-chev"><window.Icon name="arrow" size={14} stroke={1.2} /></span>
            </button>
          ))}
          {positioned.length === 0 ? (
            <div className="bq-empty bq-meta bq-meta-dim">No connections yet.</div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function TabBar({ tab, setTab, onCapture }) {
  const items = [
    { id: "today", icon: "today", label: "Today" },
    { id: "brain", icon: "brain", label: "Brain" },
    { id: "_capture", icon: "capture", label: "Capture", capture: true },
    { id: "search", icon: "search", label: "Search" },
  ];
  return (
    <nav className="bq-tabbar">
      {items.map((it) => {
        const active = tab === it.id;
        if (it.capture) {
          return (
            <button
              key={it.id}
              className="bq-tab bq-tab-capture"
              onClick={onCapture}
              type="button"
              aria-label="Capture"
            >
              <span className="bq-tab-capture-disk">
                <window.Icon name={it.icon} size={20} stroke={1.6} />
              </span>
              <span className="bq-tab-label">{it.label}</span>
            </button>
          );
        }
        return (
          <button
            key={it.id}
            className={"bq-tab" + (active ? " is-active" : "")}
            onClick={() => setTab(it.id)}
            type="button"
            aria-current={active ? "page" : undefined}
          >
            <window.Icon name={it.icon} size={20} stroke={1.4} />
            <span className="bq-tab-label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function BQTweaks({ tweaks, setTweak }) {
  const { TweaksPanel, TweakSection, TweakRadio, TweakSelect } = window;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Theme">
        <TweakRadio
          label="mode"
          value={tweaks.theme}
          options={[
            { value: "light", label: "light" },
            { value: "sepia", label: "sepia" },
            { value: "dark", label: "dark" },
          ]}
          onChange={(v) => setTweak("theme", v)}
        />
      </TweakSection>
      <TweakSection title="Accent">
        <TweakSelect
          label="hue"
          value={tweaks.accent}
          options={[
            { value: "terracotta", label: "terracotta" },
            { value: "ink", label: "ink" },
            { value: "moss", label: "moss" },
            { value: "ochre", label: "ochre" },
            { value: "rose", label: "rose" },
          ]}
          onChange={(v) => setTweak("accent", v)}
        />
      </TweakSection>
      <TweakSection title="Density">
        <TweakRadio
          label="rhythm"
          value={tweaks.density}
          options={[
            { value: "cozy", label: "cozy" },
            { value: "compact", label: "compact" },
          ]}
          onChange={(v) => setTweak("density", v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
