/* CRM Monfernatti Imóveis.
   Carregado antes do script principal do index.html: aqui só há definições.
   Usa do index.html: S, $, esc, brl, hoje, dataBR, dataHoraBR, waLink, soDig, fmtCel, ETAPAS, TIPOS_CONTATO, ORIGENS,
   CATEGORIAS, ICO, corretorDe, todosCorretores, avatar, iniciais, opcoes, rota, render. */

const DIA = 864e5;
const CONTATOS_REAIS = ["WhatsApp","Ligação","E-mail","Visita","Reunião","Proposta"];
const MOTIVOS_PERDA = ["Comprou com outro corretor","Desistiu da compra","Crédito não aprovado","Preço acima do que pode pagar","Parou de responder","Outro"];
const ETIQUETAS_BASE = ["Investidor","Financiamento","FGTS","À vista","Permuta","Primeiro imóvel","Urgente"];
const TIPOS_AUT = {exclusiva:"Exclusiva", simples:"Sem exclusividade", nenhuma:"Sem autorização assinada"};
const NOMES_MODELO = {primeiro:"Primeiro contato", imovel:"Enviar imóvel", visita:"Confirmar visita", posvisita:"Depois da visita", retomar:"Retomar contato", livre:"Mensagem em branco"};
const RAPIDOS = [
  {k:"naoatendeu", r:"Não atendeu", tipo:"Ligação", txt:"Liguei e não atendeu.", prox:"amanha", direto:true},
  {k:"semresposta", r:"Não respondeu", tipo:"WhatsApp", txt:"Mandei mensagem e ainda não respondeu.", prox:"2d", direto:true},
  {k:"pensar", r:"Vai pensar", tipo:"WhatsApp", txt:"Cliente vai pensar e dar retorno.", prox:"3d", direto:true},
  {k:"visitar", r:"Quer visitar", tipo:"WhatsApp", txt:"Cliente quer visitar.", direto:true, agendar:true},
  {k:"semint", r:"Sem interesse agora", tipo:"WhatsApp", txt:"Sem interesse no momento. Retomar mais pra frente.", prox:"30d", temp:"frio", direto:true},
  {k:"conversamos", r:"Conversamos…", tipo:"WhatsApp", txt:"Conversamos: "}
];
const FEEDBACKS = ["Gostou","Não gostou","Quer fazer proposta","Quer ver outras opções","Achou caro"];
const SIMBOLO = '<svg viewBox="0 0 74 74" fill="currentColor" aria-hidden="true"><path d="M0 0H74V74H67V7H7V74H0Z"/><rect x="34" y="66" width="40" height="8"/><path d="M16 34L23 30.5V74H16Z"/><path d="M34 20L41 24.5V74H34Z"/><path d="M51 30L58 34V56H51Z"/></svg>';

/* ---------- utilidades ---------- */
const norm = s => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const primeiroNome = n => String(n||"").trim().split(/\s+/)[0] || "";
const aberto = l => !["fechado","perdido"].includes(l.etapa);
const nomeEtapa = id => (ETAPAS.find(e=>e.id===id)||{}).nome || id || "";
const atrasado = l => !!l.proximoContato && new Date(l.proximoContato) < new Date() && aberto(l);
const contatosDe = l => (l.historico||[]).filter(h=>CONTATOS_REAIS.includes(h.tipo));
const ultimoContato = l => { const c = contatosDe(l); return c.length ? c[c.length-1].quando : ""; };
const semResposta = l => l.etapa==="novo" && !contatosDe(l).length;
const horaBR = iso => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const dLocal = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s||"")) ? new Date(s+"T12:00:00") : new Date(s);
const dataCurta = s => s ? dLocal(s).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"}) : "";
const diasAte = s => Math.ceil((new Date(String(s).slice(0,10)+"T23:59:59") - Date.now())/DIA);
const celIntl = c => { c = soDig(c); return c.length>=12 && c.startsWith("55") ? c : "55"+c; };
const imovelPorId = id => id ? S.imoveis.find(i=>i._id===id) : null;
const linkImovel = i => location.origin + "/#imovel-" + i._id;
const descImovel = i => [i.titulo, i.bairro, i.preco ? brl(i.preco) : ""].filter(Boolean).join(", ");
const ehGestor = () => S.papel !== "corretor";
const meuId = () => S.meuCorretor || "fernando";
function inicioDoDia(d=new Date()){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function fimDoDia(d=new Date()){ const x = new Date(d); x.setHours(23,59,59,999); return x; }
function haQuanto(iso){
  const m = (Date.now()-new Date(iso))/60000;
  if(m<1) return "agora"; if(m<60) return `há ${Math.round(m)} min`;
  const h = m/60; if(h<24) return `há ${Math.round(h)} h`;
  const d = Math.floor(h/24); return d===1 ? "há 1 dia" : `há ${d} dias`;
}
function diaRotulo(iso){
  const d = new Date(iso), dd = Math.round((inicioDoDia(d)-inicioDoDia())/DIA);
  if(dd===0) return "Hoje"; if(dd===1) return "Amanhã"; if(dd===-1) return "Ontem";
  return d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});
}
function diaFrase(iso){
  const d = new Date(iso), dd = Math.round((inicioDoDia(d)-inicioDoDia())/DIA);
  if(dd===0) return "hoje"; if(dd===1) return "amanhã";
  return d.toLocaleDateString("pt-BR",{weekday:"long"}) + " (" + d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}) + ")";
}
function amanhaAs(h){ const d = new Date(); d.setDate(d.getDate()+1); d.setHours(h,0,0,0); return d.toISOString(); }
function quando(k){
  const d = new Date();
  if(k==="2h"){ d.setMinutes(d.getMinutes()+120); d.setMinutes(Math.ceil(d.getMinutes()/15)*15,0,0); return d.toISOString(); }
  d.setDate(d.getDate() + ({amanha:1,"2d":2,"3d":3,"7d":7,"30d":30}[k]||1)); d.setHours(9,0,0,0); return d.toISOString();
}
function toLocalInput(iso){ if(!iso) return ""; const d=new Date(iso); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function duracao(ms){
  const m = ms/60000; if(m<60) return Math.max(1,Math.round(m))+" min";
  const h = m/60; if(h<24) return (h<10 ? h.toFixed(1).replace(".",",") : Math.round(h))+" h";
  const d = h/24; return (d<10 ? d.toFixed(1).replace(".",",") : Math.round(d))+" dias";
}
function mediana(l){ if(!l.length) return null; const s=[...l].sort((a,b)=>a-b); const k=Math.floor(s.length/2); return s.length%2 ? s[k] : (s[k-1]+s[k])/2; }
const numBR = v => { const t = String(v??"").replace(/[^\d,.-]/g,""); if(!t) return 0; return Number(t.includes(",") ? t.replace(/\./g,"").replace(",",".") : t.replace(/\.(?=\d{3}(\D|$))/g,"")) || 0; };

function leadsF(){ return S.crmCorretor ? S.leads.filter(l=>(l.corretorId||"fernando")===S.crmCorretor) : S.leads; }
function imoveisF(){ return S.crmCorretor ? S.imoveis.filter(i=>(i.corretorId||"fernando")===S.crmCorretor) : S.imoveis; }
function todasVisitas(){ return leadsF().flatMap(l=>(l.visitas||[]).map(v=>({...v, lead:l}))); }
const rotStatus = s => ({disponivel:"Disponível",reservado:"Reservado",vendido:"Vendido",oculto:"Oculto no site"})[s||"disponivel"]||s;

/* ---------- início, acesso e avisos ---------- */
async function crmIniciar(){
  let ac = null;
  try{ ac = await MF.meuAcesso(); }catch(e){}
  S.papel = (ac && ac.papel) || "gestor";
  S.meuCorretor = (ac && ac.corretor_id) || (S.papel==="gestor" ? "fernando" : "");
  if(S.papel==="corretor") S.crmCorretor = S.meuCorretor;
  S.privado = S.privado || {};
  S.acessoPronto = true;
  S.db.collection("leads").onSnapshot(snap=>{
    const lista = snap.docs.map(d=>({_id:d.id, ...d.data()}));
    avisarNovos(lista);
    S.leads = lista;
    if(rota().nome==="crm") render();
    repintarGaveta();
  }, ()=>{});
  S.db.collection("privado").onSnapshot(snap=>{
    S.privado = Object.fromEntries(snap.docs.map(d=>[d.id, d.data()]));
    if(rota().nome==="crm") render();
  }, ()=>{});
  S.modelosDb = {};
  S.db.collection("modelos").onSnapshot(snap=>{
    S.modelosDb = Object.fromEntries(snap.docs.map(d=>[d.id, d.data()])); S.modelosErro = false;
    if(rota().nome==="crm" && S.crmTab==="documentos") render();
  }, ()=>{ S.modelosErro = true; });
  if(rota().nome==="crm") render();
}

function avisarNovos(lista){
  if(!S.leadsVistos){ S.leadsVistos = new Set(lista.map(l=>l._id)); return; }
  for(const l of lista){
    if(S.leadsVistos.has(l._id)) continue;
    S.leadsVistos.add(l._id);
    if(l.origem==="Site" && Date.now()-new Date(l.criadoEm||0) < 60*60e3) notificarLead(l);
  }
}
function notificarLead(l){
  S.naoLidos = (S.naoLidos||0) + 1; marcarTitulo();
  toast(`<b>Novo lead pelo site:</b> ${esc(l.nome)}${l.imovelTitulo?` · ${esc(l.imovelTitulo)}`:""}`, {rotulo:"Abrir", fn:()=>{ location.hash="#crm"; abrirLead(l._id); }}, 15000);
  bip();
  try{
    if("Notification" in window && Notification.permission==="granted"){
      const titulo = "Novo lead: " + l.nome, op = {body: l.imovelTitulo || l.mensagem || "Contato pelo site", icon:"/icons/icon-192.png", badge:"/icons/icon-192.png", tag:"lead-"+l._id, data:{url:"/#crm"}};
      if(navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(r=>r.showNotification(titulo, op)).catch(()=>{});
      else new Notification(titulo, op);
    }
  }catch(e){}
}
function marcarTitulo(){
  const base = document.title.replace(/^\(\d+\)\s*/,"");
  document.title = S.naoLidos ? `(${S.naoLidos}) ${base}` : base;
  try{ if(navigator.setAppBadge) S.naoLidos ? navigator.setAppBadge(S.naoLidos) : navigator.clearAppBadge(); }catch(e){}
}
document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible" && S.naoLidos) setTimeout(()=>{ S.naoLidos = 0; marcarTitulo(); }, 4000); });
function bip(){
  try{
    const C = window.AudioContext || window.webkitAudioContext; if(!C) return;
    const ctx = S.audio || (S.audio = new C()); if(ctx.state==="suspended") ctx.resume();
    [[880,0],[1175,.16]].forEach(([f,t])=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value=f; o.type="sine";
      g.gain.setValueAtTime(.0001, ctx.currentTime+t); g.gain.exponentialRampToValueAtTime(.18, ctx.currentTime+t+.02); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+t+.28);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+.3); });
  }catch(e){}
}
async function pedirAvisos(){
  if(!("Notification" in window)){ toast("Este navegador não mostra avisos. Deixe o CRM aberto: o aviso aparece na tela com som."); return; }
  if(Notification.permission==="denied"){ toast("Os avisos estão bloqueados neste navegador. Libere em Configurações do site > Notificações."); return; }
  const r = await Notification.requestPermission();
  if(S.audio && S.audio.state==="suspended") S.audio.resume();
  toast(r==="granted" ? "Pronto! Você vai receber um aviso com som quando chegar lead pelo site." : "Avisos não ativados.");
  render();
}
function toast(html, acao, ms=6000){
  let box = $("#toasts");
  if(!box){ box = document.createElement("div"); box.id="toasts"; box.className="toasts"; box.setAttribute("aria-live","polite"); document.body.appendChild(box); }
  const t = document.createElement("div"); t.className = "toast"; t.innerHTML = `<span>${html}</span>`;
  if(acao){ const b=document.createElement("button"); b.className="btn btn-ouro btn-sm"; b.textContent=acao.rotulo; b.onclick=()=>{ t.remove(); acao.fn(); }; t.appendChild(b); }
  const x = document.createElement("button"); x.className="toast-x"; x.setAttribute("aria-label","Fechar aviso"); x.textContent="×"; x.onclick=()=>t.remove(); t.appendChild(x);
  box.appendChild(t); setTimeout(()=>t.remove(), ms);
  [...box.children].slice(0,-2).forEach(x=>x.remove());
}

/* ---------- instalar como aplicativo ---------- */
window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); S.instalar = e; });
async function instalarApp(){
  if(S.instalar){ S.instalar.prompt(); try{ await S.instalar.userChoice; }catch(e){} S.instalar = null; return; }
  if(window.matchMedia && matchMedia("(display-mode: standalone)").matches){ toast("O CRM já está instalado neste aparelho."); return; }
  gaveta(`<div class="ld-linha1"><h2>Instalar o CRM no celular</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>
    <p>Com o CRM instalado, ele abre direto da tela inicial, em tela cheia, como um aplicativo.</p>
    <div class="aviso"><b>iPhone (Safari)</b><br>Toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>Adicionar à Tela de Início</b>.</div>
    <div class="aviso"><b>Android (Chrome)</b><br>Toque no menu <b>⋮</b> e depois em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</div>
    <div class="aviso"><b>Computador (Chrome ou Edge)</b><br>Clique no ícone de instalar no fim da barra de endereço.</div>
    <p class="nota">Abra o endereço do site, entre no CRM e siga o passo acima. Depois, ative os avisos de lead novo no menu ⋯.</p>`);
}

