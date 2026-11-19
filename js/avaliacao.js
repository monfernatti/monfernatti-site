/* Monfernatti Imóveis · Avalie seu imóvel
   1. Página pública #avaliar: o proprietário descreve o imóvel em 7 passos e pede um estudo de mercado gratuito.
      O pedido entra no CRM como lead de captação (interesse "Captação", respostas em lead.avaliacao, fotos na pasta
      privada "avaliacoes" do Supabase).
   2. CRM: aba Avaliações, pedido dentro do lead e a ferramenta de estudo de mercado (comparação por m², faixa de valor,
      PDF com a marca e resumo por WhatsApp). Os estudos ficam em lead.estudos ou em privado[imóvel].estudos.
   Este arquivo só define funções e constantes. Usa do index.html, crm.js e documentos.js: S, $, esc, brl, hoje, soDig,
   fmtCel, waLink, ICO, CATEGORIAS, ORIGENS, numBR, primeiroNome, haQuanto, toast, salvarLead, gaveta, timbreDoc… */

/* ---------- tipos, opções e rótulos ---------- */
const AV_TIPOS = [
  ["Residencial", ["Casa","Sobrado","Casa em condomínio","Apartamento","Kitnet ou studio"]],
  ["Terreno", ["Terreno","Terreno em condomínio"]],
  ["Comercial", ["Sala comercial","Loja ou ponto","Barracão ou galpão","Prédio comercial"]],
  ["Rural", ["Chácara","Sítio","Fazenda"]]
];
const AV_FAM = {"Casa":"casa","Sobrado":"casa","Casa em condomínio":"casa","Casa de condomínio":"casa","Apartamento":"apto","Kitnet ou studio":"apto",
  "Terreno":"terreno","Terreno em condomínio":"terreno","Sala comercial":"sala","Loja ou ponto":"com","Barracão ou galpão":"com","Prédio comercial":"com",
  "Comercial":"com","Chácara":"rural","Sítio":"rural","Fazenda":"rural","Rural":"rural"};
const avFam = t => AV_FAM[t] || "casa";
const avCond = t => /condomínio|Apartamento|Kitnet/.test(t||"");
const AV_ICO = {
  Residencial:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/></svg>',
  Terreno:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="1.5" stroke-dasharray="3 2.2"/><path d="M8 6v-2.5M8 3.5l4 1.5-4 1.5"/></svg>',
  Comercial:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V4h10v17M14 9h6v12M2.5 21h19"/><path d="M7.5 8h3M7.5 12h3M7.5 16h3"/></svg>',
  Rural:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="8.5" cy="9" r="4.5"/><path d="M8.5 13.5V21M2.5 21h19M14 21v-6l3.5-3 3.5 3v6"/></svg>'
};
const AV_CONSERV = ["Novo","Reformado","Bom estado","Precisa de reparos","Precisa de reforma geral"];
const AV_DIF = {
  casa:["Área gourmet ou churrasqueira","Piscina","Edícula","Quintal","Escritório","Móveis planejados","Ar-condicionado","Energia solar","Aquecedor solar ou a gás","Portão eletrônico","Câmeras ou alarme","De esquina"],
  apto:["Sacada ou varanda","Churrasqueira na sacada","Móveis planejados","Ar-condicionado","Escritório","Vista livre","Andar alto","Aceita pet","Depósito privativo"],
  com:["De esquina","Fachada de vidro","Estacionamento próprio","Acesso para caminhão","Pé-direito alto","Mezanino","Energia trifásica","Ar-condicionado","Copa ou cozinha"],
  terreno:["De esquina","Murado","Calçada pronta","Rua asfaltada","Rede de esgoto","Projeto aprovado"],
  rural:["Casa sede","Casa de caseiro","Barracão","Curral","Pomar","Represa ou lago","Rio ou mina d'água","Poço artesiano","Energia elétrica","Pasto formado","Lavoura","Cercas em bom estado"]
};
AV_DIF.sala = AV_DIF.com.filter(x=>!/caminhão|Mezanino/.test(x));
const AV_LAZER = ["Portaria 24h","Elevador","Piscina","Academia","Salão de festas","Espaço gourmet","Playground","Quadra esportiva","Pet place"];
const AV_MOTIVOS = ["Quero vender","Quero alugar","Vender ou alugar","Inventário, partilha ou divórcio","Processo judicial ou garantia","Só quero saber quanto vale"];
const AV_CIDADES = ["Cornélio Procópio","Bandeirantes","Santa Mariana","Leópolis","Sertaneja","Nova Fátima","Congonhinhas","Nova América da Colina","Ribeirão do Pinhal",
  "Abatiá","Santo Antônio da Platina","Uraí","Assaí","Rancho Alegre","Sapopema","São Sebastião da Amoreira","Nova Santa Bárbara","Itambaracá","Andirá","Londrina"];
const AV_PASSOS = ["Tipo","Localização","O imóvel","Situação","Objetivo","Fotos","Contato"];
const AV_MAX_FOTOS = 12;
const avLaudo = m => /Inventário|judicial/.test(m||"");
const avNegocio = m => /vender|alugar/i.test(m||"") && !avLaudo(m);
const avSoAluguel = m => /alugar/i.test(m||"") && !/vender/i.test(m||"");
const juntarE = l => l.length<2 ? l.join("") : l.slice(0,-1).join(", ") + " e " + l[l.length-1];
const numFmt = n => Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:2});
const pctFmt = n => Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:1}) + "%";
const brlMil = n => !n ? "" : n>=1e6 ? "R$ " + (n/1e6).toLocaleString("pt-BR",{maximumFractionDigits:2}) + " mi" : n>=1e4 ? "R$ " + Math.round(n/1e3) + " mil" : brl(n);
function avCategoria(t){
  const m = {"Sobrado":"Sobrado","Casa em condomínio":"Casa de condomínio","Apartamento":"Apartamento","Kitnet ou studio":"Apartamento","Terreno":"Terreno","Terreno em condomínio":"Terreno"};
  if(m[t]) return m[t];
  const f = avFam(t);
  return f==="sala"||f==="com" ? "Comercial" : f==="rural" ? "Rural" : (CATEGORIAS.includes(t) ? t : "Casa");
}

/* Respostas do pedido, na ordem em que aparecem no CRM. */
const AV_ROT = [
  ["tipo","Tipo"],["areaConstruida","Área construída","m2"],["areaPrivativa","Área privativa","m2"],["areaTerreno","Área do terreno","m2"],["areaRural","Área total","rural"],
  ["areaSede","Área da sede","m2"],["frente","Frente","m"],["quartos","Quartos"],["suites","Suítes"],["banheiros","Banheiros"],["vagas","Vagas"],["andar","Andar"],
  ["ano","Ano de construção"],["conservacao","Conservação"],["mobilia","Mobília"],["topografia","Topografia"],["acesso","Acesso"],["uso","Uso atual"],["distancia","Distância da cidade","km"],
  ["diferenciais","Diferenciais"],["lazer","Condomínio"],["bairro","Bairro"],["cidade","Cidade"],["rua","Endereço"],["cep","CEP"],["condominio","Edifício ou condomínio"],
  ["situacao","Situação"],["documentacao","Documentação"],["averbada","Construção averbada"],["proprietarios","Proprietários"],["ocupacao","Ocupação"],
  ["taxaCondominio","Condomínio por mês","brl"],["iptu","IPTU por ano","brl"],["itr","ITR por ano","brl"],
  ["motivo","Motivo"],["prazo","Prazo"],["valorPretendido","Valor em mente","brl"],["permuta","Aceita permuta"],["anunciado","Já anunciado"],
  ["relacao","Quem pediu"],["horario","Melhor horário"],["obs","Observações"]
];
function avValorTxt(a, k, f){
  const v = a[k];
  if(v==null || v==="" || (Array.isArray(v) && !v.length)) return "";
  if(Array.isArray(v)) return v.join(", ");
  if(!f) return String(v);
  const n = numFmt(numBR(v));
  return f==="m2" ? n+" m²" : f==="m" ? n+" m" : f==="km" ? n+" km" : f==="brl" ? brl(numBR(v)) : n+" "+(a.unidadeRural||"alqueires");
}
function avLinhas(a){ return AV_ROT.map(([k,r,f])=>[r, avValorTxt(a,k,f), k]).filter(x=>x[1]); }
function avAreaTxt(a){
  const f = avFam(a.tipo), n = x => numFmt(numBR(x));
  if(f==="rural" && a.areaRural) return `${n(a.areaRural)} ${a.unidadeRural||"alqueires"}`;
  if(f==="terreno" && a.areaTerreno) return `${n(a.areaTerreno)} m² de terreno`;
  if(f==="apto" && a.areaPrivativa) return `${n(a.areaPrivativa)} m² privativos`;
  if(a.areaConstruida) return `${n(a.areaConstruida)} m² construídos${a.areaTerreno?`, terreno de ${n(a.areaTerreno)} m²`:""}`;
  return "";
}
function avDescCurta(a){ return `${String(a.tipo||"imóvel").toLowerCase()}${a.bairro?` no bairro ${a.bairro}`:""}`; }
function avResumoCurto(a){
  const loc = [a.bairro, a.cidade].filter(Boolean).join(", "), area = avAreaTxt(a);
  return `Pedido de estudo de mercado: ${a.tipo||"imóvel"}${area?`, ${area}`:""}${loc?`, ${loc}`:""}. ${a.motivo||""}${a.prazo?` (${a.prazo.toLowerCase()})`:""}.`
    .replace(/\s+\./g,".").replace(/\.\./g,".") + (a.valorPretendido ? ` Valor em mente: ${brl(numBR(a.valorPretendido))}.` : "");
}
/* Texto corrido do imóvel, usado no estudo e no cadastro. */
function avDescricao(a){
  const p = [], q = n => Number(numBR(n))===1;
  const det = [a.quartos?`${a.quartos} ${q(a.quartos)?"quarto":"quartos"}${a.suites?` (${a.suites} ${q(a.suites)?"suíte":"suítes"})`:""}`:"",
    a.banheiros?`${a.banheiros} ${q(a.banheiros)?"banheiro":"banheiros"}`:"", a.vagas?`${a.vagas} ${q(a.vagas)?"vaga":"vagas"} de garagem`:""].filter(Boolean);
  p.push(`${a.tipo||"Imóvel"}${det.length?" com "+juntarE(det):""}${a.bairro?` no bairro ${a.bairro}`:""}${a.cidade?`, ${a.cidade}`:""}.`);
  if(a.conservacao) p.push(`Estado de conservação: ${a.conservacao.toLowerCase()}.`);
  if((a.diferenciais||[]).length) p.push(`${avFam(a.tipo)==="rural"?"Benfeitorias":"Diferenciais"}: ${a.diferenciais.join(", ").toLowerCase()}.`);
  if((a.lazer||[]).length) p.push(`No condomínio: ${a.lazer.join(", ").toLowerCase()}.`);
  if(a.topografia) p.push(`Topografia: ${a.topografia.toLowerCase()}${a.frente?`, ${numFmt(numBR(a.frente))} m de frente`:""}.`);
  if(a.acesso) p.push(`Acesso por ${a.acesso.toLowerCase()}${a.distancia?`, a ${numFmt(numBR(a.distancia))} km da cidade`:""}.`);
  if(a.ano) p.push(`Ano de construção: ${a.ano}.`);
  return p.join(" ");
}

/* =====================================================================
   1. PÁGINA PÚBLICA
   ===================================================================== */
const AV = {passo:0, r:{cidade:"Cornélio Procópio"}, fotos:[], erro:{}, enviando:false, feito:null, carregado:false};
const AV_CHAVE = "mf_avaliacao";
let avReg = null; // enquanto um passo é montado: {req, nomes, nums}
function avCarregar(){
  try{ const s = JSON.parse(localStorage.getItem(AV_CHAVE)||"null");
    if(s && s.r && Date.now()-(s.t||0) < 30*864e5){ AV.r = {...AV.r, ...s.r}; AV.passo = Math.min(Math.max(0, s.passo|0), AV_PASSOS.length-1); } }catch(e){}
  delete AV.r.aceite;
}
function avGuardar(){ try{ const r = {...AV.r}; delete r.aceite; localStorage.setItem(AV_CHAVE, JSON.stringify({r, passo:AV.passo, t:Date.now()})); }catch(e){} }
function avLimpar(){ try{ localStorage.removeItem(AV_CHAVE); }catch(e){} }

/* Peças do formulário. Cada uma se registra em avReg (obrigatórios e nomes usados neste tipo de imóvel). */
function avOps(nome, rot, lista, o={}){
  if(avReg){ avReg.nomes.add(nome); if(o.obrig) avReg.req.push({nome, msg:o.msg||"Escolha uma opção."}); }
  const v = AV.r[nome], multi = !!o.multi, sel = x => multi ? (v||[]).includes(x) : v===x, err = AV.erro[nome];
  return `<fieldset class="av-q ${err?"erro":""}" id="avq-${nome}"><legend>${rot}${o.obrig?"":` <span class="opc">(opcional)</span>`}</legend>
    <div class="av-ops">${lista.map(x=>`<label class="av-op ${multi?"multi":""} ${sel(x)?"on":""}"><input type="${multi?"checkbox":"radio"}" name="${nome}" value="${esc(x)}" ${sel(x)?"checked":""}><span>${esc(x)}</span></label>`).join("")}</div>
    ${err?`<span class="av-erro">${esc(err)}</span>`:""}</fieldset>`;
}
function avCampo(nome, rot, o={}){
  if(avReg){ avReg.nomes.add(nome); if(o.num) avReg.nums.add(nome); if(o.obrig) avReg.req.push({nome, msg:o.msg||(o.num?"Informe um número.":"Preencha este campo."), num:o.num}); }
  const v = AV.r[nome] ?? "", err = AV.erro[nome];
  const im = o.num ? `inputmode="${o.int?"numeric":"decimal"}"` : o.tipo==="tel" ? 'inputmode="tel"' : "";
  return `<label class="av-campo ${o.largo?"largo":""} ${err?"erro":""}" id="avq-${nome}"><span>${rot}${o.obrig?"":` <i class="opc">(opcional)</i>`}</span>
    <span class="in">${o.pre?`<i>${o.pre}</i>`:""}<input id="av-${nome}" name="${nome}" type="${o.tipo||"text"}" ${im} value="${esc(v)}"${o.ph?` placeholder="${esc(o.ph)}"`:""}${o.auto?` autocomplete="${o.auto}"`:""}${o.lista?` list="${o.lista}"`:""}${o.max?` maxlength="${o.max}"`:""}>${o.suf?`<i>${o.suf}</i>`:""}</span>
    ${err?`<span class="av-erro">${esc(err)}</span>`:""}</label>`;
}
function avTexto(nome, rot, ph){
  if(avReg) avReg.nomes.add(nome);
  return `<label class="av-campo largo"><span>${rot} <i class="opc">(opcional)</i></span><textarea id="av-${nome}" name="${nome}" rows="3" maxlength="1200" placeholder="${esc(ph)}">${esc(AV.r[nome]||"")}</textarea></label>`;
}

