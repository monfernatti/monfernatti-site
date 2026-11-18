# Monfernatti Imóveis — site + CRM

Site de imóveis com CRM próprio. Página única (HTML + JavaScript), hospedada na Vercel,
com dados, fotos e login no Supabase.

## Estrutura
- `index.html` — site (rotas: `#inicio`, `#comprar`, `#alugar`, `#imovel-<id>`, `#corretores`, `#servicos`, `#informacoes`, `#anunciar`, `#favoritos`) e entrada do CRM (`#crm`, `#entrar`).
- `js/crm.js` — o CRM: Hoje, Funil, Leads, Agenda, Imóveis, Relatórios e Equipe.
- `js/config.js` — endereço e chave pública do Supabase.
- `js/dados.js` — ligação com o Supabase (banco, fotos, login, acessos).
- `manifest.webmanifest`, `sw.js`, `icons/` — instalar o CRM no celular como aplicativo.
- `fotos/` — fotos dos imóveis importados do site antigo.
- `supabase/schema.sql` — tabelas, regras de segurança e pasta de fotos.
- `supabase/seed.sql` — imóveis e corretores atuais.
- `supabase/migracao-002-acessos.sql` — acesso por corretor (gestor vê tudo; corretor vê só a própria carteira).

## Configurar (uma vez)
1. **Supabase**: crie um projeto (região São Paulo). Em *SQL Editor*, rode `supabase/schema.sql`, `supabase/seed.sql` e `supabase/migracao-002-acessos.sql`.
2. **Usuário do CRM**: abra `/#entrar`, toque em *Primeiro acesso* e crie a senha com o e-mail `monfernattiimoveis@gmail.com` (ou crie em *Authentication > Users > Add user*).
   Para dar acesso a outra pessoa: no CRM, *Equipe* > abra o corretor > *Acesso ao CRM*. Depois ela faz o *Primeiro acesso* com o e-mail liberado.
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

## CRM em resumo
- **Hoje**: quem responder agora (leads sem nenhum contato), retornos do dia, visitas, clientes esfriando (7 dias sem contato) e autorizações vencendo.
- **Lead**: WhatsApp com mensagens prontas (o envio fica no histórico), registro rápido (não atendeu, vai pensar…), próximo contato em um toque, etapa, termômetro, visitas, etiquetas, o que o cliente procura e imóveis que combinam.
- **Agenda**: visitas e retornos dos próximos 30 dias, confirmação por WhatsApp e atalho para a Agenda Google.
- **Imóveis**: captação (proprietário, autorização e validade, comissão, chave) e clientes que combinam com cada imóvel.
- **Relatórios**: leads do mês por origem, tempo até a primeira resposta, visitas, propostas, negócios fechados, volume, comissões e motivos de perda.
- **Avisos**: com o CRM aberto (ou instalado), chega aviso com som quando entra lead pelo site. Ative em ⋯ > *Ativar avisos*.
