# Deploy with Supabase and Vercel

WhiteLabel is a standard Next.js application hosted on Vercel with Supabase providing Postgres and Storage. No OpenAI hosting or OpenAI service is part of the runtime architecture.

## 1. Create the platform Supabase project

Create the Supabase project for Breeder Portal. In its SQL editor, run `supabase/schema.sql` for a fresh database. If this repository is already connected to an older database, run `supabase/multi-tenant-migration.sql` instead. Create or confirm the `documents` Storage bucket and policies created by the schema. Record the project URL, anonymous key, and service-role key.

The schema creates kennels, kennel memberships, tenant columns, and breeder records. The service-role key is server-only and must never use a `NEXT_PUBLIC_` prefix.

## 2. Create the Vercel project

Import the WhiteLabel GitHub repository into a new Vercel project. Vercel detects Next.js automatically. Keep the repository root as the project root and use the existing `npm run build` command.

Add both `breederportal.site` and `*.breederportal.site` to this Vercel project. Vercel wildcard domains require the nameserver verification method. All kennel subdomains resolve to the same project and the signed session selects the kennel tenant.

## 3. Configure Vercel environment variables

Copy every applicable variable from `.env.example` into Vercel Project Settings → Environment Variables. Apply production values to Production and safe test values to Preview and Development.

Public branding variables start with `NEXT_PUBLIC_` and are included in the browser bundle. Supabase service-role keys, session secrets, portal secrets, CRM keys, email credentials, and Twilio tokens are server-only secrets and must not use that prefix.

Required core variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `BREEDER_SESSION_SECRET`
- `BREEDER_PORTAL_SECRET`

`NEXT_PUBLIC_PLATFORM_DOMAIN` must be `breederportal.site`. Custom-domain automation additionally requires server-only `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, and, for team projects, `VERCEL_TEAM_ID`.

## 4. Create the first kennel account

Deploy the project, open `/signup`, and create the first kennel owner. There is no shared staff password. Each owner chooses an email and password, receives an included `<kennel-slug>.breederportal.site` address, and can invite buyer portal accounts from the buyer record. In **Brand and business setup**, enter the kennel's name, legal identity, contact details, colors, font, starting price, deposit, and policy reminder.

## 5. Deploy and verify

Pushes to non-production branches create Vercel previews when Git integration is enabled. Merge the verified version to `main` for production.

Before launch, verify staff login, CRUD operations, application intake, family portal authentication, file upload/download, contract creation/signing, email delivery, cron authorization, backups, and mobile layout. Confirm the browser network log sends data only to the breeder's Vercel domain, Supabase project, and explicitly configured integrations.

## 6. Custom domain and operations

Add the breeder's domain in Vercel, update `TWILIO_WEBHOOK_BASE_URL` if the phone module is enabled, and verify DNS and HTTPS. Configure Supabase backups and document retention. Rotate all inherited or temporary secrets before accepting real customer information.