/* ---------- casca do CRM ---------- */
function abasCrm(){
  const L = leadsF().filter(aberto), fim = fimDoDia();
  const nHoje = L.filter(semResposta).length + L.filter(l=>!semResposta(l) && l.proximoContato && new Date(l.proximoContato)<=fim).length
    + todasVisitas().filter(v=>v.status==="agendada" && new Date(v.quando)<=fim).length;
  const t = [["hoje","Hoje",nHoje],["funil","Funil"],["leads","Leads"],["agenda","Agenda"],["imoveis","Imóveis"],["avaliacoes","Avaliações",avPedidos().length],["documentos","Documentos"],["guia","Guia"],["relatorios","Relatórios"]];
  if(ehGestor()) t.push(["equipe","Equipe"]);
  return t;
}
function renderCrm(app){
  if(!S.acessoVerificado){ app.innerHTML = `<div class="wrap carregando">Abrindo o CRM…</div>`; return; }
  if(!S.podeCrm) return renderEntrar(app, "entrar");
  if(!S.acessoPronto){ app.innerHTML = `<div class="wrap carregando">Abrindo o CRM…</div>`; return; }
  const abas = abasCrm();
  if(!abas.some(a=>a[0]===S.crmTab)) S.crmTab = "hoje";
  const chave = [S.papel, todosCorretores().map(c=>c._id+":"+c.nome).join(",")].join("|");
  let shell = $("#crm-shell");
  if(!shell || shell.dataset.k!==chave){ app.innerHTML = cascaHtml(); ligarCasca(); shell = $("#crm-shell"); shell.dataset.k = chave; }
  if($("#crm-cor")) $("#crm-cor").value = S.crmCorretor || "";
  $("#crm-tabs").innerHTML = abas.map(([k,n,b])=>`<button class="ctab ${S.crmTab===k?"on":""}" data-act="aba" data-v="${k}" ${S.crmTab===k?'aria-current="page"':""}>${n}${b?`<i class="badge tab">${b}</i>`:""}</button>`).join("");
  const corpo = $("#crm-corpo");
  preservar(corpo, ()=>({hoje:crmHoje, funil:crmFunil, leads:crmLeads, agenda:crmAgenda, imoveis:crmImoveis, avaliacoes:crmAvaliacoes, documentos:crmDocumentos, guia:crmGuia, relatorios:crmRelatorios, equipe:crmEquipe})[S.crmTab](corpo));
  if(!$("#crm-q-res").hidden) pintarBusca();
}
function cascaHtml(){
  return `<div class="crm-top" id="crm-shell">
    <div class="wrap crm-barra">
      <a class="crm-marca" href="#inicio" title="Ver o site">${SIMBOLO}<span>CRM</span></a>
      <div class="crm-busca"><input id="crm-q" type="search" placeholder="Buscar cliente ou imóvel" autocomplete="off" aria-label="Buscar no CRM"><div class="busca-res" id="crm-q-res" hidden></div></div>
      ${ehGestor()?`<label class="crm-filtro"><span class="m-oculta">Corretor</span><select id="crm-cor" aria-label="Corretor"><option value="">Todos</option>${todosCorretores().map(c=>`<option value="${esc(c._id)}">${esc(c.nome)}</option>`).join("")}</select></label>`:""}
      <button class="btn btn-ouro btn-sm m-oculta" data-act="novo-lead">+ Lead</button>
      <button class="btn btn-marca btn-sm m-oculta" data-act="novo-imovel">+ Imóvel</button>
      <details class="menu" id="crm-mais"><summary class="btn btn-linha btn-sm" aria-label="Mais opções">⋯</summary><div class="menu-lista dir">
        <button data-act="novo-imovel">Cadastrar imóvel</button>
        <button data-act="avisos">Ativar avisos de lead novo</button>
        <button data-act="instalar">Instalar no celular</button>
        <button data-act="csv">Baixar leads em planilha</button>
        <a href="#inicio">Ver o site</a>
        <button id="crm-sair">Sair</button>
      </div></details>
    </div>
    <nav class="wrap crm-tabs" id="crm-tabs" aria-label="Seções do CRM"></nav>
  </div>
  <section class="wrap sec crm-corpo" id="crm-corpo"></section>
  <button class="fab" data-act="novo-lead" aria-label="Cadastrar lead">+ Lead</button>`;
}
function ligarCasca(){
  const q = $("#crm-q");
  q.oninput = pintarBusca;
  q.onfocus = ()=>{ if(q.value.trim().length>1) pintarBusca(); };
  q.onkeydown = e=>{
    if(e.key==="Enter"){ const f = $("#crm-q-res").querySelector("[data-l],[data-i]"); if(f){ e.preventDefault(); f.click(); } }
    if(e.key==="Escape"){ q.value=""; $("#crm-q-res").hidden = true; q.blur(); }
  };
  if($("#crm-cor")) $("#crm-cor").onchange = e=>{ S.crmCorretor = e.target.value; render(); };
}
function pintarBusca(){
  const q = $("#crm-q"), res = $("#crm-q-res"); if(!q) return;
  const t = norm(q.value.trim()); if(t.length<2){ res.hidden = true; return; }
  const dig = soDig(t);
  const L = leadsF().filter(l=>norm([l.nome,l.email,(l.tags||[]).join(" "),l.imovelTitulo,l.interesse].join(" ")).includes(t) || (dig.length>=4 && soDig(l.celular).includes(dig))).slice(0,6);
  const I = imoveisF().filter(i=>norm([i.codigo,i.titulo,i.bairro,i.categoria].join(" ")).includes(t)).slice(0,5);
  res.innerHTML = (L.length ? `<div class="br-g">Clientes</div>` + L.map(l=>`<button data-l="${esc(l._id)}"><b>${esc(l.nome)}</b><small>${esc(fmtCel(l.celular))} · ${esc(nomeEtapa(l.etapa))}</small></button>`).join("") : "")
    + (I.length ? `<div class="br-g">Imóveis</div>` + I.map(i=>`<button data-i="${esc(i._id)}"><b>${esc(i.codigo)} · ${esc(i.titulo)}</b><small>${esc(i.bairro||"")} · ${brl(i.preco)}</small></button>`).join("") : "")
    || `<div class="nota" style="padding:12px">Nada encontrado.</div>`;
  res.hidden = false;
}
/* Recria um trecho da tela sem perder o que está sendo digitado (campos com data-rascunho), o foco e os blocos abertos. */
function preservar(el, fn){
  const at = document.activeElement, ativo = at && at.id && el.contains(at) ? at.id : null;
  let sel = null; try{ if(ativo) sel = [at.selectionStart, at.selectionEnd]; }catch(e){}
  const vals = {}; el.querySelectorAll("[data-rascunho][id]").forEach(x=>{ vals[x.id] = x.type==="checkbox" ? x.checked : x.value; });
  const det = {}; el.querySelectorAll("details[id]").forEach(d=>{ det[d.id] = d.open; });
  fn();
  Object.entries(vals).forEach(([id,v])=>{ const x = document.getElementById(id); if(x && el.contains(x)){ if(x.type==="checkbox") x.checked = v; else x.value = v; } });
  Object.entries(det).forEach(([id,o])=>{ const d = document.getElementById(id); if(d && el.contains(d)) d.open = o; });
  if(ativo){ const x = document.getElementById(ativo); if(x && el.contains(x)){ x.focus({preventScroll:true}); try{ if(sel && sel[0]!=null) x.setSelectionRange(sel[0], sel[1]); }catch(e){} } }
}

/* ---------- cliques do CRM (um só ouvinte para tudo) ---------- */
document.addEventListener("click", e=>{
  if(!e.target.closest) return;
  document.querySelectorAll("details.menu[open]").forEach(d=>{ if(!d.contains(e.target)) d.open = false; });
  const res = $("#crm-q-res"); if(res && !res.hidden && !e.target.closest(".crm-busca")) res.hidden = true;
  if(e.target.id==="crm-sair"){ sairCrm(); return; }
  const t = e.target.closest("[data-wa],[data-act],[data-l],[data-i]");
  if(!t || !t.closest("#crm-shell, #crm-corpo, #gaveta, #doc-tela, #av-tela, #toasts, .fab")) return;
  const menu = t.closest("details.menu"); if(menu && t.tagName!=="SUMMARY") menu.open = false;
  if(res && t.closest("#crm-q-res")){ res.hidden = true; $("#crm-q").value = ""; }
  if(t.dataset.wa){ const d = {...t.dataset}; setTimeout(()=>registrarModelo(d.lead, d.wa, d), 60); return; }
  if(t.dataset.act){ if(t.tagName!=="A") e.preventDefault(); acao(t.dataset.act, t.dataset, t); return; }
  if(t.dataset.l){ e.preventDefault(); abrirLead(t.dataset.l); return; }
  if(t.dataset.i){ e.preventDefault(); abrirImovel(t.dataset.i); return; }
});
document.addEventListener("keydown", e=>{
  if(rota().nome!=="crm" || $("#gaveta") || $("#doc-tela") || $("#av-tela")) return;
  const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||"");
  if((e.key==="k" && (e.ctrlKey||e.metaKey)) || (e.key==="/" && !digitando)){ const q=$("#crm-q"); if(q){ e.preventDefault(); q.focus(); } }
});
async function sairCrm(){ await MF.sair(); S.podeCrm = false; S.acessoPronto = false; $("#link-crm").hidden = true; location.hash = "#inicio"; }

async function acao(nome, d, el){
  if(nome.startsWith("doc-")) return acaoDoc(nome, d, el);
  if(nome.startsWith("av-")) return acaoAv(nome, d, el);
  if(nome.startsWith("gu-")) return acaoGu(nome, d, el);
  const id = d.lead;
  const l = id ? S.leads.find(x=>x._id===id) : null;
  switch(nome){
    case "aba": S.crmTab = d.v; render(); window.scrollTo(0,0); return;
    case "fechar": fecharGaveta(); return;
    case "novo-lead": abrirLead(null); return;
    case "novo-imovel": abrirImovel(null); return;
    case "avisos": pedirAvisos(); return;
    case "instalar": instalarApp(); return;
    case "csv": exportarCsv(); return;
    case "imprimir": window.print(); return;
    case "ag-filtro": S.agFiltro = d.v; render(); return;
    case "ag-nova": escolherLeadParaVisita(); return;
    case "rel-mes": S.relMes = d.v; render(); return;
    case "adiar": if(l){ await salvarLead(id, {proximoContato: quando("amanha")}); toast(`Retorno de ${esc(primeiroNome(l.nome))} passou para amanhã às 9h.`); } return;
    case "prox": if(l) salvarLead(id, {proximoContato: d.v ? quando(d.v) : ""}); return;
    case "etapa": mudarEtapa(id, d.v); return;
    case "temp": if(l && l.temperatura!==d.v) salvarLead(id, {temperatura:d.v}, [{tipo:"Termômetro", texto:`Termômetro: ${l.temperatura||"-"} → ${d.v}.`}]); return;
    case "rapido": registroRapido(id, d.k); return;
    case "ligou": S.ligacao = id; setTimeout(pintarLeadDin, 400); return;
    case "nao-atendeu": S.ligacao = null; registroRapido(id, "naoatendeu"); return;
    case "atendeu": S.ligacao = null; pintarLeadDin(); if($("#h-tipo")){ $("#h-tipo").value = "Ligação"; $("#h-txt").value = "Conversamos por telefone: "; focarFim($("#h-txt")); } return;
    case "agendar": S.agendando = id; S.fbVisita = null; if(!S.gav || S.gav.id!==id) abrirLead(id); else pintarLeadDin(); setTimeout(()=>{ const x=$("#v-quando"); if(x){ x.scrollIntoView({block:"center"}); x.focus(); } }, 50); return;
    case "agendar-cancelar": S.agendando = null; pintarLeadDin(); return;
    case "realizada": S.fbVisita = d.visita; S.agendando = null; if(!S.gav || S.gav.id!==id) abrirLead(id); else pintarLeadDin(); setTimeout(()=>{ const x=$("#fb-txt"); if(x){ x.scrollIntoView({block:"center"}); x.focus(); } }, 50); return;
    case "fb-cancelar": S.fbVisita = null; pintarLeadDin(); return;
    case "fb": { const x = $("#fb-txt"); if(x){ x.value = (x.value ? x.value.replace(/\.?\s*$/,". ") : "") + d.v + "."; focarFim(x); } return; }
    case "cancelar-visita": if(l){ if(el.dataset.ok!=="1"){ el.dataset.ok="1"; el.textContent="Confirmar cancelamento"; return; }
        const v = (l.visitas||[]).find(x=>x.id===d.visita);
        salvarLead(id, {visitas:(l.visitas||[]).map(x=>x.id===d.visita?{...x, status:"cancelada"}:x)}, [{tipo:"Nota", texto:`Visita de ${dataHoraBR(v&&v.quando)} cancelada.`}]); } return;
    case "excluir-lead": if(el.dataset.ok!=="1"){ el.dataset.ok="1"; el.textContent="Clique de novo para excluir"; return; }
      try{ await S.db.collection("leads").doc(id).delete(); fecharGaveta(); toast("Lead excluído."); }catch(err){ toast("Não foi possível excluir."); } return;
    case "virar-imovel": if(l){ const ped = l.avaliacao ? avImovelDoPedido(l) : {};
      abrirImovel(null, {...ped, priv:{proprietario:l.nome, proprietarioCel:fmtCel(l.celular), proprietarioEmail:l.email||"", origemLead:l._id, obsInternas:l.mensagem||"", ...(ped.priv||{})}}); } return;
    case "lead-visita": S.agendando = d.lead; abrirLead(d.lead); setTimeout(()=>{ const x=$("#v-quando"); if(x){ x.scrollIntoView({block:"center"}); x.focus(); } }, 50); return;
  }
}
function focarFim(x){ x.focus(); const n = x.value.length; try{ x.setSelectionRange(n,n); }catch(e){} }

/* ---------- gravações ---------- */
async function salvarLead(id, up, hist){
  const l = S.leads.find(x=>x._id===id); if(!l) return false;
  if(hist && hist.length) up.historico = [...(l.historico||[]), ...hist.map(h=>({quando:hoje(), ...h}))];
  up.atualizadoEm = hoje();
  Object.assign(l, up);
  if(rota().nome==="crm") render();
  repintarGaveta();
  try{ await S.db.collection("leads").doc(id).update(up); return true; }
  catch(e){ toast("Não foi possível salvar. Verifique a internet e tente de novo."); return false; }
}
function aposContato(l, up, hist){
  up.ultimoContato = hoje();
  if(l.etapa==="novo"){ up.etapa = "atendimento"; hist.push({tipo:"Funil", de:"novo", para:"atendimento", texto:'Movido de "Novo" para "Em atendimento".'}); }
}
async function registrarModelo(id, modelo, d){
  const l = S.leads.find(x=>x._id===id); if(!l) return;
  const im = imovelPorId(d.imovel);
  const hist = [{tipo:"WhatsApp", texto:`Mensagem "${NOMES_MODELO[modelo]||modelo}" aberta no WhatsApp${im?` (${im.codigo} · ${im.titulo})`:""}.`}];
  const up = {};
  aposContato(l, up, hist);
  if(modelo==="imovel" && im) up.enviados = [...(l.enviados||[]).filter(e=>e.imovelId!==im._id), {imovelId:im._id, quando:hoje()}];
  if(modelo==="visita" && d.visita) up.visitas = (l.visitas||[]).map(v=>v.id===d.visita ? {...v, confirmacao:hoje()} : v);
  let msg = "Registrado no histórico.";
  if(["primeiro","retomar","imovel","livre"].includes(modelo) && (!l.proximoContato || new Date(l.proximoContato) < new Date())){
    up.proximoContato = quando("2d"); msg = `Registrado. Próximo contato: ${diaFrase(up.proximoContato)} às 9h.`;
  }
  await salvarLead(id, up, hist);
  toast(msg, S.gav && S.gav.id===id ? null : {rotulo:"Abrir lead", fn:()=>abrirLead(id)});
}
async function registroRapido(id, k){
  const l = S.leads.find(x=>x._id===id); const r = RAPIDOS.find(x=>x.k===k); if(!l || !r) return;
  if(!r.direto){ if(!S.gav || S.gav.id!==id) abrirLead(id); const h=$("#h-txt"); if(h){ $("#h-tipo").value = r.tipo; h.value = r.txt; h.scrollIntoView({block:"center"}); focarFim(h); } return; }
  const hist = [{tipo:r.tipo, texto:r.txt}], up = {};
  aposContato(l, up, hist);
  if(r.prox) up.proximoContato = quando(r.prox);
  if(r.temp && l.temperatura!==r.temp){ up.temperatura = r.temp; hist.push({tipo:"Termômetro", texto:`Termômetro: ${l.temperatura||"-"} → ${r.temp}.`}); }
  if(r.agendar){ S.agendando = id; }
  await salvarLead(id, up, hist);
  toast(r.prox ? `Registrado. Próximo contato: ${diaFrase(up.proximoContato)} às ${horaBR(up.proximoContato)}.` : "Registrado no histórico.");
  if(r.agendar) setTimeout(()=>{ const x=$("#v-quando"); if(x){ x.scrollIntoView({block:"center"}); x.focus(); } }, 60);
}
async function mudarEtapa(id, para){
  const l = S.leads.find(x=>x._id===id); if(!l || l.etapa===para) return;
  const up = {etapa:para};
  if(para==="fechado" && !l.dataFechamento) up.dataFechamento = hoje().slice(0,10);
  if(para==="perdido") up.dataPerda = hoje();
  if(!aberto({etapa:para})) up.proximoContato = "";
  await salvarLead(id, up, [{tipo:"Funil", de:l.etapa, para, texto:`Movido de "${nomeEtapa(l.etapa)}" para "${nomeEtapa(para)}".`}]);
  if(para==="fechado" || para==="perdido"){
    if(!S.gav || S.gav.id!==id) abrirLead(id);
    toast(para==="fechado" ? "Parabéns pelo negócio! Anote o valor e a comissão no lead." : "Anote o motivo da perda no lead. Isso aparece no relatório do mês.");
  }
}

