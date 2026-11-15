alter table public.orders add column if not exists is_credit boolean not null default false;
