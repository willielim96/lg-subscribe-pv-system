# LG PV Tracker - Project Handoff

Shared by Claude and ChatGPT. Read this file and AGENTS.md before changing anything.
Last updated: 2026-11-14 (Claude). Status: IN DEVELOPMENT - not launched to production.

## 1. Where things are

| Item | Value |
|---|---|
| GitHub | https://github.com/willielim96/lg-subscribe-pv-system |
| Production site (Vercel, branch main) | https://lg-subscribe-pv-system.vercel.app |
| Vercel project | team lg-pv, project lg-subscribe-pv-system, Git connected 2026-11-14 |
| Supabase PRODUCTION | project agxbbugecvnaixnamyut (real customer data - never touch without owner approval) |
| Supabase TEST | project lg-pv-test (zcoeucezvfyispcrlvtw) - used only by Vercel Preview |
| Old static site | index.html on main is served by GitHub Pages (legacy, localStorage only) |

Vercel environment variables: Production = production Supabase; Preview = test Supabase. Only the URL and the publishable key are used (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). No secret or service-role key is used anywhere in the app.

## 2. Development workflow (fixed - both AIs follow this)

1. Before editing: read the latest code on GitHub (main and any open PR branches) and this file. Do not overwrite work done by the other AI; build on top of the newest branch.
2. Every change goes on a feature branch and a Pull Request. Never commit directly to main.
3. Test on the Vercel Preview URL of the PR. Preview uses the TEST database only.
4. Run npm test, npm run typecheck and npm run build (GitHub Actions CI also runs them).
5. Never merge to main and never change Production (site or database) without the owner's explicit confirmation.
6. Database changes: save the SQL as a new file in supabase/migrations, explain it to the owner, apply to TEST first, and apply to PRODUCTION only after the owner confirms launch.
7. Never commit passwords, secret keys or .env files (.gitignore already blocks .env*).
8. The owner does not use local Git. Changes are made through GitHub (web or connector).
9. Reply to the owner in simple Chinese (Malaysia style), step by step.

Launch checklist (only when the owner says "go live"):
1. Merge the confirmed PRs into main (in order).
2. Apply confirmed migrations to the production Supabase project.
3. Confirm the Vercel Production deployment succeeded and its commit equals the latest main commit.
4. Update section 7 of this file, then report to the owner: repo URL, main commit ID, PR URLs, production URL, new features, database changes, open issues.

## 3. App structure

- app/page.tsx renders components/pv-dashboard.tsx (kept thin).
- components/: login-form, pv-dashboard (orders form and lists), commission-summary, customer-database, whatsapp-button.
- hooks/: use-pv-tracker (auth, load/save/cancel orders), use-customer-merges (merge history).
- lib/: pv.mjs (PV), commission.mjs (commission), customers.mjs (customer grouping, contract price), whatsapp.mjs (phone normalisation), order-mapping.mjs (app fields <-> database columns), orders.ts (agents, categories, form defaults), supabase/client.ts.
- tests/: node --test unit tests for all lib logic.
- Agents are fixed in lib/orders.ts: LGM121099 WILLIE LIM, LGM214656 LIEU WEI TIAN.

## 4. PV rules (lib/pv.mjs - do not change without owner approval)

- Pending (no installation date) = 0 PV. Cancelled = 0 PV.
- Cash Buy: PV = manual PV entered.
- Subscribe: (monthly fee - RM10 if Existing+New / New+New) x 17 (5-year) or x 20 (7-year).
- Half price offer (first 9 months 50%): PV uses the NORMAL monthly fee.
- Special price: the discounted monthly fee is stored and used.
- Water purifier: +300 PV if installed on or before 2026-12-31 (promotion start date not confirmed).
- Monthly targets shown: 15,000 PV and 22,100 PV. PV counts in the installation month.

## 5. Commission rules (lib/commission.mjs - do not change without owner approval)

Per agent, per installation month, cancelled and pending orders excluded:
- Subscribe basic: Subscribe PV x 15% x 70% (only the first 70% is shown; the remaining 30% is not implemented).
- Cash Buy: original price x 13%, once.
- Performance bonus on total PV: 5% (<5,100), 6% (5,100+), 8% (10,200+), 10% (17,000+), 12% (22,100+).
- Allowance by total PV: RM800 (5,000+), RM1,000 (8,500+), RM1,500 (12,000+), RM2,500 (15,000+), RM3,000 (20,000+), RM4,000 (30,000+).
- Support fund Oct-Dec 2026 only: RM500 (7,500+ PV), RM1,000 (15,000+ PV).
- Payout month = month after installation month.

## 6. Customer Database rules (lib/customers.mjs)

- Customers are derived from orders on the fly; no customer table, no duplicated customer data.
- Same name + same phone = one customer. Same name + different phone = different. Different names + same phone = flagged for the owner, never auto-merged. No phone = never merged.
- Phones normalised: 0xx -> 60xx (Malaysia), 8-digit 6/8/9xxxxxxx -> 65 (Singapore), +60/+65 kept.
- Contract total: normal = fee x months; half price = 9 months at 50% then full fee; Existing+New = (fee - RM10) x months; special = discounted fee x months; Cash Buy = one-off cash price. 5 years = 60 months, 7 years = 84 months.
- Manual merge stores (from_order_id, into_order_id) in customer_merges. Orders are never changed; undo sets undone_at, so history is kept.

## 7. Database (Supabase)

Production tables (unchanged so far): orders, agents, app_users, order_audit_log. RLS on all; access only for users in app_users (function is_app_user()). Authenticated users may select/insert/update orders; delete is not granted.

orders columns: id, order_number (unique), agent_code (FK agents), customer_name, customer_phone, category, product_model, order_type (Subscribe / Cash Buy), contract_years (5/7), normal_monthly_fee, offer_type (Normal / Limited 50% off / Special price offer / Existing + New / New + New), cash_price, cash_buy_pv, status (Pending / Installed, must match installation_date), installation_date, keyed_at, notes, removed_at (set = cancelled), created_at, updated_at.

Migration log:
| File | Purpose | TEST | PRODUCTION |
|---|---|---|---|
| supabase/test-schema.sql (local copy of production structure) | build the test project | applied 2026-11-14 | n/a |
| supabase/migrations/202611150001_customer_merges.sql | customer merge history | applied 2026-11-14 | NOT applied - apply at launch after owner confirms |

Note: supabase/migrations/202611140001_initial.sql in the local folder is outdated (different column names) and must never be run.

## 8. Progress

Open Pull Requests (not merged, production unchanged):
- PR #1 https://github.com/willielim96/lg-subscribe-pv-system/pull/1 - Commission page, WhatsApp button, Cash Buy price, blue theme.
- PR #2 https://github.com/willielim96/lg-subscribe-pv-system/pull/2 - Customer Database (stacked on PR #1; merge PR #1 first).

Production (main) currently runs the first Next.js version (orders + PV only).

Not done yet / open questions for the owner:
- Remaining 30% Subscribe commission: when and how it is paid.
- Special price orders: original monthly price is not stored.
- Existing+New contract total assumes the customer pays fee - RM10 every month - confirm.
- Water purifier +300 PV promotion start date.
- Notes field, order search/filter, export, audit history, agent management (UI not built).
- After a manual merge, the customer is shown with the name from the newest order (not necessarily the one chosen as "merge into").
- Production Supabase: "Allow new users to sign up" is ON (strangers still cannot read data). Recommend turning it off.