/* ---------- Hoje ---------- */
function crmHoje(el){
  const L = leadsF().filter(aberto), fim = fimDoDia(), ini = inicioDoDia();
  const novos = L.filter(semResposta).sort((a,b)=>(a.criadoEm||"").localeCompare(b.criadoEm||""));
  const retornos = L.filter(l=>!semResposta(l) && l.proximoContato && new Date(l.proximoContato)<=fim).sort((a,b)=>a.proximoContato.localeCompare(b.proximoContato));
  const visitas = todasVisitas().filter(v=>v.status==="agendada" && new Date(v.quando) < new Date(+ini+8*DIA)).sort((a,b)=>a.quando.localeCompare(b.quando));
  const visitasHoje = visitas.filter(v=>new Date(v.quando)<=fim);
  const esfriando = L.filter(l=>!semResposta(l) && !l.proximoContato && !(l.visitas||[]).some(v=>v.status==="agendada") && (Date.now()-new Date(ultimoContato(l)||l.atualizadoEm||l.criadoEm))/DIA > 7)
    .sort((a,b)=>(ultimoContato(a)||a.criadoEm||"").localeCompare(ultimoContato(b)||b.criadoEm||""));
  const capt = imoveisF().filter(i=>i.status!=="vendido").map(i=>[i, S.privado[i._id]]).filter(([i,p])=>p && p.autorizacaoValidade && diasAte(p.autorizacaoValidade)<=30)
    .sort((a,b)=>a[1].autorizacaoValidade.localeCompare(b[1].autorizacaoValidade));
  const h = new Date().getHours(), sauda = h<12 ? "Bom dia" : h<18 ? "Boa tarde" : "Boa noite";
  const nome = primeiroNome(corretorDe(S.crmCorretor || meuId()).nome);
  const avisos = "Notification" in window && Notification.permission==="default";
  const linha = (l, info, acoes) => `<div class="tarefa"><button class="t-info" data-l="${esc(l._id)}"><b>${esc(l.nome)}</b><small>${info}</small></button><div class="t-acoes">${acoes}</div></div>`;
  const interesse = l => esc(l.imovelTitulo || l.interesse || l.origem || "");
  const tudoEmDia = !novos.length && !retornos.length && !visitas.length && !esfriando.length && !capt.length;
  el.innerHTML = `
  <div class="hoje-topo"><div><h3>${sauda}, ${esc(nome)}</h3><p class="nota" style="font-size:14px">${new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p></div>
    <div class="resumo"><span class="${novos.length?"r-alerta":""}"><b class="tab">${novos.length}</b> para responder</span><span><b class="tab">${retornos.length}</b> ${retornos.length===1?"retorno":"retornos"}</span><span><b class="tab">${visitasHoje.length}</b> ${visitasHoje.length===1?"visita hoje":"visitas hoje"}</span></div></div>
  ${avisos?`<div class="aviso aviso-acao"><span><b>Quer saber na hora quando chegar lead pelo site?</b> Ative os avisos neste aparelho.</span><button class="btn btn-ouro btn-sm" data-act="avisos">Ativar avisos</button></div>`:""}
  ${tudoEmDia?`<div class="vazio">Tudo em dia por aqui. Nenhum cliente esperando resposta, retorno ou visita.</div>`:""}
  <div class="hoje-grid">
    ${novos.length?`<section class="bloco-card urgente"><h4>Responder agora <i class="tab">${novos.length}</i></h4><p class="nota">Leads que ainda não receberam nenhum contato. Quem responde primeiro, vende.</p>
      ${novos.map(l=>linha(l, `${interesse(l)} · <span class="${(Date.now()-new Date(l.criadoEm))>2*3600e3?"atraso":""}">chegou ${haQuanto(l.criadoEm)}</span>`, linkWa(l,"primeiro",{},`${ICO.whats} Responder`))).join("")}</section>`:""}
    ${retornos.length?`<section class="bloco-card"><h4>Retornos de hoje <i class="tab">${retornos.length}</i></h4>
      ${retornos.map(l=>linha(l, `<span class="${atrasado(l)?"atraso":""}">${atrasado(l)&&new Date(l.proximoContato)<inicioDoDia()?diaRotulo(l.proximoContato)+" ":""}${horaBR(l.proximoContato)}</span> · ${esc(nomeEtapa(l.etapa))}${ultimoTexto(l)}`,
        linkWa(l,"livre",{},ICO.whats,"btn btn-whats btn-sm btn-ico")+`<button class="btn btn-linha btn-sm" data-act="adiar" data-lead="${esc(l._id)}">Amanhã</button>`)).join("")}</section>`:""}
    ${visitas.length?`<section class="bloco-card"><h4>Visitas <i class="tab">${visitas.length}</i></h4>
      ${visitas.map(v=>{ const passou = new Date(v.quando) < new Date(); return linha(v.lead, `<span class="${passou?"atraso":""}">${diaRotulo(v.quando)} ${horaBR(v.quando)}</span> · ${esc(v.imovelTitulo||"imóvel a definir")}${v.confirmacao?' · <span class="ok-txt">confirmação enviada</span>':""}`,
        passou ? `<button class="btn btn-ouro btn-sm" data-act="realizada" data-lead="${esc(v.lead._id)}" data-visita="${esc(v.id)}">Como foi?</button>`
               : linkWa(v.lead,"visita",{visita:v},`${ICO.whats} Confirmar`)); }).join("")}</section>`:""}
    ${esfriando.length?`<section class="bloco-card"><h4>Clientes esfriando <i class="tab">${esfriando.length}</i></h4><p class="nota">Sem contato há mais de 7 dias e sem retorno marcado.</p>
      ${esfriando.slice(0,8).map(l=>linha(l, `último contato ${haQuanto(ultimoContato(l)||l.criadoEm)} · ${esc(nomeEtapa(l.etapa))}`, linkWa(l,"retomar",{},`${ICO.whats} Retomar`))).join("")}
      ${esfriando.length>8?`<p class="nota">E mais ${esfriando.length-8} na aba Leads.</p>`:""}</section>`:""}
    ${capt.length?`<section class="bloco-card"><h4>Autorizações vencendo <i class="tab">${capt.length}</i></h4>
      ${capt.map(([i,p])=>`<div class="tarefa"><button class="t-info" data-i="${esc(i._id)}"><b>${esc(i.codigo)} · ${esc(i.titulo)}</b><small>${badgeAut(p)}${p.proprietario?` · ${esc(p.proprietario)}`:""}</small></button><div class="t-acoes">${p.proprietarioCel?`<a class="btn btn-whats btn-sm" target="_blank" rel="noopener" href="${esc(waLink(msgProprietario(i,p), celIntl(p.proprietarioCel)))}">${ICO.whats} Proprietário</a>`:""}</div></div>`).join("")}</section>`:""}
  </div>`;
}
function ultimoTexto(l){ const h = [...(l.historico||[])].reverse().find(x=>CONTATOS_REAIS.includes(x.tipo)||x.tipo==="Nota"); return h ? ` · “${esc(String(h.texto).slice(0,60))}${String(h.texto).length>60?"…":""}”` : ""; }

/* ---------- mensagens prontas ---------- */
function msgModelo(id, l, ctx={}){
  const pn = primeiroNome(l.nome), eu = corretorDe(l.corretorId||"fernando").nome;
  const im = ctx.imovel || imovelPorId(l.imovelId), v = ctx.visita;
  switch(id){
    case "primeiro": return `Olá ${pn}, tudo bem? Aqui é ${eu}, da Monfernatti Imóveis. ` + (l.avaliacao ? msgPrimeiroAvaliacao(l) : l.interesse==="Captação"
      ? "Recebi seu pedido para anunciar seu imóvel. Podemos combinar uma visita para a avaliação e as fotos?"
      : im ? `Recebi seu interesse no imóvel ${im.titulo} (cód. ${im.codigo}). Posso te mandar mais detalhes ou já agendar uma visita?`
      : "Recebi seu contato. Me conta o que você procura que eu separo as melhores opções.");
    case "imovel": return `Olá ${pn}! Separei este imóvel que combina com o que você procura: ${descImovel(im)}.\nFotos e detalhes: ${linkImovel(im)}\nO que achou?`;
    case "visita": return `Olá ${pn}, tudo certo para a nossa visita${v.imovelTitulo?` ao imóvel ${v.imovelTitulo}`:""} ${diaFrase(v.quando)} às ${horaBR(v.quando)}? Qualquer imprevisto, me avise por aqui.`;
    case "posvisita": return `Olá ${pn}, obrigado pela visita${v&&v.imovelTitulo?` ao imóvel ${v.imovelTitulo}`:""}! O que achou? Se quiser, faço a simulação do financiamento ou separo outras opções parecidas.`;
    case "retomar": return `Olá ${pn}, tudo bem? Aqui é ${eu}, da Monfernatti Imóveis. Você ainda está procurando imóvel? Chegaram opções novas e lembrei de você.`;
    default: return `Olá ${pn}, `;
  }
}
function linkWa(l, modelo, ctx={}, rotulo, cls="btn btn-whats btn-sm"){
  return `<a class="${cls}" target="_blank" rel="noopener" href="${esc(waLink(msgModelo(modelo,l,ctx), celIntl(l.celular)))}" data-wa="${modelo}" data-lead="${esc(l._id)}"${ctx.imovel?` data-imovel="${esc(ctx.imovel._id)}"`:""}${ctx.visita?` data-visita="${esc(ctx.visita.id)}"`:""} title="${esc(NOMES_MODELO[modelo]||"WhatsApp")}">${rotulo||ICO.whats+" WhatsApp"}</a>`;
}
function msgProprietario(i, p){
  const desde = Date.now()-30*DIA;
  const n = S.leads.filter(l=>l.imovelId===i._id && new Date(l.criadoEm)>=desde).length;
  const v = S.leads.flatMap(l=>l.visitas||[]).filter(x=>x.imovelId===i._id && x.status==="realizada" && new Date(x.quando)>=desde).length;
  const eu = corretorDe(i.corretorId||"fernando").nome;
  return `Olá ${primeiroNome(p.proprietario)}, tudo bem? Aqui é ${eu}, da Monfernatti Imóveis. Passando para atualizar sobre o seu imóvel ${i.titulo} (cód. ${i.codigo}): nos últimos 30 dias tivemos ${n} ${n===1?"cliente interessado":"clientes interessados"} e ${v} ${v===1?"visita":"visitas"}. Sigo divulgando e te mantenho informado.`;
}

/* ---------- Funil ---------- */
function crmFunil(el){
  el.innerHTML = `<p class="nota" style="margin-top:0">Arraste os cartões entre as etapas, ou abra o lead e toque na etapa.</p>
  <div class="kanban">${ETAPAS.map(e=>{
    const l = leadsF().filter(x=>x.etapa===e.id).sort((a,b)=>(b.atualizadoEm||"").localeCompare(a.atualizadoEm||""));
    return `<div class="col" data-etapa="${e.id}"><h4>${e.nome}<i class="tab">${l.length}</i></h4>
      ${l.map(x=>`<button class="lc" draggable="true" data-l="${esc(x._id)}"><b>${esc(x.nome)}</b>
        <small>${esc(x.imovelTitulo||x.interesse||x.origem||"")}</small>
        ${(x.tags||[]).length?`<span class="tags-mini">${x.tags.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join("")}</span>`:""}
        <span class="lc-pe"><span style="display:flex;gap:6px;align-items:center"><span class="mini-av" title="${esc(corretorDe(x.corretorId).nome)}">${esc(iniciais(corretorDe(x.corretorId).nome))}</span><span class="termo t-${esc(x.temperatura||"morno")}">${esc(x.temperatura||"morno")}</span></span>${semResposta(x)?`<small class="atraso">sem resposta</small>`:x.proximoContato?`<small class="${atrasado(x)?"atraso":""} tab">${dataHoraBR(x.proximoContato)}</small>`:""}</span></button>`).join("")}
    </div>`;}).join("")}</div>`;
  el.querySelectorAll(".lc").forEach(c=>{ c.ondragstart = ev=>ev.dataTransfer.setData("text/plain", c.dataset.l); });
  el.querySelectorAll(".col").forEach(col=>{
    col.ondragover = ev=>{ ev.preventDefault(); col.classList.add("drop"); };
    col.ondragleave = ()=>col.classList.remove("drop");
    col.ondrop = ev=>{ ev.preventDefault(); col.classList.remove("drop"); mudarEtapa(ev.dataTransfer.getData("text/plain"), col.dataset.etapa); };
  });
}

