# BrainQ — Personal Brain Vector Database Schema

> **Version:** 1.0.0  
> **Purpose:** Schema definition for a vector database that stores all personal knowledge, habits, relationships, and projects in a single queryable "second brain."

---

## Overview

BrainQ uses a vector database so that every piece of information is stored alongside a **semantic embedding** — a numerical representation of its meaning. This enables natural-language queries such as:

- *"Find notes related to stoicism"*
- *"Which projects are connected to my reading goal?"*
- *"What did I write about the Pomodoro technique?"*

All collections share a common `linkedIds` field so any item can be cross-referenced with any other item, forming a personal knowledge graph on top of the vector space.

---

## Vector Configuration

| Setting | Value |
|---------|-------|
| Default dimensions | `1536` |
| Distance metric | `cosine` |
| Default embedding model | `text-embedding-ada-002` |
| Alternative models | `text-embedding-3-small`, `text-embedding-3-large`, `sentence-transformers/all-MiniLM-L6-v2` |

Each document's embedding is computed from the human-readable text fields listed under **Embedding source fields** for that collection.

---

## Collections

### 1. Note

Free-form written notes — fleeting thoughts, meeting notes, reference material, journal entries, and anything else worth capturing.

**Embedding source fields:** `title`, `content`, `tags`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | Unique identifier |
| `title` | `string` | ✅ | Short descriptive title |
| `content` | `string` | ✅ | Full body text (Markdown supported) |
| `category` | `enum` | | `fleeting` \| `permanent` \| `literature` \| `meeting` \| `journal` \| `reference` \| `other` |
| `tags` | `string[]` | | Free-form labels for filtering and linking |
| `source` | `string` | | Origin of the note (URL, book, person, …) |
| `linkedIds` | `uuid[]` | | Cross-references to any other collection items |
| `createdAt` | `date-time` | ✅ | Creation timestamp (ISO-8601) |
| `updatedAt` | `date-time` | ✅ | Last-modified timestamp (ISO-8601) |

**Indexes:** `category`, `tags`, `createdAt`

---

### 2. Idea

Creative ideas, hypotheses, inventions, or opportunities worth capturing and incubating over time.

**Embedding source fields:** `title`, `description`, `tags`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | Unique identifier |
| `title` | `string` | ✅ | Concise name for the idea |
| `description` | `string` | ✅ | Full explanation — what it is, why it matters, how it might work |
| `status` | `enum` | ✅ | `raw` \| `exploring` \| `validating` \| `parked` \| `implemented` \| `discarded` |
| `excitement` | `integer 1–5` | | Subjective excitement score (1 = low, 5 = very high) |
| `tags` | `string[]` | | Topics or domains |
| `linkedIds` | `uuid[]` | | Cross-references to any other collection items |
| `createdAt` | `date-time` | ✅ | Creation timestamp (ISO-8601) |
| `updatedAt` | `date-time` | ✅ | Last-modified timestamp (ISO-8601) |

**Indexes:** `status`, `excitement`, `tags`, `createdAt`

---

### 3. Commitment

Ongoing personal commitments and habit goals — daily exercise, dietary targets, reading quotas, sleep schedules, meditation practice, and more.

**Embedding source fields:** `title`, `description`, `type`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | Unique identifier |
| `title` | `string` | ✅ | Short name (e.g. *"Morning Run"*, *"Read 20 pages"*) |
| `description` | `string` | | Why this commitment matters and relevant detail |
| `type` | `enum` | ✅ | `exercise` \| `nutrition` \| `reading` \| `sleep` \| `meditation` \| `learning` \| `social` \| `financial` \| `creative` \| `other` |
| `frequency` | `enum` | ✅ | `daily` \| `weekdays` \| `weekends` \| `weekly` \| `biweekly` \| `monthly` \| `custom` |
| `target` | `object` | | Quantitative goal: `{ value: number, unit: string }` (e.g. `{ value: 30, unit: "minutes" }`) |
| `status` | `enum` | ✅ | `active` \| `paused` \| `completed` \| `abandoned` |
| `startDate` | `date` | ✅ | When this commitment began (ISO-8601 date) |
| `endDate` | `date \| null` | | End date — `null` means indefinite |
| `checkIns` | `CheckIn[]` | | Log of individual completion records (see below) |
| `linkedIds` | `uuid[]` | | Cross-references to projects, notes, or ideas |
| `createdAt` | `date-time` | ✅ | Creation timestamp (ISO-8601) |
| `updatedAt` | `date-time` | ✅ | Last-modified timestamp (ISO-8601) |

**CheckIn object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `date` | ✅ | The date of this check-in |
| `completed` | `boolean` | ✅ | Whether the commitment was fulfilled that day |
| `actualValue` | `number` | | Actual amount achieved (e.g. `25` minutes run) |
| `note` | `string` | | Optional note about this particular check-in |

**Indexes:** `type`, `frequency`, `status`, `startDate`

---

### 4. Contact

People in your personal and professional network — family, friends, colleagues, mentors, collaborators, etc.

