# RelevanSi — Simple Document Search (Nuxt + Tailwind + Lunr/Fuse + Supabase)

Summary: A simple Information Retrieval assignment app for building a basic search engine.  
Uses Nuxt (Vue 3), TailwindCSS for UI, Lunr + Fuse.js for client-side retrieval, and Supabase for database (tables only, no storage).

## Features
- Upload documents (TXT only, no text extraction)
- Simple preprocessing (lowercase, stopwords, light stemming)
- Client-side indexing: Lunr (primary) + Fuse.js (fallback)
- Supabase table `documents` stores: id, title, content(katalog), content_raw, created_at, processed, metadata
- Seeder with 30 sample documents (processed = true)

## Tech stack
- Nuxt 3
- TailwindCSS
- Lunr.js, Fuse.js
- Supabase (Postgres tables only)
- TypeScript (SFCs with <script setup lang="ts">)

## Schema
```ts
export interface Document {
  id: string;                       
  title: string;
  file_url: string;
  content: string;
  content_raw?: string;
  created_at: Date;
  processed: boolean;
  metadata: Record<string, any>;
}
```

## Main Features
- Upload documents (TXT only)
- Simple preprocessing (lowercase, stopwords, light stemming)
- Client-side indexing (Lunr) and Fuse.js fallback
- Supabase table documents stores content(katalog), content_raw , processed flag, and metadata (word_count, excerpt, language, file_size, uploadedAt)

## Requirements
- Node.js >= 18
- npm / pnpm / yarn
- Supabase account (project, documents table)
- For running seeder: Supabase service role key (do not commit to repo)

## Installation (local)
Clone the repo:

```sh
git clone <repo-url>
cd RelevanSi
```

Install dependencies:

```sh
npm install
```

Add a `.env` file in the root (do not commit):

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your_service_role_key_or_anon_key_for_readonly>
```

**Student-style example:**
```
SUPABASE_URL=https://myuni-project.supabase.co
SUPABASE_KEY=sbp_anon_1234567890abcdef
```

To run seeder/upsert, use SUPABASE_KEY as service role key (higher privileges).  
Never commit your key to VCS.

## Running the app (dev)
```sh
npm run dev
```
Open: http://localhost:3000

## Seeder (add 30 samples)
Seeder is in `seed/documentSeeder.ts`. It creates preprocessed text, metadata, and sets processed = true so documents appear in the search index.

Run seeder:

Quick way (temporary env export):

```sh
SUPABASE_URL="https://<your-project>.supabase.co" SUPABASE_KEY="<service_role_key>" npx ts-node -r dotenv/config ./seed/documentSeeder.ts
```

If using dotenv (recommended), make sure `.env` exists then:

```sh
npm install dotenv --save
npx ts-node -r dotenv/config ./seed/documentSeeder.ts
```
Or add `import 'dotenv/config'` at the top of `seed/documentSeeder.ts` then:
```sh
npx ts-node ./seed/documentSeeder.ts
```

Notes:
- Seeder uses simple preprocessing, creates content, metadata, and sets processed: true.
- If you rerun the seeder, it checks existing rows by title and only inserts new ones (avoids duplicates).

## Upload & Processing behavior
When a user uploads a TXT file in the UI:
- Content is read client-side (no text extraction).
- Preprocessing runs client-side.
- Metadata is created (word_count, excerpt, language, file_size, uploadedAt).
- Record is saved to documents table with processed: true.

## Troubleshooting
Seeder error "there is no unique or exclusion constraint matching the ON CONFLICT specification":
- Cause: upsert(..., { onConflict: [...] }) but no UNIQUE constraint on the specified column(s).
- Solution: use insert after checking for duplicates (seeder is adjusted), or add UNIQUE constraint on title.

If search page shows "No results found" even though table has data:
- Open browser DevTools Console.
- Make sure loadDocuments returns data (see loadDocuments -> dataLength log).
- Make sure processed = true in DB (Supabase Table Editor).
- If docs exist but Lunr/Fuse finds nothing, run fallback substring search (see console logs) to ensure content contains query.
- Make sure createLunrIndex indexes title and content fields and uses String(id) as ref (Lunr expects string ref).

If seeder doesn't run:
- Make sure SUPABASE_URL and SUPABASE_KEY env vars exist when running ts-node.
- Run with: `npx ts-node -r dotenv/config ./seed/documentSeeder.ts`

## Security & Best Practices
- Never use service role key in client or commit to repository.
- For production, use server/worker with service role key for write/heavy processing.
- Limit number of documents indexed on client (MAX_DOCS), or move indexing to server for large collections.

## Repo Structure (short)
- `app/` — Nuxt app
- `pages/index.vue` — main UI (upload + search)
- `composables/` — helpers: preprocessing, lunr/fuse wrappers, supabase client wrapper
- `seed/documentSeeder.ts` — seeder (30 samples)
- `README.md` — this documentation

## References
- Nuxt 3: https://nuxt.com
- Lunr.js: https://lunrjs.com
- Fuse.js: https://fusejs.io
- Supabase: https://supabase.com

## Quick Commands
Install:
```sh
npm install
```
Run dev:
```sh
npm run dev
```
Seed (with dotenv):
```sh
npx ts-node -r dotenv/config ./seed/documentSeeder.ts
```
Mark all non-empty content rows as processed (SQL, Supabase SQL editor):

```sql
UPDATE documents SET processed = true WHERE content IS NOT NULL AND content <> '';
```
