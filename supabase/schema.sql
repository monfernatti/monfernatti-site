-- Monfernatti Imóveis: estrutura do banco.
-- Rode uma vez no Supabase: SQL Editor > New query > cole tudo > Run.

create table if not exists public.admins (email text primary key);

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

do $$
declare t text;
begin
  foreach t in array array['imoveis','corretores','leads','privado'] loop
    execute format('create table if not exists public.%I (
      id text primary key,
      data jsonb not null default ''{}''::jsonb,
      criado_em timestamptz not null default now(),
      atualizado_em timestamptz not null default now())', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

alter table public.admins enable row level security;

-- Imóveis e corretores: todos leem, só administradores alteram.
drop policy if exists ler_imoveis on public.imoveis;
create policy ler_imoveis on public.imoveis for select using (true);
drop policy if exists admin_imoveis on public.imoveis;
create policy admin_imoveis on public.imoveis for all using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists ler_corretores on public.corretores;
create policy ler_corretores on public.corretores for select using (true);
drop policy if exists admin_corretores on public.corretores;
create policy admin_corretores on public.corretores for all using (public.eh_admin()) with check (public.eh_admin());

-- Leads: qualquer visitante pode ENVIAR (formulário do site); só administradores leem e alteram.
drop policy if exists enviar_lead on public.leads;
create policy enviar_lead on public.leads for insert with check (
  coalesce(data->>'origem','') = 'Site' and length(data::text) < 8000
);
drop policy if exists admin_leads on public.leads;
create policy admin_leads on public.leads for all using (public.eh_admin()) with check (public.eh_admin());

-- Dados do proprietário: só administradores.
drop policy if exists admin_privado on public.privado;
create policy admin_privado on public.privado for all using (public.eh_admin()) with check (public.eh_admin());

-- Lista de administradores: só eles enxergam.
drop policy if exists admin_admins on public.admins;
create policy admin_admins on public.admins for select using (public.eh_admin());

-- Atualizações ao vivo (o CRM atualiza sozinho quando chega lead).
do $$ begin
  begin alter publication supabase_realtime add table public.imoveis; exception when others then null; end;
  begin alter publication supabase_realtime add table public.corretores; exception when others then null; end;
  begin alter publication supabase_realtime add table public.leads; exception when others then null; end;
end $$;

-- Fotos: pasta pública "fotos"; só administradores enviam ou apagam.
insert into storage.buckets (id, name, public) values ('fotos','fotos', true)
  on conflict (id) do update set public = true;
drop policy if exists fotos_ler on storage.objects;
create policy fotos_ler on storage.objects for select using (bucket_id = 'fotos');
drop policy if exists fotos_admin_inserir on storage.objects;
create policy fotos_admin_inserir on storage.objects for insert with check (bucket_id = 'fotos' and public.eh_admin());
drop policy if exists fotos_admin_apagar on storage.objects;
create policy fotos_admin_apagar on storage.objects for delete using (bucket_id = 'fotos' and public.eh_admin());

-- Quem pode entrar no CRM (o e-mail precisa também ter usuário criado em Authentication > Users).
insert into public.admins (email) values ('monfernattiimoveis@gmail.com') on conflict do nothing;
