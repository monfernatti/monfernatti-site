-- Monfernatti Imóveis · atualização 002 (2026-11-18)
-- Acesso por corretor: o gestor (Fernando) vê tudo; cada corretor vê só os próprios leads e imóveis.
-- Pode rodar mais de uma vez sem problema.

alter table public.admins add column if not exists papel text not null default 'gestor';
alter table public.admins add column if not exists corretor_id text;
do $$ begin
  alter table public.admins add constraint admins_papel_ok check (papel in ('gestor','corretor'));
exception when others then null; end $$;
update public.admins set corretor_id = 'fernando'
  where lower(email) = 'monfernattiimoveis@gmail.com' and corretor_id is null;

create or replace function public.eh_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admins where lower(email) = lower(auth.jwt()->>'email') and papel = 'gestor');
$$;
create or replace function public.meu_corretor() returns text
language sql stable security definer set search_path = public as $$
  select corretor_id from public.admins where lower(email) = lower(auth.jwt()->>'email') limit 1;
$$;
create or replace function public.meu_acesso() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('papel', papel, 'corretor_id', corretor_id)
  from public.admins where lower(email) = lower(auth.jwt()->>'email') limit 1;
$$;
grant execute on function public.eh_gestor(), public.meu_corretor(), public.meu_acesso() to authenticated;

-- Leads: gestor vê todos; corretor vê e edita só os dele (lead sem corretor é do Fernando).
drop policy if exists admin_leads on public.leads;
drop policy if exists gestor_leads on public.leads;
create policy gestor_leads on public.leads for all to authenticated
  using (public.eh_gestor()) with check (public.eh_gestor());
drop policy if exists corretor_leads on public.leads;
create policy corretor_leads on public.leads for all to authenticated
  using (public.eh_admin() and coalesce(data->>'corretorId','fernando') = public.meu_corretor())
  with check (public.eh_admin() and coalesce(data->>'corretorId','fernando') = public.meu_corretor());

-- Imóveis: leitura continua pública; edição pelo gestor ou pelo corretor responsável.
drop policy if exists admin_imoveis on public.imoveis;
drop policy if exists gestor_imoveis on public.imoveis;
create policy gestor_imoveis on public.imoveis for all to authenticated
  using (public.eh_gestor()) with check (public.eh_gestor());
drop policy if exists corretor_imoveis on public.imoveis;
create policy corretor_imoveis on public.imoveis for all to authenticated
  using (public.eh_admin() and coalesce(data->>'corretorId','fernando') = public.meu_corretor())
  with check (public.eh_admin() and coalesce(data->>'corretorId','fernando') = public.meu_corretor());

-- Corretores (página Equipe): só o gestor altera.
drop policy if exists admin_corretores on public.corretores;
drop policy if exists gestor_corretores on public.corretores;
create policy gestor_corretores on public.corretores for all to authenticated
  using (public.eh_gestor()) with check (public.eh_gestor());

-- Dados de captação/proprietário: gestor, ou o corretor do imóvel.
drop policy if exists admin_privado on public.privado;
drop policy if exists gestor_privado on public.privado;
create policy gestor_privado on public.privado for all to authenticated
  using (public.eh_gestor()) with check (public.eh_gestor());
drop policy if exists corretor_privado on public.privado;
create policy corretor_privado on public.privado for all to authenticated
  using (public.eh_admin() and exists(select 1 from public.imoveis i where i.id = privado.id and coalesce(i.data->>'corretorId','fernando') = public.meu_corretor()))
  with check (public.eh_admin() and exists(select 1 from public.imoveis i where i.id = privado.id and coalesce(i.data->>'corretorId','fernando') = public.meu_corretor()));

-- Lista de acessos: cada um lê o próprio; o gestor lê e altera todos.
drop policy if exists admin_admins on public.admins;
drop policy if exists ler_admins on public.admins;
create policy ler_admins on public.admins for select to authenticated
  using (public.eh_gestor() or lower(email) = lower(auth.jwt()->>'email'));
drop policy if exists gestor_admins on public.admins;
create policy gestor_admins on public.admins for all to authenticated
  using (public.eh_gestor()) with check (public.eh_gestor());

-- Atualização em tempo real também para os dados de captação.
do $$ begin
  begin alter publication supabase_realtime add table public.privado; exception when others then null; end;
end $$;

select 'ok' as resultado, (select count(*) from public.admins) as acessos;