/* ---------- Leads ---------- */
function leadsFiltrados(){
  const f = S.fl || (S.fl = {q:"", etapa:"", temp:"", origem:"", tag:""});
  const q = norm(f.q), dig = soDig(f.q);
  return leadsF().filter(x=>
    (!q || norm([x.nome,x.email,x.imovelTitulo,x.interesse,(x.tags||[]).join(" ")].join(" ")).includes(q) || (dig.length>=4 && soDig(x.celular).includes(dig))) &&
    (!f.etapa || (f.etapa==="abertos" ? aberto(x) : x.etapa===f.etapa)) &&
    (!f.temp || (x.temperatura||"morno")===f.temp) && (!f.origem || x.origem===f.origem) && (!f.tag || (x.tags||[]).includes(f.tag))
  ).sort((a,b)=>(b.criadoEm||"").localeCompare(a.criadoEm||""));
}
function todasEtiquetas(){ return [...new Set([...ETIQUETAS_BASE, ...S.leads.flatMap(l=>l.tags||[])])].sort((a,b)=>a.localeCompare(b)); }
function crmLeads(el){
  const f = S.fl || (S.fl = {q:"", etapa:"", temp:"", origem:"", tag:""});
  const l = leadsFiltrados();
  const sel = (id, rot, ops) => `<label>${rot}<select id="${id}">${ops}</select></label>`;
  el.innerHTML = `<div class="filtros" style="margin-bottom:14px">
    <label style="flex:2 1 220px">Buscar<input id="fl-q" type="search" placeholder="Nome, telefone, imóvel ou etiqueta" value="${esc(f.q)}"></label>
    ${sel("fl-etapa","Etapa",`<option value="">Todas</option><option value="abertos" ${f.etapa==="abertos"?"selected":""}>Só em aberto</option>${ETAPAS.map(e=>`<option value="${e.id}" ${f.etapa===e.id?"selected":""}>${e.nome}</option>`).join("")}`)}
    ${sel("fl-temp","Termômetro",`<option value="">Todos</option>${["quente","morno","frio"].map(t=>`<option ${f.temp===t?"selected":""}>${t}</option>`).join("")}`)}
    ${sel("fl-origem","Origem",`<option value="">Todas</option>${ORIGENS.map(o=>`<option ${f.origem===o?"selected":""}>${esc(o)}</option>`).join("")}`)}
    ${sel("fl-tag","Etiqueta",`<option value="">Todas</option>${todasEtiquetas().map(t=>`<option ${f.tag===t?"selected":""}>${esc(t)}</option>`).join("")}`)}
    <button class="btn btn-linha btn-sm" data-act="csv" style="align-self:end">Baixar planilha</button>
  </div>
  <p class="nota" style="margin:-4px 0 10px">${l.length} ${l.length===1?"lead":"leads"}</p>
  ${l.length?`<div class="tabela-wrap"><table class="t-leads"><thead><tr><th>Nome</th><th>Celular</th><th class="m-oculta">Interesse</th>${ehGestor()?'<th class="m-oculta">Corretor</th>':""}<th class="m-oculta">Origem</th><th>Etapa</th><th>Termômetro</th><th class="m-oculta">Último contato</th><th>Próx. contato</th></tr></thead><tbody>
  ${l.map(x=>`<tr class="click" data-l="${esc(x._id)}"><td><b>${esc(x.nome)}</b>${(x.tags||[]).length?`<span class="tags-mini">${x.tags.map(t=>`<span>${esc(t)}</span>`).join("")}</span>`:""}</td><td class="tab">${esc(fmtCel(x.celular))}</td><td class="m-oculta">${esc(x.imovelTitulo||x.interesse||"")}</td>${ehGestor()?`<td class="m-oculta">${esc(corretorDe(x.corretorId).nome)}</td>`:""}<td class="m-oculta">${esc(x.origem)}</td><td>${esc(nomeEtapa(x.etapa))}</td><td><span class="termo t-${esc(x.temperatura||"morno")}">${esc(x.temperatura||"morno")}</span></td><td class="tab m-oculta">${semResposta(x)?'<span class="atraso">nunca</span>':dataBR(ultimoContato(x))}</td><td class="tab ${atrasado(x)?"atraso":""}">${dataHoraBR(x.proximoContato)}</td></tr>`).join("")}
  </tbody></table></div>`:`<div class="vazio">${S.leads.length?"Nenhum lead com esses filtros.":"Nenhum lead ainda. Os contatos do site entram aqui sozinhos, e você pode cadastrar um em \"+ Lead\"."}</div>`}`;
  $("#fl-q").oninput = e=>{ f.q = e.target.value; crmLeads(el); };
  [["fl-etapa","etapa"],["fl-temp","temp"],["fl-origem","origem"],["fl-tag","tag"]].forEach(([id,k])=>{ $("#"+id).onchange = e=>{ f[k] = e.target.value; crmLeads(el); }; });
  const b = $("#fl-q"); if(document.activeElement===document.body && f.q){ b.focus(); }
  if(S._flFoco){ b.focus(); const n=b.value.length; b.setSelectionRange(n,n); }
  b.onfocus = ()=>{ S._flFoco = true; }; b.onblur = ()=>{ S._flFoco = false; };
}
function exportarCsv(){
  const cols = [["nome","Nome"],["celular","Celular"],["email","E-mail"],["origem","Origem"],["etapa","Etapa"],["temperatura","Termômetro"],["imovelTitulo","Imóvel de interesse"],["corretor","Corretor"],["tags","Etiquetas"],["criadoEm","Entrou em"],["ultimo","Último contato"],["proximoContato","Próximo contato"],["mensagem","Observações"]];
  const fmt = v => /^\d{4}-\d{2}-\d{2}T/.test(String(v||"")) ? new Date(v).toLocaleString("pt-BR") : v;
  const linhas = (S.crmTab==="leads" ? leadsFiltrados() : leadsF()).map(l=>({...l, celular:fmtCel(l.celular), etapa:nomeEtapa(l.etapa), corretor:corretorDe(l.corretorId).nome, tags:(l.tags||[]).join(", "), ultimo:ultimoContato(l)}));
  const csv = "﻿" + [cols.map(c=>c[1]).join(";"), ...linhas.map(l=>cols.map(([k])=>`"${String(fmt(l[k])??"").replace(/"/g,'""')}"`).join(";"))].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download = `leads-monfernatti-${hoje().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
}

/* ---------- Agenda ---------- */
function crmAgenda(el){
  const filtro = S.agFiltro || "tudo", ini = inicioDoDia(), limite = +ini + 31*DIA;
  const itens = [];
  todasVisitas().forEach(v=>{ if(v.status==="cancelada" || (v.status==="realizada" && new Date(v.quando)<ini)) return; if(+new Date(v.quando)<limite) itens.push({tipo:"visita", quando:v.quando, v, l:v.lead}); });
  if(filtro!=="visitas") leadsF().filter(l=>aberto(l) && l.proximoContato && +new Date(l.proximoContato)<limite).forEach(l=>itens.push({tipo:"retorno", quando:l.proximoContato, l}));
  itens.sort((a,b)=>a.quando.localeCompare(b.quando));
  const grupos = new Map();
  itens.forEach(it=>{ const k = new Date(it.quando) < ini ? "atrasados" : inicioDoDia(new Date(it.quando)).toISOString(); if(!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(it); });
  el.innerHTML = `<div class="ag-topo"><div class="chips">${[["tudo","Visitas e retornos"],["visitas","Só visitas"]].map(([k,r])=>`<button class="chip ${filtro===k?"on":""}" data-act="ag-filtro" data-v="${k}">${r}</button>`).join("")}</div>
    <button class="btn btn-ouro btn-sm" data-act="ag-nova">+ Agendar visita</button></div>
  ${itens.length?[...grupos].map(([k,l])=>`<section class="ag-dia"><h4>${k==="atrasados"?'<span class="atraso">Pendentes de dias anteriores</span>':esc(diaRotulo(k)==="Hoje"||diaRotulo(k)==="Amanhã" ? diaRotulo(k)+" · "+new Date(k).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"}) : new Date(k).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"}))}</h4>
    ${l.map(it=>{ const passou = new Date(it.quando) < new Date();
      if(it.tipo==="visita"){ const v = it.v;
        return `<div class="tarefa"><span class="ag-hora tab">${horaBR(it.quando)}</span><button class="t-info" data-l="${esc(it.l._id)}"><b><span class="ag-tipo ag-vis">Visita</span> ${esc(it.l.nome)}</b><small>${esc(v.imovelTitulo||"imóvel a definir")}${v.status==="realizada"?' · <span class="ok-txt">realizada</span>':v.confirmacao?' · <span class="ok-txt">confirmação enviada</span>':""}</small></button>
          <div class="t-acoes">${v.status==="agendada" ? (passou ? `<button class="btn btn-ouro btn-sm" data-act="realizada" data-lead="${esc(it.l._id)}" data-visita="${esc(v.id)}">Como foi?</button>` : linkWa(it.l,"visita",{visita:v},`${ICO.whats} Confirmar`) + `<a class="btn btn-linha btn-sm" target="_blank" rel="noopener" href="${esc(linkAgendaGoogle(v, it.l))}" title="Salvar na Agenda Google">Agenda</a>`) : ""}</div></div>`;
      }
      return `<div class="tarefa"><span class="ag-hora tab ${passou?"atraso":""}">${horaBR(it.quando)}</span><button class="t-info" data-l="${esc(it.l._id)}"><b><span class="ag-tipo">Retorno</span> ${esc(it.l.nome)}</b><small>${esc(nomeEtapa(it.l.etapa))}${ultimoTexto(it.l)}</small></button>
        <div class="t-acoes">${linkWa(it.l,"livre",{},ICO.whats,"btn btn-whats btn-sm btn-ico")}<button class="btn btn-linha btn-sm" data-act="adiar" data-lead="${esc(it.l._id)}">Amanhã</button></div></div>`;
    }).join("")}</section>`).join("") : `<div class="vazio">Nada marcado para os próximos 30 dias. Agende visitas pelo lead ou pelo botão acima.</div>`}`;
}
function linkAgendaGoogle(v, l){
  const a = new Date(v.quando), b = new Date(+a + 60*60e3), f = d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const im = imovelPorId(v.imovelId);
  const p = new URLSearchParams({action:"TEMPLATE", text:`Visita · ${primeiroNome(l.nome)}${im?` · cód. ${im.codigo}`:""}`, dates:`${f(a)}/${f(b)}`, details: im ? linkImovel(im) : "", location: im ? [im.bairro, im.cidade].filter(Boolean).join(", ") : ""});
  return "https://calendar.google.com/calendar/render?" + p;
}
function escolherLeadParaVisita(){
  const L = leadsF().filter(aberto).sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
  gaveta(`<div class="ld-linha1"><h2>Agendar visita</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>
    <p class="nota" style="margin:0">Escolha o cliente. Se ele ainda não está no CRM, cadastre em "+ Lead" primeiro.</p>
    <input id="vl-q" class="campo-solto" type="search" placeholder="Buscar cliente" autocomplete="off">
    <div class="lista-sel" id="vl-lista"></div>`);
  const pintar = ()=>{ const q = norm($("#vl-q").value); $("#vl-lista").innerHTML = L.filter(l=>!q || norm(l.nome+" "+l.celular).includes(q)).slice(0,40).map(l=>`<button data-act="lead-visita" data-lead="${esc(l._id)}"><b>${esc(l.nome)}</b><small>${esc(fmtCel(l.celular))} · ${esc(nomeEtapa(l.etapa))}</small></button>`).join("") || '<div class="nota">Nenhum cliente encontrado.</div>'; };
  $("#vl-q").oninput = pintar; pintar(); $("#vl-q").focus();
}

/* ---------- Imóveis ---------- */
function badgeAut(p){
  if(!p || (!p.autorizacaoValidade && !p.autorizacaoTipo)) return '<span class="nota">—</span>';
  if(p.autorizacaoTipo==="nenhuma") return '<span class="status st-aviso">Sem autorização</span>';
  if(!p.autorizacaoValidade) return `<span class="status">${esc(TIPOS_AUT[p.autorizacaoTipo]||"Autorização")}</span>`;
  const d = diasAte(p.autorizacaoValidade);
  if(d<0) return `<span class="status st-venc">Vencida em ${dataCurta(p.autorizacaoValidade)}</span>`;
  if(d<=30) return `<span class="status st-aviso">Vence em ${d} ${d===1?"dia":"dias"}</span>`;
  return `<span class="status">${esc(TIPOS_AUT[p.autorizacaoTipo]||"Autorização")} até ${dataCurta(p.autorizacaoValidade)}</span>`;
}
function crmImoveis(el){
  const l = [...imoveisF()].sort((a,b)=>String(b.codigo).localeCompare(String(a.codigo)));
  el.innerHTML = l.length?`<div class="tabela-wrap"><table><thead><tr><th></th><th>Cód.</th><th>Imóvel</th><th class="m-oculta">Bairro</th><th>Valor</th><th>Status</th><th class="m-oculta">Autorização</th><th class="m-oculta" title="Leads interessados neste imóvel">Leads</th><th class="m-oculta" title="Clientes cujo perfil combina com este imóvel">Combinam</th></tr></thead><tbody>
  ${l.map(i=>`<tr class="click" data-i="${esc(i._id)}"><td>${(i.fotos||[])[0]?`<img src="${esc(i.fotos[0])}" alt="" style="width:56px;height:40px;object-fit:cover;border-radius:4px;display:block">`:""}</td><td class="tab">${esc(i.codigo)}</td><td><b>${esc(i.titulo)}</b>${i.destaque?' <span class="status" style="color:var(--ouro-forte)">Destaque</span>':""}<br><small class="nota">${esc(i.categoria||"")}</small></td><td class="m-oculta">${esc(i.bairro)}</td><td class="tab">${brl(i.preco)}</td><td><span class="status st-${esc(i.status||"disponivel")}">${esc(rotStatus(i.status))}</span></td><td class="m-oculta">${badgeAut(S.privado[i._id])}</td><td class="tab m-oculta">${S.leads.filter(x=>x.imovelId===i._id).length}</td><td class="tab m-oculta">${clientesQueCombinam(i).length||""}</td></tr>`).join("")}
  </tbody></table></div>`:`<div class="vazio">Nenhum imóvel cadastrado. Use "+ Imóvel" para o primeiro.</div>`;
}

/* ---------- cliente x imóvel ---------- */
function temPerfil(l){ const p = l.perfil||{}; return !!(p.finalidade || (p.categorias||[]).length || p.precoMax || p.precoMin || p.quartosMin || p.bairros); }
function perfilEfetivo(l){
  if(temPerfil(l)) return {...l.perfil, _explicito:true};
  const im = imovelPorId(l.imovelId); if(!im) return null;
  return {finalidade:im.finalidade, categorias:im.categoria?[im.categoria]:[], precoMin:im.preco?im.preco*0.7:0, precoMax:im.preco?im.preco*1.3:0, _explicito:false};
}
function pontua(p, i){
  if(!p || i.status==="vendido" || i.status==="oculto") return -1;
  let s = 0;
  if(p.finalidade && (i.finalidade||"venda")!==p.finalidade) return -1;
  if((p.categorias||[]).length){ if(!p.categorias.includes(i.categoria)) return -1; s += 2; }
  if(p.precoMax && i.preco && i.preco > p.precoMax*1.1) return -1;
  if(p.precoMin && i.preco && i.preco < p.precoMin*0.8) return -1;
  if((p.precoMax||p.precoMin) && i.preco) s += 1;
  if(p.quartosMin && (Number(i.quartos)||0) < p.quartosMin) return -1;
  const bairros = String(p.bairros||"").split(/[,;]/).map(norm).map(s=>s.trim()).filter(Boolean);
  if(bairros.length) s += bairros.some(b=>norm(i.bairro).includes(b) || norm(i.cidade).includes(b)) ? 3 : -1;
  return s;
}
function imoveisQueCombinam(l){
  const p = perfilEfetivo(l); if(!p) return [];
  return S.imoveis.filter(i=>i._id!==l.imovelId).map(i=>[i, pontua(p,i)]).filter(x=>x[1]>=0).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
}
function clientesQueCombinam(i){
  return leadsF().filter(l=>aberto(l) && l.imovelId!==i._id).map(l=>[l, pontua(perfilEfetivo(l), i)]).filter(x=>x[1]>=0).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}

/* ---------- Relatórios ---------- */
function mesesRel(){ const r = [], d = new Date(); d.setDate(1); for(let k=0;k<12;k++){ r.push({k:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, rot:d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}); d.setMonth(d.getMonth()-1); } return r; }
function barras(pares, cor="var(--ouro)"){
  if(!pares.length) return '<div class="nota">Sem dados no período.</div>';
  const max = Math.max(1, ...pares.map(p=>p[1]));
  return `<div class="br-lista">${pares.map(([r,n,txt])=>`<div class="br-linha"><span class="b-rot">${esc(r)}</span><span class="b-trilho"><span style="width:${n/max*100}%;background:${cor}"></span></span><b class="tab">${txt??n}</b></div>`).join("")}</div>`;
}
const contar = (lista, f) => { const m = new Map(); lista.forEach(x=>{ const k = f(x); if(k) m.set(k, (m.get(k)||0)+1); }); return [...m].sort((a,b)=>b[1]-a[1]); };
function crmRelatorios(el){
  const meses = mesesRel(); if(!S.relMes || !meses.some(m=>m.k===S.relMes)) S.relMes = meses[0].k;
  const [ano, mes] = S.relMes.split("-").map(Number), ini = new Date(ano, mes-1, 1), fim = new Date(ano, mes, 1);
  const dentro = s => { if(!s) return false; const d = dLocal(s); return d>=ini && d<fim; };
  const L = leadsF();
  const passou = (l, et) => (l.historico||[]).some(h=>h.tipo==="Funil" && dentro(h.quando) && (h.para===et || String(h.texto||"").includes(`para "${nomeEtapa(et)}"`)));
  const recebidos = L.filter(l=>dentro(l.criadoEm));
  const respondidos = recebidos.filter(l=>contatosDe(l).length);
  const med = mediana(respondidos.map(l=>new Date(contatosDe(l)[0].quando)-new Date(l.criadoEm)).filter(t=>t>=0));
  const vis = L.flatMap(l=>(l.visitas||[]).filter(v=>dentro(v.quando)).map(v=>({...v, l})));
  const realizadas = vis.filter(v=>v.status==="realizada");
  const propostas = L.filter(l=>passou(l,"proposta"));
  const fechados = L.filter(l=>l.etapa==="fechado" && (l.dataFechamento ? dentro(l.dataFechamento) : passou(l,"fechado")));
  const perdidos = L.filter(l=>l.etapa==="perdido" && (l.dataPerda ? dentro(l.dataPerda) : passou(l,"perdido")));
  const vgv = fechados.reduce((s,l)=>s+(Number(l.valorNegocio)||0),0), com = fechados.reduce((s,l)=>s+(Number(l.comissaoValor)||0),0);
  const abertosAgora = L.filter(aberto);
  const disp = imoveisF().filter(i=>(i.status||"disponivel")==="disponivel");
  const pct = (a,b) => b ? Math.round(a/b*100)+"%" : "—";
  const porCorretor = ehGestor() && !S.crmCorretor ? todosCorretores().map(c=>{ const m = l=>(l.corretorId||"fernando")===c._id;
      const fc = fechados.filter(m); return {c, rec:recebidos.filter(m).length, resp:respondidos.filter(m).length, vis:realizadas.filter(v=>m(v.l)).length, fech:fc.length, vgv:fc.reduce((s,l)=>s+(Number(l.valorNegocio)||0),0)}; }) : null;
  const mesRot = meses.find(m=>m.k===S.relMes).rot;
  el.innerHTML = `<div class="rel-topo"><div><h3 style="font-size:28px;margin:0">Relatório de ${esc(mesRot)}</h3><p class="nota" style="margin:2px 0 0">${S.crmCorretor?esc(corretorDe(S.crmCorretor).nome):"Toda a imobiliária"}</p></div>
    <div class="chips"><label class="crm-filtro">Mês<select id="rel-mes">${meses.map(m=>`<option value="${m.k}" ${m.k===S.relMes?"selected":""}>${esc(m.rot)}</option>`).join("")}</select></label><button class="btn btn-linha btn-sm" data-act="imprimir">Imprimir ou salvar PDF</button></div></div>
  <dl class="kpis">
    <div class="kpi"><dt>Leads recebidos</dt><dd class="tab">${recebidos.length}</dd></div>
    <div class="kpi"><dt>Respondidos</dt><dd class="tab">${respondidos.length}<small> ${pct(respondidos.length, recebidos.length)}</small></dd></div>
    <div class="kpi"><dt>Tempo até a 1ª resposta</dt><dd class="tab" style="font-size:28px">${med==null?"—":duracao(med)}</dd><small class="nota">metade dos leads foi respondida nesse tempo</small></div>
    <div class="kpi"><dt>Visitas realizadas</dt><dd class="tab">${realizadas.length}<small> de ${vis.filter(v=>v.status!=="cancelada").length} agendadas</small></dd></div>
    <div class="kpi"><dt>Propostas</dt><dd class="tab">${propostas.length}</dd></div>
    <div class="kpi"><dt>Negócios fechados</dt><dd class="tab">${fechados.length}</dd></div>
    <div class="kpi"><dt>Volume vendido</dt><dd class="tab" style="font-size:26px">${vgv?brl(vgv):"R$ 0"}</dd></div>
    <div class="kpi"><dt>Comissões</dt><dd class="tab" style="font-size:26px">${com?brl(com):"R$ 0"}</dd></div>
  </dl>
  <div class="rel-grid">
    <section class="bloco-card"><h4>De onde vieram os leads</h4>${barras(contar(recebidos, l=>l.origem||"Outro"))}</section>
    <section class="bloco-card"><h4>Imóveis mais procurados</h4>${barras(contar(recebidos, l=>l.imovelTitulo).slice(0,6))}</section>
    <section class="bloco-card"><h4>Motivos de perda</h4>${barras(contar(perdidos, l=>l.motivoPerda||"Não informado"), "var(--muted)")}</section>
    <section class="bloco-card"><h4>Funil agora</h4>${barras(ETAPAS.map(e=>[e.nome, L.filter(l=>l.etapa===e.id).length]))}</section>
  </div>
  ${porCorretor?`<h3 style="font-size:24px;margin:26px 0 10px">Por corretor</h3><div class="tabela-wrap"><table><thead><tr><th>Corretor</th><th>Leads</th><th>Respondidos</th><th>Visitas</th><th>Fechados</th><th>Volume</th></tr></thead><tbody>
    ${porCorretor.map(r=>`<tr><td><b>${esc(r.c.nome)}</b></td><td class="tab">${r.rec}</td><td class="tab">${r.resp}</td><td class="tab">${r.vis}</td><td class="tab">${r.fech}</td><td class="tab">${r.vgv?brl(r.vgv):"—"}</td></tr>`).join("")}</tbody></table></div>`:""}
  ${fechados.length?`<h3 style="font-size:24px;margin:26px 0 10px">Negócios fechados no mês</h3><div class="tabela-wrap"><table><thead><tr><th>Cliente</th><th>Imóvel</th><th>Data</th><th>Valor</th><th>Comissão</th></tr></thead><tbody>
    ${fechados.map(l=>`<tr class="click" data-l="${esc(l._id)}"><td><b>${esc(l.nome)}</b></td><td>${esc(l.imovelTitulo||"")}</td><td class="tab">${dataCurta(l.dataFechamento)}</td><td class="tab">${l.valorNegocio?brl(l.valorNegocio):"—"}</td><td class="tab">${l.comissaoValor?brl(l.comissaoValor):"—"}</td></tr>`).join("")}</tbody></table></div>`:""}
  <h3 style="font-size:24px;margin:26px 0 10px">Hoje na carteira</h3>
  <dl class="kpis">
    <div class="kpi"><dt>Leads em aberto</dt><dd class="tab">${abertosAgora.length}</dd></div>
    <div class="kpi"><dt>Leads quentes</dt><dd class="tab">${abertosAgora.filter(l=>l.temperatura==="quente").length}</dd></div>
    <div class="kpi"><dt>Imóveis disponíveis</dt><dd class="tab">${disp.length}</dd></div>
    <div class="kpi"><dt>Carteira à venda</dt><dd class="tab" style="font-size:26px">${brl(disp.filter(i=>i.finalidade!=="aluguel").reduce((s,i)=>s+(Number(i.preco)||0),0))}</dd></div>
  </dl>`;
  $("#rel-mes").onchange = e=>{ S.relMes = e.target.value; render(); };
}

/* ---------- Equipe ---------- */
async function crmEquipe(el){
  const l = [...todosCorretores()].sort((a,b)=>(a.ordem||99)-(b.ordem||99));
  if(!S.acessos) MF.acessos().then(a=>{ S.acessos = a; if(S.crmTab==="equipe") render(); }).catch(()=>{ S.acessos = []; });
  const acessoDe = id => (S.acessos||[]).filter(a=>a.corretor_id===id);
  el.innerHTML = `<div class="sec-h" style="margin-top:0"><div><h3 style="font-size:26px">Corretores</h3><p>Quem aparece na página Corretores, recebe leads e imóveis e pode entrar no CRM.</p></div><button class="btn btn-marca btn-sm" id="novo-corretor">+ Corretor</button></div>
  <div class="tabela-wrap"><table><thead><tr><th></th><th>Nome</th><th>CRECI</th><th class="m-oculta">WhatsApp</th><th>Leads abertos</th><th class="m-oculta">Imóveis</th><th>Acesso ao CRM</th><th class="m-oculta">No site</th></tr></thead><tbody>
  ${l.map(c=>`<tr class="click" data-c="${esc(c._id)}"><td>${avatar(c,36)}</td><td><b>${esc(c.nome)}</b></td><td>${esc(c.creci||"")}</td><td class="tab m-oculta">${esc(fmtCel(String(c.whatsapp||"").replace(/^55/,"")))}</td><td class="tab">${S.leads.filter(x=>(x.corretorId||"fernando")===c._id && aberto(x)).length}</td><td class="tab m-oculta">${S.imoveis.filter(i=>(i.corretorId||"fernando")===c._id).length}</td><td>${S.acessos==null?"…":acessoDe(c._id).map(a=>`${a.papel==="gestor"?"Gestor":"Corretor"}`).join(", ")||'<span class="nota">Sem acesso</span>'}</td><td class="m-oculta">${c.ativo===false?"Oculto":"Visível"}</td></tr>`).join("")}
  </tbody></table></div>`;
  $("#novo-corretor").onclick = ()=>abrirCorretor(null);
  el.querySelectorAll("[data-c]").forEach(r=>r.onclick=()=>abrirCorretor(r.dataset.c));
}
function abrirCorretor(id){
  const c = id ? todosCorretores().find(x=>x._id===id) : {ordem:todosCorretores().length+1, ativo:true};
  let foto = c.foto||"";
  gaveta(`
    <div class="ld-linha1"><h2>${id?"Editar corretor":"Novo corretor"}</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>
    <form id="c-form" style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:12px;align-items:center"><span id="c-foto-prev">${avatar({...c,foto},72)}</span><label class="campo" style="flex:1">Foto<input type="file" id="c-up" accept="image/*" ${S.assets?"":"disabled"}></label></div>
      <label class="campo">Nome<input id="c-nome" required value="${esc(c.nome||"")}"></label>
      <div class="linha2"><label class="campo">CRECI<input id="c-creci" value="${esc(c.creci||"")}"></label><label class="campo">WhatsApp com DDD<input id="c-wa" inputmode="tel" value="${esc(fmtCel(String(c.whatsapp||"").replace(/^55/,"")))}"></label></div>
      <label class="campo">E-mail<input id="c-email" type="email" value="${esc(c.email||"")}"></label>
      <label class="campo">Títulos e credenciais (separe por vírgula)<input id="c-titulos" placeholder="Ex.: CNAI 12.345, Perito judicial" value="${esc(c.titulos||"")}"></label>
      <label class="campo">Apresentação (aparece no site)<textarea id="c-bio" rows="3">${esc(c.bio||"")}</textarea></label>
      <div class="linha2"><label class="campo">Ordem na página<input id="c-ordem" inputmode="numeric" value="${esc(c.ordem||"")}"></label><label class="campo">Mostrar no site<select id="c-ativo"><option value="1">Sim</option><option value="" ${c.ativo===false?"selected":""}>Não</option></select></label></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-marca" type="submit">Salvar</button>${id&&id!=="fernando"?`<button class="btn btn-linha" type="button" id="c-excluir">Excluir</button>`:""}</div>
      <div id="c-ret" class="nota"></div>
    </form>
    ${id?`<section class="ld-sec"><div class="ld-rot">Acesso ao CRM</div><div id="ac-lista" class="nota">Carregando…</div>
      <form id="ac-form" class="ac-form"><div class="linha2"><label class="campo">E-mail de login<input id="ac-email" type="email" required placeholder="email@exemplo.com" value="${esc(c.email||"")}"></label>
        <label class="campo">O que pode ver<select id="ac-papel"><option value="corretor">Só os próprios clientes e imóveis</option><option value="gestor">Tudo (gestor)</option></select></label></div>
        <button class="btn btn-ouro btn-sm" type="submit" style="align-self:start">Liberar acesso</button>
        <p class="nota" style="margin:0">Depois de liberar, a pessoa abre <b>${esc(location.host)}/#entrar</b>, toca em <b>Primeiro acesso</b> e cria a própria senha.</p>
        <div id="ac-ret" class="nota"></div></form></section>`:""}`);
  $("#c-up").onchange = async e=>{ const a = e.target.files[0]; if(!a||!S.assets) return; $("#c-ret").textContent="Enviando foto…"; try{ const r = await S.assets.upload(a); foto = r.url; $("#c-foto-prev").innerHTML = avatar({...c,foto},72); $("#c-ret").textContent="Foto enviada. Salve para publicar."; }catch(err){ $("#c-ret").textContent="Não foi possível enviar a foto."; } };
  let conf = false;
  if($("#c-excluir")) $("#c-excluir").onclick = async()=>{ if(!conf){ conf=true; $("#c-excluir").textContent="Clique de novo para excluir"; return; } await S.db.collection("corretores").doc(id).delete(); fecharGaveta(); };
  $("#c-form").onsubmit = async e=>{ e.preventDefault();
    const wa = soDig($("#c-wa").value);
    const dados = {nome:$("#c-nome").value.trim(), creci:$("#c-creci").value.trim(), whatsapp:wa?(wa.startsWith("55")&&wa.length>11?wa:"55"+wa):"", email:$("#c-email").value.trim(), titulos:$("#c-titulos").value.trim(), bio:$("#c-bio").value.trim(), ordem:Number($("#c-ordem").value)||99, ativo:!!$("#c-ativo").value, foto, atualizadoEm:hoje()};
    try{ const docId = id || (dados.nome.toLowerCase().normalize("NFD").replace(/[^\w]+/g,"-").replace(/^-|-$/g,"")||undefined);
      await S.db.collection("corretores").doc(docId).set(dados); $("#c-ret").className="ok-box"; $("#c-ret").textContent="Salvo."; if(!id) setTimeout(fecharGaveta,600);
    }catch(err){ $("#c-ret").className="err-box"; $("#c-ret").textContent="Não foi possível salvar. Tente de novo."; } };
  if(!id) return;
  const pintarAcessos = async ()=>{
    try{ S.acessos = await MF.acessos(); }catch(err){ $("#ac-lista").textContent = "Não foi possível ler os acessos."; return; }
    const meus = S.acessos.filter(a=>a.corretor_id===id);
    const eu = ((await MF.sessao())||{user:{}}).user.email||"";
    $("#ac-lista").innerHTML = meus.length ? meus.map(a=>`<div class="ac-item"><span><b>${esc(a.email)}</b> · ${a.papel==="gestor"?"vê tudo (gestor)":"vê só os próprios clientes e imóveis"}</span>${a.email.toLowerCase()===eu.toLowerCase()?'<span class="nota">você</span>':`<button class="btn btn-linha btn-sm" data-rm="${esc(a.email)}" type="button">Remover</button>`}</div>`).join("") : "Ainda sem acesso ao CRM.";
    $("#ac-lista").querySelectorAll("[data-rm]").forEach(b=>b.onclick=async()=>{ if(b.dataset.ok!=="1"){ b.dataset.ok="1"; b.textContent="Confirmar"; return; } try{ await MF.removerAcesso(b.dataset.rm); pintarAcessos(); }catch(err){ toast("Não foi possível remover."); } });
  };
  pintarAcessos();
  $("#ac-form").onsubmit = async e=>{ e.preventDefault(); const r = $("#ac-ret");
    try{ await MF.darAcesso($("#ac-email").value, $("#ac-papel").value, id); r.className="ok-box"; r.textContent="Acesso liberado."; pintarAcessos(); }
    catch(err){ r.className="err-box"; r.textContent = /column|function|papel/i.test(err.message||"") ? "O banco ainda não foi atualizado para acessos por corretor." : "Não foi possível liberar. Confira o e-mail."; } };
}

/* ---------- Gaveta (painel lateral) ---------- */
function gaveta(html){
  fecharGaveta();
  const g = document.createElement("div"); g.className = "gaveta"; g.id = "gaveta";
  g.innerHTML = `<div class="painel" role="dialog" aria-modal="true">${html}</div>`;
  g.addEventListener("click", e=>{ if(e.target===g) fecharGaveta(); });
  document.body.appendChild(g);
  document.addEventListener("keydown", escFecha);
  return g;
}
function escFecha(e){ if(e.key==="Escape" && !e.target.closest("details.menu[open]")) fecharGaveta(); }
function fecharGaveta(){ const g = $("#gaveta"); if(g) g.remove(); document.removeEventListener("keydown", escFecha); S.gav = null; S.agendando = null; S.fbVisita = null; S.ligacao = null; }
function repintarGaveta(){ if(!S.gav || !$("#gaveta")) return; if(S.gav.tipo==="lead"){ if(!S.leads.find(x=>x._id===S.gav.id)) return; pintarLeadCab(); pintarLeadDin(); } }

/* ---------- Gaveta: lead ---------- */
function abrirLead(id){
  if(!id) return novoLead();
  const l = S.leads.find(x=>x._id===id); if(!l) return;
  const manter = {agendando:S.agendando===id?id:null, fb:S.fbVisita};
  gaveta(`<div id="ld-cab" class="ld-cab"></div><div id="ld-din" class="ld-din"></div>
    <details class="ld-bloco" id="ld-dados"><summary>Dados do cliente e o que ele procura</summary>${formLeadHtml(l)}</details>`);
  S.gav = {tipo:"lead", id}; S.agendando = manter.agendando; S.fbVisita = manter.fb;
  pintarLeadCab(); pintarLeadDin(); ligarFormLeadCrm(l);
}
function novoLead(){
  const l = {etapa:"novo", temperatura:"morno", origem:"WhatsApp", corretorId:S.crmCorretor||meuId(), historico:[]};
  gaveta(`<div class="ld-linha1"><h2>Novo lead</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>${formLeadHtml(l, true)}`);
  S.gav = {tipo:"novo"};
  ligarFormLeadCrm(l, true);
  setTimeout(()=>$("#g-nome").focus(), 50);
}
function pintarLeadCab(){
  const l = S.leads.find(x=>x._id===S.gav.id), el = $("#ld-cab"); if(!l || !el) return;
  const v = (l.visitas||[]).filter(x=>x.status==="agendada").sort((a,b)=>a.quando.localeCompare(b.quando))[0];
  const vr = (l.visitas||[]).filter(x=>x.status==="realizada").sort((a,b)=>b.quando.localeCompare(a.quando))[0];
  const im = imovelPorId(l.imovelId);
  const modelos = [["primeiro",{}],...(im?[["imovel",{imovel:im}]]:[]),...(v?[["visita",{visita:v}]]:[]),...(vr?[["posvisita",{visita:vr}]]:[]),["retomar",{}],["livre",{}]];
  preservar(el, ()=>{ el.innerHTML = `
    <div class="ld-linha1"><h2>${esc(l.nome)}</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>
    <div class="ld-meta"><span class="termo t-${esc(l.temperatura||"morno")}">${esc(l.temperatura||"morno")}</span><span>${esc(nomeEtapa(l.etapa))}</span><span>${esc(l.origem||"")}</span>${ehGestor()?`<span>${esc(corretorDe(l.corretorId).nome)}</span>`:""}<span>entrou ${haQuanto(l.criadoEm)}</span></div>
    ${(l.tags||[]).length?`<div class="tags-mini">${l.tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`:""}
    <div class="ld-acoes">
      <details class="menu" id="ld-wa"><summary class="btn btn-whats">${ICO.whats} WhatsApp ▾</summary><div class="menu-lista">${modelos.map(([m,ctx])=>linkWa(l,m,ctx,`<b>${esc(NOMES_MODELO[m])}</b><small>${esc(msgModelo(m,l,ctx).slice(0,70))}…</small>`,"menu-item")).join("")}</div></details>
      <a class="btn btn-linha" href="tel:+${esc(celIntl(l.celular))}" data-act="ligou" data-lead="${esc(l._id)}">Ligar</a>
      <button class="btn btn-linha" data-act="agendar" data-lead="${esc(l._id)}">Agendar visita</button>
      ${menuDocs({lead:l._id})}
    </div>
    <div class="nota tab">${esc(fmtCel(l.celular))}${l.email?" · "+esc(l.email):""}${im?` · interesse: <button class="link-btn" data-i="${esc(im._id)}">${esc(im.codigo)} · ${esc(im.titulo)}</button>`:l.interesse?" · "+esc(l.interesse):""}</div>
    ${l.mensagem?`<div class="ld-msg">${esc(l.mensagem)}</div>`:""}`; });
}
function pintarLeadDin(){
  if(!S.gav || S.gav.tipo!=="lead") return;
  const l = S.leads.find(x=>x._id===S.gav.id), el = $("#ld-din"); if(!l || !el) return;
  const id = esc(l._id), D = `data-lead="${id}"`;
  const visitas = [...(l.visitas||[])].sort((a,b)=>b.quando.localeCompare(a.quando));
  const comb = imoveisQueCombinam(l), pe = perfilEfetivo(l);
  const enviado = iid => (l.enviados||[]).find(e=>e.imovelId===iid);
  preservar(el, ()=>{ el.innerHTML = `
    ${S.ligacao===l._id?`<div class="aviso aviso-acao"><span><b>Como foi a ligação?</b></span><span class="chips"><button class="btn btn-ouro btn-sm" data-act="atendeu" ${D}>Atendeu</button><button class="btn btn-linha btn-sm" data-act="nao-atendeu" ${D}>Não atendeu</button></span></div>`:""}
    ${secAvaliacaoLead(l)}
    <section class="ld-sec"><div class="ld-rot">Próximo contato <span class="${atrasado(l)?"atraso":""}">${l.proximoContato?`${diaRotulo(l.proximoContato)} às ${horaBR(l.proximoContato)}${atrasado(l)?" (atrasado)":""}`:"nenhum marcado"}</span></div>
      <div class="chips">${[["2h","Daqui 2 h"],["amanha","Amanhã 9h"],["3d","Em 3 dias"],["7d","Em 1 semana"]].map(([k,r])=>`<button class="chip" data-act="prox" data-v="${k}" ${D}>${r}</button>`).join("")}
        <input type="datetime-local" class="chip-input" id="ld-prox" aria-label="Escolher data e hora" value="${toLocalInput(l.proximoContato)}">${l.proximoContato?`<button class="chip" data-act="prox" data-v="" ${D}>Limpar</button>`:""}</div></section>
    <section class="ld-sec"><div class="ld-rot">Etapa</div><div class="seg">${ETAPAS.map(e=>`<button class="${l.etapa===e.id?"on":""} et-${e.id}" data-act="etapa" data-v="${e.id}" ${D}>${e.nome}</button>`).join("")}</div></section>
    <section class="ld-sec"><div class="ld-rot">Termômetro</div><div class="seg seg-curto">${["quente","morno","frio"].map(t=>`<button class="${(l.temperatura||"morno")===t?"on":""}" data-act="temp" data-v="${t}" ${D}><span class="termo t-${t}">${t}</span></button>`).join("")}</div></section>
    ${l.etapa==="fechado"?`<form class="ld-sec ld-caixa" id="f-fech"><div class="ld-rot">Dados do fechamento</div>
      <div class="linha3"><label class="campo">Valor do negócio (R$)<input id="fe-valor" inputmode="decimal" data-rascunho value="${l.valorNegocio?esc(Number(l.valorNegocio).toLocaleString("pt-BR")):""}"></label><label class="campo">Comissão (R$)<input id="fe-com" inputmode="decimal" data-rascunho value="${l.comissaoValor?esc(Number(l.comissaoValor).toLocaleString("pt-BR")):""}"></label><label class="campo">Data<input id="fe-data" type="date" data-rascunho value="${esc(l.dataFechamento||hoje().slice(0,10))}"></label></div>
      ${l.imovelId&&imovelPorId(l.imovelId)&&imovelPorId(l.imovelId).status!=="vendido"?`<label class="check"><input type="checkbox" id="fe-vendido" data-rascunho checked> Marcar o imóvel ${esc(imovelPorId(l.imovelId).codigo)} como vendido no site</label>`:""}
      <button class="btn btn-marca btn-sm" type="submit" style="align-self:start">Salvar fechamento</button></form>`:""}
    ${l.etapa==="perdido"?`<form class="ld-sec ld-caixa" id="f-perda"><div class="ld-rot">Por que não fechou?</div>
      <div class="chips">${MOTIVOS_PERDA.map(m=>`<label class="chip ${l.motivoPerda===m?"on":""}"><input type="radio" name="motivo" value="${esc(m)}" ${l.motivoPerda===m?"checked":""}> ${esc(m)}</label>`).join("")}</div>
      <button class="btn btn-marca btn-sm" type="submit" style="align-self:start">Salvar motivo</button></form>`:""}
    <section class="ld-sec"><div class="ld-rot">Registrar atendimento</div>
      <div class="chips">${RAPIDOS.map(r=>`<button class="chip" data-act="rapido" data-k="${r.k}" ${D}>${r.r}</button>`).join("")}</div>
      <form id="h-form" class="h-form"><textarea id="h-txt" data-rascunho rows="2" required placeholder="O que aconteceu? Ex.: pediu fotos internas, retornar sexta"></textarea>
        <div class="linha2"><label class="campo">Canal<select id="h-tipo" data-rascunho>${opcoes(TIPOS_CONTATO,"WhatsApp")}</select></label><label class="campo">Próximo contato<input id="h-prox" type="datetime-local" data-rascunho value="${toLocalInput(quando("2d"))}"></label></div>
        <button class="btn btn-ouro btn-sm" type="submit" style="align-self:start">Registrar</button></form></section>
    <section class="ld-sec"><div class="ld-rot">Visitas ${S.agendando!==l._id?`<button class="link-btn" data-act="agendar" ${D}>+ Agendar</button>`:""}</div>
      ${S.agendando===l._id?`<form id="f-visita" class="ld-caixa"><div class="linha2"><label class="campo">Dia e hora<input id="v-quando" type="datetime-local" required data-rascunho value="${toLocalInput(amanhaAs(10))}"></label>
        <label class="campo">Imóvel<select id="v-imovel" data-rascunho><option value="">A definir</option>${S.imoveis.filter(i=>i.status!=="vendido").map(i=>`<option value="${esc(i._id)}" ${i._id===l.imovelId?"selected":""}>${esc(i.codigo)} · ${esc(i.titulo)}</option>`).join("")}</select></label></div>
        <label class="campo">Observação<input id="v-obs" data-rascunho placeholder="Ex.: encontrar na frente do imóvel; chave com o vizinho"></label>
        <div class="chips"><button class="btn btn-marca btn-sm" type="submit">Agendar</button><button class="btn btn-linha btn-sm" type="button" data-act="agendar-cancelar">Cancelar</button></div></form>`:""}
      ${visitas.length?visitas.map(v=>`<div class="vis ${v.status}"><div><b>${diaRotulo(v.quando)} às ${horaBR(v.quando)}</b> · ${esc(v.imovelTitulo||"imóvel a definir")}<br><small>${v.status==="agendada"?(v.confirmacao?"Confirmação enviada":"Agendada"):v.status==="realizada"?"Realizada"+(v.feedback?": "+esc(v.feedback):""):"Cancelada"}${v.obs?" · "+esc(v.obs):""}</small></div>
        ${v.status==="agendada"?`<div class="chips">${new Date(v.quando)>new Date()?linkWa(l,"visita",{visita:v},`${ICO.whats} Confirmar`)+`<a class="btn btn-linha btn-sm" target="_blank" rel="noopener" href="${esc(linkAgendaGoogle(v,l))}">Agenda</a>`:""}<button class="btn btn-ouro btn-sm" data-act="realizada" data-visita="${esc(v.id)}" ${D}>Realizada</button><button class="btn btn-linha btn-sm" data-act="cancelar-visita" data-visita="${esc(v.id)}" ${D}>Cancelar</button></div>`
          :v.status==="realizada"?`<div class="chips">${linkWa(l,"posvisita",{visita:v},`${ICO.whats} Pós-visita`)}</div>`:""}
        ${S.fbVisita===v.id?`<form id="f-fb" class="ld-caixa" data-visita="${esc(v.id)}"><div class="ld-rot">Como foi a visita?</div><div class="chips">${FEEDBACKS.map(f=>`<button type="button" class="chip" data-act="fb" data-v="${esc(f)}">${esc(f)}</button>`).join("")}</div>
          <textarea id="fb-txt" rows="2" data-rascunho placeholder="Impressões do cliente"></textarea><div class="chips"><button class="btn btn-marca btn-sm" type="submit">Salvar como realizada</button><button class="btn btn-linha btn-sm" type="button" data-act="fb-cancelar">Voltar</button></div></form>`:""}</div>`).join("")
      :(S.agendando===l._id?"":'<p class="nota" style="margin:0">Nenhuma visita ainda.</p>')}</section>
    <section class="ld-sec"><div class="ld-rot">${pe&&pe._explicito?"Imóveis que combinam com o que procura":"Imóveis parecidos com o de interesse"}</div>
      ${!pe?'<p class="nota" style="margin:0">Preencha "o que ele procura" em Dados do cliente (abaixo) para ver sugestões da sua carteira.</p>'
        :comb.length?comb.map(i=>{ const e = enviado(i._id); return `<div class="comb"><button class="t-info" data-i="${esc(i._id)}">${(i.fotos||[])[0]?`<img src="${esc(i.fotos[0])}" alt="">`:""}<span><b>${esc(i.codigo)} · ${esc(i.titulo)}</b><small>${esc(i.bairro||"")} · ${brl(i.preco)}${e?` · <span class="ok-txt">enviado ${dataBR(e.quando)}</span>`:""}</small></span></button>${linkWa(l,"imovel",{imovel:i},`${ICO.whats} ${e?"Reenviar":"Enviar"}`)}</div>`; }).join("")
        :'<p class="nota" style="margin:0">Nenhum imóvel da carteira combina agora. Quando entrar um parecido, ele aparece aqui.</p>'}</section>
    ${secDocsLead(l)}
    <section class="ld-sec"><div class="ld-rot">Histórico</div><div class="hist">${[...(l.historico||[])].reverse().map(h=>`<div><small class="tab">${dataHoraBR(h.quando)} · ${esc(h.tipo)}</small>${esc(h.texto)}</div>`).join("")||'<div class="nota">Sem registros.</div>'}</div></section>`; });
  ligarLeadDin(l);
  pintarFotosAv(el);
}
function ligarLeadDin(l){
  const id = l._id;
  const px = $("#ld-prox"); if(px) px.onchange = ()=>{ if(px.value) salvarLead(id, {proximoContato:new Date(px.value).toISOString()}); };
  const hf = $("#h-form"); if(hf) hf.onsubmit = async e=>{ e.preventDefault();
    const lead = S.leads.find(x=>x._id===id); const txt = $("#h-txt").value.trim(); if(!txt) return;
    const hist = [{tipo:$("#h-tipo").value, texto:txt}], up = {proximoContato: $("#h-prox").value ? new Date($("#h-prox").value).toISOString() : ""};
    if(CONTATOS_REAIS.includes(hist[0].tipo)) aposContato(lead, up, hist);
    $("#h-txt").value = ""; await salvarLead(id, up, hist); toast("Atendimento registrado.");
  };
  const fv = $("#f-visita"); if(fv) fv.onsubmit = async e=>{ e.preventDefault();
    const lead = S.leads.find(x=>x._id===id); const im = imovelPorId($("#v-imovel").value);
    const v = {id: Math.random().toString(36).slice(2,10), quando:new Date($("#v-quando").value).toISOString(), imovelId:im?im._id:"", imovelCodigo:im?im.codigo:"", imovelTitulo:im?im.titulo:"", obs:$("#v-obs").value.trim(), status:"agendada", criadoEm:hoje()};
    const hist = [{tipo:"Visita", texto:`Visita agendada para ${dataHoraBR(v.quando)}${im?` no imóvel ${im.codigo} · ${im.titulo}`:""}.`}], up = {visitas:[...(lead.visitas||[]), v]};
    aposContato(lead, up, hist);
    if(["novo","atendimento"].includes(up.etapa||lead.etapa)){ const de = up.etapa||lead.etapa; up.etapa = "visita"; hist.push({tipo:"Funil", de, para:"visita", texto:`Movido de "${nomeEtapa(de)}" para "Visita agendada".`}); }
    if(lead.proximoContato && new Date(lead.proximoContato) <= new Date(v.quando)) up.proximoContato = "";
    S.agendando = null;
    await salvarLead(id, up, hist);
    const atual = S.leads.find(x=>x._id===id);
    toast("Visita agendada. Quer mandar a confirmação agora?", {rotulo:"Confirmar no WhatsApp", fn:()=>{ window.open(waLink(msgModelo("visita", atual, {visita:v}), celIntl(atual.celular)), "_blank", "noopener"); registrarModelo(id, "visita", {visita:v.id}); }}, 12000);
  };
  const ff = $("#f-fb"); if(ff) ff.onsubmit = async e=>{ e.preventDefault();
    const lead = S.leads.find(x=>x._id===id), vid = ff.dataset.visita, fb = $("#fb-txt").value.trim();
    const v = (lead.visitas||[]).find(x=>x.id===vid);
    const up = {visitas:(lead.visitas||[]).map(x=>x.id===vid?{...x, status:"realizada", feedback:fb}:x)};
    const hist = [{tipo:"Visita", texto:`Visita realizada${v&&v.imovelTitulo?` ao imóvel ${v.imovelTitulo}`:""}.${fb?" Retorno: "+fb:""}`}];
    aposContato(lead, up, hist);
    if(!lead.proximoContato || new Date(lead.proximoContato) < new Date()) up.proximoContato = quando("amanha");
    S.fbVisita = null;
    await salvarLead(id, up, hist); toast("Visita registrada. Retorno marcado para amanhã às 9h.");
  };
  const fe = $("#f-fech"); if(fe) fe.onsubmit = async e=>{ e.preventDefault();
    const lead = S.leads.find(x=>x._id===id);
    const up = {valorNegocio:numBR($("#fe-valor").value), comissaoValor:numBR($("#fe-com").value), dataFechamento:$("#fe-data").value||hoje().slice(0,10)};
    const vend = $("#fe-vendido");
    await salvarLead(id, up, [{tipo:"Nota", texto:`Fechamento: ${up.valorNegocio?brl(up.valorNegocio):"valor não informado"}${up.comissaoValor?`, comissão ${brl(up.comissaoValor)}`:""}.`}]);
    if(vend && vend.checked && lead.imovelId){ try{ await S.db.collection("imoveis").doc(lead.imovelId).update({status:"vendido", atualizadoEm:hoje()}); }catch(err){ toast("O lead foi salvo, mas não consegui marcar o imóvel como vendido."); return; } }
    toast("Fechamento salvo. Ele entra no relatório do mês.");
  };
  const fp = $("#f-perda"); if(fp){
    fp.querySelectorAll("input[name=motivo]").forEach(r=>r.onchange=()=>{ fp.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on", c.querySelector("input").checked)); });
    fp.onsubmit = async e=>{ e.preventDefault(); const m = (fp.querySelector("input[name=motivo]:checked")||{}).value; if(!m) return;
      await salvarLead(id, {motivoPerda:m}, [{tipo:"Nota", texto:`Motivo da perda: ${m}.`}]); toast("Motivo salvo."); };
  }
}
function formLeadHtml(l, novo){
  const p = l.perfil || {};
  return `<form id="g-form" class="g-form">
    <div class="linha2"><label class="campo">Nome<input id="g-nome" required value="${esc(l.nome||"")}"></label><label class="campo">Celular com DDD<input id="g-cel" required inputmode="tel" value="${esc(fmtCel(l.celular||""))}"></label></div>
    <div class="linha2"><label class="campo">E-mail<input id="g-email" type="email" value="${esc(l.email||"")}"></label><label class="campo">Origem<select id="g-origem">${opcoes(ORIGENS,l.origem)}</select></label></div>
    <div class="linha2"><label class="campo">Corretor responsável<select id="g-cor" ${ehGestor()?"":"disabled"}>${todosCorretores().map(c=>`<option value="${esc(c._id)}" ${c._id===(l.corretorId||"fernando")?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>
      <label class="campo">Imóvel de interesse<select id="g-imovel"><option value="">Nenhum específico</option>${S.imoveis.map(i=>`<option value="${esc(i._id)}" ${i._id===l.imovelId?"selected":""}>${esc(i.codigo)} · ${esc(i.titulo)}</option>`).join("")}</select></label></div>
    ${novo?`<div class="linha2"><label class="campo">Termômetro<select id="g-temp">${["quente","morno","frio"].map(t=>`<option ${t===l.temperatura?"selected":""}>${t}</option>`).join("")}</select></label><label class="campo">Próximo contato<input id="g-prox" type="datetime-local" value="${toLocalInput(quando("2h"))}"></label></div>`:""}
    <div class="campo">Etiquetas<div class="tags-in" id="g-tags"></div><datalist id="dl-tags">${todasEtiquetas().map(t=>`<option value="${esc(t)}">`).join("")}</datalist></div>
    <label class="campo">Observações<textarea id="g-msg" rows="3">${esc(l.mensagem||"")}</textarea></label>
    <details class="ld-bloco" id="g-pessoais"><summary>Dados para contratos (CPF, RG, endereço)</summary><div class="g-form" style="padding-top:10px">
      <div class="linha2"><label class="campo">CPF<input id="g-cpf" inputmode="numeric" value="${esc(l.cpf||"")}"></label><label class="campo">RG<input id="g-rg" value="${esc(l.rg||"")}"></label></div>
      <div class="linha3"><label class="campo">Estado civil<select id="g-ec"><option value=""></option>${ESTADOS_CIVIS.map(x=>`<option ${x===l.estadoCivil?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label class="campo">Profissão<input id="g-prof" value="${esc(l.profissao||"")}"></label><label class="campo">Nacionalidade<input id="g-nac" value="${esc(l.nacionalidade||"")}" placeholder="brasileiro(a)"></label></div>
      <label class="campo">Endereço completo<input id="g-end" value="${esc(l.endereco||"")}" placeholder="Rua, número, bairro, cidade/UF"></label>
    </div></details>
    <fieldset class="perfil"><legend>O que o cliente procura</legend>
      <div class="linha3"><label class="campo">Quer<select id="p-fin"><option value="">Tanto faz</option><option value="venda" ${p.finalidade==="venda"?"selected":""}>Comprar</option><option value="aluguel" ${p.finalidade==="aluguel"?"selected":""}>Alugar</option></select></label>
        <label class="campo">Valor a partir de<input id="p-min" inputmode="numeric" placeholder="R$" value="${p.precoMin?esc(Number(p.precoMin).toLocaleString("pt-BR")):""}"></label>
        <label class="campo">Valor até<input id="p-max" inputmode="numeric" placeholder="R$" value="${p.precoMax?esc(Number(p.precoMax).toLocaleString("pt-BR")):""}"></label></div>
      <div class="chips">${CATEGORIAS.map(c=>`<label class="chip ${(p.categorias||[]).includes(c)?"on":""}"><input type="checkbox" name="p-cat" value="${esc(c)}" ${(p.categorias||[]).includes(c)?"checked":""}> ${esc(c)}</label>`).join("")}</div>
      <div class="linha2"><label class="campo">Quartos (mínimo)<select id="p-qua"><option value="">Tanto faz</option>${[1,2,3,4].map(n=>`<option value="${n}" ${Number(p.quartosMin)===n?"selected":""}>${n}${n===4?" ou mais":""}</option>`).join("")}</select></label>
        <label class="campo">Bairros ou cidades preferidos<input id="p-bai" placeholder="Separe por vírgula" value="${esc(p.bairros||"")}"></label></div>
    </fieldset>
    <div class="chips"><button class="btn btn-marca" type="submit">${novo?"Cadastrar lead":"Salvar dados"}</button>${!novo&&l.interesse==="Captação"?`<button class="btn btn-ouro" type="button" data-act="virar-imovel" data-lead="${esc(l._id)}">Cadastrar o imóvel deste proprietário</button>`:""}${novo?"":`<button class="btn btn-linha" type="button" data-act="excluir-lead" data-lead="${esc(l._id)}">Excluir lead</button>`}</div>
    <div id="g-ret" class="nota"></div>
  </form>`;
}
function ligarFormLeadCrm(l, novo){
  let tags = [...(l.tags||[])];
  const box = $("#g-tags");
  const pintarTags = ()=>{
    box.innerHTML = tags.map((t,k)=>`<span class="tag-chip">${esc(t)}<button type="button" data-k="${k}" aria-label="Remover ${esc(t)}">×</button></span>`).join("") + `<input id="g-tag-in" list="dl-tags" placeholder="${tags.length?"+":"Ex.: Financiamento, Investidor"}" autocomplete="off">`;
    box.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ tags.splice(+b.dataset.k,1); pintarTags(); $("#g-tag-in").focus(); });
    const inp = $("#g-tag-in");
    const add = ()=>{ const v = inp.value.replace(/,/g,"").trim(); if(v && !tags.some(t=>norm(t)===norm(v))) tags.push(v.charAt(0).toUpperCase()+v.slice(1)); inp.value=""; pintarTags(); $("#g-tag-in").focus(); };
    inp.onkeydown = e=>{ if(e.key==="Enter" || e.key===","){ e.preventDefault(); add(); } else if(e.key==="Backspace" && !inp.value && tags.length){ tags.pop(); pintarTags(); $("#g-tag-in").focus(); } };
    inp.onchange = ()=>{ if(todasEtiquetas().includes(inp.value)) add(); };
  };
  pintarTags();
  $("#g-form").querySelectorAll("input[name=p-cat]").forEach(c=>c.onchange=()=>c.closest(".chip").classList.toggle("on", c.checked));
  $("#g-form").onsubmit = async e=>{
    e.preventDefault();
    const pend = $("#g-tag-in").value.trim(); if(pend && !tags.includes(pend)) tags.push(pend);
    const imv = imovelPorId($("#g-imovel").value), r = $("#g-ret");
    const cel = soDig($("#g-cel").value);
    if(cel.length<10){ r.className="err-box"; r.textContent="Informe o celular com DDD."; return; }
    const perfil = {finalidade:$("#p-fin").value, precoMin:numBR($("#p-min").value), precoMax:numBR($("#p-max").value), quartosMin:Number($("#p-qua").value)||0,
      categorias:[...$("#g-form").querySelectorAll("input[name=p-cat]:checked")].map(c=>c.value), bairros:$("#p-bai").value.trim()};
    const dados = {nome:$("#g-nome").value.trim(), celular:cel, email:$("#g-email").value.trim(), origem:$("#g-origem").value, corretorId:$("#g-cor").value,
      imovelId:imv?imv._id:"", imovelCodigo:imv?imv.codigo:"", imovelTitulo:imv?imv.titulo:"", mensagem:$("#g-msg").value, tags, perfil,
      cpf:fmtCpf($("#g-cpf").value.trim()), rg:$("#g-rg").value.trim(), estadoCivil:$("#g-ec").value, profissao:$("#g-prof").value.trim(), nacionalidade:$("#g-nac").value.trim(), endereco:$("#g-end").value.trim()};
    try{
      if(novo){
        Object.assign(dados, {etapa:"novo", temperatura:$("#g-temp").value, proximoContato:$("#g-prox").value?new Date($("#g-prox").value).toISOString():"", criadoEm:hoje(), atualizadoEm:hoje(),
          historico:[{quando:hoje(), tipo:"Sistema", texto:"Lead cadastrado no CRM."}]});
        const ref = await S.db.collection("leads").add(dados);
        if(S.leadsVistos) S.leadsVistos.add(ref.id);
        if(!S.leads.some(x=>x._id===ref.id)) S.leads.push({_id:ref.id, ...dados});
        abrirLead(ref.id); toast("Lead cadastrado. Já pode chamar no WhatsApp.");
      }else{
        const atual = S.leads.find(x=>x._id===l._id) || l;
        const hist = [];
        if(dados.corretorId!==(atual.corretorId||"fernando")) hist.push({tipo:"Corretor", texto:`Atendimento passado para ${corretorDe(dados.corretorId).nome}.`});
        const ok = await salvarLead(l._id, dados, hist);
        if(ok){ r.className="ok-box"; r.textContent="Dados salvos."; setTimeout(()=>{ if(r.isConnected){ r.className="nota"; r.textContent=""; } }, 2500); }
      }
    }catch(err){ r.className="err-box"; r.textContent="Não foi possível salvar. Verifique a internet e tente de novo."; }
  };
}

/* ---------- Gaveta: imóvel ---------- */
function abrirImovel(id, opc={}){
  const i = id ? S.imoveis.find(x=>x._id===id) : {finalidade:"venda", status:"disponivel", uf:"PR", cidade:"Cornélio Procópio", fotos:[], caracteristicas:[], codigo:String(proximoCodigo()), corretorId:S.crmCorretor||meuId(), ...(opc.base||{})};
  if(!i) return;
  const p = {...(id ? (S.privado[id]||{}) : {}), ...(opc.priv||{})};
  const podeEditar = ehGestor() || (i.corretorId||"fernando")===S.meuCorretor;
  let fotos = [...(i.fotos||[])];
  const clientes = id ? clientesQueCombinam(i) : [];
  const nLeads = id ? S.leads.filter(x=>x.imovelId===id).length : 0;
  const nVis = id ? S.leads.flatMap(x=>x.visitas||[]).filter(v=>v.imovelId===id && v.status==="realizada").length : 0;
  gaveta(`
    <div class="ld-linha1"><h2>${id?esc(i.codigo)+" · "+esc(i.titulo):"Novo imóvel"}</h2><button class="btn btn-linha btn-sm" data-act="fechar">Fechar</button></div>
    ${id?`<div class="ld-meta"><span class="status st-${esc(i.status||"disponivel")}">${esc(rotStatus(i.status))}</span><span>${nLeads} ${nLeads===1?"lead":"leads"}</span><span>${nVis} ${nVis===1?"visita":"visitas"}</span><span>${badgeAut(p)}</span></div>
    <div class="ld-acoes">${menuDocs({imovel:id})}<button class="btn btn-linha" data-act="av-estudo" data-imovel="${esc(id)}">Estudo de mercado</button></div>
    <section class="ld-sec"><div class="ld-rot">Clientes que combinam com este imóvel</div>
      ${clientes.length?clientes.slice(0,10).map(l=>{ const e=(l.enviados||[]).find(x=>x.imovelId===id); return `<div class="comb"><button class="t-info" data-l="${esc(l._id)}"><span><b>${esc(l.nome)}</b><small>${esc(nomeEtapa(l.etapa))} · <span class="termo t-${esc(l.temperatura||"morno")}">${esc(l.temperatura||"morno")}</span>${e?` · <span class="ok-txt">enviado ${dataBR(e.quando)}</span>`:""}</small></span></button>${linkWa(l,"imovel",{imovel:i},`${ICO.whats} ${e?"Reenviar":"Enviar"}`)}</div>`; }).join("")
        :'<p class="nota" style="margin:0">Nenhum cliente em aberto com perfil compatível. Preencha "o que o cliente procura" nos leads para cruzar automaticamente.</p>'}</section>${secDocsImovel(id)}${secEstudosImovel(id)}${secChecklistImovel(id, podeEditar)}`:""}
    <form id="i-form" class="g-form" ${podeEditar?"":'inert'}>
      <details class="ld-bloco" id="i-dados" ${id?"":"open"}><summary>Dados do anúncio (aparecem no site)</summary><div class="g-form" style="padding-top:10px">
      <label class="campo">Título do anúncio<input id="i-titulo" required value="${esc(i.titulo||"")}"></label>
      <div class="linha3"><label class="campo">Código<input id="i-codigo" required value="${esc(i.codigo||"")}"></label>
        <label class="campo">Finalidade<select id="i-fin"><option value="venda" ${i.finalidade!=="aluguel"?"selected":""}>Venda</option><option value="aluguel" ${i.finalidade==="aluguel"?"selected":""}>Aluguel</option></select></label>
        <label class="campo">Tipo<select id="i-cat">${opcoes(CATEGORIAS,i.categoria)}</select></label></div>
      <div class="linha3"><label class="campo">Valor (R$)<input id="i-preco" inputmode="numeric" value="${esc(i.preco||"")}"></label>
        <label class="campo">Status<select id="i-status">${["disponivel","reservado","vendido","oculto"].map(s=>`<option value="${s}" ${s===(i.status||"disponivel")?"selected":""}>${rotStatus(s)}</option>`).join("")}</select></label>
        <label class="campo">Destaque na home<select id="i-dest"><option value="">Não</option><option value="1" ${i.destaque?"selected":""}>Sim</option></select></label></div>
      <div class="linha3"><label class="campo">Bairro<input id="i-bairro" value="${esc(i.bairro||"")}"></label><label class="campo">Cidade<input id="i-cidade" value="${esc(i.cidade||"")}"></label><label class="campo">UF<input id="i-uf" maxlength="2" value="${esc(i.uf||"PR")}"></label></div>
      <div class="linha3"><label class="campo">Área total (m²)<input id="i-at" inputmode="decimal" value="${esc(i.areaTotal||"")}"></label><label class="campo">Área construída (m²)<input id="i-ac" inputmode="decimal" value="${esc(i.areaConstruida||"")}"></label><label class="campo">Quartos<input id="i-qua" inputmode="numeric" value="${esc(i.quartos||"")}"></label></div>
      <div class="linha3"><label class="campo">Suítes<input id="i-sui" inputmode="numeric" value="${esc(i.suites||"")}"></label><label class="campo">Banheiros<input id="i-ban" inputmode="numeric" value="${esc(i.banheiros||"")}"></label><label class="campo">Vagas<input id="i-vag" inputmode="numeric" value="${esc(i.vagas||"")}"></label></div>
      <div class="linha3"><label class="campo">Financiamento<select id="i-fi"><option value="">Não</option><option value="1" ${i.aceitaFinanciamento?"selected":""}>Aceita</option></select></label><label class="campo">FGTS<select id="i-fg"><option value="">Não</option><option value="1" ${i.aceitaFGTS?"selected":""}>Aceita</option></select></label><label class="campo">Permuta<select id="i-pe"><option value="">Não</option><option value="1" ${i.aceitaPermuta?"selected":""}>Aceita</option></select></label></div>
      <label class="campo">Descrição<textarea id="i-desc" rows="5">${esc(i.descricao||"")}</textarea></label>
      <label class="campo">Características (separe por vírgula)<input id="i-car" value="${esc((i.caracteristicas||[]).join(", "))}"></label>
      <div class="campo">Fotos (a primeira é a capa)<div class="miniaturas" id="i-fotos"></div>
        <input type="file" id="i-up" accept="image/*" multiple ${S.assets?"":"disabled"}><span class="nota" id="i-upret">${S.assets?"Envie JPG ou PNG. Elas aparecem no site assim que você salvar.":"Envio de fotos indisponível agora."}</span></div>
      <label class="campo">Corretor responsável<select id="i-cor" ${ehGestor()?"":"disabled"}>${todosCorretores().map(c=>`<option value="${esc(c._id)}" ${c._id===(i.corretorId||"fernando")?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>
      </div></details>
      <details class="ld-bloco" id="i-capt" open><summary>Captação e proprietário (só no CRM, não aparece no site)</summary><div class="g-form" style="padding-top:10px">
        <div class="linha2"><label class="campo">Proprietário<input id="i-prop" value="${esc(p.proprietario||"")}"></label><label class="campo">Celular<input id="i-propcel" inputmode="tel" value="${esc(p.proprietarioCel||"")}"></label></div>
        <div class="linha2"><label class="campo">E-mail do proprietário<input id="i-propemail" type="email" value="${esc(p.proprietarioEmail||"")}"></label><label class="campo">CPF do proprietário<input id="i-propcpf" inputmode="numeric" value="${esc(p.proprietarioCpf||"")}"></label></div>
        <label class="campo">Endereço do imóvel (rua e número)<input id="i-end" placeholder="Usado nos documentos; não aparece no site" value="${esc(p.endereco||"")}"></label>
        <div class="linha2"><label class="campo">Matrícula nº<input id="i-mat" value="${esc(p.matricula||"")}"></label><label class="campo">Inscrição imobiliária (IPTU)<input id="i-iptu" value="${esc(p.inscricaoIptu||"")}"></label></div>
        <div class="linha3"><label class="campo">Autorização<select id="i-aut"><option value="">Não informada</option>${Object.entries(TIPOS_AUT).map(([k,v])=>`<option value="${k}" ${p.autorizacaoTipo===k?"selected":""}>${v}</option>`).join("")}</select></label>
          <label class="campo">Assinada em<input id="i-autini" type="date" value="${esc(p.autorizacaoInicio||"")}"></label><label class="campo">Válida até<input id="i-autfim" type="date" value="${esc(p.autorizacaoValidade||"")}"></label></div>
        <div class="linha2"><label class="campo">Comissão combinada (%)<input id="i-compct" inputmode="decimal" value="${esc(p.comissaoPct||"")}"></label><label class="campo">Onde está a chave<input id="i-chave" placeholder="Ex.: na imobiliária, com o vizinho" value="${esc(p.chave||"")}"></label></div>
        <label class="campo">Observações internas<textarea id="i-obsint" rows="2">${esc(p.obsInternas||"")}</textarea></label>
        ${id&&p.proprietarioCel?`<a class="btn btn-whats btn-sm" style="align-self:start" target="_blank" rel="noopener" href="${esc(waLink(msgProprietario(i,p), celIntl(p.proprietarioCel)))}">${ICO.whats} Mandar atualização ao proprietário</a>`:""}
      </div></details>
      ${podeEditar?`<div class="chips"><button class="btn btn-marca" type="submit">${id?"Salvar imóvel":"Cadastrar imóvel"}</button>${id?`<a class="btn btn-linha" href="#imovel-${esc(id)}" id="i-ver">Ver no site</a><button class="btn btn-linha" type="button" id="i-excluir">Excluir</button>`:""}</div>`:'<p class="nota">Este imóvel é de outro corretor. Você pode ver, mas não alterar.</p>'}
      <div id="i-ret" class="nota"></div>
    </form>`);
  S.gav = {tipo:"imovel", id};
  if(id) ligarChecklist(id, podeEditar);
  if(!podeEditar) return;
  if(id) $("#i-ver").onclick = fecharGaveta;
  const pintarFotos = ()=>{
    $("#i-fotos").innerHTML = fotos.map((f,k)=>`<div><img src="${esc(f)}" alt=""><button type="button" data-rm="${k}" aria-label="Remover foto">×</button>${k?`<button type="button" data-capa="${k}" style="right:auto;left:2px" aria-label="Tornar capa">★</button>`:""}</div>`).join("") || '<span class="nota">Sem fotos.</span>';
    $("#i-fotos").querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{ fotos.splice(+b.dataset.rm,1); pintarFotos(); });
    $("#i-fotos").querySelectorAll("[data-capa]").forEach(b=>b.onclick=()=>{ const [f] = fotos.splice(+b.dataset.capa,1); fotos.unshift(f); pintarFotos(); });
  };
  pintarFotos();
  if(!id && (opc.copiarFotos||[]).length) copiarFotosAv(opc.copiarFotos, url=>{ fotos.push(url); pintarFotos(); });
  $("#i-up").onchange = async e=>{
    const arqs = [...e.target.files]; if(!arqs.length||!S.assets) return;
    $("#i-upret").textContent = `Enviando ${arqs.length} foto(s)…`;
    for(const a of arqs){ try{ const r = await S.assets.upload(a); fotos.push(r.url); pintarFotos(); }catch(err){ $("#i-upret").textContent = "Uma foto não pôde ser enviada (limite de 20 MB)."; } }
    $("#i-upret").textContent = "Fotos enviadas. Salve o imóvel para publicar."; e.target.value = "";
  };
  let confirmar = false;
  if(id) $("#i-excluir").onclick = async ()=>{
    if(!confirmar){ confirmar = true; $("#i-excluir").textContent = "Clique de novo para excluir"; return; }
    await S.db.collection("imoveis").doc(id).delete(); fecharGaveta();
  };
  $("#i-form").onsubmit = async e=>{
    e.preventDefault();
    const num = v => v==="" ? null : Number(String(v).replace(",","."));
    const dados = { titulo:$("#i-titulo").value.trim(), codigo:$("#i-codigo").value.trim(), finalidade:$("#i-fin").value, categoria:$("#i-cat").value,
      preco:Number(soDig($("#i-preco").value))||0, status:$("#i-status").value, destaque:!!$("#i-dest").value,
      bairro:$("#i-bairro").value.trim(), cidade:$("#i-cidade").value.trim(), uf:$("#i-uf").value.trim().toUpperCase(),
      areaTotal:num($("#i-at").value), areaConstruida:num($("#i-ac").value), quartos:num($("#i-qua").value), suites:num($("#i-sui").value), banheiros:num($("#i-ban").value), vagas:num($("#i-vag").value),
      aceitaFinanciamento:!!$("#i-fi").value, aceitaFGTS:!!$("#i-fg").value, aceitaPermuta:!!$("#i-pe").value,
      corretorId:$("#i-cor").value, descricao:$("#i-desc").value, caracteristicas:$("#i-car").value.split(",").map(s=>s.trim()).filter(Boolean), fotos,
      atualizadoEm:hoje() };
    const priv = { ...p, ...(id ? S.privado[id]||{} : {}), proprietario:$("#i-prop").value.trim(), proprietarioCel:$("#i-propcel").value.trim(), proprietarioEmail:$("#i-propemail").value.trim(),
      proprietarioCpf:fmtCpf($("#i-propcpf").value.trim()), endereco:$("#i-end").value.trim(), matricula:$("#i-mat").value.trim(), inscricaoIptu:$("#i-iptu").value.trim(),
      autorizacaoTipo:$("#i-aut").value, autorizacaoInicio:$("#i-autini").value, autorizacaoValidade:$("#i-autfim").value, comissaoPct:$("#i-compct").value.trim(), chave:$("#i-chave").value.trim(), obsInternas:$("#i-obsint").value.trim() };
    const temPriv = Object.entries(priv).some(([k,v])=>v && k!=="origemLead");
    const r = $("#i-ret");
    if(!dados.titulo || !dados.codigo){ $("#i-dados").open = true; r.className="err-box"; r.textContent="Preencha o título e o código do anúncio."; return; }
    try{
      let docId = id;
      if(id) await S.db.collection("imoveis").doc(id).update(dados);
      else { const ref = S.db.collection("imoveis").doc(dados.codigo.replace(/[^\w-]/g,"")||undefined); docId = ref.id; await ref.set({...dados, criadoEm:hoje()}); }
      if(temPriv || S.privado[docId]){ await S.db.doc("privado/"+docId).set(priv); S.privado[docId] = priv; }
      if(!id && opc.priv && opc.priv.origemLead){ const ld = S.leads.find(x=>x._id===opc.priv.origemLead); if(ld) salvarLead(ld._id, {}, [{tipo:"Nota", texto:`Imóvel captado e cadastrado: ${dados.codigo} · ${dados.titulo}.`}]); }
      r.className="ok-box"; r.textContent = dados.status==="oculto" ? "Imóvel salvo (oculto no site)." : "Imóvel salvo e publicado no site.";
      if(!id) setTimeout(fecharGaveta, 700);
    }catch(err){ r.className="err-box"; r.textContent="Não foi possível salvar. Verifique a internet e tente de novo."; }
  };
}
function proximoCodigo(){ return Math.max(1000, ...S.imoveis.map(i=>Number(i.codigo)||0)) + 1; }

/* ---------- Login do CRM ---------- */
async function renderEntrar(app, modo){
  const sess = await MF.sessao();
  if(modo==="nova-senha"){
    app.innerHTML = `<section class="wrap sec"><form class="login" id="f-ns"><h2>Criar nova senha</h2>
      <label class="campo">Nova senha (mínimo 8 caracteres)<input id="ns-s" type="password" minlength="8" required autocomplete="new-password"></label>
      <button class="btn btn-marca" type="submit">Salvar senha</button><div id="ns-r" class="nota"></div></form></section>`;
    $("#f-ns").onsubmit = async e=>{ e.preventDefault(); try{ await MF.novaSenha($("#ns-s").value); location.hash = "#crm"; location.reload(); }catch(err){ $("#ns-r").className="err-box"; $("#ns-r").textContent="Não foi possível salvar. Abra de novo o link do e-mail."; } };
    return;
  }
  if(sess && S.podeCrm){ location.hash = "#crm"; return; }
  const primeiro = S.loginModo==="primeiro";
  app.innerHTML = `<section class="wrap sec"><form class="login" id="f-login">
    <span class="eyebrow">Área do corretor</span><h2>${primeiro?"Primeiro acesso":"Entrar no CRM"}</h2>
    ${sess&&S.acessoVerificado&&!primeiro?`<div class="aviso">Você entrou como <b>${esc(sess.user.email||"")}</b>, mas esse e-mail ainda não tem acesso ao CRM. Peça ao Fernando para liberar em Equipe.</div>`:""}
    ${primeiro?`<p class="nota" style="font-size:14px;margin:0">Use o e-mail que o Fernando liberou para você e crie sua senha. Vamos mandar um link de confirmação para esse e-mail.</p>`:""}
    <label class="campo">E-mail<input id="lg-e" type="email" required autocomplete="username"></label>
    <label class="campo">${primeiro?"Crie uma senha (mínimo 8 caracteres)":"Senha"}<input id="lg-s" type="password" required ${primeiro?'minlength="8" autocomplete="new-password"':'autocomplete="current-password"'}></label>
    <button class="btn btn-marca" type="submit">${primeiro?"Criar minha senha":"Entrar"}</button>
    ${primeiro?`<button class="btn btn-linha btn-sm" type="button" id="lg-volta">Já tenho senha</button>`:`<div class="chips"><button class="btn btn-linha btn-sm" type="button" id="lg-rec">Esqueci a senha</button><button class="btn btn-linha btn-sm" type="button" id="lg-pri">Primeiro acesso</button></div>`}
    <div id="lg-r" class="nota"></div></form></section>`;
  $("#f-login").onsubmit = async e=>{ e.preventDefault(); const r = $("#lg-r"); const em = $("#lg-e").value.trim(), se = $("#lg-s").value;
    if(primeiro){
      r.className="nota"; r.textContent="Criando…";
      try{ const d = await MF.cadastrar(em, se);
        if(d && d.user && Array.isArray(d.user.identities) && !d.user.identities.length){ r.className="err-box"; r.textContent="Este e-mail já tem senha. Toque em \"Já tenho senha\" para entrar, ou use \"Esqueci a senha\"."; return; }
        if(d && d.session){ location.hash = "#crm"; location.reload(); return; }
        r.className="ok-box"; r.textContent=`Quase lá! Enviamos um link para ${em}. Abra o e-mail, toque no link e depois entre aqui com a senha que você criou.`;
      }catch(err){ r.className="err-box"; r.textContent = /already|registered/i.test(err.message||"") ? "Este e-mail já tem senha. Use \"Já tenho senha\"." : /password/i.test(err.message||"") ? "A senha precisa ter pelo menos 8 caracteres." : "Não foi possível criar agora. Tente de novo em alguns minutos."; }
      return;
    }
    r.className="nota"; r.textContent="Entrando…";
    try{ await MF.entrar(em, se); location.hash = "#crm"; location.reload(); }
    catch(err){ r.className="err-box"; r.textContent = /confirm/i.test(err.message||"") ? "Falta confirmar o e-mail: abra o link que enviamos e tente de novo." : "E-mail ou senha incorretos."; } };
  if(primeiro){ $("#lg-volta").onclick = ()=>{ S.loginModo = ""; renderEntrar(app, modo); }; return; }
  $("#lg-pri").onclick = ()=>{ S.loginModo = "primeiro"; renderEntrar(app, modo); };
  $("#lg-rec").onclick = async()=>{ const r = $("#lg-r"); const em = $("#lg-e").value.trim(); if(!em){ r.className="err-box"; r.textContent="Digite seu e-mail acima primeiro."; return; }
    try{ await MF.recuperar(em); r.className="ok-box"; r.textContent="Enviamos um link para criar nova senha no seu e-mail."; }catch(err){ r.className="err-box"; r.textContent="Não foi possível enviar agora."; } };
}
