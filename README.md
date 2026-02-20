# Yacht Club Tools

Unified web app for investment club operations: monthly updates, holdings, member ownership, and research.

## Stack
- Next.js (App Router) + TypeScript
- Prisma ORM
- PostgreSQL (Vercel Postgres compatible)
- Tailwind CSS

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL` to your Postgres connection string.
   Add `TWELVEDATA_API_KEY` to enable market quotes.
3. Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

## First Tool: Monthly Update
Admin workflows live under `/admin`:
- `/admin/monthly-update` — enter month‑end totals (portfolio value, cash, BTC price, S&P value, notes).
- `/admin/import` — import contributions, Fidelity exports, live prices, and BTC purchases.

Member view:
- `/dashboard` — read‑only monthly update with share price, ownership table, BTC value, and benchmark.
- `/holdings` — latest positions snapshot + live prices table.

## Market Quotes (Twelve Data)
Set `TWELVEDATA_API_KEY` in your environment to enable quote refreshes. The admin import page includes a “Refresh Quotes” button, and the system rate‑limits refreshes using `MARKET_QUOTES_MINUTES` (default: 10).

Automatic refresh is now configured with a free external scheduler: GitHub Actions.

The workflow calls these endpoints:
- `/api/market-quotes/refresh` every 10 minutes on weekdays
- `/api/google-sheet/refresh` once daily 2 hours after market close, with an automatic New York timezone guard

Set these repository secrets in GitHub:
- `CRON_APP_URL` (optional): your production URL, e.g. `https://yachtclubtools.vercel.app`
- `MARKET_QUOTES_SECRET` (required if endpoint auth is enabled)
- `GOOGLE_SHEETS_SECRET` (required if endpoint auth is enabled)

The workflow file is at `.github/workflows/market-quotes-refresh.yml`.

Tip: you can run the workflow manually from the GitHub Actions UI via **Run workflow** to verify your endpoints before waiting for a scheduled run.

## Google Sheets (Live Metrics Feed)
`/api/google-sheet` pulls a Google Sheet dynamically and returns JSON rows.

Supported configuration (first match wins):
1. `GOOGLE_SHEETS_CSV_URL` for a published CSV export.
2. `GOOGLE_SHEETS_SHEET_ID` + `GOOGLE_SHEETS_API_KEY` + `GOOGLE_SHEETS_RANGE` for the Sheets API.
3. `GOOGLE_SHEETS_SHEET_ID` (public sheet) with optional `GOOGLE_SHEETS_GID` or `?gid=` query param.

Response shape:
- `count`: number of rows
- `rows`: array of objects keyed by header row

Example:
- `GET /api/google-sheet`
- `GET /api/google-sheet?gid=123456789`

### Google Sheets Refresh (Cron)
Use `/api/google-sheet/refresh` to invalidate the cached metrics (tag: `sheet-metrics`).
If `GOOGLE_SHEETS_SECRET` is set, include `?secret=...` or `x-refresh-secret` header.

## CSV Import Formats
Template files live in `data/templates` for quick copy/paste.
### Contributions
Headers:
`date,member_name,amount,shares,type,memo`

Notes:
- `type` is `BUY` or `WITHDRAW`.
- You can use `member_id` or `member_email` instead of `member_name`.

### BTC Purchases
Headers:
`Purchase Date, Amount Purchased (BTC), Amount Purchased (USD), Purchased At (BTC/USD)`

You can also add a single BTC purchase directly in the import screen (manual entry).

### Fidelity Positions Snapshot
Upload the Positions export. The importer maps common columns like Symbol, Quantity, Last Price, Current Value, and Cost Basis.

### Fidelity Trade History
Upload the Activity/History export. Buys and sells will be added to the trade ledger.

### Live Prices (GoogleFinance Sheet)
Upload the live prices sheet (the importer scans for the row with `Symbol` and `Qty` headers).

## Deployment
Designed for Vercel. Set `DATABASE_URL` in Vercel project settings and deploy.

## Roadmap (Next)
- Fidelity export mapping verification
- Holdings performance vs benchmarks
- Research feed + analyst consensus
- Role‑based access
