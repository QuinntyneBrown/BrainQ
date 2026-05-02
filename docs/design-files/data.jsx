// BrainQ — seed data. Mirrors a Q-Suite-style schema:
// typed entities (Person, Project, Commitment, Note, Idea) + typed edges (mentions, blocks, fulfills, relatesTo)

const TODAY = new Date(2026, 4, 1); // May 1, 2026

const seedEntities = [
  // ── People (RecallQ) ─────────────────────────────────────────
  {
    id: "p_amelia",
    type: "Person",
    title: "Amelia Bhatt",
    subtitle: "Friend · Bristol",
    body: "Met at the Calder talk in 2019. Architect, runs a small studio. Coffee every quarter or so.",
    meta: { lastSeen: "Apr 12, 2026", touchpoints: 14, relationship: "Close friend" },
    tags: ["close", "creative"],
    edges: [
      { kind: "relatesTo", to: "j_calder" },
      { kind: "mentions", to: "i_studio" },
    ],
  },
  {
    id: "p_jonas",
    type: "Person",
    title: "Jonas Reinhardt",
    subtitle: "Colleague · Berlin",
    body: "Backend lead on the Q-Suite. Owns the EF Core + pgvector groundwork.",
    meta: { lastSeen: "Apr 28, 2026", touchpoints: 38, relationship: "Colleague" },
    tags: ["work", "engineer"],
    edges: [{ kind: "fulfills", to: "pr_qsuite" }],
  },
  {
    id: "p_iris",
    type: "Person",
    title: "Iris Okafor",
    subtitle: "Mentor · Lisbon",
    body: "Ex-staff designer. Gave the advice about \"design from the seam, not the surface.\"",
    meta: { lastSeen: "Mar 03, 2026", touchpoints: 6, relationship: "Mentor" },
    tags: ["mentor"],
    edges: [{ kind: "mentions", to: "i_seams" }],
  },
  {
    id: "p_theo",
    type: "Person",
    title: "Theo Lindgren",
    subtitle: "Brother · Malmö",
    body: "Calls Sundays. Two kids — Vidar (6), Alma (3).",
    meta: { lastSeen: "Apr 27, 2026", touchpoints: 52, relationship: "Family" },
    tags: ["family"],
    edges: [],
  },
  {
    id: "p_calder",
    type: "Person",
    title: "Marian Calder",
    subtitle: "Author · —",
    body: "Wrote \"Slow Architectures.\" Re-reading. Influenced the schema-as-graph idea.",
    meta: { lastSeen: "—", touchpoints: 0, relationship: "Reference" },
    tags: ["reference"],
    edges: [{ kind: "relatesTo", to: "i_graph" }],
  },
  {
    id: "p_nadia",
    type: "Person",
    title: "Nadia Cole",
    subtitle: "Friend · Toronto",
    body: "Old housemate. Owes me a long email back. Birthday May 18.",
    meta: { lastSeen: "Feb 11, 2026", touchpoints: 9, relationship: "Friend" },
    tags: ["overdue"],
    edges: [],
  },

  // ── Projects ─────────────────────────────────────────────────
  {
    id: "pr_qsuite",
    type: "Project",
    title: "Q-Suite consolidation",
    subtitle: "Active · Q2",
    body: "Unify Commitments + RecallQ under a shared graph schema. Ship the EF Core migration by end of May.",
    meta: { status: "Active", due: "May 31", progress: 0.62 },
    tags: ["work"],
    edges: [
      { kind: "relatesTo", to: "p_jonas" },
      { kind: "blocks", to: "i_graph" },
    ],
  },
  {
    id: "pr_garden",
    type: "Project",
    title: "Balcony garden",
    subtitle: "Active · spring",
    body: "Tomatoes, basil, two chilies. Soil arrived Tuesday.",
    meta: { status: "Active", due: "—", progress: 0.3 },
    tags: ["home"],
    edges: [],
  },

  // ── Commitments ──────────────────────────────────────────────
  {
    id: "c_read",
    type: "Commitment",
    title: "Read 30 minutes",
    subtitle: "Daily · evening",
    body: "Currently: Slow Architectures by Marian Calder.",
    meta: { cadence: "daily", streak: 23, target: 30, unit: "min", todayDone: true },
    tags: ["mind"],
    edges: [{ kind: "relatesTo", to: "p_calder" }],
  },
  {
    id: "c_run",
    type: "Commitment",
    title: "Run or walk",
    subtitle: "Daily · 5km",
    body: "Soft target — walk counts on rain days.",
    meta: { cadence: "daily", streak: 11, target: 5, unit: "km", todayDone: false },
    tags: ["body"],
    edges: [],
  },
  {
    id: "c_write",
    type: "Commitment",
    title: "Morning pages",
    subtitle: "Daily · 750 words",
    body: "Loose journaling. Not for posting.",
    meta: { cadence: "daily", streak: 47, target: 750, unit: "words", todayDone: true },
    tags: ["mind"],
    edges: [],
  },
  {
    id: "c_call",
    type: "Commitment",
    title: "Call someone you love",
    subtitle: "Weekly · Sunday",
    body: "Theo most Sundays. Sometimes Mum.",
    meta: { cadence: "weekly", streak: 6, target: 1, unit: "call", todayDone: false },
    tags: ["heart"],
    edges: [{ kind: "relatesTo", to: "p_theo" }],
  },

  // ── Notes ────────────────────────────────────────────────────
  {
    id: "n_seams",
    type: "Note",
    title: "Design from the seam",
    subtitle: "Apr 28",
    body: "Iris: build at the place where two systems meet. The seam is where the truth shows up first.",
    meta: { created: "Apr 28, 2026" },
    tags: ["design", "iris"],
    edges: [{ kind: "mentions", to: "p_iris" }],
  },
  {
    id: "n_meeting",
    type: "Note",
    title: "Standup — Apr 30",
    subtitle: "Apr 30",
    body: "Jonas: pgvector index is fine up to 200k rows without IVF. We can defer tuning.",
    meta: { created: "Apr 30, 2026" },
    tags: ["work"],
    edges: [
      { kind: "mentions", to: "p_jonas" },
      { kind: "relatesTo", to: "pr_qsuite" },
    ],
  },

  // ── Ideas ────────────────────────────────────────────────────
  {
    id: "i_graph",
    type: "Idea",
    title: "Schema as a graph, stored relationally",
    subtitle: "Idea",
    body: "Typed entities + typed edges. Prevents schema sprawl. Lets new entity types arrive without migrations.",
    meta: { created: "Apr 14, 2026", heat: "warm" },
    tags: ["architecture"],
    edges: [{ kind: "relatesTo", to: "pr_qsuite" }],
  },
  {
    id: "i_studio",
    type: "Idea",
    title: "A studio of one",
    subtitle: "Idea",
    body: "What would a year of solo practice look like? Amelia did it for three.",
    meta: { created: "Mar 21, 2026", heat: "cool" },
    tags: ["life"],
    edges: [{ kind: "mentions", to: "p_amelia" }],
  },
  {
    id: "i_seams",
    type: "Idea",
    title: "The seam essay",
    subtitle: "Idea",
    body: "Could turn Iris's note into a short essay. Three examples, no more.",
    meta: { created: "Apr 28, 2026", heat: "warm" },
    tags: ["writing"],
    edges: [{ kind: "relatesTo", to: "n_seams" }],
  },
  {
    id: "j_calder",
    type: "Note",
    title: "Calder talk, 2019",
    subtitle: "memory",
    body: "Where I met Amelia. The line about \"slowness as a feature, not a bug.\"",
    meta: { created: "Sep 11, 2019" },
    tags: ["memory"],
    edges: [
      { kind: "mentions", to: "p_amelia" },
      { kind: "mentions", to: "p_calder" },
    ],
  },
];

