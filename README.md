# SkillSwap - Mentorship Connector Web App

A full-stack web application built with **Next.js 16**, **Prisma 7**, and **PostgreSQL** — the web version of the SkillSwap Android app.

## Features

- **Authentication** — Email/password login & registration with NextAuth.js JWT sessions
- **User Profiles** — Bio, location, website, avatar, and skill tags
- **Skill Management** — Add skills you can teach and skills you want to learn with proficiency levels
- **Discover** — Browse and search users by name, bio, location, or skill
- **Skill Swap Requests** — Send, accept, reject, and complete swap requests
- **Direct Messaging** — Real-time-style conversations between connected users
- **Session Scheduling** — Book mentorship sessions with date/time, duration, and meeting link
- **Reviews & Ratings** — 5-star reviews with comments after completed sessions
- **Notifications** — In-app activity feed for all events
- **Friend Groups** — Create squads, invite friends by email, learn together
- **Skill Progress Dashboard** — Per-member hours taught/learned, tasks & skills completed, XP leaderboard
- **AI Learning Roadmaps** _(Groq)_ — Generate week-by-week roadmaps; earn XP by completing tasks
- **Knowledge Repository** — Shared notes plus PDF / video / assignment links per group
- **AI Quiz Generator** _(Groq)_ — MCQ, coding & short-answer quizzes after each lesson, auto-graded
- **Weekly AI Report** _(Groq)_ — Per-member summary and a recommended next topic
- **AI Skill Map** — Visual graph of who teaches what to whom across the group

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router, React 19, TailwindCSS 4 |
| Backend | Next.js API Routes (Route Handlers) |
| Database | PostgreSQL |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| Validation | Zod v4 |
| Icons | Lucide React |

## Quick Start (Docker)

```bash
docker compose up
```

That's it. Opens at **http://localhost:3000**.

On first boot the entrypoint automatically:
1. Waits for PostgreSQL to be healthy
2. Runs `prisma db push` to create all tables
3. Seeds the database with 45 skills and 3 demo users
4. Starts the Next.js app

> First run requires building the image — takes ~2 min. Subsequent starts are instant.

```bash
# Rebuild after code changes
docker compose up --build

# Tear down (keeps DB volume)
docker compose down

# Tear down and wipe database
docker compose down -v
```

## Local Development (without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Push schema to database
npm run db:push

# (Optional) Seed demo data
npm run db:seed

# Run development server
npm run dev

# (Optional) Inspect the database in a browser at http://localhost:5555
npm run db:studio
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts (after seeding)

| Email | Password | Skills |
|-------|----------|--------|
| alice@example.com | password123 | Teaches React, Next.js / Wants UI/UX |
| bob@example.com | password123 | Teaches Figma, UI/UX / Wants React |
| carol@example.com | password123 | Teaches Python, ML / Wants React |

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/skillswap"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-min-32-chars"

# Groq AI API — powers roadmap/quiz/report generation.
# Get a key at https://console.groq.com/keys
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.1-8b-instant"   # optional
```

> The AI features degrade gracefully: without `GROQ_API_KEY`, the **Generate** buttons
> return a clear "AI is not configured" message and every non-AI feature keeps working.
> With Docker, export `GROQ_API_KEY` in your shell before `docker compose up` — it is
> passed through to the app container.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Register pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Home dashboard
│   │   ├── discover/     # Browse users
│   │   ├── profile/      # View & edit profiles
│   │   ├── requests/     # Swap requests management
│   │   ├── messages/     # Conversations & chat
│   │   ├── sessions/     # Mentorship sessions
│   │   ├── reviews/      # Reviews & ratings
│   │   └── notifications/
│   └── api/              # API route handlers
├── components/
│   ├── layout/           # Sidebar, Nav
│   └── providers/        # NextAuth session provider
└── lib/
    ├── prisma.ts          # Prisma client singleton
    ├── auth.ts            # NextAuth configuration
    └── utils.ts           # Helpers
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Demo data seeder
```

## Database Schema

- **User** — Profile, auth credentials
- **Skill** — Skill catalog (name + category)
- **UserSkill** — User's teaching/learning skills with proficiency level
- **SwapRequest** — Skill exchange requests between users
- **Conversation** + **Message** — Direct messaging
- **Session** — Scheduled mentorship sessions
- **Review** — Post-session ratings and comments
- **Notification** — In-app activity notifications

## Deployment

This app can be deployed to Vercel, Railway, or any platform that supports Node.js and PostgreSQL. Set the three environment variables and run `npm run db:push` to initialize the database.