function avPassoTipo(){
  if(avReg){ avReg.nomes.add("tipo"); avReg.req.push({nome:"tipo", msg:"Escolha o tipo do imóvel."}); }
  return `<h2 tabindex="-1">Qual é o tipo do imóvel?</h2><p class="av-sub">Escolha o que mais se parece com o seu.</p>
    <div id="avq-tipo">${AV_TIPOS.map(([g,ts])=>`<div class="av-grupo"><h3>${g}</h3><div class="av-tiles">${ts.map(t=>`<label class="av-tile ${AV.r.tipo===t?"on":""}"><input type="radio" name="tipo" value="${esc(t)}" ${AV.r.tipo===t?"checked":""}>${AV_ICO[g]}<span>${esc(t)}</span></label>`).join("")}</div></div>`).join("")}
    ${AV.erro.tipo?`<span class="av-erro">${esc(AV.erro.tipo)}</span>`:""}</div>`;
}
function avPassoLocal(){
  const f = avFam(AV.r.tipo), rural = f==="rural";
  return `<h2 tabindex="-1">Onde fica o imóvel?</h2><p class="av-sub">O endereço exato fica só com o corretor. Ele serve para comparar com imóveis da mesma região.</p>
    <div class="av-campos">
      ${rural?"":avCampo("cep","CEP",{tipo:"text",ph:"86300-000",max:9,auto:"postal-code"})}
      ${avCampo("cidade","Cidade",{obrig:true,lista:"av-cidades",auto:"address-level2"})}
      ${avCampo("bairro", rural?"Região, estrada ou bairro rural":"Bairro",{obrig:true, largo:rural, auto:rural?"":"address-level3"})}
      ${avCampo("rua", rural?"Como chegar (referência)":"Rua e número",{largo:true, auto:rural?"":"address-line1"})}
      ${avCond(AV.r.tipo)?avCampo("condominio", f==="apto"?"Nome do edifício ou condomínio":"Nome do condomínio",{largo:true}):""}
    </div>
    <datalist id="av-cidades">${AV_CIDADES.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`;
}
function avPassoImovel(){
  const t = AV.r.tipo, f = avFam(t);
  if(f==="rural" && !AV.r.unidadeRural) AV.r.unidadeRural = "alqueires";
  const qObrig = t!=="Kitnet ou studio";
  const N = {
    casa:[["areaConstruida","Área construída",{obrig:true,suf:"m²"}],["areaTerreno","Área do terreno",{obrig:true,suf:"m²"}],["quartos","Quartos",{obrig:true,int:true}],["suites","Suítes",{int:true}],
      ["banheiros","Banheiros",{obrig:true,int:true}],["vagas","Vagas de garagem",{int:true}],["ano","Ano de construção",{int:true,ph:"Ex.: 2012",max:4}]],
    apto:[["areaPrivativa","Área privativa",{obrig:true,suf:"m²"}],["quartos","Quartos",{obrig:qObrig,int:true}],["suites","Suítes",{int:true}],["banheiros","Banheiros",{obrig:true,int:true}],
      ["vagas","Vagas de garagem",{int:true}],["andar","Andar",{int:true}],["ano","Ano de construção",{int:true,ph:"Ex.: 2015",max:4}]],
    terreno:[["areaTerreno","Área do terreno",{obrig:true,suf:"m²"}],["frente","Medida da frente",{suf:"m"}]],
    sala:[["areaConstruida","Área da sala",{obrig:true,suf:"m²"}],["banheiros","Banheiros",{int:true}],["vagas","Vagas de garagem",{int:true}],["andar","Andar",{int:true}],["ano","Ano de construção",{int:true,max:4}]],
    com:[["areaConstruida","Área construída",{obrig:true,suf:"m²"}],["areaTerreno","Área do terreno",{suf:"m²"}],["banheiros","Banheiros",{int:true}],["vagas","Vagas de garagem",{int:true}],["ano","Ano de construção",{int:true,max:4}]],
    rural:[["areaRural","Área total",{obrig:true,suf:AV.r.unidadeRural}],["areaSede","Área construída da sede",{suf:"m²"}],["distancia","Distância da cidade",{suf:"km"}]]
  }[f];
  return `<h2 tabindex="-1">Como é o imóvel?</h2><p class="av-sub">Pode usar valores aproximados. O que não souber, deixe em branco.</p>
    ${f==="rural"?avOps("unidadeRural","A área está em",["alqueires","hectares","m²"]):""}
    <div class="av-campos">${N.map(([n,r,o])=>avCampo(n,r,{num:true,...o})).join("")}</div>
    ${f==="terreno"?avOps("topografia","Topografia",["Plano","Aclive","Declive","Irregular"]):""}
    ${f==="rural"?avOps("acesso","Acesso",["Asfalto","Cascalho","Estrada de terra"])+avOps("uso","Uso atual",["Lavoura","Pasto","Lazer","Misto","Sem uso"]):""}
    ${f!=="terreno"?avOps("conservacao", f==="rural"?"Estado das construções":"Estado de conservação", AV_CONSERV, {obrig:f!=="rural"}):""}
    ${f==="apto"?avOps("mobilia","Mobília",["Sem móveis","Só planejados","Mobiliado"]):""}
    ${avOps("diferenciais", f==="rural"?"Benfeitorias e recursos":f==="terreno"?"Características do terreno":"Diferenciais", AV_DIF[f], {multi:true})}
    ${avCond(t)?avOps("lazer","Lazer e serviços do condomínio",AV_LAZER,{multi:true}):""}
    ${avTexto("obs","Quer contar mais alguma coisa?","Ex.: cozinha reformada em 2023, dois lotes com escrituras separadas, rua tranquila…")}`;
}
function avPassoSituacao(){
  const f = avFam(AV.r.tipo);
  return `<h2 tabindex="-1">Situação do imóvel</h2><p class="av-sub">Isso muda o tipo de comprador e o prazo de venda. Fica só entre você e o corretor.</p>
    ${avOps("situacao","O imóvel está",["Quitado","Financiado","Na planta ou em obra"],{obrig:true})}
    ${avOps("documentacao","Documentação",["Escritura registrada no meu nome","Contrato de compra e venda","Inventário ou partilha em andamento","Tem pendência ou não sei"],{obrig:true})}
    ${f!=="terreno"?avOps("averbada","A construção está averbada na matrícula?",["Sim","Não","Não sei"]):""}
    ${avOps("proprietarios","Quem é dono",["Só eu","Eu e meu cônjuge","Herdeiros","Sócios ou empresa"])}
    ${f!=="terreno"?avOps("ocupacao","Hoje o imóvel está",["Ocupado por mim","Alugado","Vazio"],{obrig:true}):""}
    <div class="av-campos">${avCond(AV.r.tipo)?avCampo("taxaCondominio","Condomínio por mês",{num:true,pre:"R$"}):""}${f==="rural"?avCampo("itr","ITR por ano",{num:true,pre:"R$"}):avCampo("iptu","IPTU por ano",{num:true,pre:"R$"})}</div>`;
}
function avPassoObjetivo(){
  const m = AV.r.motivo;
  return `<h2 tabindex="-1">O que você pretende fazer?</h2><p class="av-sub">Assim o estudo vem focado no que você precisa.</p>
    ${avOps("motivo","Por que quer avaliar",AV_MOTIVOS,{obrig:true})}
    ${avLaudo(m)?`<div class="av-info"><b>Para esse caso, o documento indicado é o laudo de avaliação.</b> Inventários, partilhas, divórcios e processos pedem um Parecer Técnico de Avaliação Mercadológica (PTAM) ou um laudo conforme a ABNT NBR 14653. Fernando Monfernatti é avaliador com CNAI 46.678 e atua como perito judicial. Envie o pedido que ele explica como funciona, o prazo e o valor.</div>`:""}
    ${avNegocio(m)?`${avOps("prazo","Quando pretende fechar negócio",["O quanto antes","Em até 3 meses","Em até 6 meses","Sem pressa"])}
      <div class="av-campos">${avCampo("valorPretendido", avSoAluguel(m)?"Aluguel que você tem em mente":"Valor que você tem em mente",{num:true,int:true,pre:"R$"})}</div>
      ${avOps("permuta","Aceita permuta",["Sim","Não","Depende"])}
      ${avOps("anunciado","Já está anunciado",["Não","Sim, por conta própria","Sim, com imobiliária"])}`:""}`;
}
function avPassoFotos(){
  return `<h2 tabindex="-1">Fotos do imóvel</h2><p class="av-sub">Opcional, mas ajuda muito: com fotos o corretor avalia o padrão e o estado do imóvel. Fachada, sala, cozinha, quartos, banheiros e área externa já bastam.</p>
    <label class="av-drop" for="av-fotos-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
      <b>${AV.fotos.length?"Adicionar mais fotos":"Escolher fotos"}</b><span class="tab">${AV.fotos.length?`${AV.fotos.length} de ${AV_MAX_FOTOS} escolhidas`:`Até ${AV_MAX_FOTOS} fotos, da galeria ou da câmera`}</span></label>
    <input type="file" id="av-fotos-in" accept="image/*" multiple hidden>
    <div class="av-thumbs" id="av-thumbs">${AV.fotos.map((f,k)=>`<div class="av-thumb"><img src="${f.url}" alt="Foto ${k+1}"><button type="button" data-avrm="${k}" aria-label="Remover foto ${k+1}">×</button></div>`).join("")}</div>
    ${AV.fotosMsg?`<p class="av-dica" style="margin-top:10px">${esc(AV.fotosMsg)}</p>`:""}`;
}
function avPassoContato(){
  if(avReg) avReg.req.push({nome:"aceite", msg:"Marque a autorização para podermos preparar o estudo."});
  return `<h2 tabindex="-1">Para quem enviamos o estudo?</h2><p class="av-sub">O retorno chega pelo WhatsApp. Seus dados ficam só com a Monfernatti Imóveis.</p>
    <div class="av-campos">${avCampo("nome","Seu nome",{obrig:true,auto:"name",largo:true,msg:"Informe seu nome."})}
      ${avCampo("celular","WhatsApp com DDD",{obrig:true,tipo:"tel",auto:"tel",ph:"(43) 99999-9999",msg:"Informe um celular com DDD."})}
      ${avCampo("email","E-mail",{tipo:"email",auto:"email"})}</div>
    ${avOps("relacao","Você é",["Proprietário","Herdeiro ou familiar","Procurador ou representante"])}
    ${avOps("horario","Melhor horário para falar",["Manhã","Tarde","Noite","Qualquer horário"])}
    <div id="avq-aceite" class="${AV.erro.aceite?"erro":""}"><label class="av-check"><input type="checkbox" name="aceite" ${AV.r.aceite?"checked":""}><span>Autorizo a Monfernatti Imóveis a usar estes dados e fotos para preparar o estudo de mercado e falar comigo sobre ele, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</span></label>
      ${AV.erro.aceite?`<span class="av-erro">${esc(AV.erro.aceite)}</span>`:""}</div>
    <label class="av-mel" aria-hidden="true">Empresa<input name="empresa" tabindex="-1" autocomplete="off"></label>`;
}
const AV_FN = [avPassoTipo, avPassoLocal, avPassoImovel, avPassoSituacao, avPassoObjetivo, avPassoFotos, avPassoContato];
function avRegistro(k){ avReg = {req:[], nomes:new Set(), nums:new Set()}; try{ AV_FN[k](); return avReg; }finally{ avReg = null; } }

