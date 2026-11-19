/* Guia do corretor (aba Guia do CRM): passo a passo da captação, documentos, certidões,
   fotos e avaliação. E o checklist de documentos de cada imóvel, na gaveta do imóvel.
   Só definições: o código roda quando o CRM chama crmGuia, secChecklistImovel e ligarChecklist. */

const GU_ABAS = [["captacao","Captação"],["documentos","Documentos"],["certidoes","Certidões"],["fotos","Fotos"],["avaliacao","Avaliação"]];
const GU_BUSCA = q => "https://www.google.com/search?q=" + encodeURIComponent(q);

/* Certidões: onde tirar cada uma. url vazia = sem site (pedido direto); busca = sem endereço fixo confirmado. */
const GU_CERT = {
  "c-mat":  {nome:"Matrícula atualizada com ônus reais", para:"Mostra quem é o dono, a descrição do imóvel e se há hipoteca, penhora ou alienação fiduciária.",
             onde:"Registro de Imóveis, pedido online pelo ONR", url:"https://registradores.onr.org.br",
             dica:"Em Cornélio Procópio há o 1º e o 2º Ofício de Registro de Imóveis. O cartório certo aparece na matrícula antiga ou na escritura."},
  "c-cnib": {nome:"Indisponibilidade de bens (CNIB)", para:"Confirma se há ordem judicial bloqueando os bens de algum proprietário.",
             onde:"Central Nacional de Indisponibilidade de Bens", url:"https://indisponibilidade.onr.org.br", dica:"Consulte pelo CPF ou CNPJ de cada proprietário e cônjuge."},
  "c-iptu": {nome:"Certidão negativa de IPTU", para:"Confirma que não há IPTU nem taxas do imóvel em atraso.",
             onde:"Prefeitura de Cornélio Procópio (tributos)", busca:"certidão negativa de débitos imobiliários IPTU Prefeitura de Cornélio Procópio",
             dica:"Tenha em mãos a inscrição imobiliária, que está na capa do carnê."},
  "c-cond": {nome:"Declaração de quitação do condomínio", para:"Garante que não há taxas de condomínio em atraso.",
             onde:"Síndico ou administradora do condomínio", dica:"Assinada pelo síndico, junto com a ata da assembleia que o elegeu."},
  "c-itr":  {nome:"Certidão negativa do imóvel rural (ITR)", para:"Comprova que não há ITR em aberto. A escritura de imóvel rural pede a quitação dos últimos 5 anos.",
             onde:"Receita Federal, certidões de imóvel rural", url:"https://servicos.receitafederal.gov.br/servico/certidoes/#/home", dica:"Use o número do imóvel na Receita (NIRF ou CIB)."},
  "c-ccir": {nome:"CCIR do INCRA", para:"Certificado de Cadastro de Imóvel Rural, obrigatório para vender, desmembrar ou financiar.",
             onde:"Sistema Nacional de Cadastro Rural (INCRA)", url:"https://sncr.serpro.gov.br/ccir/emissao", dica:"Confira se a taxa do ano está paga."},
  "c-car":  {nome:"CAR (Cadastro Ambiental Rural)", para:"Mostra a situação ambiental do imóvel rural (reserva legal e áreas de preservação).",
             onde:"Sistema do CAR", url:"https://www.car.gov.br", dica:"Peça o recibo de inscrição ao proprietário."},
  "c-tjpr": {nome:"Ações cíveis e execuções fiscais (TJPR)", para:"Mostra processos na Justiça do Paraná que podem atingir o imóvel.",
             onde:"Tribunal de Justiça do Paraná", url:"https://portal.tjpr.jus.br/certidao/publico/inicio.do", dica:"Tire a de distribuição cível e a de execuções fiscais da comarca de Cornélio Procópio."},
  "c-trf4": {nome:"Justiça Federal (TRF4)", para:"Processos federais, inclusive cobranças da União.",
             onde:"Tribunal Regional Federal da 4ª Região", url:"https://www.trf4.jus.br/trf4/processos/certidao/index.php"},
  "c-cndt": {nome:"Débitos trabalhistas (CNDT)", para:"Confirma que o vendedor não tem dívida trabalhista com condenação.",
             onde:"Tribunal Superior do Trabalho", url:"https://cndt-certidao.tst.jus.br/inicio.faces"},
  "c-trt9": {nome:"Ações trabalhistas (TRT 9ª Região)", para:"Processos trabalhistas em andamento no Paraná.",
             onde:"Tribunal Regional do Trabalho da 9ª Região", url:"https://www.trt9.jus.br", dica:"Procure \"Certidões\" no menu de serviços."},
  "c-rfb":  {nome:"Débitos federais (Receita e PGFN)", para:"Certidão de tributos federais e dívida ativa da União.",
             onde:"Receita Federal", url:"https://servicos.receitafederal.gov.br/servico/certidoes/#/home"},
  "c-est":  {nome:"Débitos estaduais (Paraná)", para:"Certidão de débitos tributários e dívida ativa do Estado.",
             onde:"Receita Estadual do Paraná, portal de certidões", busca:"certidão de débitos tributários e dívida ativa estadual Receita Estadual Paraná",
             dica:"O portal pede login do Nota Paraná ou da Receita/PR."},
  "c-prot": {nome:"Protestos", para:"Mostra títulos protestados em cartório em nome do vendedor.", onde:"CENPROT, pesquisa nacional de protestos", url:"https://www.pesquisaprotesto.com.br"},
  "c-civil":{nome:"Certidão de casamento ou nascimento atualizada", para:"Comprova o estado civil e o regime de bens de quem vende.",
             onde:"Registro Civil, pedido online", url:"https://www.registrocivil.org.br", dica:"Para a escritura, costuma ser pedida com no máximo 90 dias."}
};
const GU_CERT_IMOVEL = ["c-mat","c-cnib","c-iptu","c-cond"];
const GU_CERT_PROP = ["c-tjpr","c-trf4","c-cndt","c-trt9","c-rfb","c-est","c-prot","c-civil"];
const GU_CERT_RURAL = ["c-itr","c-ccir","c-car"];
const guCertUrl = c => c.url || (c.busca ? GU_BUSCA(c.busca) : "");
const guDias = d => d ? Math.floor((Date.now() - new Date(String(d).slice(0,10)+"T00:00:00"))/864e5) : 0;
const guHojeIso = () => toLocalInput(hoje()).slice(0,10);

