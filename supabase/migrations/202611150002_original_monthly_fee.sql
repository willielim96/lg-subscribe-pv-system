-- Special Price: keep the original monthly price next to the discounted monthly fee (normal_monthly_fee).
-- Additive and nullable: existing orders keep NULL, nothing else changes. PV and commission do not use it.
alter table public.orders
  add column original_monthly_fee numeric(12,2)
  check (original_monthly_fee is null or original_monthly_fee >= 0);
