# HowToDoX - Video to Step-by-Step Guide Generator

Transform any video tutorial into a detailed step-by-step guide with AI assistance. This MVP allows users to upload videos, have AI analyze the frames, manually edit transcriptions, generate documents, and translate them into multiple languages.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Auth | Clerk |
| Video Storage | Cloudinary |
| AI Vision | Google Gemini Vision API |
| Translation | Lingo.dev SDK |

## Getting Started

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for PostgreSQL)
- Clerk account (for authentication)
- Cloudinary account (for video storage)
- Google AI Studio account (for Gemini API)
- Lingo.dev account (for translation)

### 2. Clone and Install

```bash
cd howto-doc-app
npm install
```

### 3. Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:password@host:5432/database"

# Clerk Authentication
# Get keys from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Cloudinary
# Get keys from: https://cloudinary.com
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

### 4. Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Create a PostgreSQL database
3. Get your connection string from Supabase dashboard
4. Update `DATABASE_URL` in `.env`
5. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Current MVP Features

1. **User Authentication**
   - Sign up / Sign in with Clerk
   - Protected dashboard routes

2. **Video Upload**
   - Drag and drop video upload
   - Videos stored on Cloudinary
   - Automatic frame extraction (10 frames)

3. **AI-Powered Analysis**
   - Google Gemini Vision analyzes each frame
   - Generates action descriptions for each step
   - Infers document title from frame content

4. **Manual Transcript Editor**
   - Timeline view with frame thumbnails
   - Edit AI suggestions
   - Review and refine step descriptions

5. **Document Generation**
   - Generate markdown from transcript
   - Download as .md file
   - Includes frame thumbnails

6. **Multilingual Support**
   - Translate documents to 9+ languages using Lingo.dev
   - Store translations in database

## Project Structure

```
howto-doc-app/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── dashboard/       # Video list page
│   │   │   └── video/[id]/      # Video editor
│   │   ├── api/                 # API routes
│   │   │   ├── videos/          # Video CRUD
│   │   │   ├── frames/          # Frame updates
│   │   │   ├── analyze/         # AI analysis
│   │   │   └── translate/       # Translation
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing page
│   ├── components/               # React components
│   ├── lib/
│   │   ├── prisma.ts            # Database client
│   │   ├── cloudinary.ts        # Video storage
│   │   ├── gemini.ts            # AI vision
│   │   └── lingod.ts            # Translation
│   └── types/                    # TypeScript types
├── prisma/
│   └── schema.prisma             # Database schema
└── .env                         # Environment variables
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/videos` | GET | List user's videos |
| `/api/videos` | POST | Upload new video |
| `/api/frames/[videoId]` | POST | Update frame with AI suggestion |
| `/api/frames/[videoId]` | PATCH | Update frame user edit |
| `/api/analyze/[videoId]` | POST | Mark analysis as complete |
| `/api/translate` | POST | Translate document content |
| `/api/translate/[videoId]` | POST | Save translation to database |

## Known Issues

- Cloudinary free tier has 100MB video limit
- Need valid API keys for all services to run properly
- Lingo.dev SDK has Node.js dependencies (server-side translation only)

## Next Steps for Production

1. Add rate limiting to API routes
2. Implement video delete functionality
3. Add support for longer videos
4. Implement team/workspaces
5. Add public document sharing
6. Add PDF export
7. Add more translation languages

## License

MIT
