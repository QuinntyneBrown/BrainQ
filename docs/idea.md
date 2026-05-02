# Idea

- Solution that stores all my notes, ideas, commitments (daily exercise, eating, reading goals, etc…), contacts, projects. A schema for my personal brain.
- All my commitments can be stored, queried and accessed by this solution https://github.com/QuinntyneBrown/Commitments
- All my contacts can be stored, queried and accessed by this solution https://github.com/QuinntyneBrown/RecallQ
- Data shall be stored in a relational database (PostgreSQL with `pgvector` extension) — structured queries against entities (commitments, contacts, projects, notes, ideas) with a secondary vector index layered on top for semantic retrieval.
- Schema modeled as a graph in relational form: typed entities (Person, Project, Commitment, Note, Idea) with typed edges (mentions, blocks, fulfills, relatesTo) — preventing schema sprawl as new entity types are added.
- .NET stack: EF Core + Npgsql + pgvector, consistent with the rest of the Q-Suite.