/* Itens do checklist. q: quando aparece (u urbano, r rural, cond condomínio, obra construção, pf, pj); opc: pode marcar "não se aplica";
   dono: o proprietário entrega (entra no pedido por WhatsApp); cert: liga à certidão (link e alerta de 30 dias). */
const GU_ITENS = [
  {g:"imovel", id:"iptu",  t:"Capa do carnê do IPTU do ano (traz a inscrição imobiliária)", q:"u", dono:1},
  {g:"imovel", id:"obra",  t:"Planta aprovada, habite-se e averbação da construção na matrícula", q:"obra", opc:1, dono:1},
  {g:"imovel", id:"contas",t:"Última conta de luz e de água", q:"u", dono:1},
  {g:"imovel", id:"ccir",  t:"CCIR do INCRA com a taxa do ano paga", q:"r", dono:1, cert:"c-ccir"},
  {g:"imovel", id:"itr",   t:"ITR dos últimos 5 anos (declarações e recibos)", q:"r", dono:1},
  {g:"imovel", id:"car",   t:"Recibo do CAR (Cadastro Ambiental Rural)", q:"r", dono:1, cert:"c-car"},
  {g:"imovel", id:"geo",   t:"Georreferenciamento certificado no INCRA, quando a área exigir", q:"r", opc:1, dono:1},
  {g:"imovel", id:"fin",   t:"Se financiado: banco e saldo devedor atualizado", opc:1, dono:1},
  {g:"imovel", id:"loc",   t:"Se alugado: contrato de locação em vigor", opc:1, dono:1},
  {g:"prop", id:"rg",      t:"RG e CPF (ou CNH) de todos os proprietários e cônjuges", q:"pf", dono:1},
  {g:"prop", id:"civil",   t:"Certidão de casamento atualizada (ou de nascimento, se solteiro)", q:"pf", dono:1, cert:"c-civil"},
  {g:"prop", id:"pacto",   t:"Pacto antenupcial ou escritura de união estável", q:"pf", opc:1, dono:1},
  {g:"prop", id:"resid",   t:"Comprovante de residência", q:"pf", dono:1},
  {g:"prop", id:"contato", t:"Profissão, e-mail e telefone de cada proprietário", q:"pf", dono:1},
  {g:"prop", id:"social",  t:"Contrato social e última alteração", q:"pj", dono:1},
  {g:"prop", id:"cnpj",    t:"Cartão CNPJ", q:"pj", dono:1},
  {g:"prop", id:"socios",  t:"RG e CPF dos sócios que assinam pela empresa", q:"pj", dono:1},
  {g:"prop", id:"ata",     t:"Ata ou procuração que autorize a venda, se o contrato social exigir", q:"pj", opc:1, dono:1},
  {g:"cert", id:"c-mat",  t:GU_CERT["c-mat"].nome,  cert:"c-mat"},
  {g:"cert", id:"c-cnib", t:GU_CERT["c-cnib"].nome, cert:"c-cnib"},
  {g:"cert", id:"c-iptu", t:GU_CERT["c-iptu"].nome, q:"u", cert:"c-iptu"},
  {g:"cert", id:"c-cond", t:GU_CERT["c-cond"].nome, q:"cond", opc:1, dono:1, cert:"c-cond"},
  {g:"cert", id:"c-itr",  t:GU_CERT["c-itr"].nome,  q:"r", cert:"c-itr"},
  ...GU_CERT_PROP.filter(k=>k!=="c-civil").map(k=>({g:"cert", id:k, t:GU_CERT[k].nome, cert:k}))
];
const GU_GRUPOS = [["imovel","Do imóvel"],["prop","Do proprietário"],["cert","Certidões"]];
const GU_ESPECIAIS = [
  "Procurador: procuração pública com poderes para vender, feita ou revalidada há pouco tempo",
  "Herança: certidão de óbito, formal de partilha ou alvará judicial e os dados do inventariante",
  "Divórcio: certidão de casamento com a averbação do divórcio e a partilha",
  "Imóvel na planta: contrato com a construtora e extrato dos pagamentos"
];

