# WhiteLabel Breeder OS

A customizable, independently hosted operating system for responsible dog breeders. It includes breeding records, litters, puppies, applications, family accounts, payments, documents, care schedules, communications, a customer portal, and reports.

## Hosting architecture

WhiteLabel uses **Vercel** for the Next.js application, API routes, scheduled jobs, previews, and production deployments. It uses **Supabase** for Postgres data and document storage. It does not require or use OpenAI hosting or OpenAI services.

The platform runs as one multi-tenant Vercel application backed by one Supabase project. Every kennel receives an isolated `kennel_id`, owner/member accounts, and an included `kennelname.mydogportal.site` address. A configured custom-domain package can attach a verified customer-owned domain to the same Vercel project.

## Five-minute setup

1. Copy `.env.example` to `.env.local`.
2. Change every value in the **Branding**, **Theme**, **Locale and business rules**, and **Optional modules** sections.
3. Create the platform Supabase project, run `supabase/schema.sql` in its SQL editor, then apply every file under `supabase/migrations` in timestamp order. On the linked production project use `npx supabase db push --linked`—never reset the database.
4. Create the Vercel project from this GitHub repository, add `mydogportal.site` and `*.mydogportal.site`, and add the variables from `.env.example` in Vercel Project Settings.
5. Add the same development values to `.env.local`. Never expose the service-role key, session secret, or Vercel API token to the browser.
6. Run `npm install`, then `npm run dev`.
7. Replace `public/favicon.svg` and `public/og.png`, or point the branding variables to other assets.
8. Open `/signup`, create the first kennel owner, then review **Brand and business setup** and all templates under **Automations & templates** with an attorney licensed where the breeder operates.

```bash
cp .env.example .env.local
npm install
npm run dev
```

## What can be customized

- Business name, short name, tagline, logo, favicon, social image, website, email, phone, and location
- Primary, dark-primary, accent, background, surface, text, muted-text, and border colors, plus corner radius
- Language, locale, currency, and timezone
- Default puppy, deposit, delivery, and special-care pricing
- Legal jurisdiction, exam window, guarantee duration, deposit rule, and custom policy notice
- Phone center, transportation, family portal, and applications modules
- Email, contract, application, milestone, and puppy-packet templates in the application

Deployment defaults come from `lib/tenant-config.ts` and `.env.example`. Each kennel's business identity, colors, font, pricing defaults, contact details, domain, and policy notice are stored in Supabase and editable by its owner.

## Isolation and safety

Kennels share platform infrastructure but not application records: all breeder-owned rows are scoped to a kennel, owner/staff sessions contain a signed kennel identity, and buyer portal links include the kennel identity. Do not copy production credentials or customer records from another installation.

See `docs/DEPLOYMENT.md` for the complete Supabase and Vercel deployment sequence.

This software provides editable operational templates, not legal advice. Pricing, sales terms, health guarantees, consumer notices, privacy disclosures, transportation rules, and breeding policies must be reviewed for the breeder's jurisdiction and practices before launch.

## Validation

```bash
npm run lint
npm run build
npm test
npx supabase db query --linked --file tests/rls-isolation.sql
```