**Embedding source fields:** `fullName`, `notes`, `tags`, `organization`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | Unique identifier |
| `fullName` | `string` | ✅ | Full name of the person |
| `email` | `string[]` | | One or more email addresses |
| `phone` | `string[]` | | One or more phone numbers (E.164 format recommended) |
| `organization` | `string` | | Company, school, or other affiliation |
| `role` | `string` | | Job title or role |
| `relationshipType` | `enum` | | `family` \| `friend` \| `colleague` \| `mentor` \| `mentee` \| `acquaintance` \| `professional` \| `other` |
| `socialProfiles` | `object` | | Map of platform → handle/URL (e.g. `{ linkedin: "…", github: "…" }`) |
| `tags` | `string[]` | | Topics, communities, or attributes associated with this contact |
| `notes` | `string` | | Free-form observations, context, or conversation history |
| `lastContactedAt` | `date-time \| null` | | Most recent meaningful interaction |
| `linkedIds` | `uuid[]` | | Cross-references to notes, projects, or ideas involving this contact |
| `createdAt` | `date-time` | ✅ | Creation timestamp (ISO-8601) |
| `updatedAt` | `date-time` | ✅ | Last-modified timestamp (ISO-8601) |

**Indexes:** `relationshipType`, `organization`, `tags`, `lastContactedAt`

---

### 5. Project

Multi-step endeavors with a clear goal — side projects, work initiatives, home improvements, learning paths, etc.

**Embedding source fields:** `title`, `description`, `goals`, `tags`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | Unique identifier |
| `title` | `string` | ✅ | Name of the project |
| `description` | `string` | ✅ | Overview of what the project is and why it exists |
| `status` | `enum` | ✅ | `idea` \| `planning` \| `active` \| `on_hold` \| `completed` \| `cancelled` |
| `priority` | `enum` | | `critical` \| `high` \| `medium` \| `low` |
| `goals` | `string[]` | | Desired outcomes or success criteria |
| `tasks` | `Task[]` | | Actionable next steps within the project (see below) |
| `tags` | `string[]` | | Topics, technologies, or domains |
| `startDate` | `date \| null` | | Planned or actual start date |
| `targetDate` | `date \| null` | | Target completion date |
| `completedDate` | `date \| null` | | Actual completion date |
| `linkedIds` | `uuid[]` | | Cross-references to notes, ideas, contacts, or commitments |
| `createdAt` | `date-time` | ✅ | Creation timestamp (ISO-8601) |
| `updatedAt` | `date-time` | ✅ | Last-modified timestamp (ISO-8601) |

**Task object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | Unique identifier for the task |
| `title` | `string` | ✅ | What needs to be done |
| `status` | `enum` | ✅ | `todo` \| `in_progress` \| `blocked` \| `done` \| `cancelled` |
| `dueDate` | `date \| null` | | Optional due date |
| `notes` | `string` | | Additional context or sub-steps |

**Indexes:** `status`, `priority`, `tags`, `startDate`, `targetDate`

---

## Cross-Collection Links

Every collection exposes a `linkedIds` array that stores the UUIDs of related documents from **any** collection. This creates a flexible graph layer on top of the vector space:

```
Note ──────────── Idea
 │                  │
 └──── Project ─────┘
         │
      Contact
         │
    Commitment
```

Example relationships:
- A **Note** summarising a book chapter → linked to the **Commitment** *"Read 20 pages/day"* and the **Project** *"Learn systems thinking"*
- An **Idea** for a new product → linked to a **Contact** (potential collaborator) and a **Project** (implementation plan)
- A **Commitment** for daily meditation → linked to a **Project** *"Build a mindfulness habit"* and related **Notes**

---

## Example Semantic Queries

| Query | Collections searched | Sample vector result |
|-------|----------------------|----------------------|
| `"notes about habit formation"` | Note, Idea | Notes tagged `habits`, ideas with status `exploring` |
| `"people who know about machine learning"` | Contact | Contacts with ML-related tags and notes |
| `"active projects related to fitness"` | Project, Commitment | Projects linked to exercise commitments |
| `"ideas I was most excited about last year"` | Idea | Ideas with high `excitement`, filtered by `createdAt` |
| `"what reading goals am I tracking?"` | Commitment | Commitments with `type = reading` and `status = active` |

---

## Implementation Notes

1. **Embedding generation** — Before inserting any document, concatenate the *embedding source fields* for that collection into a single string and pass it to your chosen embedding model. Store the resulting vector in the `embedding` field.

2. **Hybrid search** — Combine vector similarity with metadata filters (e.g. `status = active AND type = exercise`) for the most relevant results.

3. **Compatible databases** — This schema is designed to work with any of the following vector stores:
   - [Weaviate](https://weaviate.io) — use one class per collection
   - [Qdrant](https://qdrant.tech) — use one collection per entity type, with a `payload` that mirrors the properties above
   - [Pinecone](https://pinecone.io) — use one namespace per entity type; store properties as metadata
   - [pgvector](https://github.com/pgvector/pgvector) — use one table per collection with a `vector(1536)` column

4. **ID format** — Use UUID v4 for all `id` and `linkedIds` values to ensure global uniqueness across collections.

5. **Timestamps** — Store all `date-time` values in UTC (ISO-8601 with `Z` suffix). Store date-only fields (`startDate`, `endDate`, etc.) as `YYYY-MM-DD`.