function renderAvaliar(app){
  if(app.querySelector("#av-pagina")) return; // já montada: não perde o que está sendo digitado
  if(!AV.carregado){ avCarregar(); AV.carregado = true; }
  app.innerHTML = `<div id="av-pagina">
    <section class="av-hero"><div class="wrap av-hero-in">
      <div class="av-intro">
        <span class="eyebrow">Estudo de mercado gratuito</span>
        <h1>Quanto <b>vale</b> o seu imóvel hoje?</h1>
        <p class="sub">Responda algumas perguntas sobre o imóvel. Comparamos com imóveis parecidos anunciados e vendidos na região e você recebe pelo WhatsApp uma faixa de preço realista para vender ou alugar.</p>
        <ul class="av-checks"><li>Sem custo e sem compromisso</li><li>Feito por avaliador com CNAI 46.678</li><li>Leva cerca de 3 minutos</li></ul>
      </div>
      <div class="av-card" id="av-card"></div>
    </div></section>
    <section class="wrap sec">
      <div class="sec-h"><div><h2>Como funciona</h2></div></div>
      <div class="av-como">
        <div><span>1</span><h3>Você conta sobre o imóvel</h3><p>Tipo, tamanho, estado de conservação, situação dos documentos e, se quiser, algumas fotos.</p></div>
        <div><span>2</span><h3>Pesquisamos o mercado</h3><p>Comparamos o preço por metro quadrado de imóveis semelhantes no bairro e na cidade, com ajustes de localização, padrão e conservação.</p></div>
        <div><span>3</span><h3>Você recebe o estudo</h3><p>Uma faixa de valor (mínimo, recomendado e máximo) com os imóveis usados na comparação, para decidir com segurança.</p></div>
      </div>
      <div class="cta-faixa"><div><h3>Precisa de um laudo oficial?</h3><p>Para inventário, partilha, divórcio, financiamento ou processo judicial, Fernando Monfernatti elabora o PTAM e o laudo de avaliação como avaliador CNAI 46.678 e perito judicial.</p></div>
        <a class="btn btn-ouro" target="_blank" rel="noopener" href="${esc(waLink("Olá Fernando, vim pelo site e preciso de um laudo de avaliação de imóvel."))}">Falar sobre laudo</a></div>
    </section>
    <section class="wrap sec" style="padding-top:0"><div class="sec-h"><div><h2>Dúvidas comuns</h2></div></div>
      <div class="faq">
        <details><summary>O estudo é gratuito mesmo?</summary><p>Sim. É a forma de você conhecer o nosso trabalho. Se decidir vender ou alugar com a gente, o estudo vira a base do preço do anúncio.</p></details>
        <details><summary>Qual a diferença entre o estudo e um laudo de avaliação?</summary><p>O estudo de mercado é uma opinião de valor para orientar a venda ou a locação. O laudo (PTAM ou laudo pela NBR 14653) é um documento técnico, com metodologia e responsabilidade formal, exigido por bancos, cartórios e pela Justiça.</p></details>
        <details><summary>Meus dados e fotos ficam públicos?</summary><p>Não. Eles vão direto para o sistema interno da Monfernatti Imóveis e só a nossa equipe vê. Nada é anunciado sem a sua autorização.</p></details>
        <details><summary>Em quanto tempo recebo?</summary><p>Assim que o corretor terminar a pesquisa ele chama você no WhatsApp. Se precisar de mais detalhes, ele pode combinar uma visita rápida ao imóvel.</p></details>
      </div>
      <p class="nota av-aviso">O estudo de mercado é uma opinião de valor baseada nas informações enviadas e em imóveis semelhantes da região. Não substitui o laudo técnico de avaliação.</p>
    </section></div>`;
  avPintar();
}
function avPintar(rolar){
  const card = $("#av-card"); if(!card) return;
  if(AV.feito) return avPintarFeito(card, rolar);
  const k = AV.passo, n = AV_PASSOS.length;
  const corpo = AV_FN[k]();
  const rotSeguir = k===n-1 ? "Receber meu estudo" : (k===5 && !AV.fotos.length) ? "Pular esta etapa" : "Continuar";
  card.innerHTML = `<div class="av-topo"><span class="tab">Passo ${k+1} de ${n}</span><span>${AV_PASSOS[k]}</span></div>
    <div class="av-prog" role="progressbar" aria-label="Progresso do pedido" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${k+1}"><span style="width:${(k+1)/n*100}%"></span></div>
    <form id="av-form" novalidate>${corpo}
      <div class="av-nav">${k?`<button type="button" class="btn btn-linha" data-av="voltar">Voltar</button>`:"<span></span>"}<button type="submit" class="btn ${k===n-1?"btn-ouro":"btn-marca"}" id="av-seguir">${rotSeguir}</button></div>
      <div id="av-ret"></div></form>`;
  avLigar();
  if(rolar){
    const top = card.getBoundingClientRect().top;
    if(top < 70 || top > innerHeight*.55) window.scrollTo({top: top + window.scrollY - 88, behavior:"smooth"});
    const h = card.querySelector("h2"); if(h) h.focus({preventScroll:true});
  }
}
function avLigar(){
  const f = $("#av-form");
  f.addEventListener("input", avLer);
  f.addEventListener("change", avLer);
  f.addEventListener("submit", e=>{ e.preventDefault(); avSeguir(); });
  f.addEventListener("click", e=>{
    const rm = e.target.closest("[data-avrm]");
    if(rm){ const [x] = AV.fotos.splice(+rm.dataset.avrm, 1); if(x) URL.revokeObjectURL(x.url); AV.fotosMsg = ""; avPintar(); return; }
    if(e.target.closest("[data-av=voltar]")){ AV.erro = {}; AV.passo = Math.max(0, AV.passo-1); avGuardar(); avPintar(true); }
  });
  const fi = $("#av-fotos-in"); if(fi) fi.onchange = ()=>{ const l = [...fi.files]; fi.value = ""; avAddFotos(l); };
}
function avLer(e){
  const x = e.target, n = x.name;
  if(!n || n==="empresa" || x.type==="file") return;
  if(x.type==="checkbox" && n!=="aceite") AV.r[n] = [...$("#av-form").querySelectorAll(`input[name="${n}"]:checked`)].map(i=>i.value);
  else if(x.type==="checkbox") AV.r[n] = x.checked;
  else if(x.type==="radio"){ if(!x.checked) return; AV.r[n] = x.value; }
  else AV.r[n] = x.value;
  if(x.type==="radio" || x.type==="checkbox"){ const g = x.closest(".av-ops, .av-tiles"); if(g) g.querySelectorAll("label").forEach(l=>l.classList.toggle("on", l.querySelector("input").checked)); }
  if(AV.erro[n]){ delete AV.erro[n]; const q = document.getElementById("avq-"+n); if(q){ q.classList.remove("erro"); const m = q.querySelector(".av-erro"); if(m) m.remove(); } }
  avGuardar();
  if(e.type!=="change") { if(n==="cep" && soDig(x.value).length===8) avCep(soDig(x.value)); return; }
  if(n==="tipo"){ clearTimeout(AV.timer); AV.timer = setTimeout(()=>{ if(AV.passo===0){ AV.passo = 1; avGuardar(); avPintar(true); } }, 320); return; }
  if(n==="motivo" || n==="unidadeRural") avPintar();
}
function avValidar(){
  AV.erro = {};
  const reg = avRegistro(AV.passo);
  for(const q of reg.req){
    const v = AV.r[q.nome];
    let ok = Array.isArray(v) ? v.length>0 : v===true || (typeof v==="string" && v.trim()!=="") || typeof v==="number";
    if(ok && q.num) ok = numBR(v) > 0;
    if(ok && q.nome==="celular") ok = soDig(v).length>=10;
    if(ok && q.nome==="nome") ok = String(v).trim().length>=2;
    if(!ok) AV.erro[q.nome] = q.msg;
  }
  if(AV.passo===AV_PASSOS.length-1 && AV.r.email && !/^\S+@\S+\.\S+$/.test(AV.r.email)) AV.erro.email = "Confira o e-mail.";
  return !Object.keys(AV.erro).length;
}
function avSeguir(){
  if(AV.enviando) return;
  if(!avValidar()){
    avPintar();
    const p = document.querySelector("#av-card .erro");
    if(p){ p.scrollIntoView({block:"center", behavior:"smooth"}); const i = p.querySelector("input:not([type=radio]):not([type=checkbox])"); if(i) i.focus({preventScroll:true}); }
    return;
  }
  if(AV.passo < AV_PASSOS.length-1){ AV.passo++; avGuardar(); avPintar(true); return; }
  avEnviar();
}
async function avCep(cep){
  if(AV.cepFeito===cep) return; AV.cepFeito = cep;
  try{
    const ctl = new AbortController(), t = setTimeout(()=>ctl.abort(), 5000);
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {signal:ctl.signal}); clearTimeout(t);
    const d = await r.json(); if(!d || d.erro) return;
    const por = (n, v, sempre)=>{ if(!v || (!sempre && String(AV.r[n]||"").trim())) return; AV.r[n] = v; const i = document.getElementById("av-"+n); if(i) i.value = v; };
    por("cidade", d.localidade, true); por("bairro", d.bairro); por("rua", d.logradouro ? d.logradouro+", " : "");
    if(d.uf) AV.r.uf = d.uf;
    avGuardar();
  }catch(e){}
}
/* Fotos: reduz no próprio celular (lado maior 1600 px, JPEG) antes de enviar. */
function avReduzir(arq){
  return new Promise(res=>{
    const url = URL.createObjectURL(arq), img = new Image();
    img.onload = ()=>{
      try{
        const k = Math.min(1, 1600/Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.naturalWidth*k)); c.height = Math.max(1, Math.round(img.naturalHeight*k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b=>res(b && b.size < 6e6 ? b : null), "image/jpeg", .82);
      }catch(e){ URL.revokeObjectURL(url); res(null); }
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
async function avAddFotos(arqs){
  const livres = AV_MAX_FOTOS - AV.fotos.length;
  AV.fotosMsg = arqs.length > livres ? `Cabem até ${AV_MAX_FOTOS} fotos. ${arqs.length-Math.max(0,livres)} ${arqs.length-livres===1?"ficou":"ficaram"} de fora.` : "";
  const b = $("#av-seguir"); if(b) b.disabled = true;
  let ruins = 0;
  for(const a of arqs.slice(0, Math.max(0, livres))){
    const blob = await avReduzir(a);
    if(!blob){ ruins++; continue; }
    AV.fotos.push({blob, url:URL.createObjectURL(blob)});
  }
  if(ruins) AV.fotosMsg = (AV.fotosMsg ? AV.fotosMsg+" " : "") + `${ruins} ${ruins===1?"arquivo não pôde ser lido":"arquivos não puderam ser lidos"} como foto.`;
  if(AV.passo===5) avPintar();
}
function avDados(){
  const nomes = new Set(), nums = new Set();
  for(let k=0;k<AV_FN.length;k++){ const r = avRegistro(k); r.nomes.forEach(n=>nomes.add(n)); r.nums.forEach(n=>nums.add(n)); }
  const d = {};
  nomes.forEach(n=>{
    let v = AV.r[n];
    if(v==null || v==="" || (Array.isArray(v) && !v.length)) return;
    if(typeof v==="string"){ v = v.trim().slice(0,1200); if(!v) return; }
    d[n] = nums.has(n) ? numBR(v) : v;
  });
  if(AV.r.uf) d.uf = AV.r.uf;
  return d;
}
function avLead(r, fotos){
  const quente = avLaudo(r.motivo) || (avNegocio(r.motivo) && /antes|3 meses/.test(r.prazo||""));
  const a = {...r, fotos, enviadoEm:hoje()};
  delete a.nome; delete a.celular; delete a.email;
  return {nome:r.nome, celular:soDig(r.celular), email:r.email||"", mensagem:avResumoCurto(r),
    origem:"Site", etapa:"novo", temperatura: quente ? "quente" : /Só quero/.test(r.motivo||"") ? "frio" : "morno", criadoEm:hoje(), atualizadoEm:hoje(),
    historico:[{quando:hoje(), tipo:"Sistema", texto:`Pedido de avaliação recebido pelo site${fotos.length?` com ${fotos.length} ${fotos.length===1?"foto":"fotos"}`:""}.`}],
    formulario:"Avaliação do imóvel", interesse:"Captação", tags:["Avaliação", ...(avLaudo(r.motivo)?["Laudo"]:[])], avaliacao:a};
}
async function avEnviar(){
  const ret = $("#av-ret"), btn = $("#av-seguir");
  const mel = $("#av-form [name=empresa]");
  if(mel && mel.value){ AV.feito = {nome:primeiroNome(AV.r.nome)}; avLimpar(); avPintar(true); return; } // robô: finge que enviou
  AV.enviando = true; btn.disabled = true; btn.textContent = "Enviando…";
  const r = avDados(), fotos = [];
  let falhas = 0;
  if(AV.fotos.length && window.MF && MF.configurado){
    for(let k=0;k<AV.fotos.length;k++){
      const f = AV.fotos[k];
      ret.className = "nota"; ret.textContent = `Enviando as fotos (${k+1} de ${AV.fotos.length})…`;
      try{ if(!f.caminho) f.caminho = await MF.enviarFotoAvaliacao(f.blob); fotos.push(f.caminho); }catch(e){ falhas++; }
    }
  }
  if(falhas) r.fotosFalharam = falhas;
  const lead = avLead(r, fotos);
  try{
    const db = S.db || await claude.use("db"); if(!db) throw new Error("sem banco");
    await db.collection("leads").add(lead);
    AV.feito = {nome:primeiroNome(r.nome)};
    AV.fotos.forEach(f=>URL.revokeObjectURL(f.url));
    AV.fotos = []; AV.fotosMsg = ""; AV.r = {cidade:"Cornélio Procópio"}; AV.passo = 0; AV.erro = {}; avLimpar();
    avPintar(true);
  }catch(err){
    ret.className = "err-box";
    ret.innerHTML = `Não consegui enviar agora. Tente de novo em instantes ou mande pelo <a target="_blank" rel="noopener" href="${esc(waLink(`Olá Fernando! Quero um estudo de mercado do meu imóvel. ${lead.mensagem} Meu nome é ${r.nome}.`))}">WhatsApp (43) 99977-9003</a>.`;
  }finally{
    AV.enviando = false;
    if(btn.isConnected){ btn.disabled = false; btn.textContent = "Receber meu estudo"; }
  }
}
function avPintarFeito(card, rolar){
  card.innerHTML = `<div class="av-feito" role="status">
    <div class="av-feito-ico" aria-hidden="true">✓</div>
    <h2 tabindex="-1">Pedido recebido${AV.feito.nome?`, ${esc(AV.feito.nome)}`:""}!</h2>
    <p>Fernando Monfernatti vai analisar as informações, pesquisar imóveis parecidos na região e chamar você no WhatsApp com o estudo de mercado.</p>
    <p class="nota">Se quiser adiantar, mande uma mensagem agora. Ele já vai saber do que se trata.</p>
    <div class="av-feito-acoes"><a class="btn btn-whats" target="_blank" rel="noopener" href="${esc(waLink("Olá Fernando! Acabei de pedir o estudo de mercado do meu imóvel pelo site."))}">${ICO.whats} Falar no WhatsApp</a><a class="btn btn-linha" href="#comprar">Ver imóveis à venda</a></div>
    <button type="button" class="link-btn" id="av-outro">Avaliar outro imóvel</button></div>`;
  $("#av-outro").onclick = ()=>{ AV.feito = null; avPintar(true); };
  if(rolar){ const top = card.getBoundingClientRect().top; if(top < 70 || top > innerHeight*.55) window.scrollTo({top: top + window.scrollY - 88, behavior:"smooth"}); card.querySelector("h2").focus({preventScroll:true}); }
}

/* =====================================================================
   2. CRM: aba Avaliações, pedido no lead, imóvel a partir do pedido
   ===================================================================== */
const AV_URLS = {}; // caminho da foto -> {url assinada, validade}
async function urlsAv(caminhos){
  const agora = Date.now(), falta = [...new Set(caminhos)].filter(p=>!AV_URLS[p] || AV_URLS[p].ate < agora);
  if(falta.length && window.MF && MF.linksAvaliacao){
    try{ const m = await MF.linksAvaliacao(falta); Object.entries(m).forEach(([p,u])=>{ AV_URLS[p] = {url:u, ate:agora+50*60e3}; }); }catch(e){}
  }
  return caminhos.map(p=>AV_URLS[p] && AV_URLS[p].url).filter(Boolean);
}
const urlAv = p => (AV_URLS[p] && AV_URLS[p].ate > Date.now()) ? AV_URLS[p].url : "";
function avFotoHtml(p, k){
  const u = urlAv(p);
  return `<a class="av-foto" target="_blank" rel="noopener"${u?` href="${esc(u)}"`:""}><img data-avf="${esc(p)}"${u?` src="${esc(u)}"`:""} alt="Foto ${k+1} enviada pelo proprietário"></a>`;
}
function pintarFotosAv(raiz){
  if(!raiz) return;
  const imgs = [...raiz.querySelectorAll("img[data-avf]:not([src])")]; if(!imgs.length) return;
  urlsAv(imgs.map(i=>i.dataset.avf)).then(()=>imgs.forEach(i=>{
    const u = urlAv(i.dataset.avf); if(!u){ i.closest(".av-foto").classList.add("erro"); return; }
    i.src = u; i.closest(".av-foto").href = u;
  }));
}
function avPedidos(){ return leadsF().filter(l=>l.avaliacao && !(l.estudos||[]).length && aberto(l)).sort((a,b)=>String(b.criadoEm).localeCompare(String(a.criadoEm))); }
function avTodosEstudos(){
  const L = leadsF().flatMap(l=>(l.estudos||[]).map(e=>({e, lead:l})));
  const P = Object.entries(S.privado||{}).filter(([id])=>imoveisF().some(i=>i._id===id)).flatMap(([id,p])=>(p.estudos||[]).map(e=>({e, imovelId:id})));
  return [...L, ...P].sort((a,b)=>String(b.e.atualizadoEm||"").localeCompare(String(a.e.atualizadoEm||"")));
}
function avLinhaEstudo(e, o){
  const r = e.resultado || {}, at = o.lead ? `data-lead="${esc(o.lead)}"` : `data-imovel="${esc(o.imovel)}"`;
  return `<div class="doc-linha"><span><b>${r.rec?esc(brl(r.rec))+(r.fin==="aluguel"?" /mês":""):"Estudo sem valor final"}</b><small>${esc(dataCurta(e.atualizadoEm||e.criadoEm))}${r.min?` · faixa de ${esc(brlMil(r.min))} a ${esc(brlMil(r.max))}`:""}${r.n?` · ${r.n} ${r.n===1?"comparado":"comparados"}`:""}</small></span>
    <button class="btn btn-linha btn-sm" data-act="av-abrir" data-est="${esc(e.id)}" ${at}>Abrir</button></div>`;
}
function crmAvaliacoes(el){
  const ped = avPedidos(), est = avTodosEstudos(), link = location.origin + "/#avaliar";
  const mes = toLocalInput(hoje()).slice(0,7), nMes = est.filter(x=>toLocalInput(x.e.criadoEm||x.e.atualizadoEm||"").slice(0,7)===mes).length;
  el.innerHTML = `<div class="sec-h" style="margin-top:0"><div><h3 style="font-size:26px">Avaliações</h3><p>Pedidos de estudo de mercado que chegam pela página <b>Avalie seu imóvel</b> e os estudos feitos pela equipe.</p></div>
      <div class="chips"><button class="btn btn-linha btn-sm" data-act="av-copiar">Copiar link da página</button><a class="btn btn-linha btn-sm" href="/#avaliar" target="_blank" rel="noopener">Ver a página</a><button class="btn btn-marca btn-sm" data-act="av-estudo">+ Novo estudo</button></div></div>
    <div class="resumo" style="margin-bottom:14px"><span class="${ped.length?"r-alerta":""}"><b class="tab">${ped.length}</b> ${ped.length===1?"pedido aguardando":"pedidos aguardando"}</span><span><b class="tab">${nMes}</b> ${nMes===1?"estudo":"estudos"} neste mês</span><span><b class="tab">${est.length}</b> no total</span></div>
    <div class="hoje-grid">
      <div class="bloco-card ${ped.length?"urgente":""}"><h4>Pedidos aguardando estudo <i class="tab">${ped.length}</i></h4>
        ${ped.length ? ped.map(l=>{ const a = l.avaliacao; return `<div class="tarefa"><button class="t-info" data-l="${esc(l._id)}"><b>${esc(l.nome)}</b><small>${esc([a.tipo, avAreaTxt(a), a.bairro].filter(Boolean).join(" · "))} · ${esc(haQuanto(a.enviadoEm||l.criadoEm))}${(a.fotos||[]).length?` · ${a.fotos.length} ${a.fotos.length===1?"foto":"fotos"}`:""}</small></button>
          <div class="t-acoes">${linkWa(l,"primeiro",{},ICO.whats,"btn btn-whats btn-sm btn-ico")}<button class="btn btn-ouro btn-sm" data-act="av-estudo" data-lead="${esc(l._id)}">Fazer estudo</button></div></div>`; }).join("")
          : `<p class="nota">Nenhum pedido esperando. Divulgue a página para proprietários: <b>${esc(link)}</b></p>`}</div>
      <div class="bloco-card"><h4>Estudos feitos <i class="tab">${est.length}</i></h4>
        ${est.length ? est.slice(0,30).map(({e, lead, imovelId})=>{ const r = e.resultado||{}, im = imovelId ? imovelPorId(imovelId) : null;
          const nome = lead ? lead.nome : im ? `${im.codigo} · ${im.titulo}` : "Estudo";
          return `<div class="tarefa"><button class="t-info" data-act="av-abrir" data-est="${esc(e.id)}" ${lead?`data-lead="${esc(lead._id)}"`:`data-imovel="${esc(imovelId)}"`}><b>${esc(nome)}</b><small>${r.rec?esc(brl(r.rec))+(r.fin==="aluguel"?" /mês":""):"sem valor final"}${r.min?` (${esc(brlMil(r.min))} a ${esc(brlMil(r.max))})`:""} · ${esc([r.tipo||e.imovel&&e.imovel.tipo, r.bairro||e.imovel&&e.imovel.bairro].filter(Boolean).join(", "))} · ${esc(dataCurta(e.atualizadoEm))}</small></button>
            <div class="t-acoes"><button class="btn btn-linha btn-sm" data-act="av-abrir" data-est="${esc(e.id)}" ${lead?`data-lead="${esc(lead._id)}"`:`data-imovel="${esc(imovelId)}"`}>Abrir</button></div></div>`; }).join("")
          : `<p class="nota">Os estudos que você fizer aparecem aqui e no histórico do cliente. Use "+ Novo estudo" para avaliar um imóvel que chegou por outro canal.</p>`}</div>
    </div>`;
}
/* Seção "Pedido de avaliação" dentro do lead. */
function secAvaliacaoLead(l){
  const a = l.avaliacao, est = [...(l.estudos||[])].sort((x,y)=>String(y.atualizadoEm||"").localeCompare(String(x.atualizadoEm||"")));
  if(!a && !est.length) return "";
  const D = `data-lead="${esc(l._id)}"`;
  let h = "";
  if(a){
    const ls = avLinhas(a), princ = ["tipo","areaConstruida","areaPrivativa","areaTerreno","areaRural","quartos","banheiros","vagas","conservacao","bairro","cidade","motivo","prazo","valorPretendido"];
    const top = ls.filter(x=>princ.includes(x[2])), resto = ls.filter(x=>!princ.includes(x[2]));
    const dl = l2 => `<dl class="av-dl">${l2.map(([r,v])=>`<div><dt>${esc(r)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
    h += `<div class="av-ped">${dl(top)}
      ${resto.length?`<details class="av-mais" id="av-mais-${esc(l._id)}"><summary>Ver todas as respostas (${resto.length})</summary>${dl(resto)}</details>`:""}
      ${(a.fotos||[]).length?`<div class="av-fotos-ped">${a.fotos.map((p,k)=>avFotoHtml(p,k)).join("")}</div>`:""}
      ${a.fotosFalharam?`<p class="nota" style="margin:0">${a.fotosFalharam} ${a.fotosFalharam===1?"foto não chegou":"fotos não chegaram"}. Peça pelo WhatsApp.</p>`:""}
      ${avLaudo(a.motivo)?`<div class="aviso">Pediu avaliação para <b>${esc(a.motivo.toLowerCase())}</b>: ofereça o PTAM ou o laudo de avaliação.</div>`:""}</div>`;
  }
  h += `<div class="chips"><button class="btn btn-ouro btn-sm" data-act="av-estudo" ${D}>${est.length?"Novo estudo de mercado":"Fazer estudo de mercado"}</button>${a?`<button class="btn btn-linha btn-sm" data-act="virar-imovel" ${D}>Cadastrar como imóvel</button>`:""}</div>`;
  if(est.length) h += est.slice(0,5).map(e=>avLinhaEstudo(e, {lead:l._id})).join("");
  return `<section class="ld-sec"><div class="ld-rot">${a?"Pedido de avaliação":"Estudos de mercado"}${a?` <span>${esc(haQuanto(a.enviadoEm||l.criadoEm))}</span>`:""}</div>${h}</section>`;
}
function secEstudosImovel(id){
  const est = [...((S.privado[id]||{}).estudos||[])].sort((x,y)=>String(y.atualizadoEm||"").localeCompare(String(x.atualizadoEm||"")));
  if(!est.length) return "";
  return `<section class="ld-sec"><div class="ld-rot">Estudos de mercado</div>${est.slice(0,5).map(e=>avLinhaEstudo(e, {imovel:id})).join("")}</section>`;
}
function msgPrimeiroAvaliacao(l){
  return `Recebi seu pedido de estudo de mercado do seu imóvel (${avDescCurta(l.avaliacao)}). Já estou separando imóveis parecidos na região para comparar. Posso te fazer algumas perguntas rápidas ou combinar uma visita ao imóvel?`;
}
/* Dados para "Cadastrar como imóvel" a partir do pedido. O imóvel começa oculto: só vai ao site com a autorização do proprietário. */
function avImovelDoPedido(l){
  const a = l.avaliacao || {}, f = avFam(a.tipo), n = x => numBR(x) || null;
  const est = [...(l.estudos||[])].sort((x,y)=>String(x.atualizadoEm||"").localeCompare(String(y.atualizadoEm||""))).pop();
  const fator = ({alqueires:24200, hectares:10000})[a.unidadeRural||"alqueires"] || 1;
  return {
    base:{categoria:avCategoria(a.tipo), titulo:`${a.tipo||"Imóvel"}${a.quartos?` com ${a.quartos} ${Number(a.quartos)===1?"quarto":"quartos"}`:""}${a.bairro?` no bairro ${a.bairro}`:""}`,
      bairro:a.bairro||"", cidade:a.cidade||"Cornélio Procópio", uf:a.uf||"PR", finalidade: avSoAluguel(a.motivo) ? "aluguel" : "venda", status:"oculto",
      areaTotal: f==="rural" ? (n(a.areaRural) ? Math.round(n(a.areaRural)*fator) : null) : n(a.areaTerreno),
      areaConstruida: f==="apto" ? n(a.areaPrivativa) : f==="rural" ? n(a.areaSede) : n(a.areaConstruida),
      quartos:n(a.quartos), suites:n(a.suites), banheiros:n(a.banheiros), vagas:n(a.vagas),
      caracteristicas:[...(a.diferenciais||[]), ...(a.lazer||[])], descricao:avDescricao(a), aceitaPermuta: a.permuta==="Sim",
      preco:(est && est.resultado && est.resultado.rec) || n(a.valorPretendido) || 0},
    priv:{endereco:a.rua||""}, copiarFotos:a.fotos||[]};
}
/* Copia as fotos do pedido (pasta privada) para a pasta pública de fotos dos anúncios. */
async function copiarFotosAv(caminhos, add){
  const ret = () => document.getElementById("i-upret"), aberto2 = () => !!document.getElementById("i-fotos");
  if(!S.assets || !window.MF || !MF.baixarFotoAvaliacao) return;
  let n = 0;
  for(const p of caminhos){
    if(!aberto2()) return;
    if(ret()) ret().textContent = `Copiando as fotos do pedido (${n+1} de ${caminhos.length})…`;
    try{
      const b = await MF.baixarFotoAvaliacao(p);
      const r = await S.assets.upload(new File([b], "pedido.jpg", {type:b.type||"image/jpeg"}));
      if(!aberto2()) return;
      add(r.url); n++;
    }catch(e){}
  }
  if(ret()) ret().textContent = n ? `${n} ${n===1?"foto do pedido copiada":"fotos do pedido copiadas"}. O imóvel começa oculto no site: publique quando o proprietário autorizar.` : "Não foi possível copiar as fotos do pedido.";
}

/* =====================================================================
   3. ESTUDO DE MERCADO (ferramenta dos corretores)
   ===================================================================== */
const AV_UNID = {m2:["m²","m²",1], alq:["alqueires","alqueire",24200], ha:["hectares","hectare",10000]};
const avUnid = e => { const u = AV_UNID[(e.imovel||{}).unidade] || AV_UNID.m2; return {r:u[0], c:u[1], f:u[2]}; };
const AV_BASES = ["Área construída","Área privativa","Área do terreno","Área total"];
const AV_FRASES = [
  {r:"Estratégia de anúncio", t:"Recomendo anunciar pelo valor recomendado, com margem para negociar até o mínimo da faixa."},
  {r:"Venda mais rápida", t:"Para vender em menos tempo, o ideal é anunciar perto do valor mínimo, que hoje atrai mais visitas e propostas."},
  {r:"Reparos", t:"Pequenos reparos e uma boa arrumação antes das fotos ajudam a aproximar a venda do valor máximo."},
  {r:"Documentação", t:"Antes de anunciar, vale conferir a matrícula atualizada e a averbação da construção, o que evita atrasos na venda e no financiamento."}
];
/* Comparação simples: o corretor diz se o comparado é melhor, parecido ou pior que o avaliado.
   Por trás vira fator de homogeneização (NBR 14653): comparado melhor vale menos para o avaliado. */
const AV_NIVEIS = [[2,"Muito melhor"],[1,"Melhor"],[0,"Parecido"],[-1,"Pior"],[-2,"Muito pior"]];
const AV_CRIT = [["loc","Localização"],["pad","Acabamento"],["cons","Conservação"]];
const avFator = n => Math.round((1 - 0.1*(Number(n)||0))*100)/100;
const avNivel = n => (AV_NIVEIS.find(x=>x[0]===(Number(n)||0))||AV_NIVEIS[2])[1];
/* Valor crítico de Chauvenet por número de amostras e t de Student bicaudal 80% por graus de liberdade. */
const AV_CHAUV = {3:1.38,4:1.54,5:1.65,6:1.73,7:1.80,8:1.86,9:1.92,10:1.96,11:2.00,12:2.03,13:2.07,14:2.10,15:2.13,16:2.15,17:2.17,18:2.20,19:2.22,20:2.24};
const AV_T80 = [0,3.078,1.886,1.638,1.533,1.476,1.440,1.415,1.397,1.383,1.372,1.363,1.356,1.350,1.345,1.341,1.337,1.333,1.330,1.328,1.325];
function avStats(v){ const n = v.length, m = n ? v.reduce((a,b)=>a+b,0)/n : 0; return {n, m, s: n>1 ? Math.sqrt(v.reduce((a,x)=>a+(x-m)**2,0)/(n-1)) : 0}; }
const AV_PORTAIS = [["ZAP","zapimoveis.com.br"],["Viva Real","vivareal.com.br"],["OLX","olx.com.br"],["Imovelweb","imovelweb.com.br"],["Chaves na Mão","chavesnamao.com.br"]];
function avTermoBusca(e){ const im = e.imovel; return [im.tipo, Number(im.quartos)>0?`${im.quartos} quartos`:"", e.fin==="aluguel"?"aluguel":"à venda", im.bairro, im.cidade].filter(Boolean).join(" "); }
const avNovoId = () => "e" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const avBasePadrao = f => ({apto:"Área privativa", terreno:"Área do terreno", rural:"Área total"})[f] || "Área construída";
const avArred = v => !v ? 0 : v>=1e5 ? Math.round(v/1e3)*1e3 : v>=1e4 ? Math.round(v/100)*100 : Math.round(v/10)*10;
const avNumTxt = v => Number(v) ? Number(v).toLocaleString("pt-BR",{maximumFractionDigits:2}) : "";
function avPct(v){ const n = parseFloat(String(v??"").replace("−","-").replace(",",".").replace(/[^\d.-]/g,"")); return isFinite(n) ? Math.max(-60, Math.min(60, n)) : 0; }
function avSet(o, caminho, v){ const ps = caminho.split("."); let x = o; ps.slice(0,-1).forEach(p=>{ x[p] = x[p] || {}; x = x[p]; }); x[ps[ps.length-1]] = v; }
function avGet(o, caminho){ return caminho.split(".").reduce((x,p)=>x==null?x:x[p], o); }

function avEstudoBase(){
  return {id:avNovoId(), criadoEm:hoje(), atualizadoEm:hoje(), por:meuId(), fin:"venda",
    imovel:{tipo:"Casa", bairro:"", cidade:"Cornélio Procópio", endereco:"", base:"Área construída", area:0, unidade:"m2", areaTerreno:0, quartos:"", banheiros:"", vagas:"", conservacao:"", descricao:""},
    comps:[], desconto:10, amplitude:"auto", final:null, pedido:0, parecer:"", opc:{fotos:true, fontes:true, pedido:true, memoria:false}, fotos:[]};
}
function avEstudoDoPedido(l){
  const e = avEstudoBase(), a = l.avaliacao || {}, f = avFam(a.tipo);
  const area = f==="rural" ? numBR(a.areaRural) : f==="terreno" ? numBR(a.areaTerreno) : f==="apto" ? numBR(a.areaPrivativa) : numBR(a.areaConstruida);
  e.imovel = {...e.imovel, tipo:a.tipo||"Casa", bairro:a.bairro||"", cidade:a.cidade||"Cornélio Procópio", endereco:a.rua||"", base:avBasePadrao(f), area:area||0,
    unidade: f==="rural" ? (({hectares:"ha","m²":"m2"})[a.unidadeRural] || "alq") : "m2", areaTerreno:(f==="casa"||f==="com") ? numBR(a.areaTerreno) : 0,
    quartos:a.quartos?String(a.quartos):"", banheiros:a.banheiros?String(a.banheiros):"", vagas:a.vagas?String(a.vagas):"", conservacao:a.conservacao||"", descricao:l.avaliacao?avDescricao(a):""};
  e.fin = avSoAluguel(a.motivo) ? "aluguel" : "venda";
  e.fotos = a.fotos || [];
  e.pedido = numBR(a.valorPretendido) || 0;
  return e;
}
function avEstudoDoImovel(i){
  const e = avEstudoBase(), f = avFam(i.categoria);
  let area = (f==="terreno" || f==="rural") ? (i.areaTotal||0) : (i.areaConstruida||i.areaTotal||0), unidade = "m2";
  if(f==="rural" && area>=10000){ area = Math.round(area/24200*100)/100; unidade = "alq"; }
  e.imovel = {...e.imovel, tipo:i.categoria||"Casa", bairro:i.bairro||"", cidade:i.cidade||"", endereco:(S.privado[i._id]||{}).endereco||"", base:avBasePadrao(f), area, unidade,
    areaTerreno:(f==="casa"||f==="com") ? (i.areaTotal||0) : 0, quartos:i.quartos?String(i.quartos):"", banheiros:i.banheiros?String(i.banheiros):"", vagas:i.vagas?String(i.vagas):"",
    descricao:String(i.descricao||"").replace(/\s+/g," ").slice(0,420)};
  e.fin = i.finalidade==="aluguel" ? "aluguel" : "venda";
  e.imovelId = i._id; e.fotosPub = (i.fotos||[]).slice(0,3); e.pedido = i.preco || 0;
  return e;
}
/* Cálculo (roteiro do método comparativo da NBR 14653):
   1. valor por unidade de área de cada comparado; 2. homogeneização: oferta x (1 - desconto), x fatores de
   localização, acabamento e conservação (0,80 a 1,20), x ajuste extra; 3. saneamento: sai quem fica a mais de 30%
   da mediana e, depois, quem falha no critério de Chauvenet; 4. média e desvio padrão dos que ficaram;
   5. intervalo de confiança de 80% (t de Student), limitado a ±15% da média (campo de arbítrio);
   6. valor unitário = média saneada (o centro do campo); valor = unitário x área. */
function avCalc(e){
  const des = (Number(e.desconto)||0)/100;
  const L = e.comps.map(c=>{
    const area = Number(c.area)||0, valor = Number(c.valor)||0;
    if(!(area>0 && valor>0)) return {c, ok:false};
    const unit = valor/area, fFonte = c.tipo==="Vendido" ? 1 : 1-des, fat = AV_CRIT.map(([k])=>avFator(c[k])), fExtra = 1 + (Number(c.ajuste)||0)/100;
    return {c, ok:true, unit, fFonte, fat, fExtra, homog: unit * fFonte * fat.reduce((a,b)=>a*b, 1) * fExtra};
  });
  const cand = L.filter(x=>x.ok && x.c.usar!==false);
  const med0 = mediana(cand.map(x=>x.homog)) || 0;
  cand.forEach(x=>{ x.desvio = med0 ? x.homog/med0 - 1 : 0; x.fora = cand.length>=3 && Math.abs(x.desvio) > .30 && !x.c.forcar; if(x.fora) x.motivo = "mediana"; });
  let R = cand.filter(x=>!x.fora);
  const s0 = avStats(R.map(x=>x.homog)), vc = R.length>=3 ? AV_CHAUV[Math.min(R.length, 20)] : 0;
  R.forEach(x=>{ x.d = s0.s ? Math.abs(x.homog - s0.m)/s0.s : 0; if(vc && x.d >= vc && !x.c.forcar){ x.fora = true; x.motivo = "chauvenet"; } });
  R = R.filter(x=>!x.fora);
  const hs = R.map(x=>x.homog), st = avStats(hs), n = st.n, media = st.m, dp = st.s;
  const tc = n>=2 ? AV_T80[Math.min(n-1, 20)] : 0, margem = n>=2 ? tc*dp/Math.sqrt(n-1) : 0;
  const li = media - margem, ls = media + margem;
  const cMin = n>=3 ? Math.max(li, media*.85) : media*.85, cMax = n>=3 ? Math.min(ls, media*1.15) : media*1.15;
  const unitSug = media;
  const area = Number(e.imovel.area)||0, valor = unitSug*area, auto = e.amplitude==="auto";
  const amp = auto ? (media ? Math.round(Math.max(media-cMin, cMax-media)/media*1000)/10 : 0) : (Number(e.amplitude)||10);
  const min = auto ? cMin*area : valor*(1-amp/100), max = auto ? cMax*area : valor*(1+amp/100);
  return {L, usados:n, media, mediana:mediana(hs)||0, dp, cv: media ? dp/media*100 : 0, vc, tc, li, ls, cMin, cMax, unitSug,
    valor, amp, temFora:cand.some(x=>x.fora), foraMediana:cand.some(x=>x.motivo==="mediana"), foraChauv:cand.some(x=>x.motivo==="chauvenet"),
    min:avArred(min), rec:avArred(valor), max:avArred(max)};
}
const avFinais = (e, c) => e.final ? {...e.final} : {min:c.min, rec:c.rec, max:c.max};
const avLeadEst = () => S.est && S.est.alvo.tipo==="lead" ? S.leads.find(x=>x._id===S.est.alvo.id) : null;
function avSolicitante(){
  const st = S.est, l = avLeadEst();
  if(l) return l.nome;
  if(st.alvo.tipo==="imovel") return (S.privado[st.alvo.id]||{}).proprietario || "";
  return (st.e.prop||{}).nome || "";
}
function avTelefone(){
  const st = S.est, l = avLeadEst();
  if(l) return l.celular;
  if(st.alvo.tipo==="imovel") return (S.privado[st.alvo.id]||{}).proprietarioCel || "";
  return (st.e.prop||{}).celular || "";
}

function abrirEstudo(o={}){
  const origem = S.gav && S.gav.id ? {...S.gav} : null;
  fecharGaveta();
  const lead = o.lead ? S.leads.find(x=>x._id===o.lead) : null, im = o.imovel ? imovelPorId(o.imovel) : null;
  const copia = x => JSON.parse(JSON.stringify(x));
  let alvo, e;
  if(lead){ alvo = {tipo:"lead", id:lead._id}; const ex = o.est && (lead.estudos||[]).find(x=>x.id===o.est); e = ex ? copia(ex) : avEstudoDoPedido(lead); }
  else if(im){ alvo = {tipo:"imovel", id:im._id}; const ex = o.est && ((S.privado[im._id]||{}).estudos||[]).find(x=>x.id===o.est); e = ex ? copia(ex) : avEstudoDoImovel(im); }
  else { alvo = {tipo:"novo"}; e = avEstudoBase(); e.prop = {nome:"", celular:"", origem:"WhatsApp"}; }
  e.opc = {fotos:true, fontes:true, ...(e.opc||{})};
  S.est = {alvo, e, origem, picker:false, pq:"", sujo:false};
  montarTelaEstudo();
  if((e.fotos||[]).length) urlsAv(e.fotos).then(()=>{ if(S.est && S.est.e===e) avPrevia(); });
}
function montarTelaEstudo(){
  const velha = $("#av-tela"); if(velha) velha.remove();
  const t = document.createElement("div");
  t.id = "av-tela"; t.className = "doc-tela"; t.setAttribute("role","dialog"); t.setAttribute("aria-modal","true"); t.setAttribute("aria-label","Estudo de mercado");
  t.innerHTML = `<div class="doc-barra">
      <button class="btn btn-linha btn-sm doc-voltar" data-act="av-fechar">← Voltar</button>
      <h2 id="av-titulo">Estudo de mercado</h2>
      <div class="seg seg-curto doc-modo"><button class="on" data-act="av-modo" data-v="form">Preencher</button><button data-act="av-modo" data-v="prev">Ver estudo</button></div>
      <span class="doc-falta m-oculta" id="av-falta"></span>
      <button class="btn btn-linha btn-sm m-oculta" data-act="av-salvar">Salvar</button>
      <button class="btn btn-ouro btn-sm doc-acao" data-act="av-imprimir">Imprimir ou PDF</button>
    </div>
    <div class="doc-corpo modo-form" id="av-corpo">
      <form class="doc-form" id="av-fe" autocomplete="off"></form>
      <div class="doc-prev" id="av-prev"><div class="doc-escala" id="av-escala"><div class="doc-folha dc-estudo" id="av-folha"></div></div></div>
    </div>`;
  document.body.appendChild(t);
  document.body.classList.add("doc-aberto");
  document.addEventListener("keydown", avEsc);
  window.addEventListener("resize", avEscalar);
  window.addEventListener("beforeprint", avAntesImprimir);
  const f = $("#av-fe");
  f.addEventListener("input", avInput);
  f.addEventListener("change", avInput);
  f.addEventListener("focusout", avBlur);
  f.addEventListener("submit", e=>e.preventDefault());
  avPintarForm(); avPrevia();
  setTimeout(()=>{ const x = S.est && S.est.alvo.tipo==="novo" ? $("#ae-prop-nome") : null; if(x && matchMedia("(min-width:901px)").matches) x.focus(); }, 60);
}
function avEsc(e){ if(e.key==="Escape" && !e.target.closest("details.menu[open]")){ const b = $("#av-tela [data-act=av-fechar]"); if(b) b.click(); } }
function fecharEstudo(semVoltar){
  const t = $("#av-tela"); if(t) t.remove();
  document.body.classList.remove("doc-aberto");
  document.removeEventListener("keydown", avEsc);
  window.removeEventListener("resize", avEscalar);
  window.removeEventListener("beforeprint", avAntesImprimir);
  const st = S.est; S.est = null;
  if(semVoltar || !st || !st.origem || rota().nome!=="crm") return;
  const o = st.origem;
  if(o.tipo==="lead" && S.leads.find(x=>x._id===o.id)) abrirLead(o.id);
  else if(o.tipo==="imovel" && imovelPorId(o.id)) abrirImovel(o.id);
}
function avIn(caminho, rot, val, o={}){
  const id = "ae-" + caminho.replace(/\W/g,"-");
  return `<label class="campo ${o.largo?"largo":""}">${rot}<input id="${id}" data-e="${caminho}"${o.num?' inputmode="decimal" data-num="1"':""}${o.tel?' inputmode="tel"':""}${o.ph?` placeholder="${esc(o.ph)}"`:""} value="${esc(o.num ? avNumTxt(val) : (val ?? ""))}"></label>`;
}
function avCompHtml(c, k, U){
  const id = esc(c.id), A = n => `id="ac-${id}-${n}" data-c="${id}" data-cf="${n}"`;
  return `<div class="av-comp" id="acx-${id}">
    <div class="av-comp-top"><b class="av-n tab">${k+1}</b><input ${A("desc")} class="campo-solto" placeholder="Ex.: casa de 3 quartos na Rua Paraná" value="${esc(c.desc||"")}" aria-label="Descrição do imóvel ${k+1}">
      <button type="button" class="btn btn-linha btn-sm btn-ico" data-act="av-comp-rm" data-c="${id}" aria-label="Tirar o imóvel ${k+1}">×</button></div>
    <div class="av-comp-g">
      <label class="campo">Área (${U.r})<input ${A("area")} inputmode="decimal" data-num="1" value="${esc(avNumTxt(c.area))}"></label>
      <label class="campo">${S.est.e.fin==="aluguel"?"Aluguel":"Valor"} (R$)<input ${A("valor")} inputmode="numeric" data-num="1" value="${esc(avNumTxt(c.valor))}"></label>
      <label class="campo">Situação<select ${A("tipo")}><option ${c.tipo!=="Vendido"?"selected":""}>Oferta</option><option ${c.tipo==="Vendido"?"selected":""}>Vendido</option></select></label>
      <label class="campo">Bairro<input ${A("bairro")} value="${esc(c.bairro||"")}"></label>
      <label class="campo largo2">Fonte ou link<input ${A("fonte")} placeholder="Portal, placa, cartório…" value="${esc(c.fonte||"")}"></label>
    </div>
    <div class="av-crit"><span class="av-crit-r">Comparado ao imóvel avaliado, este é:</span>
      ${AV_CRIT.map(([k,r])=>`<label class="campo">${r}<select ${A(k)} class="${Number(c[k])?"mudou":""}">${AV_NIVEIS.map(([v,t])=>`<option value="${v}" ${(Number(c[k])||0)===v?"selected":""}>${t}</option>`).join("")}</select></label>`).join("")}
      ${Number(c.ajuste)?`<label class="campo">Outro ajuste (%)<input ${A("ajuste")} inputmode="decimal" value="${esc(String(c.ajuste).replace(".",","))}"></label>`:""}
    </div>
    <div class="av-comp-res" id="acr-${id}"></div></div>`;
}
function avCompRes(x, U){
  const c = x.c, D = `data-c="${esc(c.id)}"`;
  if(!x.ok) return `<span>Informe a área e o valor para entrar no cálculo.</span>`;
  const base = `<span>${brl(x.unit)}/${U.c}</span><span>ajustado <b>${brl(x.homog)}/${U.c}</b></span>`;
  if(c.usar===false) return `${base}<span class="av-fora">Fora do cálculo</span><button type="button" class="link-btn" data-act="av-usar" data-v="1" ${D}>Usar</button>`;
  const d = x.desvio!=null ? ` (${x.desvio>0?"+":""}${Math.round(x.desvio*100)}% da mediana)` : "";
  if(x.fora) return `${base}<span class="av-fora">${x.motivo==="chauvenet"?"Fora do padrão estatístico dos outros":`Muito diferente dos outros${d}`}: fora do cálculo</span><button type="button" class="link-btn" data-act="av-usar" data-v="f" ${D}>Usar mesmo assim</button>`;
  return `${base}${c.forcar?`<span class="av-mantido">Mantido por você${d}</span>`:""}<button type="button" class="link-btn" data-act="av-usar" data-v="0" ${D}>Não usar</button>`;
}
function avPickerHtml(){
  const st = S.est, e = st.e, q = norm(st.pq||""), f = avFam(e.imovel.tipo), U = avUnid(e);
  const ja = new Set(e.comps.map(c=>c.imovelId).filter(Boolean));
  const lista = S.imoveis.filter(i=>i._id!==e.imovelId)
    .map(i=>({i, s:(avFam(i.categoria)===f?2:0) + (i.bairro && norm(i.bairro)===norm(e.imovel.bairro)?1:0) + (i.status==="vendido"?.5:0)}))
    .filter(x=>!q || norm([x.i.codigo,x.i.titulo,x.i.bairro,x.i.categoria,x.i.cidade].join(" ")).includes(q))
    .sort((a,b)=>b.s-a.s || (b.i.criadoEm||"").localeCompare(a.i.criadoEm||"")).slice(0,25);
  return `<div class="lista-sel" id="av-pick-lista">${lista.map(({i})=>{ const ar = avAreaImovel(i, e); return `<button type="button" data-act="av-comp-imovel" data-imovel="${esc(i._id)}" ${ja.has(i._id)?"disabled":""}><b>${esc(i.codigo)} · ${esc(i.titulo)}</b><small>${esc([i.categoria, i.bairro, ar?`${numFmt(ar)} ${U.r}`:"", i.preco?brl(i.preco):"", rotStatus(i.status)].filter(Boolean).join(" · "))}${ja.has(i._id)?" · já incluído":""}</small></button>`; }).join("") || '<p class="nota" style="margin:0">Nenhum imóvel encontrado.</p>'}</div>`;
}
function avAreaImovel(i, e){
  const b = e.imovel.base, U = avUnid(e);
  const m2v = (b==="Área do terreno" || b==="Área total") ? (i.areaTotal||i.areaConstruida||0) : (i.areaConstruida||i.areaTotal||0);
  return m2v ? Math.round(m2v/U.f*100)/100 : 0;
}
function avPintarForm(){
  const f = $("#av-fe"); if(!f || !S.est) return;
  const st = S.est, e = st.e, im = e.imovel, U = avUnid(e);
  const tipos = [...new Set([...AV_TIPOS.flatMap(g=>g[1]), ...CATEGORIAS])];
  const temFotos = (e.fotos||[]).length || (e.fotosPub||[]).length, sc = f.scrollTop;
  preservar(f, ()=>{ f.innerHTML = `
    ${st.alvo.tipo==="novo"?`<section class="doc-sec"><div class="ld-rot">Proprietário</div><div class="doc-campos">
      ${avIn("prop.nome","Nome",e.prop.nome,{largo:true})}${avIn("prop.celular","Celular com DDD",e.prop.celular,{tel:true})}
      <label class="campo">Como chegou<select id="ae-prop-origem" data-e="prop.origem">${opcoes(ORIGENS.filter(o=>o!=="Site"), e.prop.origem)}</select></label></div>
      <p class="nota" style="margin:0">Ao salvar, o proprietário entra nos leads como captação, com o estudo no histórico.</p></section>`:""}
    <section class="doc-sec"><div class="ld-rot">Imóvel avaliado</div><div class="doc-campos">
      <label class="campo">Tipo<select id="ae-tipo" data-e="imovel.tipo">${opcoes(tipos, im.tipo)}</select></label>
      <label class="campo">Estudo para<select id="ae-fin" data-e="fin"><option value="venda" ${e.fin!=="aluguel"?"selected":""}>Venda</option><option value="aluguel" ${e.fin==="aluguel"?"selected":""}>Locação</option></select></label>
      ${avIn("imovel.bairro","Bairro",im.bairro)}${avIn("imovel.cidade","Cidade",im.cidade)}
      ${avIn("imovel.endereco","Endereço (opcional)",im.endereco,{largo:true})}
      <label class="campo">Área comparada<select id="ae-base" data-e="imovel.base">${opcoes(AV_BASES, im.base)}</select></label>
      <label class="campo">Medida<select id="ae-unid" data-e="imovel.unidade">${Object.entries(AV_UNID).map(([k,[r]])=>`<option value="${k}" ${k===(im.unidade||"m2")?"selected":""}>${r}</option>`).join("")}</select></label>
      ${avIn("imovel.area",`${esc(im.base)} (${U.r})`,im.area,{num:true})}
      ${im.base==="Área construída"||im.base==="Área privativa"?avIn("imovel.areaTerreno","Área do terreno (m²)",im.areaTerreno,{num:true}):"<span></span>"}
      ${avIn("imovel.quartos","Quartos",im.quartos)}${avIn("imovel.banheiros","Banheiros",im.banheiros)}
      ${avIn("imovel.vagas","Vagas",im.vagas)}
      <label class="campo">Conservação<select id="ae-cons" data-e="imovel.conservacao"><option value=""></option>${opcoes(AV_CONSERV, im.conservacao)}</select></label>
      <label class="campo largo">Descrição no estudo<textarea id="ae-desc" data-e="imovel.descricao" rows="3">${esc(im.descricao||"")}</textarea></label>
    </div></section>
    <section class="doc-sec"><div class="ld-rot">Imóveis comparados <span class="tab">${e.comps.length}</span></div>
      <p class="nota" style="margin:0">Use imóveis parecidos (tipo, bairro e padrão), de portais, placas ou vendas que você conhece. O ideal é de 4 a 8. Para cada um, diga se é melhor, parecido ou pior que o avaliado: o CRM faz os ajustes.</p>
      <div class="av-busca" id="av-busca"></div>
      ${e.comps.map((c,k)=>avCompHtml(c,k,U)).join("")}
      <div class="chips"><button type="button" class="btn btn-linha btn-sm" data-act="av-comp-add">+ Adicionar imóvel</button><button type="button" class="btn btn-linha btn-sm" data-act="av-picker" aria-expanded="${st.picker}">${st.picker?"Fechar a carteira":"+ Da minha carteira"}</button></div>
      ${st.picker?`<div class="av-pick"><input id="ae-pq" class="campo-solto" data-pq="1" placeholder="Buscar por código, bairro ou tipo" value="${esc(st.pq||"")}" aria-label="Buscar na carteira">${avPickerHtml()}</div>`:""}
    </section>
    <section class="doc-sec"><div class="ld-rot">Resultado</div>
      <div class="doc-campos">
        <label class="campo">Desconto nas ofertas<select id="ae-desconto" data-e="desconto">${[0,5,10,15,20].map(n=>`<option value="${n}" ${Number(e.desconto)===n?"selected":""}>${n}%</option>`).join("")}</select></label>
        <label class="campo">Faixa de valor<select id="ae-amp" data-e="amplitude"><option value="auto" ${e.amplitude==="auto"?"selected":""}>Estatística (automática)</option>${[5,10,15].map(n=>`<option value="${n}" ${String(e.amplitude)===String(n)?"selected":""}>± ${n}%</option>`).join("")}</select></label>
      </div>
      <div class="av-calc" id="av-calc"></div>
      <details class="av-tec" id="av-tec"><summary>Ver detalhes técnicos do cálculo</summary><div id="av-tec-c"></div></details>
      <div class="av-finais">${[["min","Mínimo"],["rec","Recomendado"],["max","Máximo"]].map(([k,r])=>`<label class="campo">${r} (R$)<input id="ae-f-${k}" data-final="${k}" inputmode="numeric"></label>`).join("")}</div>
      <p class="nota" id="av-final-nota" style="margin:0"></p>
      <div class="doc-campos">${avIn("pedido", e.fin==="aluguel"?"Aluguel pedido pelo proprietário (R$)":"Valor pedido pelo proprietário (R$)", e.pedido, {num:true, ph:"opcional"})}</div>
      <div id="av-pedido"></div>
    </section>
    <section class="doc-sec"><div class="ld-rot">Parecer do corretor</div>
      <textarea id="ae-parecer" class="campo-solto" data-e="parecer" rows="4" placeholder="Sua leitura do mercado e a estratégia sugerida (opcional)">${esc(e.parecer||"")}</textarea>
      <div class="me-trechos">${AV_FRASES.map((x,k)=>`<button type="button" class="chip" data-act="av-frase" data-v="${k}">+ ${esc(x.r)}</button>`).join("")}</div>
    </section>
    <section class="doc-sec"><div class="ld-rot">No PDF</div>
      <label class="check"><input type="checkbox" id="ae-opc-fontes" data-e="opc.fontes" ${e.opc.fontes!==false?"checked":""}> Mostrar a fonte de cada imóvel comparado</label>
      ${temFotos?`<label class="check"><input type="checkbox" id="ae-opc-fotos" data-e="opc.fotos" ${e.opc.fotos!==false?"checked":""}> Mostrar fotos do imóvel</label>`:""}
      <label class="check"><input type="checkbox" id="ae-opc-pedido" data-e="opc.pedido" ${e.opc.pedido!==false?"checked":""}> Comparar com o valor pedido pelo proprietário</label>
      <label class="check"><input type="checkbox" id="ae-opc-memoria" data-e="opc.memoria" ${e.opc.memoria?"checked":""}> Incluir a memória de cálculo (estatística)</label>
    </section>
    <div class="chips av-fe-acoes"><button type="button" class="btn btn-marca" data-act="av-salvar">Salvar estudo</button><a class="btn btn-whats" id="av-wa" target="_blank" rel="noopener" data-act="av-wa" hidden>${ICO.whats} Enviar resumo</a><button type="button" class="btn btn-ouro" data-act="av-imprimir">Imprimir ou PDF</button></div>
    <p class="nota" id="av-salvo" style="margin:0"></p>`; });
  f.scrollTop = sc;
  const tecD = $("#av-tec"); if(tecD) tecD.addEventListener("toggle", ()=>{ if(tecD.open) avAtualizar(true); });
  avAtualizar(true);
}
/* Valor pedido pelo proprietário x faixa de mercado. */
function avPedidoInfo(e, fin){
  const p = Number(e.pedido)||0; if(!p || !fin.rec) return null;
  const dif = (p - fin.rec)/fin.rec*100, situ = fin.max && p > fin.max ? "acima" : fin.min && p < fin.min ? "abaixo" : "dentro";
  const pct = `${Math.abs(dif).toLocaleString("pt-BR",{maximumFractionDigits:1})}% ${dif>=0?"acima":"abaixo"} do valor de mercado`;
  return {p, dif, situ, pct, titulo:{acima:"Pedido acima da faixa de mercado", dentro:"Pedido dentro da faixa de mercado", abaixo:"Pedido abaixo da faixa de mercado"}[situ],
    texto:{acima:"Vale mostrar os imóveis comparados ao proprietário e combinar um valor de anúncio mais perto do recomendado.", dentro:"O valor pedido está coerente com o mercado.",
      abaixo:"O imóvel tende a vender rápido. Confirme se o proprietário sabe que pode pedir mais."}[situ]};
}
const avF2 = v => Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
/* Memória de cálculo: tabela de homogeneização e estatística (tela e PDF). */
function avTecHtml(e, c, U){
  const L = c.L.filter(x=>x.ok);
  if(!L.length) return `<p class="nota" style="margin:0">Adicione imóveis comparados com área e valor.</p>`;
  const sit = x => x.c.usar===false ? "fora (você tirou)" : x.fora ? (x.motivo==="chauvenet" ? "fora (Chauvenet)" : "fora (+30% da mediana)") : (x.homog>=c.cMin-1e-9 && x.homog<=c.cMax+1e-9 ? "no campo" : "fora do campo");
  return `<div class="av-tec-tab"><table class="dc-tab"><thead><tr><th>#</th><th>R$/${U.c}</th><th>Fonte</th>${AV_CRIT.map(([,r])=>`<th>${r.slice(0,4)}.</th>`).join("")}<th>Outro</th><th>Homog.</th><th>d</th><th>Situação</th></tr></thead><tbody>
    ${L.map(x=>`<tr><td>${e.comps.indexOf(x.c)+1}</td><td>${avF2(x.unit)}</td><td>${avF2(x.fFonte)}</td>${x.fat.map(f=>`<td>${avF2(f)}</td>`).join("")}<td>${avF2(x.fExtra)}</td><td><b>${avF2(x.homog)}</b></td><td>${x.d!=null?avF2(x.d):"—"}</td><td>${sit(x)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="av-tec-g">${[["Amostras no cálculo", String(c.usados)], ["Média (X)", `${avF2(c.media)} R$/${U.c}`], ["Desvio padrão (S)", `${avF2(c.dp)} R$/${U.c}`], ["Coef. de variação", pctFmt(c.cv)],
      ["Chauvenet", c.vc ? `VC = ${avF2(c.vc)} (n = ${c.L.filter(x=>x.ok && x.c.usar!==false && x.motivo!=="mediana").length})` : "a partir de 3 amostras"],
      ["t de Student 80%", c.tc ? `${avF2(c.tc)} (${c.usados-1} g.l.)` : "—"], ["Intervalo de confiança", c.usados>=2 ? `${avF2(c.li)} a ${avF2(c.ls)}` : "—"],
      ["Campo de arbítrio", `${avF2(c.cMin)} a ${avF2(c.cMax)}`], ["Unitário adotado", `${avF2(c.unitSug)} R$/${U.c} (média saneada)`]]
      .map(([r,v])=>`<div><small>${r}</small><b>${v}</b></div>`).join("")}</div>`;
}
/* Atualiza números, avisos e prévia sem redesenhar o formulário (não perde o foco de quem está digitando). */
function avAtualizar(semPrevia){
  const st = S.est; if(!st) return;
  const e = st.e, c = avCalc(e), U = avUnid(e), fin = avFinais(e, c);
  c.L.forEach(x=>{ const r = document.getElementById("acr-"+x.c.id); if(r) r.innerHTML = avCompRes(x, U); const b = document.getElementById("acx-"+x.c.id); if(b) b.classList.toggle("fora", !!(x.fora || x.c.usar===false)); });
  const cal = $("#av-calc");
  if(cal) cal.innerHTML = c.usados
    ? `<div><small>No cálculo</small><b class="tab">${c.usados} de ${e.comps.length}</b></div><div><small>Média ajustada</small><b class="tab">${brl(c.media)}/${U.c}</b></div>
      <div><small>Mediana</small><b class="tab">${brl(c.mediana)}/${U.c}</b></div><div><small>Variação</small><b class="tab">${pctFmt(c.cv)}</b></div>
      <div class="av-calc-v"><small>Valor calculado${e.imovel.area?` para ${numFmt(e.imovel.area)} ${U.r}`:""}</small><b class="tab">${c.valor?brl(c.valor):"informe a área do imóvel"}</b></div>
      ${c.usados<3?`<p class="av-alerta">Use pelo menos 3 imóveis comparados para um resultado confiável.</p>`:""}`
    : `<p class="nota" style="margin:0;grid-column:1/-1">Adicione imóveis comparados com área e valor para calcular.</p>`;
  ["min","rec","max"].forEach(k=>{ const i = document.getElementById("ae-f-"+k); if(i && document.activeElement!==i) i.value = fin[k] ? Number(fin[k]).toLocaleString("pt-BR") : ""; });
  const nota = $("#av-final-nota");
  if(nota) nota.innerHTML = e.final ? `Valores ajustados por você. <button type="button" class="link-btn" data-act="av-recalc">Voltar ao calculado</button>`
    : c.valor ? (e.amplitude==="auto" ? (c.usados>=3 ? `Faixa estatística de ± ${String(c.amp).replace(".",",")}% (intervalo de confiança de 80%, limitado a 15%).` : "Faixa de ± 15% até ter 3 comparados.") : `Faixa de ± ${c.amp}%.`) + " Você pode mudar os valores à mão." : "";
  const tec = $("#av-tec-c"); if(tec && $("#av-tec").open) tec.innerHTML = avTecHtml(e, c, U);
  const bu = $("#av-busca"), termo = avTermoBusca(e);
  if(bu && bu.dataset.t!==termo){ bu.dataset.t = termo;
    bu.innerHTML = `<span class="nota">Buscar parecidos:</span>${AV_PORTAIS.map(([n,d])=>`<a class="chip" target="_blank" rel="noopener" href="${esc(GU_BUSCA(`site:${d} ${termo}`))}">${n} ↗</a>`).join("")}<a class="chip" target="_blank" rel="noopener" href="${esc(GU_BUSCA(termo))}">Google ↗</a>`; }
  const pe = $("#av-pedido"), pi = avPedidoInfo(e, fin);
  if(pe) pe.innerHTML = pi ? `<div class="av-ped-${pi.situ} av-pedcard"><b>${pi.titulo}</b><span>${brl(pi.p)}${e.fin==="aluguel"?" por mês":""}, ${pi.pct}.</span><small>${pi.texto}</small></div>` : "";
  const sol = avSolicitante(), t = $("#av-titulo"); if(t) t.textContent = "Estudo de mercado" + (sol ? " · " + sol : "");
  const falta = [!(Number(e.imovel.area)>0) && "área do imóvel", c.usados<3 && "3 comparados", !fin.rec && "valor"].filter(Boolean), fe = $("#av-falta");
  if(fe){ fe.className = "doc-falta m-oculta " + (falta.length ? "tem" : "ok"); fe.textContent = falta.length ? "Falta: " + falta.join(", ") : "Pronto para enviar"; }
  const wa = $("#av-wa"), tel = avTelefone();
  if(wa){ wa.hidden = !(fin.rec && soDig(tel).length>=10); if(!wa.hidden) wa.href = waLink(avMsgEstudo(), celIntl(tel)); }
  if(!semPrevia) avPreviaLogo();
}
function avInput(ev){
  const x = ev.target, st = S.est; if(!st) return;
  const e = st.e;
  if(x.dataset.pq){ if(ev.type!=="input") return; st.pq = x.value; const l = $("#av-pick-lista"); if(l){ const d = document.createElement("div"); d.innerHTML = avPickerHtml(); l.replaceWith(d.firstElementChild); } return; }
  if(x.dataset.c && x.dataset.cf){
    const c = e.comps.find(y=>y.id===x.dataset.c); if(!c) return;
    const k = x.dataset.cf, crit = AV_CRIT.some(([q])=>q===k), v = k==="ajuste" ? avPct(x.value) : (k==="area" || k==="valor") ? numBR(x.value) : crit ? (Number(x.value)||0) : x.value;
    if(c[k]===v) return;
    c[k] = v; st.sujo = true; if(crit) x.classList.toggle("mudou", !!v); avAtualizar(); return;
  }
  if(x.dataset.final){ const c = avCalc(e), v = numBR(x.value); if(e.final && e.final[x.dataset.final]===v) return; e.final = {...avFinais(e, c), [x.dataset.final]:v}; st.sujo = true; avAtualizar(); return; }
  const k = x.dataset.e; if(!k) return;
  let v = x.type==="checkbox" ? x.checked : x.value;
  if(x.dataset.num) v = numBR(v);
  if(k==="prop.celular") v = soDig(v);
  if(k==="imovel.unidade" && v!==e.imovel.unidade){ // converte as áreas para a nova medida
    const de = (AV_UNID[e.imovel.unidade]||AV_UNID.m2)[2], para = (AV_UNID[v]||AV_UNID.m2)[2], cv = n => n ? Math.round(n*de/para*100)/100 : n;
    e.imovel.area = cv(Number(e.imovel.area)||0); e.comps.forEach(c=>{ c.area = cv(Number(c.area)||0); });
  }
  if(avGet(e, k)===v) return;
  avSet(e, k, v); st.sujo = true;
  if(["imovel.unidade","imovel.base","fin"].includes(k)){ avPintarForm(); avPrevia(); return; }
  if(k==="imovel.tipo"){ const b = avBasePadrao(avFam(v)); if(b!==e.imovel.base){ e.imovel.base = b; avPintarForm(); avPrevia(); return; } }
  avAtualizar();
}
function avBlur(ev){
  const x = ev.target;
  if((x.dataset.num || x.dataset.final) && x.value.trim()){ const n = numBR(x.value); x.value = n ? n.toLocaleString("pt-BR",{maximumFractionDigits:2}) : ""; }
  if(x.dataset.e==="prop.celular" && x.value) x.value = fmtCel(x.value);
}
function avEscalar(){
  const p = $("#av-prev"), fo = $("#av-folha"), es = $("#av-escala"); if(!p || !fo || !es) return;
  const w = fo.offsetWidth || 794, s = Math.min(1, Math.max(.3, (p.clientWidth - 32) / w));
  fo.style.transform = s<1 ? `scale(${s})` : "";
  es.style.width = (w*s)+"px"; es.style.height = (fo.offsetHeight*s)+"px";
}
let avTimer = null;
function avPrevia(){ const fo = $("#av-folha"); if(!fo || !S.est) return; fo.innerHTML = htmlEstudo(); avEscalar(); }
function avPreviaLogo(){ clearTimeout(avTimer); avTimer = setTimeout(avPrevia, 160); }

/* Folha A4 do estudo (prévia e impressão). */
function htmlEstudo(){
  const st = S.est, e = st.e, im = e.imovel, c = avCalc(e), fin = avFinais(e, c), U = avUnid(e);
  const l = avLeadEst(), imv = st.alvo.tipo==="imovel" ? imovelPorId(st.alvo.id) : null;
  const cor = corretorDoc((l && l.corretorId) || (imv && imv.corretorId) || e.por || meuId()), emp = empresaDoc();
  const cnai = titulosDe(cor).find(t=>/CNAI/i.test(t)), sol = avSolicitante(), alug = e.fin==="aluguel";
  const fotos = e.opc.fotos===false ? [] : ((e.fotosPub||[]).length ? e.fotosPub : (e.fotos||[]).map(urlAv).filter(Boolean)).slice(0,3);
  const specs = [["Tipo", im.tipo], [im.base, im.area?`${numFmt(im.area)} ${U.r}`:""], ["Área do terreno", im.areaTerreno && !/terreno|total/i.test(im.base) ? `${numFmt(im.areaTerreno)} m²` : ""],
    ["Quartos", im.quartos], ["Banheiros", im.banheiros], ["Vagas", im.vagas], ["Conservação", im.conservacao], ["Localização", [im.bairro, im.cidade].filter(Boolean).join(", ")]].filter(x=>x[1]);
  const area = Number(im.area)||0, usados = c.L.filter(x=>x.ok && x.c.usar!==false && !x.fora);
  let escala = "";
  if(area && usados.length && fin.min && fin.max){
    const vals = usados.map(x=>x.homog*area), lo = Math.min(fin.min, ...vals)*.96, hi = Math.max(fin.max, ...vals)*1.04, pos = v => ((v-lo)/(hi-lo)*100).toFixed(2);
    escala = `<div class="es-escala" aria-hidden="true"><div class="es-trilho"></div><div class="es-banda" style="left:${pos(fin.min)}%;width:${(pos(fin.max)-pos(fin.min)).toFixed(2)}%"></div>
      ${vals.map(v=>`<i style="left:${pos(v)}%"></i>`).join("")}<div class="es-alvo" style="left:${pos(fin.rec)}%"></div></div>
      <div class="es-leg"><span><i class="es-ponto"></i> valor equivalente de cada imóvel comparado</span><span><i class="es-faixa-ico"></i> faixa recomendada</span></div>`;
  }
  const des = Number(e.desconto)||0, auto = e.amplitude==="auto";
  const metodo = `Seguimos o roteiro do método comparativo direto de dados de mercado da ABNT NBR 14653: o valor por ${U.c} de imóveis semelhantes da região foi homogeneizado e aplicado à ${String(im.base).toLowerCase()} do imóvel avaliado.`
    + (des && e.comps.some(x=>x.tipo!=="Vendido") ? ` Os preços em oferta receberam desconto de ${des}%, margem comum de negociação.` : "")
    + (e.comps.some(x=>AV_CRIT.some(([k])=>Number(x[k])) || Number(x.ajuste)) ? " Cada imóvel comparado foi ajustado pelas diferenças de localização, acabamento e conservação em relação ao avaliado." : "")
    + (c.temFora ? ` Foram desconsiderados os imóveis muito distantes dos demais (${[c.foraMediana&&"mais de 30% da mediana", c.foraChauv&&"critério de Chauvenet"].filter(Boolean).join(" e ")}).` : "")
    + (c.usados ? ` Média homogeneizada: ${brl(c.media)} por ${U.c}, com ${c.usados} ${c.usados===1?"imóvel":"imóveis"}.` : "")
    + (e.final ? " Os valores finais foram definidos pelo corretor a partir do cálculo, considerando características do imóvel que os números não mostram."
      : !c.valor ? "" : auto && c.usados>=3 ? ` A faixa corresponde ao intervalo de confiança de 80% da média, limitado a 15% (campo de arbítrio).` : ` A faixa é de ± ${String(c.amp).replace(".",",")}% sobre o valor recomendado.`);
  const ped = e.opc.pedido!==false ? avPedidoInfo(e, fin) : null;
  return `${timbreDoc({empresa:emp, corretor:cor})}
    <h1>Estudo de mercado</h1>
    <p class="es-sub">${alug?"Opinião de valor de locação":"Opinião de valor de venda"} · ${esc(dataLonga(toLocalInput(e.atualizadoEm||hoje()).slice(0,10)))}${sol?` · Para ${esc(sol)}`:""}</p>
    <section class="es-res">
      <div class="es-faixa">
        <div><small>Mínimo</small><b>${fin.min?brl(fin.min):"—"}</b></div>
        <div class="es-rec"><small>${alug?"Aluguel recomendado":"Valor de mercado"}</small><b>${fin.rec?brl(fin.rec):"—"}</b>${alug?"<span>por mês</span>":""}</div>
        <div><small>Máximo</small><b>${fin.max?brl(fin.max):"—"}</b></div>
      </div>${escala}
      ${fin.rec && area ? `<p class="es-m2">Equivale a ${brl(fin.rec/area)} por ${U.c} (${esc(String(im.base).toLowerCase())} de ${numFmt(area)} ${U.r}).</p>` : ""}
      ${ped ? `<p class="es-ped es-ped-${ped.situ}">${alug?"Aluguel pretendido":"Valor pretendido"} pelo proprietário: <b>${brl(ped.p)}</b>, ${esc(ped.pct)}${ped.situ==="dentro"?", dentro da faixa":ped.situ==="acima"?", acima da faixa":", abaixo da faixa"}.</p>` : ""}
    </section>
    <h2>Imóvel avaliado</h2>
    <div class="fi-specs es-specs">${specs.map(([r,v])=>`<div><small>${esc(r)}</small><b>${esc(v)}</b></div>`).join("")}</div>
    ${im.descricao?`<p class="es-txt">${esc(im.descricao)}</p>`:""}
    ${fotos.length?`<div class="es-fotos">${fotos.map(u=>`<img src="${esc(u)}" alt="">`).join("")}</div>`:""}
    <h2>Imóveis comparados</h2>
    ${e.comps.length ? `<table class="dc-tab es-tab"><thead><tr><th>#</th><th>Imóvel</th><th>Área</th><th>${alug?"Aluguel":"Valor"}</th><th>Por ${U.c}</th><th>Ajustado</th></tr></thead><tbody>
      ${c.L.map((x,k)=>{ const cc = x.c, fora = !x.ok || cc.usar===false || x.fora;
        const crit = AV_CRIT.filter(([k])=>Number(cc[k])).map(([k,r])=>`${r.toLowerCase()} ${avNivel(cc[k]).toLowerCase()}`).join(", ");
        const info = [cc.bairro, cc.tipo==="Vendido"?"vendido":"em oferta", crit, cc.ajuste?`outro ajuste ${cc.ajuste>0?"+":""}${String(cc.ajuste).replace(".",",")}%`:"", e.opc.fontes!==false?cc.fonte:""].filter(Boolean).join(" · ");
        return `<tr class="${fora?"es-fora":""}"><td>${k+1}</td><td><b>${esc(cc.desc||"Imóvel "+(k+1))}</b>${info||fora?`<br><small>${esc(info)}${fora?`${info?" · ":""}${x.ok?(x.fora?"fora do padrão dos demais, não considerado":"não considerado"):"dados incompletos"}`:""}</small>`:""}</td>
          <td>${cc.area?esc(numFmt(cc.area)+" "+(U.c==="m²"?"m²":U.r)):"—"}</td><td>${cc.valor?brl(cc.valor):"—"}</td><td>${x.ok?brl(x.unit):"—"}</td><td>${x.ok?brl(x.homog):"—"}</td></tr>`; }).join("")}
      </tbody></table>` : `<p class="es-txt">Nenhum imóvel comparado informado.</p>`}
    <h2>Como chegamos ao valor</h2>
    <p class="es-txt">${esc(metodo)}</p>
    ${e.opc.memoria && c.usados ? `<h2>Memória de cálculo</h2><p class="es-txt es-peq">Comparado em relação ao avaliado: muito melhor 0,80; melhor 0,90; parecido 1,00; pior 1,10; muito pior 1,20. Homogeneizado = R$/${esc(U.c)} × fonte × localização × acabamento × conservação × outro ajuste.</p><div class="es-tec">${avTecHtml(e, c, U)}</div>` : ""}
    ${e.parecer?`<h2>Parecer do corretor</h2><p class="es-txt">${esc(e.parecer).replace(/\n/g,"<br>")}</p>`:""}
    <div class="dc-assin n1"><div class="dc-ass"><span class="dc-linha"></span><b>${esc(cor.nome)}</b><small>${/a$/i.test(primeiroNome(cor.nome))?"Corretora":"Corretor"} de imóveis${cor.creci?` · CRECI ${esc(cor.creci)}`:""}${cnai?` · ${esc(cnai)}`:""}</small></div></div>
    <p class="es-aviso">Este estudo é uma opinião de valor preparada para orientar a ${alug?"locação":"venda"} do imóvel, com base nas informações fornecidas e em imóveis semelhantes ofertados ou negociados na região até a data acima. Não é laudo de avaliação e não substitui o Parecer Técnico de Avaliação Mercadológica (PTAM) nem o laudo conforme a ABNT NBR 14653, exigidos em inventários, partilhas, processos judiciais e garantias bancárias. Os valores mudam com o mercado; recomenda-se revisar o estudo em até seis meses.</p>`;
}
function avMsgEstudo(){
  const st = S.est, e = st.e, c = avCalc(e), fin = avFinais(e, c), l = avLeadEst();
  const eu = corretorDe((l && l.corretorId) || e.por || meuId()).nome, alug = e.fin==="aluguel";
  const loc = e.imovel.bairro ? ` no bairro ${e.imovel.bairro}` : "";
  const comp = c.usados ? `Comparando com ${c.usados} ${c.usados===1?"imóvel parecido":"imóveis parecidos"} da região, ` : "Pela pesquisa de mercado, ";
  return `Olá ${primeiroNome(avSolicitante())}, tudo bem? Aqui é ${eu}, da Monfernatti Imóveis. Terminei o estudo de mercado do seu imóvel (${String(e.imovel.tipo||"imóvel").toLowerCase()}${loc}).\n\n`
    + `${comp}${alug?"o aluguel de mercado fica":"o valor de mercado fica"} em torno de *${brl(fin.rec)}*${alug?" por mês":""}, numa faixa de ${brl(fin.min)} a ${brl(fin.max)}.\n\n`
    + `Posso te enviar o estudo completo em PDF e explicar como chegamos a esse valor?`;
}
async function salvarEstudo(o={}){
  const st = S.est; if(!st) return false;
  const e = st.e, c = avCalc(e), fin = avFinais(e, c), U = avUnid(e);
  e.atualizadoEm = hoje(); e.por = e.por || meuId();
  e.resultado = {min:fin.min||0, rec:fin.rec||0, max:fin.max||0, unit:fin.rec && Number(e.imovel.area) ? Math.round(fin.rec/Number(e.imovel.area)) : 0,
    n:c.usados, total:e.comps.length, unidade:U.c, tipo:e.imovel.tipo, bairro:e.imovel.bairro, fin:e.fin||"venda"};
  const rotulo = fin.rec ? `${brl(fin.rec)}${e.fin==="aluguel"?" por mês":""} (faixa de ${brl(fin.min)} a ${brl(fin.max)})` : "ainda sem valor final";
  const limpo = JSON.parse(JSON.stringify(e)); delete limpo.prop;
  const aviso = $("#av-salvo");
  try{
    if(st.alvo.tipo==="novo"){
      const p = e.prop || {};
      if(String(p.nome||"").trim().length<2 || soDig(p.celular).length<10){
        if(!o.silencioso){ toast("Para salvar, informe o nome e o celular do proprietário."); const x = $("#ae-prop-nome"); if(x){ x.scrollIntoView({block:"center"}); x.focus(); } }
        return false;
      }
      const lead = {nome:p.nome.trim(), celular:soDig(p.celular), email:"", origem:p.origem||"WhatsApp", etapa:"atendimento", temperatura:"morno", interesse:"Captação",
        corretorId:S.crmCorretor||meuId(), criadoEm:hoje(), atualizadoEm:hoje(), tags:["Avaliação"], mensagem:`Estudo de mercado: ${e.imovel.tipo}${e.imovel.bairro?` no bairro ${e.imovel.bairro}`:""}.`,
        historico:[{quando:hoje(), tipo:"Sistema", texto:"Lead cadastrado a partir de um estudo de mercado."},{quando:hoje(), tipo:"Nota", texto:`Estudo de mercado: ${rotulo}.`}], estudos:[limpo]};
      const ref = await S.db.collection("leads").add(lead);
      if(!S.leads.some(x=>x._id===ref.id)) S.leads.push({_id:ref.id, ...lead});
      st.alvo = {tipo:"lead", id:ref.id}; delete e.prop;
      avPintarForm();
    } else if(st.alvo.tipo==="lead"){
      const l = S.leads.find(x=>x._id===st.alvo.id); if(!l) throw new Error("lead");
      const ja = (l.estudos||[]).some(x=>x.id===e.id);
      const ok = await salvarLead(l._id, {estudos:[...(l.estudos||[]).filter(x=>x.id!==e.id), limpo].slice(-10)}, ja ? [] : [{tipo:"Nota", texto:`Estudo de mercado: ${rotulo}.`}]);
      if(!ok) return false;
    } else {
      const id = st.alvo.id, atual = S.privado[id] || {};
      const novo = {...atual, estudos:[...(atual.estudos||[]).filter(x=>x.id!==e.id), limpo].slice(-10)};
      await S.db.doc("privado/"+id).set(novo); S.privado[id] = novo;
    }
    st.sujo = false;
    const a2 = $("#av-salvo") || aviso; if(a2) a2.textContent = `Estudo salvo às ${horaBR(hoje())}.`;
    if(!o.silencioso) toast("Estudo salvo.");
    return true;
  }catch(err){ toast("Não foi possível salvar o estudo. Verifique a internet e tente de novo."); return false; }
}
function avNomeArquivo(){
  return ["Estudo de mercado", avSolicitante(), S.est.e.imovel.tipo, S.est.e.imovel.bairro].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]/g,"");
}
function avPrepararImpressao(){
  if(!S.est || document.body.classList.contains("imprimindo")) return null;
  let p = $("#doc-print"); if(!p){ p = document.createElement("div"); p.id = "doc-print"; document.body.appendChild(p); }
  p.innerHTML = `<div class="doc-folha dc-estudo">${htmlEstudo()}</div>`;
  const titulo = document.title; document.title = avNomeArquivo();
  document.body.classList.add("imprimindo");
  const fim = ()=>{ document.body.classList.remove("imprimindo"); document.title = titulo; window.removeEventListener("afterprint", fim); };
  window.addEventListener("afterprint", fim);
  return p;
}
function avAntesImprimir(){ if(avPrepararImpressao() && S.est.sujo) salvarEstudo({silencioso:true}); }
async function imprimirEstudo(){
  if(!S.est) return;
  if(S.est.sujo) salvarEstudo({silencioso:true});
  const p = avPrepararImpressao(); if(!p) return;
  await imagensProntas(p);
  window.print();
}
async function avRegistrarWa(){
  const st = S.est; if(!st) return;
  if(st.sujo) await salvarEstudo({silencioso:true});
  const l = avLeadEst(); if(!l) return;
  const up = {}, hist = [{tipo:"WhatsApp", texto:"Resumo do estudo de mercado enviado ao proprietário."}];
  aposContato(l, up, hist);
  salvarLead(l._id, up, hist);
}
function avAddDaCarteira(id){
  const st = S.est, i = imovelPorId(id); if(!st || !i) return;
  const fechado = S.leads.find(l=>l.imovelId===id && l.etapa==="fechado" && Number(l.valorNegocio));
  st.e.comps.push({id:avNovoId(), desc:`${i.codigo} · ${i.titulo}`, bairro:i.bairro||"", area:avAreaImovel(i, st.e), valor:fechado ? Number(fechado.valorNegocio) : (i.preco||0),
    tipo:(i.status==="vendido" || fechado) ? "Vendido" : "Oferta", fonte:fechado ? "Venda fechada pela Monfernatti" : "Carteira Monfernatti", imovelId:id});
  st.sujo = true; avPintarForm(); avPrevia();
}

/* ---------- cliques que começam com "av-" (chamados pelo crm.js) ---------- */
async function acaoAv(nome, d, el){
  const st = S.est;
  switch(nome){
    case "av-estudo": abrirEstudo({lead:d.lead, imovel:d.imovel}); return;
    case "av-abrir": abrirEstudo({lead:d.lead, imovel:d.imovel, est:d.est}); return;
    case "av-copiar": { const link = location.origin + "/#avaliar";
      try{ await navigator.clipboard.writeText(link); toast(`Link copiado: <b>${esc(link)}</b>`); }catch(e){ toast(`Link da página: <b>${esc(link)}</b>`, null, 12000); } return; }
  }
  if(!st) return;
  switch(nome){
    case "av-fechar":
      if(st.sujo){
        const ok = await salvarEstudo({silencioso:true});
        if(!ok && st.alvo.tipo==="novo" && el.dataset.ok!=="1"){ el.dataset.ok = "1"; el.textContent = "Sair sem salvar"; toast("Informe o nome e o celular do proprietário para salvar, ou toque de novo em Voltar para sair sem salvar."); return; }
      }
      fecharEstudo(); return;
    case "av-modo": { const c = $("#av-corpo"); c.classList.toggle("modo-form", d.v==="form"); c.classList.toggle("modo-prev", d.v==="prev");
      el.parentElement.querySelectorAll("button").forEach(b=>b.classList.toggle("on", b===el)); if(d.v==="prev") avPrevia(); return; }
    case "av-salvar": salvarEstudo(); return;
    case "av-imprimir": imprimirEstudo(); return;
    case "av-wa": avRegistrarWa(); return;
    case "av-comp-add": { const c = {id:avNovoId(), tipo:"Oferta", bairro:st.e.imovel.bairro||""}; st.e.comps.push(c); st.sujo = true; avPintarForm(); avPrevia();
      const x = document.getElementById(`ac-${c.id}-desc`); if(x){ x.scrollIntoView({block:"center"}); x.focus({preventScroll:true}); } return; }
    case "av-comp-rm": st.e.comps = st.e.comps.filter(c=>c.id!==d.c); st.sujo = true; avPintarForm(); avPrevia(); return;
    case "av-picker": st.picker = !st.picker; avPintarForm(); if(st.picker){ const q = $("#ae-pq"); if(q){ q.scrollIntoView({block:"center"}); q.focus({preventScroll:true}); } } return;
    case "av-comp-imovel": avAddDaCarteira(d.imovel); return;
    case "av-usar": { const c = st.e.comps.find(x=>x.id===d.c); if(c){ c.usar = d.v!=="0"; c.forcar = d.v==="f"; st.sujo = true; avAtualizar(); } return; }
    case "av-recalc": st.e.final = null; st.sujo = true; avAtualizar(); return;
    case "av-frase": { const t = $("#ae-parecer"), fr = AV_FRASES[+d.v]; if(t && fr){ t.value = (t.value.trim() ? t.value.trim() + " " : "") + fr.t; st.e.parecer = t.value; st.sujo = true; avAtualizar(); } return; }
  }
}
