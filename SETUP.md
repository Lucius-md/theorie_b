# Theorie B – accounts en abonnement instellen

De site heeft nu accounts (e-mail + wachtwoord), een abonnement van €10 per jaar, kortingscodes en voortgang per gebruiker.
De lessen staan **niet** meer in de openbare bestanden: de server (`/api/app`) stuurt ze alleen naar iemand met een actief abonnement.

## Wat heb je nodig
| Dienst | Waarvoor | Kosten |
|---|---|---|
| Supabase | accounts, wachtwoorden, database | gratis tot 50.000 gebruikers |
| Mollie | iDEAL, Apple Pay, kaart, bankoverschrijving | per betaling, zie mollie.com/pricing |
| BTCPay Server (optioneel) | Bitcoin | eigen server of een gehoste BTCPay |
| Vercel | de website (heb je al) | gratis |

Mollie vraagt bij aanmelding een **KvK-nummer**. Zonder KvK kun je nog geen echte betalingen ontvangen. Kortingscodes en accounts werken wel meteen.

## Stap 1 – Supabase
1. Maak een account op supabase.com → **New project** (regio: Europe, bijv. Frankfurt).
2. **SQL Editor** → plak de inhoud van `supabase/schema.sql` → **Run**.
3. **Authentication → Providers → Email**: aan. “Confirm email” mag aan blijven.
4. **Authentication → URL Configuration**: Site URL = `https://theoriesaid.site`, en voeg dezelfde toe bij Redirect URLs.
5. **Project Settings → API**: kopieer
   - Project URL → in `assets/config.js` bij `SUPABASE_URL`
   - `anon` `public` key → in `assets/config.js` bij `SUPABASE_ANON_KEY`
   - `service_role` key → **alleen** in Vercel (stap 3), nooit in de code.

## Stap 2 – Mollie
1. Account op mollie.com, profiel voor `theoriesaid.site`.
2. Zet aan: iDEAL, Apple Pay, Creditcard, Bankoverschrijving.
3. **Developers → API keys**: kopieer de **test**-key (`test_...`) om eerst te testen, later de **live**-key.

## Stap 3 – Vercel: Settings → Environment Variables
| Naam | Waarde |
|---|---|
| `SUPABASE_URL` | Project URL van Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (geheim!) |
| `MOLLIE_API_KEY` | `test_...` of `live_...` |
| `SITE_URL` | `https://theoriesaid.site` |
| `ADMIN_EMAILS` | `sli726428@gmail.com` (beheerders, gescheiden door komma's) |
| `BTCPAY_URL`, `BTCPAY_STORE_ID`, `BTCPAY_API_KEY`, `BTCPAY_WEBHOOK_SECRET` | alleen voor Bitcoin |

Daarna: **Deployments → Redeploy**.

## Stap 4 – Bitcoin (optioneel)
In BTCPay: maak een store, een API key (rechten: invoices maken), en een webhook naar `https://theoriesaid.site/api/btcpay-webhook` met event **InvoiceSettled**. Zet de 4 BTCPAY-variabelen in Vercel. De knop “Betalen met Bitcoin” verschijnt dan vanzelf.

## Kortingscodes beheren (Supabase → Table Editor → `codes`)
- `kind = free`: gratis toegang voor `days` dagen.
- `kind = percent`: `percent`% korting op €10.
- `max_uses`: hoe vaak de code mag (leeg = onbeperkt). `active = false` zet hem uit. Codes in HOOFDLETTERS.
Voorbeeld (SQL Editor):
```sql
insert into codes(code, kind, days, max_uses, note) values ('VRIEND2026','free',365,10,'voor vrienden');
```

## Iemand handmatig toegang geven
```sql
select extend_subscription((select id from auth.users where email='naam@voorbeeld.nl'), 365);
```

## Lessen aanpassen
De lessen staan in `src/app.html` en `src/questions.js`. Na een wijziging: `python3 tools/build.py` en committen (dat maakt `api/app.js` opnieuw).

## Beheerpaneel
Ga naar `https://theoriesaid.site/admin` terwijl je bent ingelogd met een e-mailadres uit `ADMIN_EMAILS` (bevestigd via de mail).
Daar zie je omzet en aantallen, maak je kortingscodes, geef of stop je toegang voor gebruikers en zie je alle betalingen.
Beheerders hebben zelf altijd toegang tot de lessen.
