-- Theorie B: accounts, abonnement, kortingscodes en voortgang per gebruiker.
-- Is al toegepast op het project 'theoriesaid'. Alleen nodig bij een nieuw project: Supabase → SQL Editor → Run.

-- 1. Abonnement per gebruiker (alleen de server mag dit veranderen)
create table if not exists public.subscriptions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  paid_until timestamptz not null default now() - interval '1 second',
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "eigen abonnement lezen" on public.subscriptions;
create policy "eigen abonnement lezen" on public.subscriptions
  for select using (auth.uid() = user_id);

-- 2. Voortgang per gebruiker (iedereen ziet en bewaart alleen zijn eigen voortgang)
create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
drop policy if exists "eigen voortgang lezen" on public.progress;
drop policy if exists "eigen voortgang maken" on public.progress;
drop policy if exists "eigen voortgang wijzigen" on public.progress;
create policy "eigen voortgang lezen"    on public.progress for select using (auth.uid() = user_id);
create policy "eigen voortgang maken"    on public.progress for insert with check (auth.uid() = user_id);
create policy "eigen voortgang wijzigen" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Kortingscodes (niemand kan deze lezen via de website; alleen de server)
--    kind = 'free'    → gratis toegang voor <days> dagen
--    kind = 'percent' → <percent>% korting op de prijs
create table if not exists public.codes (
  code       text primary key,
  kind       text not null default 'free' check (kind in ('free','percent')),
  percent    int  not null default 100 check (percent between 1 and 100),
  days       int  not null default 365 check (days > 0),
  max_uses   int,                 -- leeg = onbeperkt
  uses       int  not null default 0,
  active     boolean not null default true,
  expires_at timestamptz,         -- leeg = verloopt niet
  note       text,
  created_at timestamptz not null default now()
);
alter table public.codes enable row level security;  -- geen policies: alleen service role

create table if not exists public.code_uses (
  code    text references public.codes(code) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  used_at timestamptz not null default now(),
  primary key (code, user_id)
);
alter table public.code_uses enable row level security;

-- 4. Betalingen (Mollie en Bitcoin), om dubbele verwerking te voorkomen
create table if not exists public.payments (
  id         text primary key,      -- tr_xxx (Mollie) of BTCPay invoice id
  provider   text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  amount     numeric(10,2) not null,
  code       text,
  status     text not null default 'open',
  processed  boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
drop policy if exists "eigen betalingen lezen" on public.payments;
create policy "eigen betalingen lezen" on public.payments for select using (auth.uid() = user_id);

-- 5. Functies (alleen aan te roepen door de server met de service role key)
create or replace function public.extend_subscription(p_user uuid, p_days int)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v timestamptz;
begin
  insert into subscriptions(user_id, paid_until) values (p_user, now() + make_interval(days => p_days))
  on conflict (user_id) do update
    set paid_until = greatest(subscriptions.paid_until, now()) + make_interval(days => p_days),
        updated_at = now()
  returning paid_until into v;
  return v;
end $$;

-- Controleert een code. Geeft terug: ok, kind, percent, days, reason
create or replace function public.check_code(p_user uuid, p_code text)
returns table(ok boolean, kind text, percent int, days int, reason text)
language plpgsql security definer set search_path = public as $$
declare c codes%rowtype;
begin
  select * into c from codes where code = upper(trim(p_code));
  if not found or not c.active then return query select false, null::text, 0, 0, 'onbekend'; return; end if;
  if c.expires_at is not null and c.expires_at < now() then return query select false, null::text, 0, 0, 'verlopen'; return; end if;
  if c.max_uses is not null and c.uses >= c.max_uses then return query select false, null::text, 0, 0, 'op'; return; end if;
  if exists(select 1 from code_uses u where u.code = c.code and u.user_id = p_user) then return query select false, null::text, 0, 0, 'al gebruikt'; return; end if;
  return query select true, c.kind, c.percent, c.days, 'ok';
end $$;

-- Gebruikt een code (atomair): telt hem en registreert de gebruiker
create or replace function public.use_code(p_user uuid, p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update codes set uses = uses + 1
   where code = upper(trim(p_code)) and active
     and (max_uses is null or uses < max_uses)
     and (expires_at is null or expires_at > now());
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  insert into code_uses(code, user_id) values (upper(trim(p_code)), p_user);
  return true;
exception when unique_violation then
  return false;  -- the block is rolled back, so the count above is undone too
end $$;

revoke all on function public.extend_subscription(uuid,int) from public, anon, authenticated;
revoke all on function public.check_code(uuid,text)        from public, anon, authenticated;
revoke all on function public.use_code(uuid,text)          from public, anon, authenticated;
grant execute on function public.extend_subscription(uuid,int) to service_role;
grant execute on function public.check_code(uuid,text)        to service_role;
grant execute on function public.use_code(uuid,text)          to service_role;

-- 6. Codes maak je in het beheerpaneel (/admin). Zet hier geen codes neer: dit bestand is openbaar.

-- 7. Beheerders (alleen de server leest dit)
create table if not exists public.admins (email text primary key check (email = lower(email)), created_at timestamptz not null default now());
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- 8. Beveiliging: pogingen om codes in te wisselen (max 10 per uur), grootte van voortgang, sleutel voor de lesinhoud
create table if not exists public.redeem_attempts (user_id uuid not null references auth.users(id) on delete cascade, at timestamptz not null default now());
create index if not exists redeem_attempts_user_at on public.redeem_attempts(user_id, at);
alter table public.redeem_attempts enable row level security;
revoke all on public.redeem_attempts from anon, authenticated;
alter table public.progress drop constraint if exists progress_size;
alter table public.progress add constraint progress_size check (pg_column_size(data) < 200000);
create table if not exists public.app_secrets (name text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
-- content_key wordt eenmalig aangemaakt met gen_random_bytes(32); de waarde staat NIET in deze repo.
alter table public.payments add column if not exists method text;

-- Terugbetaling / chargeback: 365 dagen weer aftrekken (één keer per betaling).
create or replace function public.revoke_payment(p_id text) returns boolean
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  update public.payments set processed = false, status = 'refunded' where id = p_id and processed = true and coalesce(status,'') <> 'refunded' returning user_id into r;
  if not found then return false; end if;
  update public.subscriptions set paid_until = paid_until - interval '365 days', updated_at = now() where user_id = r.user_id;
  return true;
end $$;
revoke all on function public.revoke_payment(text) from public, anon, authenticated;
grant execute on function public.revoke_payment(text) to service_role;