function guCtx(i, ck){
  const f = avFam(i && i.categoria);
  return {r: f==="rural", u: f!=="rural", cond: avCond(i && i.categoria), obra: f==="casa" || f==="com", pj: !!(ck && ck._pj), pf: !(ck && ck._pj)};
}
const guItensDe = ctx => GU_ITENS.filter(it=>!it.q || ctx[it.q]);
function guResumo(i, ck){
  ck = ck || {};
  const its = guItensDe(guCtx(i, ck)), feitos = its.filter(it=>ck[it.id]);
  const velhas = its.filter(it=>it.cert && ck[it.id] && ck[it.id].s==="ok" && ck[it.id].d && guDias(ck[it.id].d) > 30);
  return {its, total:its.length, feitos:feitos.length, velhas, pendDono:its.filter(it=>it.dono && !ck[it.id])};
}

/* ---------- Aba Guia ---------- */
const GU_PASSOS = [
  {t:"Pesquise antes de falar com o proprietário", x:"Veja anúncios antigos do endereço e o preço de imóveis parecidos no bairro. Chegar com números mostra preparo e evita discutir preço no achismo.",
   b:[["Fazer estudo de mercado","av-estudo"]]},
  {t:"Primeiro contato", x:"Apresente-se e entenda a situação: por que quer vender, em quanto tempo, quanto espera receber, se o imóvel está financiado, alugado ou ocupado e se os documentos estão em dia. Já marque a visita.",
   b:[["Cadastrar o proprietário","novo-lead"]]},
  {t:"Visita de captação", x:"Percorra o imóvel inteiro com o proprietário. Confira medidas, estado de conservação, pontos fortes e o que pode atrapalhar a venda. Tire fotos de referência (as do anúncio seguem a aba Fotos)."},
  {t:"Mostre o valor de mercado", x:"Apresente o estudo de mercado com os imóveis comparados. Combine o valor do anúncio e a margem de negociação com base nos dados, não na opinião.",
   b:[["Abrir Avaliações","aba","avaliacoes"]]},
  {t:"Explique o plano de divulgação", x:"Mostre onde o imóvel vai aparecer (site, Instagram, grupos e parceiros), como serão as visitas, de quanto em quanto tempo ele terá retorno, a comissão e por que a exclusividade ajuda."},
  {t:"Peça os documentos", x:"Use a lista da aba Documentos. Peça fotos ou PDFs legíveis e confira nomes, CPF e número da matrícula. O checklist de cada imóvel fica dentro do próprio imóvel.",
   b:[["Ver a lista","gu-aba","documentos"]]},
  {t:"Assine a autorização de venda", x:"Assinada por todos os proprietários e cônjuges, com valor, prazo, comissão e exclusividade. Sem autorização assinada, a captação não está fechada.",
   b:[["Gerar autorização","aba","documentos"]]},
  {t:"Cadastre o imóvel no CRM", x:"Preencha tudo: dados, características, fotos na ordem do tour, descrição, onde está a chave, validade da autorização e observações internas. Imóvel incompleto vende menos.",
   b:[["+ Imóvel","novo-imovel"]]},
  {t:"Acompanhe o proprietário", x:"Dê retorno pelo menos a cada 15 dias: visitas, propostas e o que os clientes acharam. Se o imóvel não girar em 60 dias, reveja preço e anúncio com ele. O botão \"Mandar atualização ao proprietário\" fica no imóvel."}
];
const GU_FOTOS_PASSOS = [
  {t:"Escolha dia e horário", x:"Dia de sol, entre 10h e 15h. A fachada sai melhor com o sol batendo nela, nunca contra o sol. Área de lazer fica bonita no fim da tarde."},
  {t:"Prepare o imóvel", x:"Abra cortinas e janelas, acenda todas as luzes, arrume camas e almofadas. Tire objetos pessoais, roupas, lixo, tapetes do banheiro, ímãs da geladeira e produtos da pia. Baixe a tampa do vaso e tire os carros da garagem."},
  {t:"Ajuste o celular", x:"Limpe a lente, ligue o HDR e as linhas de grade. Use a câmera principal (1x); a grande-angular (0,5x) só em cômodos pequenos. Nada de filtros nem modo retrato."},
  {t:"Fotografe deitado (horizontal)", x:"Site e portais mostram as fotos na horizontal. Foto em pé fica com faixas e parece amadora. A exceção são stories e reels."},
  {t:"Altura e ângulo", x:"Celular na altura do peito (1,20 m a 1,50 m), reto, sem inclinar. Paredes e portas devem sair retas. Fotografe do canto do cômodo, pegando três paredes, para dar noção de espaço."},
  {t:"Siga o caminho da visita", x:"Fotografe na ordem em que o cliente andaria pelo imóvel. Fica mais fácil de cadastrar e conta uma história para quem vê o anúncio."},
  {t:"Revise antes de subir", x:"Apague fotos tremidas, escuras ou repetidas. Ajuste só brilho e alinhamento. No CRM, suba na ordem do tour, com a melhor foto (fachada ou sala) como capa."}
];
const GU_FOTOS_LISTAS = [
  ["Área externa", ["Fachada de frente e em 45 graus","Portaria e entrada do condomínio","Rua e vizinhança","Garagem e vagas","Quintal, jardim ou área gourmet","Vista da janela ou da varanda"]],
  ["Área interna", ["Sala, de dois ângulos opostos","Cozinha, geral e detalhe dos armários","Cada quarto, do canto, pegando janela e armário","Suíte e closet","Banheiros, de pé na porta","Área de serviço","Varanda ou sacada"]],
  ["Condomínio", ["Piscina","Academia","Salão de festas e churrasqueira","Playground e quadra","Hall de entrada e elevadores"]],
  ["Rural", ["Entrada e porteira","Sede e casas","Barracões, currais e estruturas","Lavoura, pasto ou mata","Água: rio, mina, açude ou poço","Foto aérea com drone, se possível"]],
  ["Evite", ["Aparecer no reflexo de espelhos e vidros","Pessoas ou animais na foto","Zoom digital (chegue mais perto andando)","Fotografar contra a janela com sol forte","Flash direto","Placas de carro, documentos ou fotos da família"]]
];

