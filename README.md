# Brightwood — School Management System

A full-featured school management system: academics, attendance, exams & report cards, timetable, fees, library, transport, hostel, HR/payroll, notices, events, and internal messaging — with dedicated Admin, Teacher, and Student portals.

**Live:** https://school-management-system-rho-umber.vercel.app (demo password `Password123!` for every seeded account, e.g. `admin@school.test`)

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

## Deployment (Vercel + Neon, free tier)

This project is deployed at https://school-management-system-rho-umber.vercel.app, set up as follows — the same steps apply if you fork/redeploy it elsewhere:

1. **Database:** a Neon Postgres database, provisioned through Vercel's Marketplace integration (`vercel integration add neon`, or Vercel dashboard → Storage → Neon). This auto-injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` into the project's env vars for Production/Preview/Development. Prisma expects `DIRECT_URL` for migrations, so a `DIRECT_URL` env var was added separately with the same value as `DATABASE_URL_UNPOOLED`.
2. **GitHub → Vercel:** the repo is connected (`vercel git connect`) so every push to `main` auto-deploys.
3. **Env vars set on the Vercel project:** `DATABASE_URL`, `DIRECT_URL` (both from Neon, per above), `AUTH_SECRET` (`vercel env add AUTH_SECRET production`, value from `npx auth secret` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
4. **Migrations applied once** against the production database:
   ```bash
   DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon unpooled url>" npx prisma migrate deploy
   DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon unpooled url>" npm run db:seed   # optional demo data
   ```
5. **Deploy:** `npx vercel deploy --prod` (or just push to `main`, now that GitHub is connected).

To redeploy elsewhere from scratch: create a Neon (or any Postgres) database, set the same three env vars in your host of choice, run the migration step above, then deploy — no paid services required, the whole stack fits within free tiers for small-to-medium school usage.

## Architecture notes

- **Server Actions** (`src/actions/*.ts`) handle all mutations, validated with Zod schemas from `src/lib/validations/*.ts`, and return a consistent `{ error } | { success: true }` shape (`src/lib/action-result.ts`).
- **Route protection** is enforced in `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) plus a `requireUser`/`requireTeacher`/`requireStudent` helper (`src/lib/session.ts`) used at the top of every protected Server Component page.
- **Database schema** lives in `prisma/schema.prisma` — a single-tenant model covering people, academics, attendance, exams, fees, library, transport, hostel, HR/payroll, and communication.
