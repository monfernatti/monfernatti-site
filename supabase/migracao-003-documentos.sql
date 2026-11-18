-- Monfernatti Imóveis · atualização 003 (2026-11-18)
-- Documentos do CRM: textos de modelos editados pelo gestor, modelos próprios, dados da imobiliária
-- (_empresa) e dados privados de cada corretor usados nos documentos (_corretor-<id>, ex.: CPF).
-- Pode rodar mais de uma vez sem problema.

create table if not exists public.modelos (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.modelos enable row level security;

-- Todos que entram no CRM leem os modelos.
drop policy if exists ler_modelos on public.modelos;
create policy ler_modelos on public.modelos for select to authenticated
  using (public.eh_admin());

-- Só o gestor cria, edita e apaga modelos e os dados da imobiliária.
drop policy if exists gestor_modelos on public.modelos;
create policy gestor_modelos on public.modelos for all to authenticated
  using (public.eh_gestor()) with check (public.eh_gestor());

-- Cada corretor pode guardar os próprios dados de documentos (registro _corretor-<seu id>).
drop policy if exists corretor_modelos on public.modelos;
create policy corretor_modelos on public.modelos for all to authenticated
  using (public.eh_admin() and id = '_corretor-' || public.meu_corretor())
  with check (public.eh_admin() and id = '_corretor-' || public.meu_corretor());

do $$ begin
  begin alter publication supabase_realtime add table public.modelos; exception when others then null; end;
end $$;

select 'ok' as resultado, (select count(*) from public.modelos) as modelos;
