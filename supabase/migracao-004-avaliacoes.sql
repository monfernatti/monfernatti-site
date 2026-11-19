-- Monfernatti Imóveis · atualização 004 (2026-11-19)
-- Avalie seu imóvel: pedidos de estudo de mercado pelo site (com fotos) e estudos feitos no CRM.
-- Pode rodar mais de uma vez sem problema.

-- 1. O pedido de avaliação traz mais respostas que os outros formulários:
--    o limite do envio público de leads passa de 8 mil para 20 mil caracteres.
drop policy if exists enviar_lead on public.leads;
create policy enviar_lead on public.leads for insert with check (
  coalesce(data->>'origem','') = 'Site' and length(data::text) < 20000
);

-- 2. Fotos enviadas pelos proprietários: pasta PRIVADA "avaliacoes" (até 6 MB por foto, só imagens).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avaliacoes', 'avaliacoes', false, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Qualquer visitante pode ENVIAR foto para a pasta pedidos/ (não pode ver, listar, trocar nem apagar).
drop policy if exists avaliacoes_enviar on storage.objects;
create policy avaliacoes_enviar on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'avaliacoes' and (storage.foldername(name))[1] = 'pedidos');

-- Só quem entra no CRM vê as fotos (por links temporários); só o gestor apaga.
drop policy if exists avaliacoes_ler on storage.objects;
create policy avaliacoes_ler on storage.objects for select to authenticated
  using (bucket_id = 'avaliacoes' and public.eh_admin());
drop policy if exists avaliacoes_apagar on storage.objects;
create policy avaliacoes_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'avaliacoes' and public.eh_gestor());

select 'ok' as resultado,
  (select public from storage.buckets where id = 'avaliacoes') as pasta_publica,
  (select count(*) from pg_policies where tablename = 'objects' and policyname like 'avaliacoes_%') as regras_fotos;
