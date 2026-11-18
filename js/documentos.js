/* Documentos do CRM: ficha do imóvel, folder de vitrine, autorização de venda, termo de visita,
   retirada de chaves, proposta de compra e recibo de comissão. Saem preenchidos com os dados do cliente,
   do imóvel, do proprietário e do corretor; o que faltar fica em branco para completar à mão.
   O gestor pode editar os textos e criar modelos próprios (tabela "modelos" no Supabase).
   Carregado depois de crm.js e antes do script principal do index.html: aqui só há definições. */

const EMPRESA_PADRAO = {nome:"Monfernatti Imóveis", documento:"", endereco:"Rua dos Bandeirantes, 315, Sala 02, Centro", cidade:"Cornélio Procópio", uf:"PR",
  telefone:"(43) 99977-9003", email:"monfernattiimoveis@gmail.com", site:"monfernattiimoveis.com.br", instagram:"@monfernattiimoveis"};
const ESTADOS_CIVIS = ["solteiro(a)","casado(a)","em união estável","divorciado(a)","separado(a) judicialmente","viúvo(a)"];
const GRUPOS_DOC = [["negocio","Negócio"],["cliente","Cliente"],["proprietario","Proprietário"],["imovel","Imóvel"],["corretor","Corretor"],["empresa","Imobiliária"]];

/* Campos que os modelos podem usar. lead/priv/cor/emp dizem onde o valor fica guardado. */
const CAMPOS_DOC = {
  "cliente.nome":{r:"Nome completo", lead:"nome"},
  "cliente.cpf":{r:"CPF", lead:"cpf", cpf:1},
  "cliente.rg":{r:"RG", lead:"rg"},
  "cliente.nacionalidade":{r:"Nacionalidade", lead:"nacionalidade", padrao:"brasileiro(a)"},
  "cliente.estado_civil":{r:"Estado civil", lead:"estadoCivil", tipo:"opcoes", ops:ESTADOS_CIVIS},
  "cliente.profissao":{r:"Profissão", lead:"profissao"},
  "cliente.endereco":{r:"Endereço completo", lead:"endereco", dica:"Rua, número, bairro, cidade/UF"},
  "cliente.celular":{r:"Celular", ler:c=>c.lead && fmtCel(c.lead.celular)},
  "cliente.email":{r:"E-mail", lead:"email", opcional:1},
  "proprietario.nome":{r:"Nome completo", priv:"proprietario"},
  "proprietario.cpf":{r:"CPF", priv:"proprietarioCpf", cpf:1},
  "proprietario.rg":{r:"RG", priv:"proprietarioRg"},
  "proprietario.nacionalidade":{r:"Nacionalidade", priv:"proprietarioNacionalidade", padrao:"brasileiro(a)"},
  "proprietario.estado_civil":{r:"Estado civil", priv:"proprietarioEstadoCivil", tipo:"opcoes", ops:ESTADOS_CIVIS},
  "proprietario.profissao":{r:"Profissão", priv:"proprietarioProfissao"},
  "proprietario.endereco":{r:"Endereço completo", priv:"proprietarioEndereco", dica:"Rua, número, bairro, cidade/UF"},
  "proprietario.celular":{r:"Celular", priv:"proprietarioCel", ler:c=>c.priv.proprietarioCel && fmtCel(c.priv.proprietarioCel)},
  "proprietario.email":{r:"E-mail", priv:"proprietarioEmail", opcional:1},
  "proprietario.conjuge":{r:"Cônjuge (nome e CPF), se casado", priv:"proprietarioConjuge", opcional:1},
  "imovel.codigo":{r:"Código", ler:c=>c.imovel && c.imovel.codigo},
  "imovel.titulo":{r:"Título do anúncio", ler:c=>c.imovel && c.imovel.titulo},
  "imovel.tipo":{r:"Tipo", ler:c=>c.imovel && c.imovel.categoria},
  "imovel.finalidade":{r:"Finalidade", ler:c=>c.imovel && (c.imovel.finalidade==="aluguel" ? "locação" : "venda")},
  "imovel.preco":{r:"Valor anunciado", tipo:"dinheiro", ler:c=>c.imovel && c.imovel.preco},
  "imovel.endereco":{r:"Endereço (rua e número)", priv:"endereco", dica:"Não aparece no site"},
  "imovel.bairro":{r:"Bairro", ler:c=>c.imovel && c.imovel.bairro},
  "imovel.cidade":{r:"Cidade", ler:c=>c.imovel && c.imovel.cidade},
  "imovel.uf":{r:"UF", ler:c=>c.imovel && c.imovel.uf},
  "imovel.area_total":{r:"Área total (m²)", ler:c=>c.imovel && numTxt(c.imovel.areaTotal)},
  "imovel.area_construida":{r:"Área construída (m²)", ler:c=>c.imovel && numTxt(c.imovel.areaConstruida)},
  "imovel.quartos":{r:"Quartos", ler:c=>c.imovel && numTxt(c.imovel.quartos)},
  "imovel.suites":{r:"Suítes", ler:c=>c.imovel && numTxt(c.imovel.suites)},
  "imovel.banheiros":{r:"Banheiros", ler:c=>c.imovel && numTxt(c.imovel.banheiros)},
  "imovel.vagas":{r:"Vagas", ler:c=>c.imovel && numTxt(c.imovel.vagas)},
  "imovel.matricula":{r:"Matrícula nº", priv:"matricula"},
  "imovel.cartorio":{r:"Cartório de registro", priv:"cartorio", padrao:"Registro de Imóveis de Cornélio Procópio/PR"},
  "imovel.inscricao":{r:"Inscrição imobiliária (IPTU)", priv:"inscricaoIptu", opcional:1},
  "imovel.link":{r:"Link no site", ler:c=>c.imovel && linkImovel(c.imovel)},
  "imovel.descricao":{r:"Descrição", tipo:"area", ler:c=>c.imovel && c.imovel.descricao},
  "corretor.nome":{r:"Nome", cor:"nome"},
  "corretor.creci":{r:"CRECI", cor:"creci"},
  "corretor.cpf":{r:"CPF", cor:"cpf", cpf:1},
  "corretor.celular":{r:"Celular", ler:c=>fmtCel(String(c.corretor.whatsapp||"").replace(/^55/,""))},
  "corretor.email":{r:"E-mail", cor:"email"},
  "corretor.titulos":{r:"Títulos", cor:"titulos", opcional:1},
  "empresa.nome":{r:"Nome", emp:"nome"},
  "empresa.documento":{r:"CPF ou CNPJ", emp:"documento", cpf:1},
  "empresa.endereco":{r:"Endereço", emp:"endereco"},
  "empresa.cidade":{r:"Cidade", emp:"cidade"},
  "empresa.uf":{r:"UF", emp:"uf"},
  "empresa.telefone":{r:"Telefone", emp:"telefone"},
  "empresa.email":{r:"E-mail", emp:"email"},
  "empresa.site":{r:"Site", emp:"site"},
  "negocio.comissao":{r:"Comissão (%)", tipo:"numero", priv:"comissaoPct", padrao:"6"},
  "negocio.prazo":{r:"Prazo da autorização (dias)", tipo:"numero", padrao:"90"},
  "negocio.exclusividade":{r:"Exclusividade", tipo:"opcoes", ops:["com exclusividade","sem exclusividade"], ler:c=>c.priv && c.priv.autorizacaoTipo==="simples" ? "sem exclusividade" : "com exclusividade"},
  "negocio.condicoes_venda":{r:"Formas de pagamento aceitas", tipo:"area", ler:c=>condicoesImovel(c.imovel)},
  "negocio.placa":{r:"Pode colocar placa?", tipo:"opcoes", ops:["sim","não"], padrao:"sim"},
  "negocio.data_visita":{r:"Data da visita", tipo:"data", ler:c=>dataUltimaVisita(c)},
  "negocio.qtd_chaves":{r:"Quantidade de chaves", tipo:"numero", padrao:"1"},
  "negocio.finalidade_chaves":{r:"Para que", tipo:"opcoes", ops:["visitar o imóvel","fazer vistoria","fazer medição ou orçamento de obra","avaliar o imóvel"], padrao:"visitar o imóvel"},
  "negocio.devolucao":{r:"Devolver até", tipo:"datahora", ler:()=>{ const d = new Date(); d.setDate(d.getDate()+1); d.setHours(18,0,0,0); return toLocalInput(d.toISOString()); }},
  "negocio.valor_proposta":{r:"Valor oferecido (R$)", tipo:"dinheiro"},
  "negocio.forma_pagamento":{r:"Forma de pagamento", tipo:"area", dica:"Ex.: sinal de R$ 20.000 na assinatura do compromisso e o restante por financiamento bancário"},
  "negocio.condicoes":{r:"Outras condições", tipo:"area", opcional:1, dica:"Ex.: entrega das chaves em 60 dias; imóvel com os móveis da cozinha"},
  "negocio.validade_proposta":{r:"Proposta válida até", tipo:"data", ler:()=>{ const d = new Date(); d.setDate(d.getDate()+5); return d.toISOString().slice(0,10); }},
  "negocio.valor_venda":{r:"Valor da venda (R$)", tipo:"dinheiro", ler:c=>(c.lead && Number(c.lead.valorNegocio)) || (c.imovel && c.imovel.preco)},
  "negocio.valor_comissao":{r:"Valor da comissão (R$)", tipo:"dinheiro", ler:c=>{ if(c.lead && Number(c.lead.comissaoValor)) return c.lead.comissaoValor; const v = (c.lead && Number(c.lead.valorNegocio)) || (c.imovel && c.imovel.preco); const p = numBR(c.priv && c.priv.comissaoPct); return v && p ? Math.round(v*p)/100 : ""; }},
  "negocio.forma_recebimento":{r:"Pago por", tipo:"opcoes", ops:["PIX","transferência bancária","dinheiro","cheque","boleto"], padrao:"PIX"}
};

