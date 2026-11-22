# Theorie B – accounts en abonnement

Alles draait op Supabase (project `theoriesaid`, regio eu-west-1):
- **Database**: tabellen `subscriptions`, `progress`, `codes`, `code_uses`, `payments`, `admins` (zie `supabase/schema.sql`).
- **Server**: Edge Function `api` (`supabase/functions/api/index.ts`). Die krijgt de geheime sleutel automatisch van Supabase. In Vercel hoeft niets ingesteld te worden.
- **Lessen**: `src/app.html` + `src/questions.js` → `python3 tools/build.py` → `content.json`. De functie haalt dit op en geeft het alleen aan abonnees en beheerders.

## Nog door de eigenaar te doen
1. **Supabase → Authentication → URL Configuration**: Site URL `https://theoriesaid.site`, Redirect URL `https://theoriesaid.site/**`.
2. **Mollie** (na KvK): API key als Edge Function secret `MOLLIE_API_KEY` (Supabase → Edge Functions → Secrets).
3. **Bitcoin** (optioneel): secrets `BTCPAY_URL`, `BTCPAY_STORE_ID`, `BTCPAY_API_KEY`, `BTCPAY_WEBHOOK_SECRET`; webhook naar `https://hvtmgzvqnnbabjptpbfr.supabase.co/functions/v1/api/btcpay-webhook` (event InvoiceSettled).
4. **E-mail**: de ingebouwde mailservice van Supabase verstuurt maar een paar mails per uur. Voor echte gebruikers: Authentication → Emails → SMTP Settings (bijv. Resend of Brevo).

## Beheer
- Beheerders staan in de tabel `admins` (e-mail in kleine letters, account moet bevestigd zijn).
- Beheerpaneel: `https://theoriesaid.site/admin` (codes, gebruikers, betalingen, omzet).

## Let op
Dit GitHub-project is openbaar, dus `content.json` (de lessen) is daar voor iedereen te lezen. Wil je dat niet: maak het project privé en zet een GitHub-token als Edge Function secret `GITHUB_TOKEN`.
