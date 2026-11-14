# Instructions for Claude

Follow AGENTS.md (project rules and code organization).

## Owner preferences
- The owner is not a professional developer. Reply in simple Chinese (Malaysia style), step by step.
- Work on this existing repository only. Never create a new project, repo, Vercel project or Supabase project.
- Every change goes on a new branch with a Pull Request for the owner to review. Never push to or merge into `main` without explicit confirmation.
- Keep existing features unless removal is requested. Keep the UI mobile-friendly.
- Run `npm test`, `npm run typecheck` and `npm run build` before opening a PR, and report the results honestly.
- Explain changes in simple numbered steps.

## Database (Supabase) safety
- Never modify or delete production customer/order data.
- If a database change is needed, explain the exact SQL and why, and wait for approval. The owner runs SQL in the Supabase SQL Editor.
- The real `public.orders` columns (checked 2026-11-14): id, order_number, agent_code, customer_name,
  customer_phone, category, product_model, order_type, contract_years, normal_monthly_fee,
  offer_type, cash_price, cash_buy_pv, status, installation_date, keyed_at, notes, removed_at,
  created_at, updated_at. Code mapping lives in lib/order-mapping.mjs.
- Never put service-role or secret keys in code or `NEXT_PUBLIC_*` variables.
- Vercel Preview uses the separate TEST Supabase project `lg-pv-test`; Production uses the original project. Never point Preview at production data.