/* ---------- Textos dos modelos (redação própria; revisar com advogado antes de usar) ---------- */
const TXT_AUTORIZACAO = `# Autorização para venda de imóvel

**CONTRATANTE (proprietário):** {{proprietario.nome}}, {{proprietario.nacionalidade}}, {{proprietario.estado_civil}}, {{proprietario.profissao}}, CPF {{proprietario.cpf}}, RG {{proprietario.rg}}, residente em {{proprietario.endereco}}, telefone {{proprietario.celular}}.

**CONTRATADO (corretor):** {{corretor.nome}}, corretor de imóveis inscrito no CRECI sob o nº {{corretor.creci}}, atuando como {{empresa.nome}}, com escritório em {{empresa.endereco}}, {{empresa.cidade}}/{{empresa.uf}}.

O CONTRATANTE autoriza o CONTRATADO a intermediar a venda do imóvel descrito abaixo, nas condições desta autorização, que segue os artigos 722 a 729 do Código Civil.

## 1. O imóvel
{{imovel.tipo}} (código {{imovel.codigo}}), situado em {{imovel.endereco}}, bairro {{imovel.bairro}}, {{imovel.cidade}}/{{imovel.uf}}, com área total de {{imovel.area_total}} m² e área construída de {{imovel.area_construida}} m², registrado na matrícula nº {{imovel.matricula}} do {{imovel.cartorio}}.

## 2. Valor e condições
O valor pedido pela venda é de **{{imovel.preco}}** ({{imovel.preco|extenso}}). Formas de pagamento aceitas: {{negocio.condicoes_venda}}. Toda proposta recebida será apresentada ao CONTRATANTE, que decide se aceita ou não.

## 3. Prazo e exclusividade
Esta autorização vale por {{negocio.prazo}} ({{negocio.prazo|extenso}}) dias a partir da assinatura e é dada **{{negocio.exclusividade}}**. Quando dada com exclusividade, a remuneração será devida ao CONTRATADO mesmo que a venda seja feita, dentro do prazo, diretamente pelo CONTRATANTE ou por outra pessoa, salvo se comprovada inércia ou ociosidade do CONTRATADO (art. 726 do Código Civil).

## 4. Remuneração do corretor
Concluída a venda, o CONTRATANTE pagará ao CONTRATADO {{negocio.comissao}}% ({{negocio.comissao|extenso}} por cento) sobre o valor final do negócio, no recebimento do sinal ou na assinatura do compromisso de compra e venda, o que acontecer primeiro. A remuneração é devida uma vez alcançado o acordo entre as partes, ainda que o negócio não se concretize por arrependimento delas (art. 725 do Código Civil), e também se a venda for feita depois do prazo a comprador apresentado pelo CONTRATADO durante a vigência desta autorização (art. 727 do Código Civil).

## 5. O que o corretor se compromete a fazer
- Divulgar o imóvel no site, nas redes sociais e nos meios que considerar adequados;
- Acompanhar os interessados nas visitas e levar ao CONTRATANTE todas as propostas recebidas;
- Prestar contas do andamento do trabalho sempre que solicitado, agindo com diligência e prudência (art. 723 do Código Civil).

## 6. O que o proprietário se compromete a fazer
- Informar ao CONTRATADO qualquer dívida, ônus, ação judicial ou pendência que envolva o imóvel;
- Fornecer os documentos necessários à venda e permitir visitas em horários combinados;
- Avisar o CONTRATADO sobre qualquer interessado que o procure diretamente.

O CONTRATANTE autoriza fotografar o imóvel e divulgar as imagens. Colocação de placa no local: {{negocio.placa}}.

## 7. Foro
Fica eleito o foro da comarca de {{empresa.cidade}}/{{empresa.uf}} para resolver qualquer questão relativa a esta autorização.

[local e data]

[assinatura: {{proprietario.nome}} | Proprietário (CONTRATANTE)]
[assinatura: {{proprietario.conjuge}} | Cônjuge, se casado]
[assinatura: {{corretor.nome}} | Corretor (CONTRATADO), CRECI {{corretor.creci}}]

[assinatura: | Testemunha 1: nome e CPF]
[assinatura: | Testemunha 2: nome e CPF]`;

const TXT_VISITA = `# Termo de visita

Eu, {{cliente.nome}}, {{cliente.nacionalidade}}, {{cliente.estado_civil}}, CPF {{cliente.cpf}}, RG {{cliente.rg}}, residente em {{cliente.endereco}}, telefone {{cliente.celular}}, declaro que em {{negocio.data_visita}} visitei, acompanhado(a) do corretor {{corretor.nome}} (CRECI {{corretor.creci}}), de {{empresa.nome}}, o(s) imóvel(is) abaixo, que me foi(ram) apresentado(s) pela imobiliária:

[imoveis]

Declaro que conheci esse(s) imóvel(is) por intermédio de {{empresa.nome}}. Caso eu venha a comprá-lo(s) ou alugá-lo(s) nos próximos 12 (doze) meses, reconheço que o negócio terá resultado do trabalho de intermediação do corretor, nos termos dos artigos 725 e 727 do Código Civil, e comprometo-me a conduzir propostas e negociações por intermédio dele.

Se o negócio for feito diretamente com o proprietário ou por meio de terceiros, sem a participação do corretor, assumo o pagamento da comissão de corretagem que deixar de ser paga a ele.

[local e data]

[assinatura: {{cliente.nome}} | Cliente]
[assinatura: {{corretor.nome}} | Corretor, CRECI {{corretor.creci}}]`;

const TXT_CHAVES = `# Termo de retirada de chaves

Eu, {{cliente.nome}}, CPF {{cliente.cpf}}, RG {{cliente.rg}}, telefone {{cliente.celular}}, recebi de {{empresa.nome}}, nesta data, {{negocio.qtd_chaves}} ({{negocio.qtd_chaves|extenso}}) chave(s) do imóvel abaixo, para {{negocio.finalidade_chaves}}:

**{{imovel.tipo}}, código {{imovel.codigo}}**: {{imovel.endereco}}, bairro {{imovel.bairro}}, {{imovel.cidade}}/{{imovel.uf}}.

Comprometo-me a:
- devolver as chaves até {{negocio.devolucao}}, no escritório da imobiliária ({{empresa.endereco}});
- não fazer cópias nem entregar as chaves a outra pessoa;
- deixar o imóvel fechado e nas mesmas condições em que o encontrei, respondendo por danos causados enquanto as chaves estiverem comigo.

Retirada em {{data.curta}}, às ____:____.

[assinatura: {{cliente.nome}} | Quem retirou as chaves]
[assinatura: {{corretor.nome}} | Corretor responsável]

---

## Devolução
Chaves devolvidas em ____/____/________, às ____:____.
[ ] Tudo em ordem.   [ ] Com observações: ______________________________________

[assinatura: | Recebido por]`;

const TXT_PROPOSTA = `# Proposta de compra de imóvel

**PROPONENTE:** {{cliente.nome}}, {{cliente.nacionalidade}}, {{cliente.estado_civil}}, {{cliente.profissao}}, CPF {{cliente.cpf}}, RG {{cliente.rg}}, residente em {{cliente.endereco}}, telefone {{cliente.celular}}, e-mail {{cliente.email}}.

**IMÓVEL:** {{imovel.tipo}}, código {{imovel.codigo}}, situado em {{imovel.endereco}}, bairro {{imovel.bairro}}, {{imovel.cidade}}/{{imovel.uf}}, matrícula nº {{imovel.matricula}}, anunciado por {{imovel.preco}}.

**PROPRIETÁRIO:** {{proprietario.nome}}.

Por intermédio do corretor {{corretor.nome}} (CRECI {{corretor.creci}}), apresento proposta para comprar o imóvel acima nas condições a seguir.

## Valor oferecido
**{{negocio.valor_proposta}}** ({{negocio.valor_proposta|extenso}}).

## Forma de pagamento
{{negocio.forma_pagamento}}

## Outras condições
{{negocio.condicoes}}

Esta proposta vale até {{negocio.validade_proposta}}. Se for aceita, as partes assinarão o compromisso de compra e venda, com o pagamento do sinal combinado. A comissão de corretagem é paga pelo proprietário, salvo acordo diferente por escrito.

Declaro que as informações acima são verdadeiras.

[local e data]

[assinatura: {{cliente.nome}} | Proponente]
[assinatura: {{corretor.nome}} | Corretor, CRECI {{corretor.creci}}]

---

## Resposta do proprietário
[ ] Aceito a proposta nas condições acima.
[ ] Não aceito a proposta.
[ ] Faço a contraproposta: ____________________________________________

[assinatura: {{proprietario.nome}} | Proprietário · Data: ____/____/________]`;

const TXT_RECIBO = `# Recibo de comissão de corretagem

Recebi de {{proprietario.nome}}, CPF {{proprietario.cpf}}, a importância de **{{negocio.valor_comissao}}** ({{negocio.valor_comissao|extenso}}), paga por {{negocio.forma_recebimento}}, referente à comissão de corretagem pela intermediação da venda do imóvel {{imovel.tipo}}, código {{imovel.codigo}}, situado em {{imovel.endereco}}, bairro {{imovel.bairro}}, {{imovel.cidade}}/{{imovel.uf}}, ao comprador {{cliente.nome}}, pelo valor de {{negocio.valor_venda}}.

Pelo valor recebido, dou plena quitação da comissão referente a este negócio.

[local e data]

[assinatura: {{corretor.nome}} | Corretor, CRECI {{corretor.creci}} · CPF {{corretor.cpf}}]`;

const MODELOS_PADRAO = [
  {id:"ficha", nome:"Ficha do imóvel", desc:"Fotos, valor e características para entregar ao cliente ou mandar em PDF.", tipo:"layout", alvo:["imovel"], clienteOpcional:1},
  {id:"folder", nome:"Folder de vitrine", desc:"Cartaz A4 com foto grande, valor e QR code para a vitrine ou a placa.", tipo:"layout", alvo:["imovel"]},
  {id:"autorizacao", nome:"Autorização de venda", desc:"Contrato de intermediação com o proprietário: valor, prazo, exclusividade e comissão.", tipo:"texto", texto:TXT_AUTORIZACAO},
  {id:"visita", nome:"Termo de visita", desc:"O cliente confirma os imóveis que visitou com você. Protege sua comissão.", tipo:"texto", texto:TXT_VISITA},
  {id:"chaves", nome:"Retirada de chaves", desc:"Quem levou a chave, para quê e até quando devolve. Com espaço para a devolução.", tipo:"texto", texto:TXT_CHAVES},
  {id:"proposta", nome:"Proposta de compra", desc:"Valor oferecido, forma de pagamento e espaço para a resposta do proprietário.", tipo:"texto", texto:TXT_PROPOSTA},
  {id:"recibo", nome:"Recibo de comissão", desc:"Recibo da comissão recebida, com valor por extenso.", tipo:"texto", texto:TXT_RECIBO}
];

