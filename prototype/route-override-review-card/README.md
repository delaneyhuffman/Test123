# Route Override Approval — Review Card (Prototype)

A small, **reviewer-facing** prototype artifact that visualizes how route override
decisions are authorized and audited. It is a single self-contained static HTML
file (`index.html`) — no build step, no dependencies. Open it in any browser.

## What it shows

- **Role hierarchy & authority** — Operator → Supervisor → Safety Officer, and what
  each tier may initiate, approve, prioritize, or fully override.
- **Authorization outcome states** — Requested, Approved, Supervisor priority
  override, Denied, and Safety override.
- **Audit panel per decision** — user identity, role/tier, timestamp, affected
  robot/route, action type, authorization outcome, and approver.
- **Where settings live** — surfaces `Fleet Management → Operator Roles → Route
  Override` to address the admin discoverability gap.

The four sample cards are drawn from PRD evidence:

1. **RoboFlex** assembly-line reroute — operator requests, supervisor approves.
2. **FleetOps** command conflict — supervisor priority override resolves competing commands.
3. **RoboFlex** safety event — safety officer full override, automatically audited.
4. **FleetOps** out-of-scope attempt — operator self-approval **denied** (and recorded).

## How to view

Open `index.html` in a browser (double-click, or `open index.html` /
`xdg-open index.html`).

## Traceability

- **PRD:** Role-Based Route Override Controls (Status: Approved)
- **Source Product Signal:** enterprise route override authority (RoboFlex, TechWare, FleetOps)

## Scope / non-goals

This is an illustrative prototype only. It has **no** backend, RBAC engine, live
fleet control, persistence, or auth. Audit export format and configurable-tier
decisions remain open questions in the PRD.
