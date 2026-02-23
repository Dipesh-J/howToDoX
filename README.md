<p align="center">
  <img src="public/logo.png" alt="HowToDoX Logo" width="400" />
</p>

<h1 align="center">HowToDoX</h1>

<p align="center">
  <a href="https://www.loom.com/share/e5f2db6bd5994bec9e347f1912b37012"><strong>Watch Product Demo (Loom)</strong></a>
</p>

<p align="center">
  <strong>Turn any video into a step-by-step guide — instantly.</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/AI_Powered-Gemini_Vision-EBFF00?style=flat-square&labelColor=0A0A0A" alt="AI Powered" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Built_With-Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Multilingual-50+_Languages-EBFF00?style=flat-square&labelColor=0A0A0A" alt="Multilingual" /></a>
  <img src="https://img.shields.io/badge/License-MIT-EBFF00?style=flat-square&labelColor=0A0A0A" alt="License" />
</p>

---

## What is HowToDoX?

**HowToDoX** is an AI-powered documentation tool that transforms video tutorials into clear, shareable, step-by-step guides with screenshots and text instructions.

Record your screen or upload a video → AI analyzes each frame → get a polished, translatable document. No more tedious manual documentation.

### The Problem

Creating step-by-step documentation from tutorials is painfully manual — screenshot, write, screenshot, write, repeat. Teams waste hours documenting processes that could be captured in a quick screen recording.

### The Solution

HowToDoX automates the entire pipeline:

1. **Upload** a video tutorial (or record directly in-app)
2. **AI extracts** key frames and generates action descriptions using Google Gemini Vision
3. **Refine** the steps in a visual editor with frame thumbnails
4. **Generate** a downloadable Markdown document
5. **Translate** into 50+ languages with one click  
6. **Share** publicly with anyone via a direct link 

---

## Features

| Feature | Description |
|---|---|
| 🎥 **Video Upload** | Drag-and-drop upload with Cloudinary storage. Supports any video format. |
| 🔴 **Screen Recording** | Record your screen directly from the app — no external tools needed. |
| 🤖 **AI Frame Analysis** | Google Gemini Vision extracts key frames and generates step-by-step descriptions automatically. |
| ✏️ **Visual Editor** | Timeline view with frame thumbnails. Edit AI suggestions, reorder steps, and refine descriptions. |
| 📄 **Document Generation** | One-click Markdown document generation with embedded screenshots. |
| 🌍 **Multilingual Translation** | Translate guides into 50+ languages using Lingo.dev SDK. |
| 🔗 **Public Sharing** | Share generated guides publicly via a direct link. |
| 🔍 **Search** | Full-text search across all your documents and guides. |
| 🔐 **Authentication** | Secure sign-up/sign-in with Clerk. Protected dashboard routes. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | PostgreSQL (Supabase) + [Prisma ORM](https://www.prisma.io/) |
| **Auth** | [Clerk](https://clerk.com/) |
| **Video Storage** | [Cloudinary](https://cloudinary.com/) |
| **AI Vision** | [Google Gemini Vision API](https://ai.google.dev/) |
| **Translation** | [Lingo.dev SDK](https://lingo.dev/) |
| **State Management** | [Zustand](https://zustand.docs.pmnd.rs/) |
| **Fonts** | Unbounded (headings) + Space Mono (body) |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** (or yarn/pnpm)
- Accounts for the following services:
  - [Supabase](https://supabase.com) — PostgreSQL database
  - [Clerk](https://clerk.com) — Authentication
  - [Cloudinary](https://cloudinary.com) — Video storage
  - [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini API key
  - [Lingo.dev](https://lingo.dev) — Translation API key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/howToDoX.git
cd howToDoX
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:password@host:5432/database"

# Clerk Authentication
# Get keys from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Cloudinary
# Get keys from: https://cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini Vision
# Get API key from: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=your_gemini_key

# Lingo.dev Translation
# Get API key from: https://lingo.dev
LINGODOTDEV_API_KEY=your_lingodotdev_key
```

### 4. Set Up the Database

1. Create a new project on [Supabase](https://supabase.com)
2. Copy the connection string from the Supabase dashboard
3. Update `DATABASE_URL` in your `.env` file
4. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

5. *(Optional)* Open Prisma Studio to inspect your database:

```bash
npx prisma studio
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UPLOAD /   │     │  AI ANALYZES │     │    REFINE    │     │   GENERATE   │
│   RECORD     │────▶│   FRAMES     │────▶│    & EDIT    │────▶│  & TRANSLATE │
│   VIDEO      │     │  (Gemini)    │     │   STEPS      │     │   DOCUMENT   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Upload or Record** — Drop a video file or record your screen directly in the app.
2. **AI Analysis** — Google Gemini Vision extracts key frames and generates instructional step descriptions for each frame.
3. **Refine** — Use the visual timeline editor to edit descriptions, reorder steps, and perfect your guide.
4. **Generate & Translate** — Export a Markdown document with embedded screenshots, then translate it into any of 50+ supported languages with one click.

---

## Project Structure

```
howToDoX/
├── prisma/
│   └── schema.prisma            # Database schema (User, Video, Frame, Transcript, Document)
├── public/                      # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   │   ├── (dashboard)/         # Protected routes
│   │   │   ├── dashboard/       # Video list & overview
│   │   │   ├── record/          # Screen recording
│   │   │   ├── search/          # Full-text search
│   │   │   ├── upload/          # Video upload
│   │   │   └── video/[id]/      # Video editor & document generation
│   │   ├── api/                 # API routes
│   │   │   ├── videos/          # Video CRUD
│   │   │   ├── frames/          # Frame updates
│   │   │   ├── analyze/         # AI analysis
│   │   │   └── translate/       # Translation
│   │   ├── globals.css          # Design system & theme
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   ├── components/              # Reusable React components
│   │   ├── editor/              # Editor components
│   │   ├── ui/                  # UI primitives
│   │   ├── video/               # Video-related components
│   │   └── markdown-renderer.tsx
│   ├── lib/
│   │   ├── prisma.ts            # Database client
│   │   ├── cloudinary.ts        # Video storage utilities
│   │   ├── gemini.ts            # AI Vision integration
│   │   └── lingod.ts            # Translation service
│   └── types/                   # TypeScript type definitions
├── .env                         # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

---

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/videos` | `GET` | List all videos for the authenticated user |
| `/api/videos` | `POST` | Upload a new video |
| `/api/frames/[videoId]` | `POST` | Update frame with AI suggestion |
| `/api/frames/[videoId]` | `PATCH` | Update frame with user edits |
| `/api/analyze/[videoId]` | `POST` | Trigger AI analysis / mark as complete |
| `/api/translate` | `POST` | Translate document content |
| `/api/translate/[videoId]` | `POST` | Save translation to database |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |

---

## Known Limitations

- Cloudinary free tier has a **100 MB** video upload limit
- All external API keys must be valid for the app to function
- Translation runs server-side only (Lingo.dev SDK has Node.js dependencies)

---

## License

[MIT](LICENSE)
