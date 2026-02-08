# Technical Scope (Phase 1)

## Stack
- Next.js (App Router) + TypeScript
- Prisma ORM
- PostgreSQL (Vercel Postgres compatible)
- Tailwind CSS

## Core Data Model
- `Member`
- `Contribution` (buy/withdraw)
- `PortfolioSnapshot` (month‑end totals)
- `BtcPurchase` (ledger of BTC buys)
- `Trade` (holdings purchases/sales)

## Monthly Update Flow
- Admin enters month‑end snapshot (portfolio value, cash, BTC price, S&P value, notes).
- System computes:
  - Share price = total value / total shares outstanding
  - Member ownership before/after contributions for the month
  - BTC value and benchmark display

## Imports
- Contributions CSV
- BTC purchases CSV or manual entry
- Fidelity positions snapshot
- Fidelity trade history
- Live prices (GoogleFinance export)

## Member View
- Read‑only `/dashboard` showing:
  - Portfolio value + cash
  - Share price and total shares
  - BTC holdings and value
  - Member ownership table
  - Notes
- `/holdings` showing latest positions snapshot + live prices metrics

## Next Milestones
- Confirm Fidelity export mapping with a real sample
- Add holdings summary and benchmark comparisons over time
- Add research feed + analyst consensus
- Add role‑based access
