# Product Brief — Yacht Club Tools

## Goal
Create a unified web app that streamlines monthly club operations, centralizes holdings and member data, and provides research + analysis to support better decisions.

## Primary Users
- President: runs meetings, needs monthly summaries, member communications, decision history.
- Comptroller/Treasurer: manages contributions, withdrawals, member balances, accounting.
- Members (9–10): need transparent access to holdings, performance, and research.

## Core Problems
- Monthly updates are manual and inconsistent.
- Holdings and member balances are scattered in Google Sheets.
- Research is fragmented and not shared consistently.
- Performance comparisons against benchmarks are time‑consuming.

## Phase 1 Scope (MVP)
- Monthly Update Builder
  - Standardized monthly report (performance, holdings changes, contributions, notes).
  - Visible to all members inside the web app; share links optional.
- Holdings Snapshot
  - Current holdings with cost basis, market value, and P/L.
- Member Ledger
  - Track contributions/withdrawals and member balances.
- Research Tool
  - Use existing holdings list to surface relevant news and updates.
  - Provide buy/hold/sell recommendations (sourced externally).
- Analysis Tool
  - Compare holdings performance vs. indexes across selectable periods.

## Phase 2 Scope
- Research workspace (watchlists, thesis templates, catalysts, earnings calendar).
- Decision log (votes, rationale, links).
- Alerts (price moves, earnings, news).
- K‑1 support tools (future).

## Non‑Goals (for now)
- Brokerage integrations beyond CSV import.
- Automated tax filing/K‑1 generation.

## Success Criteria
- Monthly update generated in under 30 minutes.
- President and comptroller get all numbers from one place.
- Members access everything they need from the web app.
- Performance comparisons available in a few clicks.

## Assumptions
- Share price fluctuates monthly based on total portfolio value / total shares.
- Default monthly purchase is 2 shares per member, with optional extra purchases.
- Withdrawals are rare and priced at current share price.
- BTC holdings are tracked via purchase ledger.

## Open Items
- Fidelity trade export mapping (once sample is provided).
- Benchmarks beyond S&P 500 (QQQ, IWM, BTC).