function guBtn([r, act, v]){ return `<button type="button" class="btn btn-linha btn-sm" data-act="${act}"${v?` data-v="${v}"`:""}>${esc(r)}</button>`; }
function guPassos(lista){
  return `<ol class="gu-passos">${lista.map(p=>`<li><div><b>${esc(p.t)}</b><p>${esc(p.x)}</p>${p.b?`<div class="chips">${p.b.map(guBtn).join("")}</div>`:""}</div></li>`).join("")}</ol>`;
}
function guLista(titulo, itens, nota){
  return `<div class="bloco-card gu-lista"><h4>${esc(titulo)}</h4><ul class="lista">${itens.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${nota?`<p class="nota">${esc(nota)}</p>`:""}</div>`;
}
function guCartao(k, n){
  const c = GU_CERT[k], u = guCertUrl(c);
  return `<li class="gu-cert"><div class="gu-cert-top"><span class="gu-n tab">${String(n).padStart(2,"0")}</span><div><b>${esc(c.nome)}</b><p>${esc(c.para)}</p></div></div>
    <div class="gu-onde"><p><b>Onde:</b> ${esc(c.onde)}</p>${c.dica?`<small>Dica: ${esc(c.dica)}</small>`:""}</div>
    ${u?`<a class="btn btn-linha btn-sm" target="_blank" rel="noopener" href="${esc(u)}">${c.url?"Abrir site oficial ↗":"Procurar o site oficial ↗"}</a>`:""}</li>`;
}
function guMsgDocs(nome, itens, corretor){
  const p = primeiroNome(nome||"");
  return `Olá${p?", "+p:""}! Para anunciar o imóvel e deixar a venda mais rápida e segura, preciso destes documentos (pode mandar foto ou PDF por aqui mesmo):\n\n`
    + itens.map(x=>"• "+x).join("\n") + `\n\nQualquer dúvida, estou à disposição.${corretor?"\n"+corretor:""}`;
}

