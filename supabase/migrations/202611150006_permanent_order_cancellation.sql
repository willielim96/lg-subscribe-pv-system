alter table public.orders
  add column permanently_cancelled_at timestamptz,
  add constraint permanent_cancellation_requires_removed_at
    check (permanently_cancelled_at is null or removed_at is not null);

create function public.keep_order_permanently_cancelled()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.permanently_cancelled_at is not null
     and new.permanently_cancelled_at is distinct from old.permanently_cancelled_at then
    raise exception 'Permanent cancellation cannot be undone';
  end if;
  return new;
end;
$$;

create trigger keep_order_permanently_cancelled
before update on public.orders
for each row execute function public.keep_order_permanently_cancelled();
