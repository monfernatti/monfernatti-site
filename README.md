# Monfernatti Imóveis — site + CRM

Site de imóveis com CRM próprio. Página única (HTML + JavaScript), hospedada na Vercel,
com dados, fotos e login no Supabase.

## Estrutura
- `index.html` — site e CRM (rotas: `#inicio`, `#comprar`, `#alugar`, `#imovel-<id>`, `#corretores`, `#servicos`, `#informacoes`, `#anunciar`, `#favoritos`, `#crm`, `#entrar`).
- `js/config.js` — endereço e chave pública do Supabase.
- `js/dados.js` — ligação com o Supabase (banco, fotos, login).
- `fotos/` — fotos dos imóveis importados do site antigo.
- `supabase/schema.sql` — tabelas, regras de segurança e pasta de fotos.
- `supabase/seed.sql` — imóveis e corretores atuais.

## Configurar (uma vez)
1. **Supabase**: crie um projeto (região São Paulo). Em *SQL Editor*, rode `supabase/schema.sql` e depois `supabase/seed.sql`.
2. **Usuário do CRM**: em *Authentication > Users > Add user*, crie o usuário com o e-mail `monfernattiimoveis@gmail.com` e uma senha sua.
   Para dar acesso a outra pessoa: crie o usuário dela e rode `insert into public.admins (email) values ('email@dela.com');`.
3. **Chaves**: em *Project Settings > API*, copie *Project URL* e *anon public key* para `js/config.js`.
4. **Login por e-mail**: em *Authentication > URL Configuration*, coloque o endereço do site em *Site URL* (ex.: `https://monfernattiimoveis.com.br`).
5. **Vercel**: *Add New > Project*, importe este repositório e clique em *Deploy* (não precisa de configuração).

## Domínio
Só depois de testar no endereço `*.vercel.app`: na Vercel, *Settings > Domains*, adicione `monfernattiimoveis.com.br`
e `www.monfernattiimoveis.com.br`, e no registro.br troque os registros DNS indicados pela Vercel.
O e-mail (Gmail) não é afetado.

## Endereços
- Supabase: projeto `monfernatti` (região São Paulo), `https://rzwzcaixyrzpeavnxbxi.supabase.co`
- Vercel: projeto `monfernatti-site` (publica sozinho a cada envio para `main`)