function crmGuia(el){
  const ab = GU_ABAS.some(a=>a[0]===S.guTab) ? S.guTab : "captacao";
  const topo = `<div class="sec-h" style="margin-top:0"><div><h3 style="font-size:26px">Guia do corretor</h3><p>Captação, documentos, certidões, fotos e avaliação em um só lugar, ligados ao que você faz no CRM.</p></div></div>
    <nav class="pills gu-abas" aria-label="Partes do guia">${GU_ABAS.map(([k,r])=>`<button type="button" class="pill ${k===ab?"on":""}" data-act="gu-aba" data-v="${k}" ${k===ab?'aria-current="true"':""}>${r}</button>`).join("")}</nav>`;
  let corpo = "";
  if(ab==="captacao") corpo = `<div class="gu-duas"><div>${guPassos(GU_PASSOS)}</div>
      <aside class="gu-lado"><div class="aviso"><b>Sem autorização assinada não há captação.</b><p class="nota" style="margin:6px 0 0">Herança, divórcio sem partilha ou dívida na matrícula: converse com o Fernando antes de assinar.</p></div>
      ${guLista("Antes da visita, leve", ["O estudo de mercado impresso ou no celular","A autorização de venda para assinar","A lista de documentos para o proprietário"])}</aside></div>`;
  else if(ab==="documentos"){
    const grupo = (g, ctx) => GU_ITENS.filter(it=>it.g===g && (!it.q || ctx(it.q))).map(it=>it.t);
    corpo = `<div class="aviso-acao"><p class="nota" style="margin:0;max-width:640px">Peça os documentos já na captação: a venda anda mais rápido e não aparecem surpresas quando surgir o comprador. As certidões valem pouco tempo e são tiradas de novo perto da escritura. Cada imóvel tem o próprio checklist na gaveta do imóvel.</p>
        <button type="button" class="btn btn-whats btn-sm" data-act="gu-copiar-docs">Copiar lista para o WhatsApp</button></div>
      <div class="gu-grade">
        ${guLista("Do imóvel (urbano)", grupo("imovel", q=>q==="u"||q==="obra"||q==="cond").concat("Declaração de quitação do condomínio, se houver"))}
        ${guLista("Proprietário pessoa física", grupo("prop", q=>q==="pf"))}
        ${guLista("Proprietário empresa", grupo("prop", q=>q==="pj"))}
        ${guLista("Imóvel rural", GU_ITENS.filter(it=>it.q==="r" && it.g==="imovel").map(it=>it.t), "Chácara, sítio ou fazenda pedem também a certidão de ITR da Receita Federal.")}
        ${guLista("Situações especiais", GU_ESPECIAIS, "Nesses casos, converse com o Fernando antes de assinar a autorização.")}
      </div>`;
  }
  else if(ab==="certidoes") corpo = `<div class="aviso" style="margin-bottom:16px">Tire as certidões de <b>todos os proprietários e cônjuges</b>. A maioria é gratuita e sai na hora. Elas valem pouco tempo, então para a escritura tire de novo perto da data. Se alguma vier positiva (com processo ou débito), não descarte o negócio: leve para o Fernando analisar.</div>
      <h4 class="gu-h">Do imóvel</h4><ul class="gu-certs">${GU_CERT_IMOVEL.map((k,n)=>guCartao(k,n+1)).join("")}</ul>
      <h4 class="gu-h">Do proprietário</h4><ul class="gu-certs">${GU_CERT_PROP.map((k,n)=>guCartao(k,n+1)).join("")}</ul>
      <h4 class="gu-h">Imóvel rural</h4><ul class="gu-certs">${GU_CERT_RURAL.map((k,n)=>guCartao(k,n+1)).join("")}</ul>`;
  else if(ab==="fotos") corpo = `<div class="aviso" style="margin-bottom:16px">A foto é o primeiro contato do cliente com o imóvel. Meta mínima: <b>20 fotos</b> por imóvel; o ideal é de 30 a 40.</div>
      <div class="gu-duas"><div>${guPassos(GU_FOTOS_PASSOS)}
        <h4 class="gu-h">Vídeo</h4>${guPassos([{t:"Vídeo de apresentação", x:"Na horizontal, movimentos lentos, de 30 segundos a 1 minuto e meio, na mesma ordem das fotos. Use estabilizador se tiver."},{t:"Reels e stories", x:"Na vertical, cortes rápidos, mostrando os 3 maiores diferenciais logo nos primeiros segundos."}])}</div>
      <aside class="gu-lado">${GU_FOTOS_LISTAS.map(([t,l])=>guLista(t,l)).join("")}</aside></div>`;
  else corpo = `<div class="gu-duas"><div>
      <h4 class="gu-h" style="margin-top:0">Quando usar</h4>
      <div class="gu-quando">
        <div class="bloco-card"><b>Pedido pelo site</b><p class="nota">O proprietário responde a página Avalie seu imóvel e o pedido cai na aba Avaliações.</p><button type="button" class="btn btn-linha btn-sm" data-act="aba" data-v="avaliacoes">Ver pedidos</button></div>
        <div class="bloco-card"><b>Captação na rua</b><p class="nota">Faça o estudo do zero. Ao salvar, o proprietário entra nos leads como captação.</p><button type="button" class="btn btn-ouro btn-sm" data-act="av-estudo">+ Novo estudo</button></div>
        <div class="bloco-card"><b>Imóvel da carteira</b><p class="nota">Abra o imóvel e toque em Estudo de mercado para rever o preço com o proprietário.</p><button type="button" class="btn btn-linha btn-sm" data-act="aba" data-v="imoveis">Abrir Imóveis</button></div>
      </div>
      <h4 class="gu-h">Como fazer em 3 passos</h4>
      ${guPassos([{t:"Conte como é o imóvel", x:"Tipo, bairro, área e o básico. Se veio pelo site, já vem preenchido."},
        {t:"Compare com 4 a 8 parecidos", x:"Use os botões de busca (ZAP, Viva Real, OLX…) ou imóveis da carteira. Para cada um, informe área e valor e diga se é melhor, parecido ou pior que o avaliado em localização, acabamento e conservação."},
        {t:"Confira e envie", x:"O CRM calcula a faixa (mínimo, recomendado e máximo). Ajuste se precisar, escreva o parecer e gere o PDF ou mande o resumo pelo WhatsApp."}])}</div>
      <aside class="gu-lado">
        <div class="bloco-card"><h4>O que o CRM faz por trás</h4><ul class="lista">
          <li>Calcula o valor por m² de cada comparado e tira o desconto das ofertas (margem de negociação).</li>
          <li>Transforma "melhor, parecido, pior" em fatores de 0,80 a 1,20 (homogeneização).</li>
          <li>Descarta o que foge muito dos outros (30% da mediana e critério de Chauvenet).</li>
          <li>Faixa = intervalo de confiança de 80% da média, limitado a 15% (campo de arbítrio).</li></ul>
          <p class="nota">Os detalhes aparecem em "Ver detalhes técnicos" e podem ir no PDF.</p></div>
        <div class="aviso"><b>Estudo não é laudo.</b><p class="nota" style="margin:6px 0 0">Para inventário, partilha, processo judicial ou banco, o documento é o PTAM ou o laudo pela NBR 14653, feito por avaliador habilitado. Fale com o Fernando (CNAI 46.678).</p></div>
      </aside></div>`;
  el.innerHTML = topo + `<div class="gu-corpo">${corpo}</div>`;
}

