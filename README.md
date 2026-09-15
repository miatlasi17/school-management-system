# Brightwood — School Management System

A full-featured school management system: academics, attendance, exams & report cards, timetable, fees, library, transport, hostel, HR/payroll, notices, events, and internal messaging — with dedicated Admin, Teacher, and Student portals.

Built entirely on stacks with a free tier suitable for Vercel:

- **[Next.js](https://nextjs.org)** (App Router, TypeScript) — frontend + backend (Server Components, Server Actions, Route Handlers)
- **[Prisma](https://prisma.io) + PostgreSQL** — data layer. Designed for [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres), both free-tier friendly
- **[Auth.js (NextAuth v5)](https://authjs.dev)** — credentials (email/password) auth with role-based access control
- **[shadcn/ui](https://ui.shadcn.com)** (Base UI + Tailwind CSS v4) — component library
- **[Zod](https://zod.dev) + [React Hook Form](https://react-hook-form.com)** — validation

## Roles

- **Admin** — full control: manage people, academics, attendance, exams, fees, library, transport, hostel, HR/payroll, notices/events, messaging.
- **Teacher** — view their timetable, mark attendance for classes they lead, enter marks for subjects they teach, view their students, notices, messaging.
- **Student** — view their timetable, attendance, marks/report card, fees, library loans, notices, messaging.

## Local development

### Prerequisites

- Node.js 20+
- A PostgreSQL database (a local instance via Docker, or a free [Neon](https://neon.tech) database)

### Setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL / DIRECT_URL / AUTH_SECRET
npx prisma migrate dev # create the schema
npm run db:seed        # load demo data
npm run dev
```

Generate a real `AUTH_SECRET` with:

```bash
npx auth secret
```

### Demo accounts (seeded)

All seeded users share the password `Password123!`.

| Role    | Email                          |
| ------- | ------------------------------- |
| Admin   | `admin@school.test`             |
| Teacher | `priya.sharma@school.test`      |
| Student | see `npm run db:studio` → `User` table (role `STUDENT`) |

### Useful scripts

| Script              | Purpose                                   |
| ------------------- | ------------------------------------------ |
| `npm run dev`        | Start the dev server                       |
| `npm run build`      | Production build (also runs `prisma generate`) |
| `npm run db:migrate` | Create/apply a new migration in development |
| `npm run db:deploy`  | Apply existing migrations (used in production) |
| `npm run db:seed`    | Reseed demo data                           |
| `npm run db:studio`  | Open Prisma Studio to browse the database  |

## Deploying to Vercel (free tier)

1. **Create a Postgres database.** Easiest: [Neon](https://neon.tech) (has a generous free tier and is what Vercel's own "Postgres" storage integration uses under the hood), or provision Vercel Postgres directly from your Vercel project's Storage tab. Copy both the **pooled** connection string (`DATABASE_URL`) and the **direct** connection string (`DIRECT_URL`, used for migrations) — Neon's dashboard labels these clearly.
2. **Push this repo to GitHub** and import it into Vercel ("Add New Project").
3. **Set environment variables** in the Vercel project settings:
   - `DATABASE_URL` — pooled connection string
   - `DIRECT_URL` — direct connection string
   - `AUTH_SECRET` — output of `npx auth secret`
   - `NEXTAUTH_URL` — your production URL (e.g. `https://your-app.vercel.app`) — optional on Vercel (Auth.js can infer it), but recommended
4. **Run the migration against the production database** once, from your machine (with `DATABASE_URL`/`DIRECT_URL` pointed at the production database):
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # optional — only if you want the demo data in production
   ```
5. **Deploy.** Vercel will run `npm run build`, which runs `prisma generate` automatically via the `postinstall`/`build` scripts.

No other paid services are required — the whole stack (Next.js on Vercel, Postgres on Neon) fits within free tiers for small-to-medium school usage.

## Architecture notes

- **Server Actions** (`src/actions/*.ts`) handle all mutations, validated with Zod schemas from `src/lib/validations/*.ts`, and return a consistent `{ error } | { success: true }` shape (`src/lib/action-result.ts`).
- **Route protection** is enforced in `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) plus a `requireUser`/`requireTeacher`/`requireStudent` helper (`src/lib/session.ts`) used at the top of every protected Server Component page.
- **Database schema** lives in `prisma/schema.prisma` — a single-tenant model covering people, academics, attendance, exams, fees, library, transport, hostel, HR/payroll, and communication.