// Index by id for cheap lookup
const entityById = Object.fromEntries(seedEntities.map((e) => [e.id, e]));

// Inbound edge index — for "mentioned by"
const inboundEdges = {};
for (const e of seedEntities) {
  for (const edge of e.edges || []) {
    if (!inboundEdges[edge.to]) inboundEdges[edge.to] = [];
    inboundEdges[edge.to].push({ from: e.id, kind: edge.kind });
  }
}

// Activity heatmap — last 18 weeks × 7 days. Deterministic pseudo-random.
function buildHeatmap() {
  const weeks = 18;
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const seed = (w * 7 + d) * 9301 + 49297;
      const r = (seed % 233280) / 233280;
      let v;
      if (r < 0.18) v = 0;
      else if (r < 0.5) v = 1;
      else if (r < 0.78) v = 2;
      else if (r < 0.94) v = 3;
      else v = 4;
      // Final week — today is filled
      if (w === weeks - 1 && d === 5) v = 3;
      if (w === weeks - 1 && d === 6) v = 0;
      col.push(v);
    }
    out.push(col);
  }
  return out;
}

const heatmap = buildHeatmap();

// Today's agenda — what BrainQ surfaces on the home screen.
const todayAgenda = {
  date: "Friday, May 1",
  greeting: "Quiet morning",
  prompt: "What\u2019s on your mind?",
  recent: ["n_meeting", "i_seams", "p_amelia"],
  nudges: [
    { id: "nudge_nadia", text: "Nadia's birthday in 17 days.", kind: "soft", entityId: "p_nadia" },
    { id: "nudge_run", text: "You haven\u2019t walked yet today.", kind: "soft", entityId: "c_run" },
  ],
};

Object.assign(window, {
  seedEntities,
  entityById,
  inboundEdges,
  heatmap,
  todayAgenda,
  TODAY,
});
