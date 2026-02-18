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

Optional: schedule the refresh endpoint with a cron service (Vercel Cron or any scheduler) calling `/api/market-quotes/refresh?secret=...` and set `MARKET_QUOTES_SECRET` to protect it.

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

### Trades (Generic CSV)
The importer attempts to map standard columns. Required fields include:
- Date
- Symbol
- Action
- Quantity
- Price

If your export differs, share a sample and we’ll refine the mapping.

## Deployment
Designed for Vercel. Set `DATABASE_URL` in Vercel project settings and deploy.

## Roadmap (Next)
- Fidelity export mapping verification
- Holdings performance vs benchmarks
- Research feed + analyst consensus
- Role‑based access
