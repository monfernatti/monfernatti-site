# Monfernatti Imóveis — site + CRM

Site de imóveis com CRM próprio. Página única (HTML + JavaScript), hospedada na Vercel,
com dados, fotos e login no Supabase.

## Estrutura
- `index.html` — site (rotas: `#inicio`, `#comprar`, `#alugar`, `#imovel-<id>`, `#corretores`, `#servicos`, `#informacoes`, `#avaliar`, `#anunciar`, `#favoritos`) e entrada do CRM (`#crm`, `#entrar`).
- `js/crm.js` — o CRM: Hoje, Funil, Leads, Agenda, Imóveis, Relatórios e Equipe.
- `js/guia.js` — aba Guia (captação, documentos, certidões, fotos e avaliação) e o checklist *Documentos da venda* de cada imóvel.
- `js/avaliacao.js` — página pública *Avalie seu imóvel* (`#avaliar`) e, no CRM, a aba Avaliações com a ferramenta de estudo de mercado.
- `js/documentos.js` — aba Documentos: modelos, gerador preenchido, impressão/PDF e Word. `js/vendor/qrcode.js` (MIT) gera os QR codes.
- `js/config.js` — endereço e chave pública do Supabase.
- `js/dados.js` — ligação com o Supabase (banco, fotos, login, acessos).
- `manifest.webmanifest`, `sw.js`, `icons/` — instalar o CRM no celular como aplicativo.
- `fotos/` — fotos dos imóveis importados do site antigo.
- `supabase/schema.sql` — tabelas, regras de segurança e pasta de fotos.
- `supabase/seed.sql` — imóveis e corretores atuais.
- `supabase/migracao-002-acessos.sql` — acesso por corretor (gestor vê tudo; corretor vê só a própria carteira).
- `supabase/migracao-003-documentos.sql` — tabela `modelos` (textos editados, modelos próprios, dados da imobiliária).
- `supabase/migracao-004-avaliacoes.sql` — pasta privada `avaliacoes` para as fotos enviadas pelos proprietários e limite maior para o pedido de avaliação.

## Configurar (uma vez)
1. **Supabase**: crie um projeto (região São Paulo). Em *SQL Editor*, rode `supabase/schema.sql`, `supabase/seed.sql`, `supabase/migracao-002-acessos.sql`, `supabase/migracao-003-documentos.sql` e `supabase/migracao-004-avaliacoes.sql`.
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
- **Documentos**: ficha do imóvel, folder de vitrine (com QR code), autorização de venda, termo de visita, retirada de chaves, proposta de compra e recibo de comissão. Saem preenchidos com cliente, imóvel, proprietário e corretor; o que faltar vira campo para preencher (ou linha em branco no papel). CPF, RG e endereço digitados ficam salvos no lead ou na captação. Imprime, salva em PDF ou baixa para o Word, e fica registrado no histórico. O gestor edita os textos e cria modelos próprios com `{{campos}}`. São modelos de referência: revise com seu advogado.
- **Avaliações**: o proprietário responde a página *Avalie seu imóvel* (tipo, local, características, situação, objetivo, fotos e contato) e o pedido entra como lead de captação com etiqueta *Avaliação*. As fotos ficam numa pasta privada, vistas só no CRM. No lead ou no imóvel, *Estudo de mercado* compara imóveis parecidos (da carteira, digitados ou achados pelos botões de busca nos portais) pelo preço por m² ou por alqueire. Para cada um o corretor só diz se é melhor, parecido ou pior em localização, acabamento e conservação; o CRM aplica os fatores, o desconto de oferta, o saneamento (mediana e Chauvenet) e o intervalo de confiança de 80% com o campo de arbítrio de ±15% (roteiro da NBR 14653-2), e sugere a faixa mínima, recomendada e máxima. Os detalhes do cálculo ficam escondidos em *Ver detalhes técnicos* e podem sair no PDF como memória de cálculo. Compara também o valor pedido pelo proprietário com a faixa. Sai em PDF com a marca e o CRECI/CNAI, com resumo pronto para o WhatsApp. É opinião de valor de corretor, não substitui o PTAM nem o laudo pela NBR 14653.
- **Guia**: o passo a passo do corretor em um lugar só: captação (9 passos com atalhos para o CRM), lista de documentos (casa, apartamento, terreno, rural, PF ou PJ) com cópia para o WhatsApp, certidões com o site oficial de cada uma, fotos e avaliação.
- **Documentos da venda** (em cada imóvel): checklist que se adapta ao tipo do imóvel e do proprietário. Marca a data de cada item, avisa certidão com mais de 30 dias, aceita *não se aplica* e monta a mensagem de WhatsApp pedindo ao proprietário só o que falta. Fica salvo em `privado.checklist`.
- **Relatórios**: leads do mês por origem, tempo até a primeira resposta, visitas, propostas, negócios fechados, volume, comissões e motivos de perda.
- **Avisos**: com o CRM aberto (ou instalado), chega aviso com som quando entra lead pelo site. Ative em ⋯ > *Ativar avisos*.
