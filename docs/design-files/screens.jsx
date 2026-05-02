// BrainQ — screens.

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

// ── TODAY ─────────────────────────────────────────────────────────
function TodayScreen({ onOpen, onCapture, accent }) {
  const ag = window.todayAgenda;
  const commitments = window.seedEntities.filter((e) => e.type === "Commitment");
  const recentEntities = ag.recent.map((id) => window.entityById[id]).filter(Boolean);

  return (
    <div className="bq-screen">
      <header className="bq-today-head">
        <div className="bq-meta bq-meta-dim">{ag.date.toUpperCase()}</div>
        <h1 className="bq-display">{ag.greeting}.</h1>
      </header>

      <button className="bq-capture-prompt" onClick={onCapture} type="button">
        <span className="bq-capture-prompt-text">{ag.prompt}</span>
        <span className="bq-capture-prompt-hint">
          <span className="bq-meta bq-meta-dim">tap to capture</span>
          <window.Icon name="arrow" size={14} stroke={1.2} />
        </span>
      </button>

      <section className="bq-block">
        <window.SectionLabel count={commitments.length}>Commitments</window.SectionLabel>
        <div className="bq-commit-grid">
          {commitments.map((c) => (
            <CommitmentCell key={c.id} entity={c} onOpen={onOpen} />
          ))}
        </div>
      </section>

      {ag.nudges.length ? (
        <section className="bq-block">
          <window.SectionLabel>On your mind</window.SectionLabel>
          <ul className="bq-nudges">
            {ag.nudges.map((n) => {
              const e = window.entityById[n.entityId];
              return (
                <li key={n.id} className="bq-nudge" onClick={() => onOpen(n.entityId)}>
                  <span className="bq-nudge-mark" />
                  <span className="bq-nudge-text">{n.text}</span>
                  {e ? (
                    <span className="bq-nudge-tail">
                      <window.TypeGlyph type={e.type} size={11} />
                      <span className="bq-meta bq-meta-dim">{e.title}</span>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="bq-block">
        <window.SectionLabel>Recently touched</window.SectionLabel>
        <div className="bq-rows">
          {recentEntities.map((e) => (
            <window.EntityRow key={e.id} entity={e} onOpen={onOpen} />
          ))}
        </div>
      </section>

      <footer className="bq-footnote bq-meta bq-meta-dim">
        BrainQ · 18 entities · 23 edges · synced 2 min ago
      </footer>
    </div>
  );
}

function CommitmentCell({ entity, onOpen }) {
  const m = entity.meta;
  const value = m.todayDone ? 1 : 0.32;
  return (
    <button className="bq-commit-cell" onClick={() => onOpen(entity.id)} type="button">
      <div className="bq-commit-ring-wrap">
        <window.Ring value={value} size={44} stroke={2.4} accented={m.todayDone} />
        {m.todayDone ? (
          <span className="bq-commit-check"><window.Icon name="check" size={14} stroke={1.6} /></span>
        ) : null}
      </div>
      <div className="bq-commit-text">
        <div className="bq-commit-title">{entity.title}</div>
        <div className="bq-meta bq-meta-dim">
          {m.streak}-day streak · {m.cadence}
        </div>
      </div>
    </button>
  );
}

// ── CAPTURE ───────────────────────────────────────────────────────
function CaptureSheet({ open, onClose, onCommit }) {
  const [text, setText] = useS("");
  const [type, setType] = useS("auto");
  const ref = useR(null);

  useE(() => {
    if (open) {
      setTimeout(() => ref.current?.focus(), 80);
    } else {
      setText("");
      setType("auto");
    }
  }, [open]);

  // Auto-classify: very simple heuristic to feel alive.
  const inferred = useM(() => {
    const t = text.toLowerCase().trim();
    if (!t) return "Note";
    if (/\b(idea|what if|maybe i could|possibility)\b/.test(t)) return "Idea";
    if (/\b(every day|daily|each week|commit|goal of)\b/.test(t)) return "Commitment";
    if (/\b(met|coffee with|called|emailed|birthday)\b/.test(t) || /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text)) return "Person";
    if (/\bproject\b|\bship\b|\bdeadline\b|\bmilestone\b/.test(t)) return "Project";
    return "Note";
  }, [text]);

  const finalType = type === "auto" ? inferred : type;

  // Suggested links: any word that matches a known entity title/tag.
  const suggested = useM(() => {
    if (!text.trim()) return [];
    const words = text.toLowerCase();
    return window.seedEntities.filter((e) =>
      words.includes(e.title.toLowerCase().split(" ")[0]) ||
      (e.tags || []).some((tag) => words.includes(tag))
    ).slice(0, 3);
  }, [text]);

  if (!open) return null;

  return (
    <div className="bq-sheet-backdrop" onClick={onClose}>
      <div className="bq-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bq-sheet-handle" />
        <div className="bq-sheet-head">
          <div className="bq-meta bq-meta-dim">CAPTURE</div>
          <button className="bq-icon-btn" onClick={onClose} type="button" aria-label="Close">
            <window.Icon name="close" size={18} stroke={1.4} />
          </button>
        </div>

        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What\u2019s on your mind?"
          className="bq-capture-input"
          rows={4}
        />

        <div className="bq-capture-meta">
          <span className="bq-meta bq-meta-dim">Detected as</span>
          <span className="bq-detected">
            <window.TypeGlyph type={finalType} size={12} />
            <span>{window.TYPE_LABEL[finalType]}</span>
          </span>
        </div>

        <div className="bq-chip-row">
          <window.Chip active={type === "auto"} onClick={() => setType("auto")}>auto</window.Chip>
          {["Note", "Idea", "Person", "Project", "Commitment"].map((t) => (
            <window.Chip
              key={t}
              glyph={t}
              active={type === t}
              onClick={() => setType(t)}
            >
              {window.TYPE_LABEL[t]}
            </window.Chip>
          ))}
        </div>

        {suggested.length ? (
          <div className="bq-suggested">
            <div className="bq-meta bq-meta-dim">Looks related to</div>
            <div className="bq-suggested-list">
              {suggested.map((s) => (
                <span key={s.id} className="bq-edge-chip is-static">
                  <window.TypeGlyph type={s.type} size={11} />
                  <span className="bq-edge-title">{s.title}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bq-sheet-actions">
          <button className="bq-btn-ghost" onClick={onClose} type="button">Cancel</button>
          <button
            className="bq-btn-primary"
            disabled={!text.trim()}
            onClick={() => {
              onCommit({ type: finalType, text: text.trim() });
              onClose();
            }}
            type="button"
          >
            <span>Save to brain</span>
            <window.Icon name="arrow" size={14} stroke={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BRAIN (entities browser, default = Contacts/RecallQ focus) ────
function BrainScreen({ onOpen, initialFilter = "Person" }) {
  const [filter, setFilter] = useS(initialFilter);
  const [q, setQ] = useS("");

  const types = ["Person", "Project", "Commitment", "Note", "Idea"];
  const counts = useM(() => {
    const c = {};
    for (const t of types) c[t] = window.seedEntities.filter((e) => e.type === t).length;
    c.All = window.seedEntities.length;
    return c;
  }, []);

  const list = useM(() => {
    let xs = filter === "All" ? window.seedEntities : window.seedEntities.filter((e) => e.type === filter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      xs = xs.filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          (e.body || "").toLowerCase().includes(needle) ||
          (e.tags || []).some((t) => t.includes(needle))
      );
    }
    return xs;
  }, [filter, q]);

  return (
    <div className="bq-screen">
      <header className="bq-screen-head">
        <div className="bq-meta bq-meta-dim">YOUR BRAIN</div>
        <h1 className="bq-display-sm">
          {filter === "Person" ? "People you know" : filter === "All" ? "Everything" : window.TYPE_LABEL[filter] + "s"}
        </h1>
      </header>

      <div className="bq-search-bar">
        <window.Icon name="search" size={16} stroke={1.4} />
        <input
          className="bq-search-input"
          placeholder={filter === "Person" ? "Search by name, tag, last seen…" : "Filter…"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bq-chip-row bq-chip-row-scroll">
        <window.Chip active={filter === "All"} onClick={() => setFilter("All")}>
          all <span className="bq-chip-count">{counts.All}</span>
        </window.Chip>
        {types.map((t) => (
          <window.Chip
            key={t}
            glyph={t}
            active={filter === t}
            onClick={() => setFilter(t)}
          >
            {window.TYPE_LABEL[t]}s <span className="bq-chip-count">{counts[t]}</span>
          </window.Chip>
        ))}
      </div>

      {filter === "Person" ? <RecallQHead people={list} onOpen={onOpen} /> : null}

      <section className="bq-block">
        <window.SectionLabel count={list.length}>
          {filter === "All" ? "All entities" : "Sorted by recency"}
        </window.SectionLabel>
        <div className="bq-rows">
          {list.map((e) => (
            <window.EntityRow key={e.id} entity={e} onOpen={onOpen} />
          ))}
          {list.length === 0 ? (
            <div className="bq-empty bq-meta bq-meta-dim">No matches. Try capturing it.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

// RecallQ-style header: who's overdue, who's close, etc.
function RecallQHead({ people, onOpen }) {
  const overdue = people.filter((p) => p.tags.includes("overdue"));
  const close = people.filter((p) => p.tags.includes("close") || p.tags.includes("family"));

  return (
    <div className="bq-recallq">
      <div className="bq-recallq-band">
        <div className="bq-recallq-stat">
          <div className="bq-display-num">{people.length}</div>
          <div className="bq-meta bq-meta-dim">people in orbit</div>
        </div>
        <div className="bq-recallq-stat">
          <div className="bq-display-num">{overdue.length}</div>
          <div className="bq-meta bq-meta-dim">overdue to reach out</div>
        </div>
        <div className="bq-recallq-stat">
          <div className="bq-display-num">{close.length}</div>
          <div className="bq-meta bq-meta-dim">close circle</div>
        </div>
      </div>
      {overdue.length ? (
        <div className="bq-recallq-overdue">
          <div className="bq-meta">Worth a message</div>
          {overdue.map((p) => (
            <button key={p.id} className="bq-recallq-overdue-row" onClick={() => onOpen(p.id)} type="button">
              <span className="bq-name-init">{p.title.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
              <span className="bq-recallq-overdue-text">
                <span className="bq-entity-title">{p.title}</span>
                <span className="bq-meta bq-meta-dim">last seen {p.meta.lastSeen}</span>
              </span>
              <window.Icon name="arrow" size={14} stroke={1.2} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── DETAIL ────────────────────────────────────────────────────────
function DetailScreen({ id, onBack, onOpen }) {
  const e = window.entityById[id];
  if (!e) return null;
  const inbound = window.inboundEdges[id] || [];

  return (
    <div className="bq-screen bq-detail">
      <header className="bq-detail-head">
        <button className="bq-icon-btn" onClick={onBack} type="button" aria-label="Back">
          <window.Icon name="back" size={20} stroke={1.4} />
        </button>
        <div className="bq-detail-head-meta">
          <window.TypeGlyph type={e.type} size={12} />
          <span className="bq-meta bq-meta-dim">{window.TYPE_LABEL[e.type]}</span>
        </div>
        <button className="bq-icon-btn" type="button" aria-label="More">
          <window.Icon name="more" size={20} stroke={1.4} />
        </button>
      </header>

      <div className="bq-detail-body">
        {e.type === "Person" ? (
          <div className="bq-person-mark">
            {e.title.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
        ) : null}
        <h1 className="bq-display">{e.title}</h1>
        <div className="bq-meta bq-meta-dim">{e.subtitle}</div>

        <p className="bq-detail-body-text">{e.body}</p>

        {/* Type-specific meta */}
        {e.type === "Commitment" ? (
          <div className="bq-detail-card">
            <div className="bq-detail-card-row">
              <div>
                <div className="bq-meta bq-meta-dim">streak</div>
                <div className="bq-display-num">{e.meta.streak}</div>
              </div>
              <div>
                <div className="bq-meta bq-meta-dim">today</div>
                <div className="bq-display-num">{e.meta.todayDone ? "✓" : "—"}</div>
              </div>
              <div>
                <div className="bq-meta bq-meta-dim">target</div>
                <div className="bq-display-num">
                  {e.meta.target}
                  <span className="bq-display-num-unit"> {e.meta.unit}</span>
                </div>
              </div>
            </div>
            <window.Heatmap data={window.heatmap} />
            <div className="bq-meta bq-meta-dim bq-heatmap-caption">last 18 weeks · darker = more</div>
          </div>
        ) : null}

        {e.type === "Person" ? (
          <div className="bq-detail-card">
            <div className="bq-detail-card-row">
              <div>
                <div className="bq-meta bq-meta-dim">last seen</div>
                <div className="bq-stat-mid">{e.meta.lastSeen}</div>
              </div>
              <div>
                <div className="bq-meta bq-meta-dim">touchpoints</div>
                <div className="bq-stat-mid">{e.meta.touchpoints}</div>
              </div>
              <div>
                <div className="bq-meta bq-meta-dim">relationship</div>
                <div className="bq-stat-mid">{e.meta.relationship}</div>
              </div>
            </div>
          </div>
        ) : null}

        {e.type === "Project" ? (
          <div className="bq-detail-card">
            <div className="bq-detail-card-row">
              <div>
                <div className="bq-meta bq-meta-dim">status</div>
                <div className="bq-stat-mid">{e.meta.status}</div>
              </div>
              <div>
                <div className="bq-meta bq-meta-dim">due</div>
                <div className="bq-stat-mid">{e.meta.due}</div>
              </div>
              <div>
                <div className="bq-meta bq-meta-dim">progress</div>
                <div className="bq-stat-mid">{Math.round(e.meta.progress * 100)}%</div>
              </div>
            </div>
            <div className="bq-progress-bar">
              <div className="bq-progress-fill" style={{ width: e.meta.progress * 100 + "%" }} />
            </div>
          </div>
        ) : null}

        {/* Outbound edges */}
        {(e.edges || []).length ? (
          <section className="bq-detail-block">
            <window.SectionLabel>Connections</window.SectionLabel>
            <div className="bq-edge-list">
              {e.edges.map((edge, i) => (
                <window.EdgeChip key={i} kind={edge.kind} target={edge.to} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Inbound edges */}
        {inbound.length ? (
          <section className="bq-detail-block">
            <window.SectionLabel>Mentioned by</window.SectionLabel>
            <div className="bq-rows">
              {inbound.map((inb, i) => {
                const src = window.entityById[inb.from];
                if (!src) return null;
                return (
                  <button
                    key={i}
                    className="bq-entity-row is-dense"
                    onClick={() => onOpen(src.id)}
                    type="button"
                  >
                    <span className="bq-entity-glyph"><window.TypeGlyph type={src.type} size={14} /></span>
                    <span className="bq-entity-body">
                      <span className="bq-entity-title">{src.title}</span>
                      <span className="bq-meta bq-meta-dim">via {window.EDGE_LABEL[inb.kind]}</span>
                    </span>
                    <span className="bq-entity-chev"><window.Icon name="arrow" size={14} stroke={1.2} /></span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

// ── SEARCH ────────────────────────────────────────────────────────
function SearchScreen({ onOpen }) {
  const [q, setQ] = useS("");
  const [mode, setMode] = useS("structured"); // structured | semantic

  const results = useM(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    if (mode === "structured") {
      return window.seedEntities
        .map((e) => {
          let score = 0;
          if (e.title.toLowerCase().includes(needle)) score += 3;
          if ((e.body || "").toLowerCase().includes(needle)) score += 2;
          if ((e.tags || []).some((t) => t.includes(needle))) score += 1;
          return { e, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.e);
    }
    // Semantic — fake ranking by token-overlap score, with a different ordering
    return window.seedEntities
      .map((e) => {
        const hay = (e.title + " " + (e.body || "") + " " + (e.tags || []).join(" ")).toLowerCase();
        const tokens = needle.split(/\s+/).filter(Boolean);
        let score = 0;
        for (const t of tokens) {
          if (hay.includes(t)) score += 1;
          if (hay.includes(t.slice(0, 4))) score += 0.4;
        }
        // mild boost for ideas/notes in semantic mode
        if (e.type === "Idea" || e.type === "Note") score += 0.6;
        return { e, score };
      })
      .filter((x) => x.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.e);
  }, [q, mode]);

  return (
    <div className="bq-screen">
      <header className="bq-screen-head">
        <div className="bq-meta bq-meta-dim">SEARCH</div>
        <h1 className="bq-display-sm">Find anything you’ve thought about.</h1>
      </header>

      <div className="bq-search-bar bq-search-bar-lg">
        <window.Icon name="search" size={18} stroke={1.4} />
        <input
          className="bq-search-input"
          placeholder={mode === "semantic" ? "Describe what you\u2019re looking for…" : "name, word, or tag"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {q ? (
          <button className="bq-icon-btn" onClick={() => setQ("")} type="button" aria-label="Clear">
            <window.Icon name="close" size={16} stroke={1.4} />
          </button>
        ) : null}
      </div>

      <div className="bq-chip-row">
        <window.Chip active={mode === "structured"} onClick={() => setMode("structured")}>
          structured
        </window.Chip>
        <window.Chip active={mode === "semantic"} onClick={() => setMode("semantic")}>
          semantic
        </window.Chip>
        <span className="bq-meta bq-meta-dim bq-search-hint">
          {mode === "semantic" ? "pgvector · cosine" : "indexed columns"}
        </span>
      </div>

      {!q ? (
        <section className="bq-block">
          <window.SectionLabel>Try</window.SectionLabel>
          <div className="bq-suggestion-list">
            {[
              "people I haven\u2019t seen since February",
              "ideas about writing",
              "what Iris said about seams",
              "commitments I missed this week",
            ].map((s) => (
              <button key={s} className="bq-suggestion" onClick={() => { setMode("semantic"); setQ(s); }} type="button">
                <window.Icon name="spark" size={14} stroke={1.4} />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="bq-block">
          <window.SectionLabel count={results.length}>
            {mode === "semantic" ? "Closest in meaning" : "Direct matches"}
          </window.SectionLabel>
          <div className="bq-rows">
            {results.map((e) => (
              <window.EntityRow key={e.id} entity={e} onOpen={onOpen} />
            ))}
            {results.length === 0 ? (
              <div className="bq-empty bq-meta bq-meta-dim">Nothing yet. Try different words.</div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, {
  TodayScreen,
  CaptureSheet,
  BrainScreen,
  DetailScreen,
  SearchScreen,
});
