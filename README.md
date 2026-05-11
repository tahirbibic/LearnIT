# LearnIT

Educational game based on the Feynman Technique. Teach AI students to deepen your own understanding. Built with React, Express, Supabase, and OpenAI.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4
- **Backend**: Express 4, Node.js, TypeScript
- **AI**: OpenAI GPT-4o (text), OpenAI TTS (voice), pdfjs-dist (PDF extraction)
- **Database**: Supabase (auth, documents, leaderboard)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`** — create this file:
```env
GITHUB_TOKEN=your_github_pat_token
OPENAI_MODEL=gpt-4o
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

**`frontend/.env.local`** — create this file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up Supabase tables

Run this SQL in the Supabase SQL editor:

```sql
create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  username text not null unique,
  score integer not null default 0,
  updated_at timestamptz default now()
);

create table documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text default 'Opste',
  storage_path text not null,
  extracted_text text,
  file_size integer,
  created_at timestamptz default now()
);
```

Also enable Supabase Auth (Email provider) in the Supabase dashboard under Authentication > Providers.

### 4. Add assets

Place these images in `frontend/public/assets/`:

**Login screen:**
- `login-bg.jpg` — full-screen school entrance background
- `login-logo.png` — game title logo

**Student avatars (for the shop):**
- `student-marko.png`
- `student-jovana.png`
- `student-stefan.png`
- `student-viktor.png`
- `student-vuk.png`
- `student-soon.png` — placeholder for coming-soon slots

**Existing assets** (already present):
- `classroom-bg.jpg`, `desk-student.jpg`, `exam-bg.jpg`, `greenboard-bg.jpg`
- `kid_teach.jpg`, `kid_teach_talking.jpg`, `kid_teach_thinking.jpg`
- `leaderboard-bg.jpg`, `menu-bg-open.jpg`, `menu-bg-professor-open.jpg`, `menu-bg-student-open.jpg`
- `pano-meni.jpg`, `professor-neutral.jpg`, `professor-point.jpg`, `professor-talk.jpg`, `store.jpg`

## Running

**Two separate terminals:**
```bash
cd backend && npm run dev   # starts on port 3001
cd frontend && npm run dev  # starts on port 5173
```

**Or from the root:**
```bash
npm install
npm run dev
```

Open http://localhost:5173

## Folder Structure

```
learnit/
├── backend/
│   ├── server.ts      — Express API (AI proxy, TTS, PDF, leaderboard, documents)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/     — Scene components
│   │   ├── components/ — Reusable UI
│   │   ├── data/      — Student definitions
│   │   ├── lib/       — ai.ts, supabase.ts
│   │   └── App.tsx
│   ├── public/assets/
│   └── package.json
└── README.md
```

## License

Copyright (c) 2026 SPIRIT. All rights reserved.