/* ---------- Checklist do imóvel (gaveta) ---------- */
function secChecklistImovel(id, podeEditar){
  const i = imovelPorId(id); if(!i) return "";
  const p = S.privado[id] || {}, ck = p.checklist || {}, r = guResumo(i, ck), pct = r.total ? Math.round(r.feitos/r.total*100) : 0;
  const aberto = S.guCkAberto === id;
  const item = it => {
    const v = ck[it.id], c = it.cert ? GU_CERT[it.cert] : null, u = c ? guCertUrl(c) : "", dias = v && v.d ? guDias(v.d) : 0;
    const info = !v ? "" : v.s==="na" ? "não se aplica" : `em ${dataCurta(v.d)}` + (it.cert && dias>30 ? ` · há ${dias} dias, pode precisar renovar para a escritura` : "");
    return `<div class="gu-it ${v?(v.s==="na"?"na":"ok"):""} ${it.cert&&dias>30&&v&&v.s==="ok"?"velha":""}">
      <label><input type="checkbox" data-gu-ck="${it.id}" ${v&&v.s==="ok"?"checked":""} ${!podeEditar||(v&&v.s==="na")?"disabled":""}><span>${esc(it.t)}${info?`<small>${esc(info)}</small>`:""}</span></label>
      <span class="gu-it-a">${u?`<a class="link-btn" target="_blank" rel="noopener" href="${esc(u)}" title="${esc(c.onde)}">site ↗</a>`:""}${it.opc&&podeEditar&&!(v&&v.s==="ok")?`<button type="button" class="link-btn" data-gu-na="${it.id}">${v&&v.s==="na"?"aplica":"não se aplica"}</button>`:""}</span></div>`;
  };
  const cor = corretorDoc(i.corretorId || meuId()), msg = r.pendDono.length && p.proprietarioCel ? guMsgDocs(p.proprietario, r.pendDono.map(x=>x.t), cor && cor.nome) : "";
  return `<section class="ld-sec gu-ck" id="gu-ck" data-imovel="${esc(id)}">
    <div class="ld-rot">Documentos da venda <span class="tab">${r.feitos} de ${r.total}</span>${r.velhas.length?`<span class="atraso">${r.velhas.length} ${r.velhas.length===1?"certidão":"certidões"} com mais de 30 dias</span>`:""}</div>
    <div class="gu-barra" role="progressbar" aria-label="Documentos da venda" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
    <details class="gu-ck-det" id="gu-ck-det" ${aberto?"open":""}><summary>${aberto?"Fechar o checklist":"Abrir o checklist"}</summary>
      <label class="check gu-pj"><input type="checkbox" data-gu-pj="1" ${ck._pj?"checked":""} ${podeEditar?"":"disabled"}> O proprietário é uma empresa (CNPJ)</label>
      ${GU_GRUPOS.map(([g,t])=>{ const its = r.its.filter(it=>it.g===g); return its.length ? `<div class="gu-grupo"><h5>${t}</h5>${its.map(item).join("")}</div>` : ""; }).join("")}
      <div class="chips">${msg?`<a class="btn btn-whats btn-sm" target="_blank" rel="noopener" href="${esc(waLink(msg, celIntl(p.proprietarioCel)))}">${ICO.whats} Pedir ${r.pendDono.length===1?"o documento que falta":"os "+r.pendDono.length+" documentos que faltam"}</a>`:""}
        <button type="button" class="btn btn-linha btn-sm" data-act="gu-guia" data-v="certidoes">Onde tirar as certidões</button></div>
      ${!p.proprietarioCel && r.pendDono.length ? `<p class="nota" style="margin:0">Preencha o celular do proprietário para pedir os documentos pelo WhatsApp.</p>` : ""}
    </details></section>`;
}
function ligarChecklist(id, podeEditar){
  const sec = $("#gu-ck"); if(!sec) return;
  const repintar = ()=>{ const s = $("#gu-ck"); if(!s) return; const d = document.createElement("div"); d.innerHTML = secChecklistImovel(id, podeEditar); s.replaceWith(d.firstElementChild); ligarChecklist(id, podeEditar); };
  const det = $("#gu-ck-det");
  det.addEventListener("toggle", ()=>{ S.guCkAberto = det.open ? id : null; const sm = det.querySelector("summary"); if(sm) sm.textContent = det.open ? "Fechar o checklist" : "Abrir o checklist"; });
  if(!podeEditar) return;
  const salvar = async ck => {
    const novo = {...(S.privado[id]||{}), checklist:ck}; S.privado[id] = novo; repintar();
    try{ await S.db.doc("privado/"+id).set(novo); }catch(e){ toast("Não foi possível salvar o checklist. Verifique a internet."); }
  };
  sec.addEventListener("change", e=>{
    const x = e.target, ck = {...((S.privado[id]||{}).checklist||{})};
    if(x.dataset.guCk){ if(x.checked) ck[x.dataset.guCk] = {s:"ok", d:guHojeIso()}; else delete ck[x.dataset.guCk]; salvar(ck); }
    else if(x.dataset.guPj){ ck._pj = x.checked; salvar(ck); }
  });
  sec.addEventListener("click", e=>{
    const b = e.target.closest("[data-gu-na]"); if(!b) return;
    const ck = {...((S.privado[id]||{}).checklist||{})}, k = b.dataset.guNa;
    if(ck[k] && ck[k].s==="na") delete ck[k]; else ck[k] = {s:"na", d:guHojeIso()};
    salvar(ck);
  });
}

async function acaoGu(nome, d, el){
  switch(nome){
    case "gu-aba": S.guTab = d.v; render(); return;
    case "gu-guia": S.guTab = d.v || "captacao"; S.crmTab = "guia"; fecharGaveta(); render(); window.scrollTo(0,0); return;
    case "gu-copiar-docs": {
      const its = ["iptu","contas","rg","civil","resid","contato"].map(k=>GU_ITENS.find(it=>it.id===k).t)
        .concat(["Se for casa: planta aprovada, habite-se e averbação da construção","Se for apartamento ou condomínio: declaração de quitação do condomínio, assinada pelo síndico",
          "Se estiver financiado: banco e saldo devedor atualizado","Se estiver alugado: contrato de locação"]);
      const cor = corretorDoc(meuId()), msg = guMsgDocs("", its, cor && cor.nome);
      try{ await navigator.clipboard.writeText(msg); toast("Lista copiada. Cole na conversa do proprietário no WhatsApp."); }
      catch(e){ toast("Não foi possível copiar. Abra um imóvel e use o botão do checklist para mandar pelo WhatsApp.", null, 9000); }
      return;
    }
  }
}
