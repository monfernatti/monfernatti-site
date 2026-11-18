/* Camada de dados: liga o site ao Supabase mantendo a mesma interface usada pelo app
   (db.collection(x).doc(id).set/update/delete/get, add, onSnapshot; assets.upload; user.isOwner). */
(function(){
  const cfg = window.MF_CONFIG || {};
  const sb = (window.supabase && cfg.supabaseUrl && !/COLE_AQUI/.test(cfg.supabaseUrl))
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const TABELAS = {imoveis:"imoveis", corretores:"corretores", leads:"leads", privado:"privado", modelos:"modelos"};
  const ouvintes = {}; // colecao -> [fn]
  const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(16).slice(2)).replace(/-/g,"").slice(0,20);
  const tab = c => { const t = TABELAS[c]; if(!t) throw new Error("coleção desconhecida: "+c); return t; };
  const snap = rows => ({docs: rows.map(r=>({id:r.id, data:()=>r.data||{}}))});

  async function buscar(c){
    const {data, error} = await sb.from(tab(c)).select("id,data");
    if(error) throw error; return data||[];
  }
  async function recarregar(c){
    for(const o of (ouvintes[c]||[])){ try{ o.ok(snap(await buscar(c))); }catch(e){ o.err && o.err(e); } }
  }
  function docRef(c, id){
    id = id || novoId();
    return {
      id,
      async get(){ const {data, error} = await sb.from(tab(c)).select("id,data").eq("id", id).maybeSingle(); if(error) throw error; return {id, exists:!!data, data:()=>data?data.data:undefined}; },
      async set(d){ const {error} = await sb.from(tab(c)).upsert({id, data:d}); if(error) throw error; recarregar(c); },
      async update(d){
        const {data:atual, error:e1} = await sb.from(tab(c)).select("data").eq("id", id).maybeSingle(); if(e1) throw e1;
        if(!atual) throw new Error("não encontrado");
        const {error} = await sb.from(tab(c)).update({data:{...atual.data, ...d}}).eq("id", id); if(error) throw error; recarregar(c);
      },
      async delete(){ const {error} = await sb.from(tab(c)).delete().eq("id", id); if(error) throw error; recarregar(c); }
    };
  }
  function colecao(c){
    return {
      doc: id => docRef(c, id),
      async add(d){ const id = novoId(); const {error} = await sb.from(tab(c)).insert({id, data:d}); if(error) throw error; recarregar(c); return {id}; },
      onSnapshot(ok, err){
        (ouvintes[c] = ouvintes[c]||[]).push({ok, err});
        buscar(c).then(r=>ok(snap(r))).catch(e=>err&&err(e));
        if(!ouvintes[c].canal){
          ouvintes[c].canal = sb.channel("mf-"+c).on("postgres_changes", {event:"*", schema:"public", table:tab(c)}, ()=>recarregar(c)).subscribe();
        }
        return ()=>{};
      }
    };
  }
  const db = sb ? { collection: colecao, doc: path => { const [c,id] = path.split("/"); return docRef(c,id); } } : null;

  let adminCache = null;
  async function ehAdmin(){
    if(!sb) return false;
    if(adminCache!==null) return adminCache;
    const {data:{session}} = await sb.auth.getSession();
    if(!session) return (adminCache=false);
    const {data, error} = await sb.rpc("eh_admin");
    return (adminCache = !error && !!data);
  }
  const user = { isOwner: ehAdmin, canEdit: ehAdmin };
  const assets = sb ? {
    async upload(arquivo){
      const ext = (arquivo.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
      const caminho = new Date().toISOString().slice(0,7)+"/"+novoId()+"."+ext;
      const {error} = await sb.storage.from("fotos").upload(caminho, arquivo, {contentType: arquivo.type, upsert:false});
      if(error) throw error;
      return {url: sb.storage.from("fotos").getPublicUrl(caminho).data.publicUrl};
    }
  } : null;

  window.claude = {
    async use(nome){ if(nome==="db") return db; if(nome==="user") return user; if(nome==="assets") return assets; return null; }
  };
  window.MF = {
    configurado: !!sb,
    async sessao(){ if(!sb) return null; const {data:{session}} = await sb.auth.getSession(); return session; },
    async entrar(email, senha){ const {error} = await sb.auth.signInWithPassword({email, password:senha}); if(error) throw error; adminCache=null; },
    async sair(){ if(sb) await sb.auth.signOut(); adminCache=null; },
    async recuperar(email){ const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin+"/#nova-senha"}); if(error) throw error; },
    async novaSenha(senha){ const {error} = await sb.auth.updateUser({password:senha}); if(error) throw error; },
    /* Primeiro acesso: a pessoa cria a própria senha (o e-mail precisa estar liberado na tabela admins para ver o CRM). */
    async cadastrar(email, senha){ const {data, error} = await sb.auth.signUp({email, password:senha, options:{emailRedirectTo: location.origin+"/#entrar"}}); if(error) throw error; adminCache=null; return data; },
    /* Papel de quem está logado: gestor (vê tudo) ou corretor (vê só a própria carteira). */
    async meuAcesso(){
      if(!sb) return null;
      const {data, error} = await sb.rpc("meu_acesso");
      if(error) return (await ehAdmin()) ? {papel:"gestor", corretor_id:"fernando"} : null;
      return data || null;
    },
    async acessos(){ const {data, error} = await sb.from("admins").select("*"); if(error) throw error; return data||[]; },
    async darAcesso(email, papel, corretor_id){ const {error} = await sb.from("admins").upsert({email:String(email).trim().toLowerCase(), papel, corretor_id}); if(error) throw error; },
    async removerAcesso(email){ const {error} = await sb.from("admins").delete().eq("email", email); if(error) throw error; }
  };
})();