/* ---------- utilidades ---------- */
const numTxt = v => v==null || v==="" ? "" : String(v).replace(".",",");
const fmtCpf = v => { const d = soDig(v); if(d.length===11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4"); if(d.length===14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,"$1.$2.$3/$4-$5"); return String(v||""); };
const moedaDoc = n => "R$ " + Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
const dataLonga = s => s ? dLocal(String(s).slice(0,10)).toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"}) : "";
const dataNum = s => s ? dLocal(String(s).slice(0,10)).toLocaleDateString("pt-BR") : "";
const logoDoc = escuro => ((document.querySelector(escuro===false ? ".logo .l-claro" : ".logo .l-escuro")||{}).src) || "";
function empresaDoc(){ return {...EMPRESA_PADRAO, ...(((S.modelosDb||{})._empresa)||{})}; }
function corretorDoc(id){ return {...corretorDe(id||meuId()), ...(((S.modelosDb||{})["_corretor-"+(id||meuId())])||{})}; }
function condicoesImovel(i){
  if(!i) return "";
  const l = ["à vista", i.aceitaFinanciamento && "financiamento bancário", i.aceitaFGTS && "uso do FGTS", i.aceitaPermuta && "permuta (a negociar)"].filter(Boolean);
  return l.length>1 ? l.slice(0,-1).join(", ")+" ou "+l[l.length-1] : l[0];
}
/* Visitas do cliente na última semana ou na próxima, da mais próxima de agora para a mais distante. */
function visitasPerto(l){
  const agora = Date.now();
  return (l && l.visitas || []).filter(x=>x.status!=="cancelada" && Math.abs(new Date(x.quando)-agora)<=7*DIA)
    .sort((a,b)=>Math.abs(new Date(a.quando)-agora)-Math.abs(new Date(b.quando)-agora));
}
function dataUltimaVisita(c){
  const v = visitasPerto(c.lead)[0];
  return toLocalInput(v ? v.quando : hoje()).slice(0,10);
}

/* Número por extenso (pt-BR). */
function extensoInt(n){
  n = Math.floor(Math.abs(n));
  const U = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
  const D = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
  const C = ["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
  const ate999 = x => { if(x===100) return "cem"; const c = Math.floor(x/100), r = x%100, p = []; if(c) p.push(C[c]); if(r) p.push(r<20 ? U[r] : D[Math.floor(r/10)] + (r%10 ? " e "+U[r%10] : "")); return p.join(" e "); };
  if(n===0) return "zero";
  const classes = [["",""],["mil","mil"],["milhão","milhões"],["bilhão","bilhões"],["trilhão","trilhões"]];
  const g = []; let x = n; while(x>0){ g.push(x%1000); x = Math.floor(x/1000); }
  const partes = [];
  for(let k=g.length-1;k>=0;k--){ if(!g[k]) continue; partes.push({k, v:g[k], t: k===1 && g[k]===1 ? "mil" : ate999(g[k]) + (k ? " " + classes[k][g[k]===1?0:1] : "")}); }
  return partes.map((p,i)=>{ if(!i) return p.t; const ult = i===partes.length-1; return (ult && (p.v<100 || p.v%100===0) ? " e " : p.k===0 ? " " : ", ") + p.t; }).join("");
}
function numExtenso(v){
  const s = String(v).trim().replace(/\./g,"").replace(",","."); const n = Number(s); if(!isFinite(n) || s==="") return String(v);
  const [i, d] = s.split("."); let t = extensoInt(Number(i));
  if(d && Number(d)) t += " vírgula " + extensoInt(Number(d));
  return t;
}
function reaisExtenso(n){
  n = Math.round(Number(n||0)*100)/100;
  const i = Math.floor(n), c = Math.round((n - i)*100);
  let t = "";
  if(i){ t = extensoInt(i) + (i % 1000000 === 0 ? " de" : "") + (i===1 ? " real" : " reais"); }
  if(c){ t += (t ? " e " : "") + extensoInt(c) + (c===1 ? " centavo" : " centavos"); }
  return t || "zero real";
}

/* ---------- modelos (padrão + editados/criados pelo gestor) ---------- */
function listaModelos(){
  const db = S.modelosDb || {};
  const base = MODELOS_PADRAO.map(m=>{ const o = db[m.id]; return o && m.tipo==="texto" ? {...m, nome:o.nome||m.nome, desc:o.desc??m.desc, texto:o.texto||m.texto, editado:true} : m; });
  const proprios = Object.entries(db).filter(([k,v])=>!k.startsWith("_") && !MODELOS_PADRAO.some(m=>m.id===k) && v && v.texto)
    .map(([k,v])=>({id:k, nome:v.nome||"Modelo sem nome", desc:v.desc||"", tipo:"texto", texto:v.texto, proprio:true})).sort((a,b)=>a.nome.localeCompare(b.nome));
  return [...base, ...proprios];
}
const modeloPorId = id => listaModelos().find(m=>m.id===id);
const RX_CAMPO = /\{\{\s*([\w.]+)\s*(?:\|\s*(\w+))?\s*\}\}/g;
function chavesModelo(m){
  if(m.tipo==="layout") return m.clienteOpcional ? ["cliente.nome"] : [];
  const s = new Set(); String(m.texto||"").replace(RX_CAMPO, (_,k)=>{ if(!/^data(\.curta)?$/.test(k)) s.add(k); return ""; }); return [...s];
}
function alvosModelo(m){
  if(m.alvo) return {imovel:true, cliente:!!m.clienteOpcional, clienteOpcional:!!m.clienteOpcional, varios:false};
  const ks = chavesModelo(m), t = String(m.texto||"");
  const varios = /^\s*\[im[oó]veis\]\s*$/im.test(t);
  return {imovel: varios || ks.some(k=>/^(imovel|proprietario)\./.test(k)) || ks.some(k=>/^negocio\.(comissao|prazo|exclusividade|condicoes_venda|valor_venda|valor_comissao)$/.test(k)),
    cliente: ks.some(k=>k.startsWith("cliente.")), clienteOpcional:false, varios};
}
function campoDoc(k){
  if(CAMPOS_DOC[k]) return CAMPOS_DOC[k];
  const ult = k.split(".").pop().replace(/_/g," ");
  const r = ult.charAt(0).toUpperCase() + ult.slice(1);
  const tipo = /valor|pre[cç]o|sinal|entrada/i.test(ult) ? "dinheiro" : /^data|vencimento|prazo final/i.test(ult) ? "data" : /obs|condi|descri|forma/i.test(ult) ? "area" : "texto";
  return {r, tipo, livre:true};
}
const grupoDoc = k => { const g = k.split(".")[0]; return GRUPOS_DOC.some(x=>x[0]===g) ? g : "negocio"; };

/* ---------- contexto e valores ---------- */
function ctxDoc(){
  const d = S.doc;
  const lead = d.leadId ? S.leads.find(x=>x._id===d.leadId) : null;
  const imovel = d.imovelId ? imovelPorId(d.imovelId) : null;
  return {lead, imovel, priv:(imovel && S.privado[imovel._id]) || {}, empresa:empresaDoc(),
    corretor:corretorDoc((lead && lead.corretorId) || (imovel && imovel.corretorId) || meuId()),
    imoveis:(d.imoveisSel||[]).map(imovelPorId).filter(Boolean)};
}
function lerCampo(k, c){
  const f = campoDoc(k); let v;
  if(f.ler) v = f.ler(c);
  if((v==null || v==="") && f.lead && c.lead) v = c.lead[f.lead];
  if((v==null || v==="") && f.priv) v = c.priv[f.priv];
  if((v==null || v==="") && f.cor) v = c.corretor[f.cor];
  if((v==null || v==="") && f.emp) v = c.empresa[f.emp];
  if((v==null || v==="") && f.livre){ const g = grupoDoc(k), sub = k.slice(k.indexOf(".")+1);
    if(g==="cliente" && c.lead) v = (c.lead.docCampos||{})[sub];
    if((g==="proprietario" || g==="imovel")) v = (c.priv.docCampos||{})[k]; }
  if(v==null || v==="") v = f.padrao || "";
  if(f.tipo==="dinheiro" && v!=="" && typeof v==="number") v = v.toLocaleString("pt-BR",{maximumFractionDigits:2});
  if(f.cpf) v = fmtCpf(v);
  return String(v);
}
function carregarValoresDoc(){
  const d = S.doc, c = ctxDoc();
  for(const k of chavesModelo(d.m)){ if(grupoDoc(k)==="negocio" && d.editados.has(k)) continue; d.V[k] = lerCampo(k, c); d.editados.delete(k); }
  if(!d.V.data) d.V.data = toLocalInput(hoje()).slice(0,10);
}
function valorDoc(k, f, V, opt={}){
  if(opt.rotulos){
    if(k==="data") return "[data por extenso]"; if(k==="data.curta") return "[data]";
    const c = campoDoc(k), g = grupoDoc(k), gn = g==="negocio" ? "" : " · " + GRUPOS_DOC.find(x=>x[0]===g)[1].toLowerCase();
    return `[${c.r}${gn}${f==="extenso"?" por extenso":""}]`; }
  if(k==="data") return dataLonga(V.data);
  if(k==="data.curta") return dataNum(V.data);
  const c = campoDoc(k); let v = V[k];
  if(v==null || String(v).trim()==="") return "";
  v = String(v).trim();
  if(c.tipo==="dinheiro"){ const n = numBR(v); return f==="extenso" ? reaisExtenso(n) : moedaDoc(n); }
  if(c.tipo==="data") return f==="extenso" ? dataLonga(v) : dataNum(v);
  if(c.tipo==="datahora"){ const x = new Date(v); return isNaN(x) ? v : `${x.toLocaleDateString("pt-BR")} às ${x.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`; }
  if(f==="extenso") return numExtenso(v);
  if(f==="maiusculas") return v.toUpperCase();
  return v;
}
function faltandoDoc(){
  const d = S.doc; if(d.m.tipo==="layout") return [];
  return chavesModelo(d.m).filter(k=>!campoDoc(k).opcional && !String(d.V[k]||"").trim());
}

/* ---------- montagem do documento ---------- */
function inlineDoc(s, V, opt={}){
  let o = esc(s).replace(RX_CAMPO, (_, k, f)=>{
    const v = valorDoc(k, f, V, opt);
    if(v) return opt.word ? esc(v).replace(/\n/g,"<br>") : `<span class="${opt.rotulos?"dc-rot":"dc-v"}" data-k="${esc(k)}">${esc(v).replace(/\n/g,"<br>")}</span>`;
    if(opt.semBranco) return "";
    if(opt.word) return campoDoc(k).tipo==="area" ? "<br>______________________________________________________________<br>______________________________________________________________" : "____________________";
    return `<span class="dc-vazio${campoDoc(k).tipo==="area"?" area":""}${campoDoc(k).opcional?" opc":""}" data-k="${esc(k)}"></span>`;
  });
  o = o.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  o = opt.word ? o.replace(/\[ \]/g,"☐").replace(/\[x\]/gi,"☒") : o.replace(/\[ \]/g,'<span class="dc-cx"></span>').replace(/\[x\]/gi,'<span class="dc-cx on"></span>');
  return o;
}
function tabelaImoveisDoc(c, opt){
  const lin = c.imoveis.length ? c.imoveis.map(i=>{ const p = S.privado[i._id]||{}; return `<tr><td>${esc(i.codigo)}</td><td>${esc(i.categoria||"")}${i.titulo?"<br><small>"+esc(i.titulo)+"</small>":""}</td><td>${esc([p.endereco, i.bairro, i.cidade].filter(Boolean).join(", "))}</td><td>${i.preco?esc(moedaDoc(i.preco)):""}</td><td></td></tr>`; }).join("")
    : `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>`.repeat(3);
  return `<table class="dc-tab" ${opt.word?'border="1" cellpadding="5" style="border-collapse:collapse;width:100%"':""}><thead><tr><th>Código</th><th>Imóvel</th><th>Endereço</th><th>Valor</th><th>Visto do cliente</th></tr></thead><tbody>${lin}</tbody></table>`;
}
function renderTextoDoc(txt, V, c, opt={}){
  let html = "", par = [], lista = [], assin = [];
  const fl = (...q)=>{
    if(q.includes("p") && par.length){ html += `<p>${par.join("<br>")}</p>`; par = []; }
    if(q.includes("l") && lista.length){ html += `<ul>${lista.map(x=>`<li>${x}</li>`).join("")}</ul>`; lista = []; }
    if(q.includes("a") && assin.length){
      html += opt.word ? `<table style="width:100%;margin-top:28pt"><tr>${assin.map(a=>`<td style="text-align:center;vertical-align:top;padding:18pt 10pt 0">_______________________________<br>${a[0]?"<b>"+a[0]+"</b><br>":""}<small>${a[1]}</small></td>`).join("")}</tr></table>`
        : `<div class="dc-assin n${Math.min(assin.length,3)}">${assin.map(a=>`<div class="dc-ass"><span class="dc-linha"></span>${a[0]?`<b>${a[0]}</b>`:""}<small>${a[1]}</small></div>`).join("")}</div>`;
      assin = []; }
  };
  const todos = ()=>fl("p","l","a");
  for(const bruta of String(txt||"").replace(/\r/g,"").split("\n")){
    const s = bruta.trim(); let m;
    if(!s){ todos(); continue; }
    if((m = s.match(/^\[assinatura:?\s*([^\]]*)\]$/i))){ fl("p","l"); const [n, p=""] = m[1].split("|"); assin.push([inlineDoc(n.trim(), V, {...opt, semBranco:true}), inlineDoc(p.trim(), V, {...opt, semBranco:true})]); continue; }
    if(/^#\s+/.test(s)){ todos(); html += `<h1>${inlineDoc(s.replace(/^#\s+/,""), V, opt)}</h1>`; continue; }
    if(/^##\s+/.test(s)){ todos(); html += `<h2>${inlineDoc(s.replace(/^##\s+/,""), V, opt)}</h2>`; continue; }
    if(/^-{3,}$/.test(s)){ todos(); html += `<hr class="dc-corte">`; continue; }
    if(/^\[quebra\]$/i.test(s)){ todos(); html += `<div class="dc-quebra"></div>`; continue; }
    if(/^\[local e data\]$/i.test(s)){ todos(); html += `<p class="dc-local">${opt.rotulos?"[Cidade], [data por extenso].":esc(`${(V["empresa.cidade"]||empresaDoc().cidade)}, ${dataLonga(V.data)}.`)}</p>`; continue; }
    if(/^\[im[oó]veis\]$/i.test(s)){ todos(); html += tabelaImoveisDoc(c, opt); continue; }
    if(/^[-•]\s+/.test(s)){ fl("p","a"); lista.push(inlineDoc(s.replace(/^[-•]\s+/,""), V, opt)); continue; }
    fl("l","a"); par.push(inlineDoc(s, V, opt));
  }
  todos();
  return html;
}
function timbreDoc(c){
  const e = c.empresa, logo = logoDoc();
  return `<header class="dc-timbre">${logo?`<img src="${esc(logo)}" alt="${esc(e.nome)}">`:`<b class="dc-marca">${esc(e.nome)}</b>`}
    <div>${esc(e.nome)}${c.corretor.creci?` · CRECI ${esc(c.corretor.creci)}`:""}<br>${esc(e.endereco)}, ${esc(e.cidade)}/${esc(e.uf)}<br>${esc(e.telefone)} · ${esc(e.email)}${e.site?" · "+esc(e.site):""}</div></header>`;
}
function qrDoc(url, px=4){
  if(!window.qrcode) return `<span class="dc-qr-esp"></span>`;
  try{ const q = window.qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({cellSize:px, margin:0, scalable:true}); }catch(e){ return ""; }
}
let qrCarregando = null;
function carregarQr(){
  if(window.qrcode) return Promise.resolve();
  return qrCarregando || (qrCarregando = new Promise(res=>{ const s = document.createElement("script"); s.src = "/js/vendor/qrcode.js"; s.onload = res; s.onerror = ()=>{ qrCarregando = null; res(); }; document.head.appendChild(s); }));
}
function specsImovel(i){
  return [["Tipo", i.categoria], ["Área total", i.areaTotal && numTxt(i.areaTotal)+" m²"], ["Área construída", i.areaConstruida && numTxt(i.areaConstruida)+" m²"],
    ["Quartos", i.quartos], ["Suítes", i.suites], ["Banheiros", i.banheiros], ["Vagas", i.vagas]].filter(x=>x[1]!=null && x[1]!=="" && x[1]!==0);
}
function fichaDoc(c, V, o){
  const i = c.imovel; if(!i) return `<p class="dc-nada">Escolha o imóvel ao lado.</p>`;
  const f = (i.fotos||[]).slice(0,5), e = c.empresa, cor = c.corretor, end = o.endereco && c.priv.endereco;
  const cond = [i.aceitaFinanciamento && "Aceita financiamento", i.aceitaFGTS && "Aceita FGTS", i.aceitaPermuta && "Aceita permuta"].filter(Boolean);
  return `${timbreDoc(c)}
  <div class="fi-tit"><div><span class="fi-cod">Código ${esc(i.codigo)} · ${i.finalidade==="aluguel"?"Para alugar":"À venda"}</span><h1>${esc(i.titulo)}</h1>
    <p>${esc([end, i.bairro, [i.cidade, i.uf].filter(Boolean).join("/")].filter(Boolean).join(" · "))}</p></div>
    ${o.preco?`<div class="fi-preco">${esc(brl(i.preco))}${i.finalidade==="aluguel"?"<small>/mês</small>":""}</div>`:""}</div>
  ${f.length?`<div class="fi-fotos n${f.length}"><img src="${esc(f[0])}" alt="">${f.length>1?`<div style="grid-template-columns:repeat(${Math.max(3,f.length-1)},1fr)">${f.slice(1).map(u=>`<img src="${esc(u)}" alt="">`).join("")}</div>`:""}</div>`:""}
  <div class="fi-specs">${specsImovel(i).map(([r,v])=>`<div><small>${esc(r)}</small><b>${esc(v)}</b></div>`).join("")}</div>
  ${cond.length?`<div class="fi-cond">${cond.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}
  ${i.descricao?`<h2>Descrição</h2><p class="fi-desc">${esc(i.descricao).replace(/\n+/g,"<br>")}</p>`:""}
  ${(i.caracteristicas||[]).length?`<h2>Características</h2><ul class="fi-car">${i.caracteristicas.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
  <footer class="fi-rod"><div><small>Fale com o corretor</small><b>${esc(cor.nome)}</b><span>CRECI ${esc(cor.creci||"")}${cor.whatsapp?` · WhatsApp ${esc(fmtCel(String(cor.whatsapp).replace(/^55/,"")))}`:""}</span><span>${esc(cor.email||e.email)}</span>
    ${V["cliente.nome"]?`<em>Ficha preparada para ${esc(V["cliente.nome"])} em ${esc(dataNum(V.data))}.</em>`:""}</div>
    ${o.qr?`<div class="fi-qr">${qrDoc(linkImovel(i))}<small>Todas as fotos e detalhes</small></div>`:""}</footer>`;
}
function folderDoc(c, V, o){
  const i = c.imovel; if(!i) return `<p class="dc-nada">Escolha o imóvel ao lado.</p>`;
  const e = c.empresa, cor = c.corretor, logo = logoDoc(false);
  const sp = [i.quartos && `${i.quartos} ${i.quartos==1?"quarto":"quartos"}`, i.suites && `${i.suites} ${i.suites==1?"suíte":"suítes"}`, i.banheiros && `${i.banheiros} ${i.banheiros==1?"banheiro":"banheiros"}`, i.vagas && `${i.vagas} ${i.vagas==1?"vaga":"vagas"}`,
    (i.areaConstruida||i.areaTotal) && `${numTxt(i.areaConstruida||i.areaTotal)} m²`].filter(Boolean);
  const fone = cor.whatsapp ? fmtCel(String(cor.whatsapp).replace(/^55/,"")) : e.telefone;
  return `<div class="fd">
    <div class="fd-faixa">${esc(o.faixa||"À venda")}</div>
    <div class="fd-foto">${(i.fotos||[])[0]?`<img src="${esc(i.fotos[0])}" alt="">`:""}</div>
    <div class="fd-info"><div class="fd-tit">${esc(i.titulo)}</div><div class="fd-local">${esc([i.bairro, i.cidade].filter(Boolean).join(" · "))}</div>
      ${sp.length?`<div class="fd-specs">${sp.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}
      ${o.preco&&i.preco?`<div class="fd-preco">${esc(brl(i.preco))}${i.finalidade==="aluguel"?"<small>/mês</small>":""}</div>`:""}</div>
    <div class="fd-rod"><div class="fd-qr">${qrDoc(linkImovel(i), 5)}</div>
      <div class="fd-cta"><small>Aponte a câmera para ver fotos e detalhes</small><b>${esc(fone)}</b><span>${esc(cor.nome)} · CRECI ${esc(cor.creci||"")}</span><span>Código ${esc(i.codigo)}</span></div>
      ${logo?`<img class="fd-logo" src="${esc(logo)}" alt="${esc(e.nome)}">`:`<b class="fd-logo">${esc(e.nome)}</b>`}</div>
  </div>`;
}
function htmlDoc(opt={}){
  const d = S.doc, c = ctxDoc();
  if(d.m.id==="ficha" && d.m.tipo==="layout") return fichaDoc(c, d.V, d.opc);
  if(d.m.id==="folder" && d.m.tipo==="layout") return folderDoc(c, d.V, d.opc);
  return (d.opc.timbrado && !opt.word ? timbreDoc(c) : "") + `<div class="dc-texto">${renderTextoDoc(d.m.texto, d.V, c, opt)}</div>`;
}

/* ---------- tela do gerador ---------- */
function imoveisDaVisita(l){
  const vs = visitasPerto(l).filter(x=>x.imovelId), dia = vs.length ? toLocalInput(vs[0].quando).slice(0,10) : "";
  const v = vs.filter(x=>toLocalInput(x.quando).slice(0,10)===dia).map(x=>x.imovelId);
  return [...new Set(v.length ? v : [l.imovelId].filter(Boolean))].filter(id=>imovelPorId(id));
}
function abrirDoc(mid, o={}){
  const m = modeloPorId(mid); if(!m){ toast("Modelo não encontrado."); return; }
  const origem = S.gav && S.gav.id ? {...S.gav} : null;
  fecharGaveta();
  const lead = o.lead ? S.leads.find(x=>x._id===o.lead) : null;
  const al = alvosModelo(m);
  let imovelId = o.imovel || (lead && (imoveisDaVisita(lead)[0] || lead.imovelId)) || "";
  if(al.imovel && !imovelId && imoveisF().length===1) imovelId = imoveisF()[0]._id;
  S.doc = {m, al, leadId:lead?lead._id:"", imovelId, imoveisSel:o.imoveis || (lead ? imoveisDaVisita(lead) : imovelId ? [imovelId] : []),
    V:{}, editados:new Set(), origem, registroId:o.registroId||"", registrado:false,
    opc:{timbrado:true, preco:true, qr:true, endereco:false, registrarAut:true,
      faixa: imovelId && imovelPorId(imovelId) ? (imovelPorId(imovelId).status==="vendido" ? "Vendido" : imovelPorId(imovelId).finalidade==="aluguel" ? "Aluga-se" : "À venda") : "À venda"}};
  carregarValoresDoc();
  if(o.valores){ Object.assign(S.doc.V, o.valores); Object.keys(o.valores).forEach(k=>S.doc.editados.add(k)); }
  montarTelaDoc();
  if(m.tipo==="layout") carregarQr().then(()=>{ if(S.doc && S.doc.m===m) pintarPreviaDoc(); });
}
function montarTelaDoc(editor){
  const velha = $("#doc-tela"); if(velha) velha.remove();
  const d = S.doc, m = d.m;
  const t = document.createElement("div");
  t.id = "doc-tela"; t.className = "doc-tela"; t.setAttribute("role","dialog"); t.setAttribute("aria-modal","true"); t.setAttribute("aria-label", editor ? "Editar modelo" : m.nome);
  t.innerHTML = `<div class="doc-barra">
      <button class="btn btn-linha btn-sm doc-voltar" data-act="doc-fechar">← Voltar</button>
      <h2>${editor ? (d.novo ? "Novo modelo" : "Editar modelo") : esc(m.nome)}</h2>
      <div class="seg seg-curto doc-modo"><button class="on" data-act="doc-modo" data-v="form">${editor?"Texto":"Preencher"}</button><button data-act="doc-modo" data-v="prev">Ver documento</button></div>
      <span class="doc-falta m-oculta" id="doc-falta"></span>
      ${editor ? `${!d.novo && (m.editado || m.proprio) ? `<button class="btn btn-linha btn-sm m-oculta" data-act="${m.proprio?"doc-excluir-modelo":"doc-restaurar"}">${m.proprio?"Excluir modelo":"Voltar ao texto original"}</button>`:""}<button class="btn btn-ouro btn-sm doc-acao" data-act="doc-salvar-modelo">Salvar modelo</button>`
        : `${m.tipo==="texto"?`<button class="btn btn-linha btn-sm m-oculta" data-act="doc-word">Baixar Word</button>`:""}<button class="btn btn-ouro btn-sm doc-acao" data-act="doc-imprimir">Imprimir ou PDF</button>`}
    </div>
    <div class="doc-corpo modo-form" id="doc-corpo">
      <form class="doc-form" id="doc-form" autocomplete="off"></form>
      <div class="doc-prev" id="doc-prev"><div class="doc-escala" id="doc-escala"><div class="doc-folha" id="doc-folha"></div></div></div>
    </div>`;
  document.body.appendChild(t);
  document.body.classList.add("doc-aberto");
  document.addEventListener("keydown", escDoc);
  window.addEventListener("resize", escalarPreviaDoc);
  window.addEventListener("beforeprint", antesDeImprimirDoc);
  if(editor) pintarEditorModelo(); else pintarFormDoc();
  pintarPreviaDoc();
  setTimeout(()=>{ const f = t.querySelector(editor ? "#me-nome" : "#doc-form select, #doc-form .falta input, #doc-form .falta textarea"); if(f && matchMedia("(min-width:901px)").matches) f.focus(); }, 60);
}
function escDoc(e){ if(e.key==="Escape" && !e.target.closest("details.menu[open]")) fecharDoc(); }
function fecharDoc(semVoltar){
  const t = $("#doc-tela"); if(t) t.remove();
  document.body.classList.remove("doc-aberto");
  document.removeEventListener("keydown", escDoc);
  window.removeEventListener("resize", escalarPreviaDoc);
  window.removeEventListener("beforeprint", antesDeImprimirDoc);
  const o = S.doc && S.doc.origem; S.doc = null;
  if(!semVoltar && o && rota().nome==="crm"){ if(o.tipo==="lead" && S.leads.find(x=>x._id===o.id)) abrirLead(o.id); else if(o.tipo==="imovel" && imovelPorId(o.id)) abrirImovel(o.id); }
}
function campoFormDoc(k, V){
  const c = campoDoc(k), v = V[k]||"", id = "dk-"+k.replace(/\W/g,"-"), vazio = !String(v).trim() && !c.opcional;
  const a = `id="${id}" data-k="${esc(k)}"`;
  let inp;
  if(c.tipo==="area") inp = `<textarea ${a} rows="3" placeholder="${esc(c.dica||"")}">${esc(v)}</textarea>`;
  else if(c.tipo==="opcoes") inp = `<select ${a}><option value=""></option>${c.ops.map(o=>`<option ${o===v?"selected":""}>${esc(o)}</option>`).join("")}${v&&!c.ops.includes(v)?`<option selected>${esc(v)}</option>`:""}</select>`;
  else if(c.tipo==="data") inp = `<input ${a} type="date" value="${esc(v)}">`;
  else if(c.tipo==="datahora") inp = `<input ${a} type="datetime-local" value="${esc(v)}">`;
  else inp = `<input ${a} value="${esc(v)}" ${c.tipo==="dinheiro"||c.tipo==="numero"?'inputmode="decimal"':""} placeholder="${esc(c.dica||(c.tipo==="dinheiro"?"R$":""))}">`;
  return `<label class="campo ${vazio?"falta":""} ${c.tipo==="area"||/endereco|nome|conjuge/.test(k)?"largo":""}">${esc(c.r)}${c.opcional?' <span class="opc">opcional</span>':""}${inp}</label>`;
}
function pintarFormDoc(){
  const d = S.doc, m = d.m, al = d.al, f = $("#doc-form"); if(!f) return;
  const L = [...leadsF()].sort((a,b)=>String(b.atualizadoEm||b.criadoEm||"").localeCompare(String(a.atualizadoEm||a.criadoEm||"")));
  const I = [...S.imoveis].sort((a,b)=>(a.status==="vendido")-(b.status==="vendido") || String(a.codigo).localeCompare(String(b.codigo)));
  const ks = chavesModelo(m).filter(k=>!(m.tipo==="layout"));
  const grupos = GRUPOS_DOC.map(([g, nome])=>({g, nome, ks:ks.filter(k=>grupoDoc(k)===g)})).filter(x=>x.ks.length);
  const vazio = k => !String(d.V[k]||"").trim();
  f.innerHTML = `
    <section class="doc-sec">
      ${al.varios ? `<div class="campo largo">Imóveis visitados<div class="doc-lista">${I.map(i=>`<label class="check"><input type="checkbox" name="doc-ims" value="${esc(i._id)}" ${d.imoveisSel.includes(i._id)?"checked":""}> <span><b>${esc(i.codigo)}</b> · ${esc(i.titulo)}</span></label>`).join("")}</div></div>`
        : al.imovel ? `<label class="campo largo ${d.imovelId?"":"falta"}">Imóvel<select id="doc-imovel"><option value="">Escolha o imóvel</option>${I.map(i=>`<option value="${esc(i._id)}" ${i._id===d.imovelId?"selected":""}>${esc(i.codigo)} · ${esc(i.titulo)}${i.status==="vendido"?" (vendido)":""}</option>`).join("")}</select></label>` : ""}
      ${al.cliente ? `<label class="campo largo ${d.leadId||al.clienteOpcional?"":"falta"}">Cliente${al.clienteOpcional?' <span class="opc">opcional</span>':""}<select id="doc-lead"><option value="">${al.clienteOpcional?"Sem cliente (ficha geral)":"Escolha o cliente ou preencha à mão"}</option>${L.map(l=>`<option value="${esc(l._id)}" ${l._id===d.leadId?"selected":""}>${esc(l.nome)} · ${esc(fmtCel(l.celular))}</option>`).join("")}</select></label>` : ""}
      ${m.tipo==="texto" ? `<label class="campo">Data do documento<input type="date" id="doc-data" value="${esc(d.V.data)}"></label>` : ""}
    </section>
    ${m.id==="ficha" ? `<section class="doc-sec"><div class="ld-rot">Opções</div>
      <label class="check"><input type="checkbox" data-o="preco" ${d.opc.preco?"checked":""}> Mostrar o valor</label>
      <label class="check"><input type="checkbox" data-o="endereco" ${d.opc.endereco?"checked":""}> Mostrar o endereço completo (rua e número)</label>
      <label class="check"><input type="checkbox" data-o="qr" ${d.opc.qr?"checked":""}> QR code para a página do imóvel</label></section>` : ""}
    ${m.id==="folder" ? `<section class="doc-sec"><div class="ld-rot">Opções</div>
      <label class="campo">Faixa no topo<select data-o="faixa">${["À venda","Aluga-se","Oportunidade","Lançamento","Vendido"].map(x=>`<option ${x===d.opc.faixa?"selected":""}>${x}</option>`).join("")}</select></label>
      <label class="check"><input type="checkbox" data-o="preco" ${d.opc.preco?"checked":""}> Mostrar o valor</label></section>` : ""}
    ${m.tipo==="texto" ? `<section class="doc-sec"><label class="check"><input type="checkbox" data-o="timbrado" ${d.opc.timbrado?"checked":""}> Papel timbrado (logo e contatos no topo)</label>
      ${m.id==="autorizacao"&&d.imovelId?`<label class="check"><input type="checkbox" data-o="registrarAut" ${d.opc.registrarAut?"checked":""}> Ao imprimir, anotar no imóvel a autorização e a validade</label>`:""}</section>` : ""}
    ${grupos.map(gr=>{ const fal = gr.ks.filter(vazio), ok = gr.ks.filter(k=>!vazio(k));
      return `<section class="doc-sec"><div class="ld-rot">${esc(gr.nome)}${fal.filter(k=>!campoDoc(k).opcional).length?` <span class="doc-n">${fal.filter(k=>!campoDoc(k).opcional).length} em branco</span>`:""}</div>
        <div class="doc-campos">${fal.map(k=>campoFormDoc(k, d.V)).join("")}</div>
        ${ok.length?`<details class="doc-cheios" id="dc-ch-${gr.g}" ${fal.length?"":"open"}><summary>${ok.length} ${ok.length===1?"dado já preenchido":"dados já preenchidos"}: conferir</summary><div class="doc-campos">${ok.map(k=>campoFormDoc(k, d.V)).join("")}</div></details>`:""}</section>`; }).join("")}
    <p class="nota doc-aviso">${m.tipo==="texto"?"Modelo de referência: revise com seu advogado antes de usar. ":""}O que ficar em branco sai com linha para preencher à mão. CPF, RG e endereço do cliente e do proprietário ficam salvos para os próximos documentos.</p>
    <p class="nota doc-aviso m-oculta">Para salvar em PDF, escolha "Salvar como PDF" na janela de impressão. No Chrome, desmarque "Cabeçalhos e rodapés" em Mais definições.</p>`;
  ligarFormDoc();
  atualizarFaltaDoc();
}
function ligarFormDoc(){
  const f = $("#doc-form"), d = S.doc;
  let tm = null;
  const agendar = ()=>{ clearTimeout(tm); tm = setTimeout(()=>{ pintarPreviaDoc(); atualizarFaltaDoc(); }, 120); };
  f.oninput = e=>{
    const x = e.target;
    if(x.dataset.k){ d.V[x.dataset.k] = x.value; d.editados.add(x.dataset.k); x.closest(".campo").classList.toggle("falta", !x.value.trim() && !campoDoc(x.dataset.k).opcional); agendar(); }
    if(x.id==="doc-data"){ d.V.data = x.value; agendar(); }
  };
  f.onchange = e=>{
    const x = e.target;
    if(x.dataset.k && campoDoc(x.dataset.k).cpf && x.value){ x.value = fmtCpf(x.value); d.V[x.dataset.k] = x.value; agendar(); }
    if(x.dataset.o){ d.opc[x.dataset.o] = x.type==="checkbox" ? x.checked : x.value; agendar(); }
    if(x.id==="doc-lead"){ d.leadId = x.value; const l = S.leads.find(y=>y._id===x.value);
      if(l && d.al.varios){ const ims = imoveisDaVisita(l); if(ims.length) d.imoveisSel = ims; }
      if(l && d.al.imovel && !d.al.varios && !d.imovelId && l.imovelId) d.imovelId = l.imovelId;
      recarregarDoc(); }
    if(x.id==="doc-imovel"){ d.imovelId = x.value; d.imoveisSel = x.value ? [x.value] : []; recarregarDoc(); }
    if(x.name==="doc-ims"){ d.imoveisSel = [...f.querySelectorAll("input[name=doc-ims]:checked")].map(y=>y.value); if(!d.imovelId || !d.imoveisSel.includes(d.imovelId)) d.imovelId = d.imoveisSel[0]||""; recarregarDoc(true); }
  };
  f.onsubmit = e=>e.preventDefault();
}
function recarregarDoc(manterForm){
  const d = S.doc, digitado = {}; d.editados.forEach(k=>{ if(grupoDoc(k)==="negocio") digitado[k] = d.V[k]; });
  carregarValoresDoc(); Object.assign(d.V, digitado);
  if(manterForm){ const f = $("#doc-form"); f.querySelectorAll("[data-k]").forEach(x=>{ if(x.value!==(d.V[x.dataset.k]||"")) x.value = d.V[x.dataset.k]||""; }); pintarPreviaDoc(); atualizarFaltaDoc(); return; }
  pintarFormDoc(); pintarPreviaDoc();
}
function atualizarFaltaDoc(){
  const el = $("#doc-falta"); if(!el || !S.doc || S.doc.editor) return;
  const n = faltandoDoc().length + ((S.doc.al.imovel && !S.doc.imovelId && !S.doc.al.varios) ? 1 : 0);
  el.className = "doc-falta m-oculta " + (n ? "tem" : "ok");
  el.textContent = n ? `${n} ${n===1?"dado em branco":"dados em branco"}` : "Tudo preenchido";
}
function pintarPreviaDoc(){
  const fo = $("#doc-folha"); if(!fo || !S.doc) return;
  const d = S.doc;
  fo.className = "doc-folha " + (d.m.tipo==="layout" ? "dc-"+d.m.id : "dc-txt");
  fo.innerHTML = d.editor ? (d.opc.timbrado ? timbreDoc(ctxDoc()) : "") + `<div class="dc-texto">${renderTextoDoc(d.m.texto, {}, {imoveis:[]}, {rotulos:true})}</div>` : htmlDoc();
  escalarPreviaDoc();
}
function escalarPreviaDoc(){
  const p = $("#doc-prev"), fo = $("#doc-folha"), es = $("#doc-escala"); if(!p || !fo || !es) return;
  const w = fo.offsetWidth || 794, livre = p.clientWidth - 32;
  const s = Math.min(1, Math.max(.3, livre / w));
  fo.style.transform = s<1 ? `scale(${s})` : "";
  es.style.width = (w*s)+"px"; es.style.height = (fo.offsetHeight*s)+"px";
}

/* ---------- imprimir, Word e registro ---------- */
function nomeArquivoDoc(){
  const d = S.doc, c = ctxDoc();
  return [d.m.nome, c.lead && c.lead.nome, c.imovel && c.imovel.codigo].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]/g,"");
}
async function imagensProntas(el){
  await Promise.all([...el.querySelectorAll("img")].map(img=>img.complete ? 0 : new Promise(r=>{ img.onload = img.onerror = r; setTimeout(r, 4000); })));
}
/* Monta a cópia que vai para a impressora (também usada no Ctrl+P com o documento aberto). */
function prepararImpressaoDoc(){
  if(!S.doc || S.doc.editor || document.body.classList.contains("imprimindo")) return null;
  let p = $("#doc-print"); if(!p){ p = document.createElement("div"); p.id = "doc-print"; document.body.appendChild(p); }
  p.innerHTML = `<div class="${$("#doc-folha").className}">${htmlDoc()}</div>`;
  const titulo = document.title;
  document.title = nomeArquivoDoc();
  document.body.classList.add("imprimindo");
  const fim = ()=>{ document.body.classList.remove("imprimindo"); document.title = titulo; window.removeEventListener("afterprint", fim); };
  window.addEventListener("afterprint", fim);
  return p;
}
function antesDeImprimirDoc(){ if(prepararImpressaoDoc() && !S.doc.registrado) salvarDadosDoc(); }
async function imprimirDoc(){
  if(!S.doc) return;
  if(S.doc.al.imovel && !S.doc.al.varios && !S.doc.imovelId){ toast("Escolha o imóvel antes de imprimir."); return; }
  salvarDadosDoc();
  const p = prepararImpressaoDoc(); if(!p) return;
  await imagensProntas(p);
  window.print();
}
function baixarWordDoc(){
  if(!S.doc) return;
  salvarDadosDoc();
  const c = ctxDoc(), e = c.empresa;
  const topo = S.doc.opc.timbrado ? `<p style="text-align:right;font-size:9pt;color:#555;border-bottom:1.5pt solid #C9A464;padding-bottom:6pt"><b style="color:#293731;font-size:12pt">${esc(e.nome)}</b><br>${esc(e.endereco)}, ${esc(e.cidade)}/${esc(e.uf)} · ${esc(e.telefone)} · ${esc(e.email)}</p>` : "";
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(S.doc.m.nome)}</title>
    <style>@page{size:21cm 29.7cm;margin:2cm 2cm 2cm 2.5cm}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.45;color:#1b1b1b}h1{font-size:15pt;text-align:center;text-transform:uppercase;color:#293731;margin:6pt 0 14pt}h2{font-size:11pt;text-transform:uppercase;color:#293731;margin:12pt 0 4pt}p{margin:0 0 8pt;text-align:justify}.dc-local{text-align:right;margin-top:16pt}th{background:#eef2ef;font-size:9pt}td{font-size:9.5pt}</style></head>
    <body>${topo}${renderTextoDoc(S.doc.m.texto, S.doc.V, c, {word:true})}</body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿", html], {type:"application/msword"}));
  a.download = nomeArquivoDoc().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w .-]/g,"") + ".doc";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  toast("Arquivo do Word baixado. Abra para ajustar o texto antes de imprimir.");
}
/* Guarda no CRM o que foi digitado (CPF, RG, endereço…) e registra o documento no histórico do cliente ou do imóvel. */
async function salvarDadosDoc(){
  const d = S.doc; if(!d || d.editor) return;
  const c = ctxDoc(), V = d.V, upLead = {}, upPriv = {}, upEmp = {}, upCor = {};
  for(const k of d.editados){
    const f = campoDoc(k), v = String(V[k]??"").trim(), g = grupoDoc(k), sub = k.slice(k.indexOf(".")+1);
    if(f.lead && c.lead && v!==(c.lead[f.lead]||"") && (v || f.lead!=="nome")) upLead[f.lead] = v;
    else if(f.priv && c.imovel) upPriv[f.priv] = v;
    else if(f.emp && ehGestor()) upEmp[f.emp] = v;
    else if(f.cor) upCor[f.cor] = v;
    else if(f.livre && g==="cliente" && c.lead) upLead.docCampos = {...(c.lead.docCampos||{}), ...(upLead.docCampos||{}), [sub]:v};
    else if(f.livre && (g==="proprietario" || g==="imovel") && c.imovel) upPriv.docCampos = {...(c.priv.docCampos||{}), ...(upPriv.docCampos||{}), [k]:v};
  }
  if(d.m.id==="autorizacao" && d.opc.registrarAut && c.imovel && !d.registrado){
    const ini = V.data || toLocalInput(hoje()).slice(0,10), dias = Number(soDig(V["negocio.prazo"]))||0;
    upPriv.autorizacaoTipo = /sem/.test(V["negocio.exclusividade"]||"") ? "simples" : "exclusiva";
    upPriv.autorizacaoInicio = ini;
    if(dias){ const fimAut = dLocal(ini); fimAut.setDate(fimAut.getDate()+dias); upPriv.autorizacaoValidade = fimAut.toISOString().slice(0,10); }
  }
  const negocio = Object.fromEntries(Object.entries(V).filter(([k])=>grupoDoc(k)==="negocio" || k==="data"));
  const reg = {id:d.registroId || ("d"+Date.now().toString(36)), modelo:d.m.id, nome:d.m.nome, quando:hoje(), por:meuId(), imovelId:d.imovelId||"", imoveis:d.imoveisSel||[], valores:negocio};
  d.registroId = reg.id;
  const im = c.imovel, rotulo = `${d.m.nome}${im?` (imóvel ${im.codigo})`:""}`;
  try{
    if(c.lead){
      upLead.documentos = [...(c.lead.documentos||[]).filter(x=>x.id!==reg.id), reg].slice(-30);
      await salvarLead(c.lead._id, upLead, d.registrado ? [] : [{tipo:"Documento", texto:`Documento gerado: ${rotulo}.`}]);
    }
    if(im && (Object.keys(upPriv).length || !c.lead)){
      const atual = S.privado[im._id] || {};
      const novo = {...atual, ...upPriv};
      if(!c.lead) novo.documentos = [...(atual.documentos||[]).filter(x=>x.id!==reg.id), reg].slice(-30);
      S.privado[im._id] = novo;
      await S.db.doc("privado/"+im._id).set(novo);
    }
    if(Object.keys(upEmp).length){ const e = {...(((S.modelosDb||{})._empresa)||{}), ...upEmp}; await salvarModeloDb("_empresa", e); }
    if(Object.keys(upCor).length){ const id = "_corretor-" + ((c.lead && c.lead.corretorId) || (im && im.corretorId) || meuId()); await salvarModeloDb(id, {...(((S.modelosDb||{})[id])||{}), ...upCor}).catch(()=>{}); }
    d.registrado = true;
    d.editados = new Set([...d.editados].filter(k=>grupoDoc(k)==="negocio"));
  }catch(err){ toast("O documento foi gerado, mas os dados não foram salvos no CRM. Verifique a internet."); }
}
async function salvarModeloDb(id, dados){
  S.modelosDb = S.modelosDb || {};
  await S.db.collection("modelos").doc(id).set(dados);
  S.modelosDb[id] = dados;
}

/* ---------- aba Documentos ---------- */
const ICO_DOC = {ficha:"▦", folder:"▣", autorizacao:"✎", visita:"⌂", chaves:"⚿", proposta:"$", recibo:"✓"};
function docsGerados(){
  const L = leadsF().flatMap(l=>(l.documentos||[]).map(r=>({...r, lead:l})));
  const P = Object.entries(S.privado||{}).flatMap(([id,p])=>(p.documentos||[]).map(r=>({...r, imovelId:r.imovelId||id})));
  return [...L, ...P].sort((a,b)=>String(b.quando).localeCompare(String(a.quando)));
}
function linhaDocGerado(r, comCliente=true){
  const im = imovelPorId(r.imovelId);
  return `<div class="doc-linha"><span><b>${esc(r.nome)}</b><small>${esc(dataHoraBR(r.quando))}${comCliente&&r.lead?" · "+esc(r.lead.nome):""}${im?" · "+esc(im.codigo):""}</small></span>
    <button class="btn btn-linha btn-sm" data-act="doc-reabrir" data-reg="${esc(r.id)}" ${r.lead?`data-lead="${esc(r.lead._id||r.lead)}"`:""} data-imovel="${esc(r.imovelId||"")}">Abrir</button></div>`;
}
function crmDocumentos(el){
  const ms = listaModelos(), ger = docsGerados().slice(0,10);
  const al = m => alvosModelo(m);
  el.innerHTML = `<div class="sec-h" style="margin-top:0"><div><h3 style="font-size:26px">Documentos</h3><p>Escolha o documento: ele já sai preenchido com os dados do cliente, do imóvel e do corretor. Depois é só imprimir ou salvar em PDF.</p></div>
      ${ehGestor()?`<div class="chips"><button class="btn btn-linha btn-sm" data-act="doc-empresa">Dados da imobiliária</button><button class="btn btn-marca btn-sm" data-act="doc-novo-modelo">+ Novo modelo</button></div>`:""}</div>
    ${S.modelosErro && ehGestor() ? `<div class="aviso" style="margin-bottom:14px">Para editar e criar modelos, o banco precisa da atualização 003 (supabase/migracao-003-documentos.sql). Os documentos padrão já funcionam.</div>` : ""}
    <div class="doc-grid">${ms.map(m=>{ const a = al(m); return `<article class="doc-card">
      <div class="doc-ico" aria-hidden="true">${ICO_DOC[m.id]||"¶"}</div>
      <div class="doc-txt"><h4>${esc(m.nome)}</h4><p>${esc(m.desc||"")}</p>
        <div class="tags-mini">${a.imovel?"<span>Imóvel</span>":""}${a.cliente&&!a.clienteOpcional?"<span>Cliente</span>":""}${m.proprio?"<span>Seu modelo</span>":m.editado?"<span>Texto editado</span>":""}</div></div>
      <div class="chips"><button class="btn btn-ouro btn-sm" data-act="doc-abrir" data-modelo="${esc(m.id)}">Gerar</button>${ehGestor()&&m.tipo==="texto"?`<button class="btn btn-linha btn-sm" data-act="doc-editar" data-modelo="${esc(m.id)}">Editar texto</button>`:""}</div>
    </article>`; }).join("")}</div>
    <h3 class="doc-h3">Gerados recentemente</h3>
    ${ger.length ? `<div class="doc-ger">${ger.map(r=>linhaDocGerado(r)).join("")}</div>` : `<p class="nota">Os documentos que você imprimir aparecem aqui e no histórico do cliente, para abrir de novo com os mesmos dados.</p>`}`;
}
function menuDocs(o){
  const ms = listaModelos().filter(m=>{ const a = alvosModelo(m); return o.lead ? (a.cliente || m.id==="ficha") : a.imovel; });
  const extra = o.lead ? `data-lead="${esc(o.lead)}"` : `data-imovel="${esc(o.imovel)}"`;
  return `<details class="menu" id="${o.lead?"ld-docs":"im-docs"}"><summary class="btn btn-linha">Documentos ▾</summary><div class="menu-lista">${ms.map(m=>`<button class="menu-item" data-act="doc-abrir" data-modelo="${esc(m.id)}" ${extra}><b>${esc(m.nome)}</b><small>${esc(m.desc||"")}</small></button>`).join("")}</div></details>`;
}
function secDocsLead(l){
  const r = [...(l.documentos||[])].reverse().slice(0,5); if(!r.length) return "";
  return `<section class="ld-sec"><div class="ld-rot">Documentos gerados</div>${r.map(x=>linhaDocGerado({...x, lead:l}, false)).join("")}</section>`;
}
function secDocsImovel(id){
  const p = S.privado[id]||{};
  const r = [...(p.documentos||[]).map(x=>({...x, imovelId:id})), ...leadsF().flatMap(l=>(l.documentos||[]).filter(x=>x.imovelId===id || (x.imoveis||[]).includes(id)).map(x=>({...x, lead:l})))]
    .sort((a,b)=>String(b.quando).localeCompare(String(a.quando))).slice(0,5);
  if(!r.length) return "";
  return `<section class="ld-sec"><div class="ld-rot">Documentos gerados</div>${r.map(x=>linhaDocGerado(x)).join("")}</section>`;
}

/* ---------- editor de modelos (gestor) ---------- */
const TRECHOS_DOC = [["Título","# Título do documento"],["Seção","## Nome da seção"],["Negrito","**texto em negrito**"],["Item de lista","- item"],["Caixa de marcar","[ ] "],
  ["Assinatura","[assinatura: {{cliente.nome}} | Cliente]"],["Local e data","[local e data]"],["Tabela de imóveis","[imoveis]"],["Linha de corte","---"],["Nova página","[quebra]"]];
function abrirEditorModelo(mid){
  if(!ehGestor()) return;
  const base = mid ? modeloPorId(mid) : null;
  if(mid && (!base || base.tipo!=="texto")) return;
  const origem = S.gav && S.gav.id ? {...S.gav} : null; fecharGaveta();
  const m = base ? {...base} : {id:"m-"+Date.now().toString(36), nome:"", desc:"", tipo:"texto", texto:"# Título do documento\n\nEu, {{cliente.nome}}, CPF {{cliente.cpf}}, ...\n\n[local e data]\n\n[assinatura: {{cliente.nome}} | Cliente]\n[assinatura: {{corretor.nome}} | Corretor, CRECI {{corretor.creci}}]", proprio:true};
  S.doc = {m, editor:true, novo:!base, V:{}, editados:new Set(), opc:{timbrado:true}, al:{}, origem, imoveisSel:[]};
  montarTelaDoc(true);
}
function pintarEditorModelo(){
  const d = S.doc, m = d.m, f = $("#doc-form");
  const chave = Object.keys(CAMPOS_DOC);
  f.innerHTML = `<section class="doc-sec">
      <label class="campo largo">Nome do modelo<input id="me-nome" value="${esc(m.nome)}" placeholder="Ex.: Autorização de locação" required></label>
      <label class="campo largo">Descrição curta<input id="me-desc" value="${esc(m.desc||"")}" placeholder="Para que serve, em uma frase"></label></section>
    <section class="doc-sec"><div class="ld-rot">Texto do documento</div>
      <div class="me-trechos">${TRECHOS_DOC.map(([r,t])=>`<button type="button" class="chip" data-act="doc-ins" data-v="${esc(t)}">${esc(r)}</button>`).join("")}</div>
      <textarea id="me-texto" class="me-texto" rows="22" spellcheck="true">${esc(m.texto)}</textarea>
      <details class="ld-bloco" id="me-campos"><summary>Inserir dado do cliente, imóvel, proprietário…</summary>
        ${GRUPOS_DOC.map(([g,nome])=>`<div class="ld-rot" style="margin-top:8px">${esc(nome)}</div><div class="chips">${chave.filter(k=>grupoDoc(k)===g).map(k=>`<button type="button" class="chip" data-act="doc-ins" data-v="{{${esc(k)}}}" title="{{${esc(k)}}}">${esc(CAMPOS_DOC[k].r)}</button>`).join("")}</div>`).join("")}
        <div class="ld-rot" style="margin-top:8px">Datas</div><div class="chips"><button type="button" class="chip" data-act="doc-ins" data-v="{{data}}">Data por extenso</button><button type="button" class="chip" data-act="doc-ins" data-v="{{data.curta}}">Data curta</button></div>
      </details>
      <details class="ld-bloco" id="me-ajuda"><summary>Como escrever o modelo</summary><div class="nota me-ajuda">
        <p>Os dados entre chaves duplas, como <code>{{cliente.nome}}</code>, são trocados pelos dados do CRM. O que não existir no CRM vira um campo para preencher na hora: escreva, por exemplo, <code>{{negocio.valor_aluguel}}</code>.</p>
        <p>Para valor por extenso, use <code>|extenso</code>: <code>{{negocio.valor_proposta|extenso}}</code>.</p>
        <p><code>#</code> no começo da linha faz um título, <code>##</code> uma seção, <code>- </code> um item de lista, <code>**texto**</code> deixa em negrito e <code>[ ]</code> vira uma caixa de marcar. Linha em branco separa parágrafos.</p>
        <p><code>[assinatura: Nome | Papel]</code> cria a linha de assinatura; várias seguidas ficam lado a lado.</p></div></details>
    </section>
    <p class="nota doc-aviso">Modelos de referência: revise o texto com seu advogado.</p>`;
  const tx = $("#me-texto");
  let tm = null;
  f.oninput = e=>{
    if(e.target.id==="me-texto"){ m.texto = tx.value; clearTimeout(tm); tm = setTimeout(pintarPreviaDoc, 150); }
    if(e.target.id==="me-nome") m.nome = e.target.value;
    if(e.target.id==="me-desc") m.desc = e.target.value;
  };
  f.onsubmit = e=>e.preventDefault();
}
function inserirTrechoDoc(t){
  const tx = $("#me-texto"); if(!tx) return;
  const a = tx.selectionStart ?? tx.value.length, b = tx.selectionEnd ?? a;
  const bloco = /^(#|\[assinatura|\[local|\[imoveis|---|\[quebra|- )/.test(t);
  const antes = tx.value.slice(0,a), ins = bloco && antes && !antes.endsWith("\n") ? "\n"+t : t;
  tx.value = antes + ins + tx.value.slice(b);
  const p = a + ins.length; tx.focus(); tx.setSelectionRange(p, p);
  S.doc.m.texto = tx.value; pintarPreviaDoc();
}
async function salvarEditorModelo(){
  const d = S.doc, m = d.m;
  if(!m.nome.trim()){ toast("Dê um nome ao modelo."); $("#me-nome").focus(); return; }
  if(!m.texto.trim()){ toast("Escreva o texto do modelo."); return; }
  try{
    await salvarModeloDb(m.id, {nome:m.nome.trim(), desc:(m.desc||"").trim(), texto:m.texto, tipo:"texto", atualizadoEm:hoje(), por:meuId()});
    toast(`Modelo “${esc(m.nome.trim())}” salvo.`);
    fecharDoc(); if(S.crmTab==="documentos") render();
  }catch(err){ toast(/relation|modelos|does not exist|schema/i.test(err.message||"") ? "O banco ainda não tem a tabela de modelos (atualização 003)." : "Não foi possível salvar o modelo. Verifique a internet."); }
}
async function apagarModeloDoc(el){
  const d = S.doc, m = d.m;
  if(el.dataset.ok!=="1"){ el.dataset.ok = "1"; el.textContent = m.proprio ? "Clique de novo para excluir" : "Clique de novo para voltar ao original"; return; }
  try{ await S.db.collection("modelos").doc(m.id).delete(); if(S.modelosDb) delete S.modelosDb[m.id]; toast(m.proprio ? "Modelo excluído." : "O texto original foi restaurado."); fecharDoc(); if(S.crmTab==="documentos") render(); }
  catch(err){ toast("Não foi possível concluir. Verifique a internet."); }
}

/* ---------- dados da imobiliária (gestor) ---------- */
function abrirEmpresaDoc(){
  const e = empresaDoc(), cor = corretorDoc(meuId());
  gaveta(`<div class="ld-linha1"><h2>Dados da imobiliária</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>
    <p class="nota">Aparecem no topo dos documentos e nas cláusulas dos contratos.</p>
    <form id="emp-form" class="g-form">
      <label class="campo">Nome<input id="em-nome" value="${esc(e.nome)}"></label>
      <div class="linha2"><label class="campo">CPF ou CNPJ<input id="em-doc" value="${esc(e.documento||"")}" placeholder="Usado em recibos e contratos"></label><label class="campo">Seu CPF (corretor)<input id="em-cpf" value="${esc(cor.cpf||"")}" placeholder="Usado no recibo de comissão"></label></div>
      <label class="campo">Endereço<input id="em-end" value="${esc(e.endereco)}"></label>
      <div class="linha2"><label class="campo">Cidade<input id="em-cid" value="${esc(e.cidade)}"></label><label class="campo">UF<input id="em-uf" maxlength="2" value="${esc(e.uf)}"></label></div>
      <div class="linha2"><label class="campo">Telefone<input id="em-tel" value="${esc(e.telefone)}"></label><label class="campo">E-mail<input id="em-email" type="email" value="${esc(e.email)}"></label></div>
      <label class="campo">Site<input id="em-site" value="${esc(e.site||"")}"></label>
      <div class="chips"><button class="btn btn-marca" type="submit">Salvar</button></div>
      <div id="em-ret" class="nota"></div>
    </form>`);
  S.gav = {tipo:"empresa"};
  $("#emp-form").onchange = ev=>{ if(ev.target.id==="em-doc"||ev.target.id==="em-cpf") ev.target.value = fmtCpf(ev.target.value); };
  $("#emp-form").onsubmit = async ev=>{
    ev.preventDefault(); const r = $("#em-ret");
    const dados = {nome:$("#em-nome").value.trim(), documento:fmtCpf($("#em-doc").value.trim()), endereco:$("#em-end").value.trim(), cidade:$("#em-cid").value.trim(), uf:$("#em-uf").value.trim().toUpperCase(),
      telefone:$("#em-tel").value.trim(), email:$("#em-email").value.trim(), site:$("#em-site").value.trim()};
    try{
      await salvarModeloDb("_empresa", dados);
      const id = "_corretor-"+meuId(); await salvarModeloDb(id, {...(((S.modelosDb||{})[id])||{}), cpf:fmtCpf($("#em-cpf").value.trim())});
      r.className = "ok-box"; r.textContent = "Dados salvos.";
    }catch(err){ r.className = "err-box"; r.textContent = /relation|modelos|does not exist|schema/i.test(err.message||"") ? "O banco ainda não tem a tabela de modelos (atualização 003)." : "Não foi possível salvar. Verifique a internet."; }
  };
}

/* ---------- ações (chamadas pelo ouvinte de cliques do CRM) ---------- */
async function acaoDoc(nome, d, el){
  switch(nome){
    case "doc-abrir": abrirDoc(d.modelo, {lead:d.lead, imovel:d.imovel}); return;
    case "doc-reabrir": {
      const l = d.lead ? S.leads.find(x=>x._id===d.lead) : null;
      const r = l ? (l.documentos||[]).find(x=>x.id===d.reg) : ((S.privado[d.imovel]||{}).documentos||[]).find(x=>x.id===d.reg);
      if(!r){ toast("Registro não encontrado."); return; }
      abrirDoc(r.modelo, {lead:l&&l._id, imovel:r.imovelId||d.imovel, imoveis:r.imoveis, valores:r.valores, registroId:r.id}); return; }
    case "doc-fechar": fecharDoc(); return;
    case "doc-modo": { const c = $("#doc-corpo"); c.classList.toggle("modo-form", d.v==="form"); c.classList.toggle("modo-prev", d.v==="prev");
      el.parentElement.querySelectorAll("button").forEach(b=>b.classList.toggle("on", b===el)); if(d.v==="prev") escalarPreviaDoc(); return; }
    case "doc-imprimir": imprimirDoc(); return;
    case "doc-word": baixarWordDoc(); return;
    case "doc-editar": abrirEditorModelo(d.modelo); return;
    case "doc-novo-modelo": abrirEditorModelo(null); return;
    case "doc-ins": inserirTrechoDoc(d.v); return;
    case "doc-salvar-modelo": salvarEditorModelo(); return;
    case "doc-restaurar": case "doc-excluir-modelo": apagarModeloDoc(el); return;
    case "doc-empresa": abrirEmpresaDoc(); return;
  }
}
