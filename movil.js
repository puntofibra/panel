/* ===== PUNTOFIBRA · FORMATO MÓVIL =====
   Se carga dentro del panel (Apps Script) cuando se entra en «Formato móvil».
   Borradores y contratos: buscador, lista (documento, nombre y dirección), ficha completa,
   editar, ver documento cara A / cara B y subir documento. Se adapta a móvil vertical,
   horizontal y a la pantalla cuadrada del Fold. */
(function(){
  if(window.__pfMovil) return; window.__pfMovil = true;
  var D = document;
  var ST = { tab:'borradores', data:{ borradores:null, contratos:null }, titles:{}, ids:[], q:'', shown:0, sel:null, edit:false };
  var POR_PAGINA = 40;

  function fold(s){ return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function v(it,id){ return String(it && it[id]!=null ? it[id] : '').trim(); }
  function tit(id){ return ST.titles[id] || ('Campo '+id); }
  function vib(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }
  function tsDMY(s){ var m=String(s||'').match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/); return m ? new Date(+m[3], m[2]-1, +m[1]).getTime() : 0; }
  function run(fn){ var args=[].slice.call(arguments,1); return new Promise(function(ok, ko){ try{ var r=google.script.run.withSuccessHandler(ok).withFailureHandler(ko); r[fn].apply(r, args); }catch(e){ ko(e); } }); }

  /* ---------- estilos ---------- */
  var css = `
  body.pfMovil{ overflow:hidden !important; }
  body.pfMovil #lucasDock, body.pfMovil .chatWidget, body.pfMovil #iaChatPanel, body.pfMovil #pfcon{ display:none !important; }
  #pfm{ position:fixed; inset:0; z-index:2147482000; display:flex; flex-direction:column; background:#070d1a; color:#e6edf7;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; -webkit-tap-highlight-color:transparent; overflow:hidden; }
  #pfm *{ box-sizing:border-box; }
  #pfm .bg{ position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  #pfm .bg i{ position:absolute; width:380px; height:380px; border-radius:50%; filter:blur(80px); opacity:.22; animation:pfmFlota 12s ease-in-out infinite; }
  #pfm .bg i:nth-child(1){ background:#0ea5e9; top:-160px; left:-120px; }
  #pfm .bg i:nth-child(2){ background:#8b5cf6; bottom:-180px; right:-140px; animation-delay:-6s; }
  @keyframes pfmFlota{ 50%{ transform:translate(30px,40px) scale(1.15); } }
  #pfm header{ position:relative; z-index:2; padding:calc(10px + env(safe-area-inset-top)) 14px 10px; background:linear-gradient(180deg,rgba(7,13,26,.96),rgba(7,13,26,.82)); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid rgba(148,163,184,.14); }
  #pfm .fila1{ display:flex; align-items:center; gap:10px; }
  #pfm .logo{ height:30px; width:auto; filter:drop-shadow(0 3px 10px rgba(56,189,248,.35)); }
  #pfm .tt{ flex:1; font-weight:900; font-size:16px; letter-spacing:.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #pfm .ib{ width:40px; height:40px; border-radius:12px; border:1px solid rgba(148,163,184,.22); background:rgba(255,255,255,.05); color:#e6edf7; font-size:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex:0 0 auto; transition:transform .15s, background .2s; }
  #pfm .ib:active{ transform:scale(.9); background:rgba(56,189,248,.18); }
  #pfm .tabs{ position:relative; display:grid; grid-template-columns:1fr 1fr; margin-top:10px; padding:4px; border-radius:14px; background:rgba(255,255,255,.06); border:1px solid rgba(148,163,184,.14); }
  #pfm .tabs .pill{ position:absolute; top:4px; bottom:4px; left:4px; width:calc(50% - 4px); border-radius:11px; background:linear-gradient(135deg,#0ea5e9,#6366f1); box-shadow:0 6px 18px rgba(14,165,233,.4); transition:transform .35s cubic-bezier(.3,1.3,.5,1); }
  #pfm .tabs.c .pill{ transform:translateX(100%); }
  #pfm .tabs button{ position:relative; z-index:1; border:0; background:none; color:#cbd5e1; font:inherit; font-weight:800; font-size:14px; padding:10px 6px; cursor:pointer; transition:color .2s; }
  #pfm .tabs button.on{ color:#fff; }
  #pfm .tabs .n{ display:inline-block; min-width:22px; margin-left:6px; padding:1px 7px; border-radius:999px; font-size:11.5px; background:rgba(255,255,255,.18); }
  #pfm .busca{ position:relative; margin-top:10px; }
  #pfm .busca input{ width:100%; height:46px; border-radius:14px; border:1px solid rgba(148,163,184,.25); background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:16px; padding:0 44px 0 42px; outline:none; transition:border-color .2s, box-shadow .2s; }
  #pfm .busca input:focus{ border-color:#38bdf8; box-shadow:0 0 0 4px rgba(56,189,248,.18); }
  #pfm .busca input::placeholder{ color:#7c8aa3; }
  #pfm .busca .lu{ position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:16px; opacity:.7; }
  #pfm .busca .x{ position:absolute; right:6px; top:50%; transform:translateY(-50%); width:34px; height:34px; border:0; border-radius:10px; background:rgba(255,255,255,.08); color:#cbd5e1; font-size:15px; display:none; cursor:pointer; }
  #pfm .busca.lleno .x{ display:block; }
  #pfm .cuerpo{ position:relative; z-index:1; flex:1; display:flex; min-height:0; }
  #pfm .lista{ flex:1; overflow-y:auto; overflow-x:hidden; padding:12px 12px calc(20px + env(safe-area-inset-bottom)); -webkit-overflow-scrolling:touch; }
  #pfm .info{ font-size:12px; color:#7c8aa3; margin:2px 4px 10px; }
  #pfm .card{ position:relative; display:block; width:100%; text-align:left; margin:0 0 10px; padding:14px 14px 13px 16px; border-radius:16px; cursor:pointer; color:inherit; font:inherit;
    border:1px solid rgba(148,163,184,.16); background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.025)); box-shadow:0 8px 22px rgba(0,0,0,.25);
    overflow:hidden; animation:pfmCard .4s cubic-bezier(.2,1.2,.4,1) both; transition:transform .15s, border-color .2s; }
  #pfm .card::before{ content:""; position:absolute; left:0; top:12px; bottom:12px; width:4px; border-radius:4px; background:var(--c,#38bdf8); box-shadow:0 0 10px var(--c,#38bdf8); }
  #pfm .card:active{ transform:scale(.98); border-color:rgba(56,189,248,.5); }
  #pfm .card.sel{ border-color:#38bdf8; box-shadow:0 0 0 1px rgba(56,189,248,.4), 0 10px 26px rgba(14,165,233,.25); }
  @keyframes pfmCard{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:none; } }
  #pfm .card .nom{ font-weight:850; font-size:15.5px; line-height:1.25; padding-right:70px; }
  #pfm .card .doc{ display:inline-block; margin-top:6px; font-family:ui-monospace,Consolas,monospace; font-size:13px; font-weight:700; letter-spacing:.4px; color:#7dd3fc; background:rgba(56,189,248,.12); border:1px solid rgba(56,189,248,.3); padding:2px 8px; border-radius:8px; }
  #pfm .card .dir{ margin-top:7px; font-size:13px; color:#a9b6c9; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  #pfm .card .comp{ position:absolute; top:13px; right:12px; font-size:10.5px; font-weight:900; letter-spacing:.5px; padding:3px 8px; border-radius:999px; background:rgba(255,255,255,.1); color:#e2e8f0; text-transform:uppercase; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #pfm .card .est{ position:absolute; right:12px; bottom:11px; display:flex; gap:6px; }
  #pfm .card .est span{ min-width:30px; height:28px; padding:0 6px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; background:rgba(255,255,255,.08); border:1px solid rgba(148,163,184,.2); color:#94a3b8; font-weight:800; }
  #pfm .card .dir{ padding-right:0; }
  #pfm .card:has(.est) .dir{ padding-right:84px; }
  #pfm .acc button, #pfm .acc a{ position:relative; overflow:hidden; -webkit-touch-callout:none; user-select:none; -webkit-user-select:none; }
  #pfm .acc .carga{ position:absolute; left:0; bottom:0; height:4px; width:0; background:linear-gradient(90deg,#38bdf8,#a78bfa); box-shadow:0 0 10px #38bdf8; }
  #pfm .acc .mant{ display:block; font-size:9.5px; font-weight:600; opacity:.55; margin-top:1px; }
  #pfm .vacio{ text-align:center; padding:50px 20px; color:#7c8aa3; font-size:14px; }
  #pfm .vacio b{ display:block; font-size:40px; margin-bottom:10px; }
  #pfm .sk{ height:96px; border-radius:16px; margin-bottom:10px; background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.09),rgba(255,255,255,.04)); background-size:200% 100%; animation:pfmSk 1.2s linear infinite; }
  @keyframes pfmSk{ to{ background-position:-200% 0; } }
  /* ficha */
  #pfm .det{ position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; background:#070d1a; transform:translateX(105%); transition:transform .38s cubic-bezier(.2,1,.3,1); }
  #pfm .det.on{ transform:none; }
  #pfm .det .dh{ display:flex; align-items:center; gap:10px; padding:calc(10px + env(safe-area-inset-top)) 12px 10px; border-bottom:1px solid rgba(148,163,184,.14); background:rgba(7,13,26,.95); }
  #pfm .det .dh .tt{ font-size:15px; }
  #pfm .det .dc{ flex:1; overflow-y:auto; overflow-x:hidden; padding:14px 12px calc(90px + env(safe-area-inset-bottom)); -webkit-overflow-scrolling:touch; }
  #pfm .hero{ position:relative; padding:18px 16px; border-radius:20px; overflow:hidden; background:linear-gradient(135deg,#0c4a6e,#312e81); box-shadow:0 14px 34px rgba(49,46,129,.45); animation:pfmCard .45s both; }
  #pfm .hero::after{ content:""; position:absolute; right:-40px; top:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,.08); }
  #pfm .hero .hn{ font-size:20px; font-weight:900; line-height:1.2; position:relative; }
  #pfm .hero .hd{ margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; position:relative; }
  #pfm .chip{ display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:800; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.22); }
  #pfm .acc{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:12px 0 4px; }
  #pfm .acc button, #pfm .acc a{ display:flex; flex-direction:column; align-items:center; gap:4px; padding:11px 6px; border-radius:14px; border:1px solid rgba(148,163,184,.2); background:rgba(255,255,255,.05); color:#e6edf7; font:inherit; font-size:12px; font-weight:700; text-decoration:none; cursor:pointer; transition:transform .15s; }
  #pfm .acc button:active, #pfm .acc a:active{ transform:scale(.94); }
  #pfm .acc b{ font-size:20px; }
  #pfm .sec{ margin-top:14px; border-radius:18px; border:1px solid rgba(148,163,184,.14); background:rgba(255,255,255,.035); overflow:hidden; animation:pfmCard .45s both; }
  #pfm .sec h4{ margin:0; padding:12px 14px; font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#7dd3fc; border-bottom:1px solid rgba(148,163,184,.12); background:rgba(56,189,248,.06); }
  #pfm .kv{ display:flex; gap:10px; padding:11px 14px; border-bottom:1px solid rgba(148,163,184,.08); }
  #pfm .kv:last-child{ border-bottom:0; }
  #pfm .kv .k{ flex:0 0 38%; font-size:12px; color:#8b9ab0; font-weight:700; padding-top:1px; }
  #pfm .kv .val{ flex:1; font-size:14px; word-break:break-word; white-space:pre-wrap; }
  #pfm .kv .val.mono{ font-family:ui-monospace,Consolas,monospace; letter-spacing:.3px; }
  #pfm .kv input, #pfm .kv textarea{ flex:1; min-width:0; width:100%; font:inherit; font-size:15px; color:#fff; background:rgba(255,255,255,.07); border:1px solid rgba(148,163,184,.3); border-radius:10px; padding:9px 10px; outline:none; }
  #pfm .kv textarea{ min-height:70px; resize:vertical; }
  #pfm .kv input:focus, #pfm .kv textarea:focus{ border-color:#38bdf8; box-shadow:0 0 0 3px rgba(56,189,248,.18); }
  #pfm .kv.cambio input, #pfm .kv.cambio textarea{ border-color:#f5c344; box-shadow:0 0 0 3px rgba(245,195,68,.18); }
  /* documentos */
  #pfm .docs{ display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:12px; }
  #pfm .dcard{ border-radius:14px; border:1px solid rgba(148,163,184,.2); background:rgba(0,0,0,.25); overflow:hidden; display:flex; flex-direction:column; }
  #pfm .dcard .dt{ font-size:11.5px; font-weight:900; letter-spacing:.8px; padding:8px 10px; color:#cbd5e1; background:rgba(255,255,255,.05); }
  #pfm .dcard .dv{ height:118px; display:flex; align-items:center; justify-content:center; background:#0b1324; cursor:pointer; position:relative; }
  #pfm .dcard .dv img{ width:100%; height:100%; object-fit:cover; }
  #pfm .dcard .dv .no{ font-size:12px; color:#7c8aa3; text-align:center; padding:8px; }
  #pfm .dcard .db{ display:flex; }
  #pfm .dcard .db button{ flex:1; border:0; border-top:1px solid rgba(148,163,184,.15); background:none; color:#7dd3fc; font:inherit; font-size:12.5px; font-weight:800; padding:10px 4px; cursor:pointer; }
  #pfm .dcard .db button + button{ border-left:1px solid rgba(148,163,184,.15); }
  #pfm .dcard .db button:active{ background:rgba(56,189,248,.12); }
  /* barra inferior de la ficha */
  #pfm .barra{ position:absolute; left:0; right:0; bottom:0; padding:10px 12px calc(10px + env(safe-area-inset-bottom)); display:flex; gap:10px; background:linear-gradient(0deg,rgba(7,13,26,.98) 60%,rgba(7,13,26,0)); }
  #pfm .btn{ flex:1; height:50px; border-radius:15px; border:0; font:inherit; font-size:15.5px; font-weight:900; cursor:pointer; transition:transform .15s; }
  #pfm .btn:active{ transform:scale(.97); }
  #pfm .btn.pri{ color:#04202e; background:linear-gradient(90deg,#38bdf8,#818cf8); box-shadow:0 8px 24px rgba(56,189,248,.4); }
  #pfm .btn.sec2{ color:#e6edf7; background:rgba(255,255,255,.08); border:1px solid rgba(148,163,184,.25); }
  #pfm .btn:disabled{ opacity:.55; }
  /* visor, menú, avisos */
  #pfmVisor{ position:fixed; inset:0; z-index:2147482500; background:rgba(0,0,0,.92); display:flex; align-items:center; justify-content:center; padding:16px; animation:pfmFade .2s both; }
  #pfmVisor img{ max-width:100%; max-height:100%; object-fit:contain; border-radius:10px; }
  #pfmVisor iframe{ width:100%; height:100%; border:0; border-radius:10px; background:#fff; }
  #pfmVisor .vx{ position:absolute; top:calc(12px + env(safe-area-inset-top)); right:12px; width:46px; height:46px; border-radius:50%; border:1px solid rgba(255,255,255,.35); background:rgba(255,255,255,.14); color:#fff; font-size:22px; cursor:pointer; }
  #pfmVisor .vd{ position:absolute; top:calc(16px + env(safe-area-inset-top)); right:70px; padding:10px 14px; border-radius:999px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.3); color:#fff; font-weight:800; font-size:13px; text-decoration:none; }
  @keyframes pfmFade{ from{ opacity:0; } }
  #pfmMenu{ position:fixed; inset:0; z-index:2147482400; background:rgba(0,0,0,.45); animation:pfmFade .2s both; }
  #pfmMenu .mm{ position:absolute; top:calc(58px + env(safe-area-inset-top)); right:12px; min-width:220px; border-radius:16px; overflow:hidden; background:#101a2e; border:1px solid rgba(148,163,184,.22); box-shadow:0 20px 50px rgba(0,0,0,.5); animation:pfmCard .3s both; }
  #pfmMenu button{ display:flex; align-items:center; gap:10px; width:100%; padding:14px 16px; border:0; border-bottom:1px solid rgba(148,163,184,.1); background:none; color:#e6edf7; font:inherit; font-size:14.5px; font-weight:700; text-align:left; cursor:pointer; }
  #pfmMenu button:last-child{ border-bottom:0; color:#fca5a5; }
  #pfmToast{ position:fixed; left:50%; bottom:calc(84px + env(safe-area-inset-bottom)); transform:translateX(-50%) translateY(20px); z-index:2147482600; padding:12px 18px; border-radius:14px; background:#111c33; color:#fff; font-weight:700; font-size:14px; border:1px solid rgba(148,163,184,.25); box-shadow:0 12px 30px rgba(0,0,0,.5); opacity:0; transition:all .3s; pointer-events:none; max-width:90vw; text-align:center; }
  #pfmToast.on{ opacity:1; transform:translateX(-50%); }
  #pfmToast.ok{ border-color:#22c55e; } #pfmToast.err{ border-color:#ef4444; }
  #pfmCarga{ position:fixed; inset:0; z-index:2147482700; display:none; align-items:center; justify-content:center; background:rgba(3,7,18,.55); backdrop-filter:blur(3px); }
  #pfmCarga.on{ display:flex; }
  #pfmCarga div{ width:46px; height:46px; border-radius:50%; border:4px solid rgba(255,255,255,.2); border-top-color:#38bdf8; animation:pfmGira .8s linear infinite; }
  @keyframes pfmGira{ to{ transform:rotate(360deg); } }
  /* pantallas anchas: Fold abierto / móvil en horizontal → lista y ficha lado a lado */
  @media (min-width:700px){
    #pfm .cuerpo{ gap:0; }
    #pfm .lista{ flex:0 0 min(42%,440px); border-right:1px solid rgba(148,163,184,.14); }
    #pfm .det{ position:relative; inset:auto; flex:1; transform:none; transition:none; }
    #pfm .det .dh .atras{ display:none; }
    #pfm .det.vacia .dc{ display:flex; align-items:center; justify-content:center; }
    #pfm .det .ph{ text-align:center; color:#7c8aa3; font-size:14px; }
    #pfm .det .ph b{ display:block; font-size:46px; margin-bottom:10px; opacity:.7; }
    #pfm .barra{ position:absolute; }
  }
  @media (min-width:700px) and (max-height:520px){ #pfm header .busca{ margin-top:8px; } #pfm .tabs{ margin-top:8px; } }
  `;
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);

  /* ---------- estructura ---------- */
  D.body.classList.add('pfMovil');
  var root = D.createElement('div'); root.id = 'pfm';
  root.innerHTML =
    '<div class="bg"><i></i><i></i></div>' +
    '<header>' +
      '<div class="fila1"><img class="logo" src="https://i.postimg.cc/vZwLhn6g/descarga.png" alt=""><div class="tt">Puntofibra</div>' +
      '<button class="ib" id="pfmRef" title="Actualizar">⟳</button><button class="ib" id="pfmMas" title="Más">⋮</button></div>' +
      '<div class="tabs" id="pfmTabs"><span class="pill"></span><button data-t="borradores" class="on">📝 Borradores<span class="n" id="pfmNb">·</span></button><button data-t="contratos">📄 Contratos<span class="n" id="pfmNc">·</span></button></div>' +
      '<div class="busca" id="pfmBusca"><span class="lu">🔍</span><input id="pfmQ" type="search" placeholder="Buscar por nombre, documento, cuenta, dirección…" autocomplete="off" enterkeyhint="search"><button class="x" id="pfmQx">✕</button></div>' +
    '</header>' +
    '<div class="cuerpo"><div class="lista" id="pfmLista"></div>' +
      '<div class="det vacia" id="pfmDet"><div class="dh"><button class="ib atras" id="pfmAtras">←</button><div class="tt" id="pfmDtt">Ficha</div><button class="ib" id="pfmEdit" title="Editar" style="display:none">✏️</button></div><div class="dc" id="pfmDc"><div class="ph"><b>👈</b>Elige un cliente de la lista para ver su ficha</div></div><div class="barra" id="pfmBarra" style="display:none"></div></div>' +
    '</div>';
  D.body.appendChild(root);
  var toastEl = D.createElement('div'); toastEl.id = 'pfmToast'; D.body.appendChild(toastEl);
  var cargaEl = D.createElement('div'); cargaEl.id = 'pfmCarga'; cargaEl.innerHTML = '<div></div>'; D.body.appendChild(cargaEl);
  var $ = function(id){ return D.getElementById(id); };
  var ancho = function(){ return window.matchMedia('(min-width:700px)').matches; };

  var tT = 0;
  function toast(t, tipo){ toastEl.textContent = t; toastEl.className = 'on ' + (tipo||''); clearTimeout(tT); tT = setTimeout(function(){ toastEl.className = ''; }, 2600); }
  function carga(on){ cargaEl.classList.toggle('on', !!on); }

  /* ---------- datos ---------- */
  function cargar(tab, forzar){
    if(ST.data[tab] && !forzar) return Promise.resolve(ST.data[tab]);
    return run('apiGetContratos', tab).then(function(res){
      if(!res || res.ok === false) throw new Error((res && res.error) || 'No se han podido leer los datos');
      var ids = (res.ids||[]).map(String), tl = res.titlesById || [];
      ids.forEach(function(id, i){ if(tl[i]) ST.titles[id] = String(tl[i]).trim(); });
      ST.ids = ids;
      var items = (res.items||[]).map(function(it){
        var o = {}; for(var k in it) o[k] = it[k];
        o.__txt = fold(ids.map(function(id){ return it[id]; }).join(' | '));
        return o;
      });
      if(tab === 'contratos') items.sort(function(a,b){ return tsDMY(v(b,'14')) - tsDMY(v(a,'14')); });
      ST.data[tab] = items;
      $(tab === 'borradores' ? 'pfmNb' : 'pfmNc').textContent = items.length;
      return items;
    });
  }
  function filtrados(){
    var l = ST.data[ST.tab] || [], q = fold(ST.q);
    if(!q) return l;
    var palabras = q.split(/\s+/).filter(Boolean);
    var qd = q.replace(/[\s\-.]/g,'');
    return l.filter(function(it){
      var t = it.__txt;
      if(qd.length >= 4 && t.replace(/[\s\-.]/g,'').indexOf(qd) >= 0) return true;   // cuentas y teléfonos con o sin espacios
      return palabras.every(function(p){ return t.indexOf(p) >= 0; });
    });
  }

  /* ---------- lista ---------- */
  var obs = null;
  function colorComp(c){ c = fold(c); if(/simyo/.test(c)) return '#f59e0b'; if(/masmovil|mas movil/.test(c)) return '#facc15'; if(/o2/.test(c)) return '#3b82f6'; if(/pepe/.test(c)) return '#ef4444'; if(/jazztel/.test(c)) return '#f472b6'; if(/lowi/.test(c)) return '#22c55e'; if(/finetwork/.test(c)) return '#a855f7'; return '#38bdf8'; }
  function pintarLista(reset){
    var box = $('pfmLista');
    if(!ST.data[ST.tab]){ box.innerHTML = '<div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div>'; return; }
    var l = filtrados();
    if(reset){ ST.shown = 0; box.innerHTML = '<div class="info" id="pfmInfo"></div>'; box.scrollTop = 0; }
    $('pfmInfo').textContent = l.length ? (l.length + (l.length === 1 ? ' resultado' : ' resultados') + (ST.q ? ' para «' + ST.q + '»' : '')) : '';
    if(!l.length){ box.insertAdjacentHTML('beforeend', '<div class="vacio"><b>🔎</b>' + (ST.q ? 'No hay nada que coincida con «' + esc(ST.q) + '»' : 'No hay ' + ST.tab + ' ahora mismo') + '</div>'); return; }
    var hasta = Math.min(l.length, ST.shown + POR_PAGINA), frag = D.createDocumentFragment();
    for(var i = ST.shown; i < hasta; i++){
      var it = l[i], b = D.createElement('button');
      b.className = 'card' + (ST.sel === it ? ' sel' : ''); b.type = 'button';
      b.style.setProperty('--c', colorComp(v(it,'2')));
      b.style.animationDelay = Math.min((i - ST.shown) * 25, 300) + 'ms';
      b.innerHTML = (v(it,'2') ? '<span class="comp">' + esc(v(it,'2')) + '</span>' : '') +
        '<div class="nom">' + esc(v(it,'21') || 'Sin nombre') + '</div>' +
        '<div class="doc">' + esc(v(it,'20') || 'Sin documento') + '</div>' +
        '<div class="dir">📍 ' + esc(v(it,'23') || 'Sin dirección') + '</div>' +
        (ST.tab === 'contratos' ? '<div class="est"><span title="Estado">' + esc(v(it,'45') || '-') + '</span><span title="Estado 2">' + esc(v(it,'44') || '-') + '</span></div>' : '');
      (function(it, b){ b.onclick = function(){ vib(15); abrirFicha(it, b); }; })(it, b);
      frag.appendChild(b);
    }
    var old = $('pfmMasSent'); if(old) old.remove();
    box.appendChild(frag); ST.shown = hasta;
    if(hasta < l.length){
      var s = D.createElement('div'); s.id = 'pfmMasSent'; s.style.height = '40px'; box.appendChild(s);
      if(obs) obs.disconnect();
      obs = new IntersectionObserver(function(e){ if(e[0].isIntersecting){ obs.disconnect(); pintarLista(false); } }, { root:box, rootMargin:'400px' });
      obs.observe(s);
    }
  }
  function cambiarTab(t){
    if(ST.tab === t) return;
    ST.tab = t; ST.sel = null;
    $('pfmTabs').classList.toggle('c', t === 'contratos');
    [].forEach.call($('pfmTabs').querySelectorAll('button'), function(b){ b.classList.toggle('on', b.getAttribute('data-t') === t); });
    cerrarFicha(true);
    pintarLista(true);
    cargar(t).then(function(){ pintarLista(true); }).catch(function(e){ toast('❌ ' + (e.message||e), 'err'); });
  }

  /* ---------- ficha ---------- */
  var GRUPOS = [
    ['👤 Cliente', ['21','20','22','23','24']],
    ['📄 Contrato', ['2','26','14','15','16','17','18','29','28','44','45','50']],
    ['📝 Notas', ['31','1']]
  ];
  var MONO = { '20':1, '22':1, '24':1 };
  var OCULTOS = { '32':1, '46':1, '47':1, '48':1, '51':1, '52':1, '53':1, '54':1 };
  function abrirFicha(it, card){
    ST.sel = it; ST.edit = false;
    [].forEach.call(D.querySelectorAll('#pfm .card.sel'), function(c){ c.classList.remove('sel'); });
    if(card) card.classList.add('sel');
    pintarFicha();
    var d = $('pfmDet'); d.classList.remove('vacia');
    if(!ancho()){ d.classList.add('on'); try{ history.pushState({ pfm:'ficha' }, ''); }catch(e){} }
  }
  function cerrarFicha(sinHistoria){
    var d = $('pfmDet'); d.classList.remove('on');
    ST.edit = false;
    if(ancho() && !ST.sel){ d.classList.add('vacia'); $('pfmDc').innerHTML = '<div class="ph"><b>👈</b>Elige un cliente de la lista para ver su ficha</div>'; $('pfmBarra').style.display = 'none'; $('pfmEdit').style.display = 'none'; $('pfmDtt').textContent = 'Ficha'; }
    if(sinHistoria && !ancho()){ ST.sel = null; }
  }
  function kv(id, it){
    var val = v(it, id);
    if(ST.edit){
      var largo = id === '31' || id === '23' || val.length > 40;
      return '<div class="kv" data-id="' + id + '"><div class="k">' + esc(tit(id)) + '</div>' + (largo ? '<textarea data-id="' + id + '">' + esc(val) + '</textarea>' : '<input data-id="' + id + '" value="' + esc(val) + '">') + '</div>';
    }
    if(!val) return '';
    return '<div class="kv"><div class="k">' + esc(tit(id)) + '</div><div class="val' + (MONO[id] ? ' mono' : '') + '">' + esc(val) + '</div></div>';
  }
  function pintarFicha(){
    var it = ST.sel; if(!it) return;
    $('pfmDtt').textContent = ST.edit ? 'Editar ficha' : (v(it,'21') || 'Ficha');
    $('pfmEdit').style.display = ST.edit ? 'none' : 'flex';
    var usados = {}, h = '';
    if(!ST.edit){
      var tel = v(it,'22').replace(/[^\d+]/g,'');
      h += '<div class="hero"><div class="hn">' + esc(v(it,'21') || 'Sin nombre') + '</div><div class="hd">' +
        (v(it,'20') ? '<span class="chip">🪪 ' + esc(v(it,'20')) + '</span>' : '') +
        (v(it,'2') ? '<span class="chip">📶 ' + esc(v(it,'2')) + '</span>' : '') +
        (v(it,'14') ? '<span class="chip">📅 ' + esc(v(it,'14')) + '</span>' : '') +
        (ST.tab === 'contratos' || (v(it,'45') && v(it,'45') !== '-') ? '<span class="chip">' + esc(v(it,'45') || '-') + '</span>' : '') +
        (ST.tab === 'contratos' || (v(it,'44') && v(it,'44') !== '-') ? '<span class="chip">' + esc(v(it,'44') || '-') + '</span>' : '') +
        '</div></div>';
      h += '<div class="acc">' +
        (tel ? '<a href="tel:' + esc(tel) + '" data-buscar="' + esc(tel.replace(/^\+34/,'')) + '"><b>📞</b>Llamar<span class="mant">mantén: buscar</span><i class="carga"></i></a>' : '<button disabled style="opacity:.4"><b>📞</b>Llamar</button>') +
        '<button data-copiar="' + esc(v(it,'20')) + '" data-buscar="' + esc(v(it,'20')) + '"><b>📋</b>Copiar doc.<span class="mant">mantén: buscar</span><i class="carga"></i></button>' +
        '<button data-copiar="' + esc(v(it,'24').replace(/\s+/g,'')) + '" data-buscar="' + esc(v(it,'24').replace(/\s+/g,'')) + '"><b>🏦</b>Copiar cuenta<span class="mant">mantén: buscar</span><i class="carga"></i></button>' +
        '</div>';
      h += '<div class="sec"><h4>🪪 Documento</h4><div class="docs" id="pfmDocs"><div class="dcard"><div class="dt">CARA A</div><div class="dv"><div class="no">Cargando…</div></div></div><div class="dcard"><div class="dt">CARA B</div><div class="dv"><div class="no">Cargando…</div></div></div></div></div>';
    }
    GRUPOS.forEach(function(g){
      var filas = g[1].filter(function(id){ return ST.titles[id] !== undefined || v(it,id); }).map(function(id){ usados[id] = 1; return kv(id, it); }).join('');
      if(filas) h += '<div class="sec"><h4>' + g[0] + '</h4>' + filas + '</div>';
    });
    var resto = ST.ids.filter(function(id){ return !usados[id] && !OCULTOS[id] && ST.titles[id]; }).map(function(id){ return kv(id, it); }).join('');
    if(resto) h += '<div class="sec"><h4>➕ Más datos</h4>' + resto + '</div>';
    var dc = $('pfmDc'); dc.innerHTML = h; dc.scrollTop = 0;
    // barra inferior
    var bar = $('pfmBarra');
    if(ST.edit){
      bar.style.display = 'flex';
      bar.innerHTML = '<button class="btn sec2" id="pfmCancel">Cancelar</button><button class="btn pri" id="pfmGuardar">💾 Guardar</button>';
      $('pfmCancel').onclick = function(){ ST.edit = false; pintarFicha(); };
      $('pfmGuardar').onclick = guardar;
      [].forEach.call(dc.querySelectorAll('input,textarea'), function(el){ el.addEventListener('input', function(){ el.parentNode.classList.toggle('cambio', el.value.trim() !== v(it, el.getAttribute('data-id'))); }); });
    } else {
      bar.style.display = 'flex';
      bar.innerHTML = '<button class="btn pri" id="pfmEdit2">✏️ Editar datos</button>';
      $('pfmEdit2').onclick = function(){ ST.edit = true; pintarFicha(); };
      [].forEach.call(dc.querySelectorAll('[data-copiar]'), function(b){ b.onclick = function(e){ if(b.__largo){ e.preventDefault(); b.__largo = false; return; } copiar(b.getAttribute('data-copiar')); }; });
      [].forEach.call(dc.querySelectorAll('[data-buscar]'), mantenerParaBuscar);
      cargarDocs(it);
    }
  }
  // mantener pulsado 2 s en Llamar / Copiar doc. / Copiar cuenta → lo busca y enseña lo filtrado
  function mantenerParaBuscar(b){
    var t0 = 0, raf = 0, barra = b.querySelector('.carga');
    function parar(){ cancelAnimationFrame(raf); raf = 0; if(barra) barra.style.width = '0'; }
    function paso(){
      var p = Math.min(1, (Date.now() - t0) / 2000);
      if(barra) barra.style.width = (p * 100) + '%';
      if(p >= 1){ parar(); b.__largo = true; vib([40,40,80]); buscarDesdeFicha(b.getAttribute('data-buscar')); return; }
      raf = requestAnimationFrame(paso);
    }
    b.addEventListener('pointerdown', function(e){ if(e.button > 0) return; b.__largo = false; t0 = Date.now(); parar(); raf = requestAnimationFrame(paso); });
    ['pointerup','pointerleave','pointercancel'].forEach(function(n){ b.addEventListener(n, function(){ if(raf) parar(); }); });
    b.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    b.addEventListener('click', function(e){ if(b.__largo){ e.preventDefault(); e.stopImmediatePropagation(); b.__largo = false; } }, true);
  }
  function buscarDesdeFicha(q){
    q = String(q || '').trim(); if(!q){ toast('No hay nada que buscar'); return; }
    ST.sel = null; ST.edit = false;
    var d = $('pfmDet');
    if(d.classList.contains('on')){ d.classList.remove('on'); try{ history.back(); }catch(e){} }
    cerrarFicha(true);
    var inp = $('pfmQ'); inp.value = q; $('pfmBusca').classList.add('lleno');
    ST.q = q; pintarLista(true);
    var n = filtrados().length;
    toast('🔍 ' + n + (n === 1 ? ' resultado' : ' resultados') + ' para «' + q + '»', 'ok');
  }
  function copiar(t){
    if(!t){ toast('No hay nada que copiar'); return; }
    var hecho = function(){ vib(25); toast('📋 Copiado: ' + t, 'ok'); };
    var viejo = function(){ try{ var ta = D.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;left:-9999px'; D.body.appendChild(ta); ta.select(); D.execCommand('copy'); ta.remove(); hecho(); }catch(e){ toast('No se ha podido copiar', 'err'); } };
    try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(hecho, viejo); else viejo(); }catch(e){ viejo(); }
  }
  function guardar(){
    var it = ST.sel, patch = {}, n = 0;
    [].forEach.call($('pfmDc').querySelectorAll('input[data-id],textarea[data-id]'), function(el){
      var id = el.getAttribute('data-id'), nv = el.value.trim();
      if(nv !== v(it, id)){ patch[id] = nv; n++; }
    });
    if(!n){ toast('No has cambiado nada'); ST.edit = false; pintarFicha(); return; }
    var b = $('pfmGuardar'); b.disabled = true; carga(true);
    run('apiUpdateContrato', it.__row, patch).then(function(r){
      carga(false);
      if(!r || r.ok === false){ b.disabled = false; toast('❌ ' + ((r && r.error) || 'No se ha podido guardar'), 'err'); return; }
      for(var k in patch) it[k] = patch[k];
      it.__txt = fold(ST.ids.map(function(id){ return it[id]; }).join(' | '));
      vib([30,40,30]); toast('✅ Guardado (' + n + (n === 1 ? ' cambio' : ' cambios') + ')', 'ok');
      ST.edit = false; pintarFicha(); pintarLista(true);
      try{ if(typeof loadContratos === 'function') setTimeout(function(){ loadContratos(); }, 500); }catch(e){}
    }).catch(function(e){ carga(false); b.disabled = false; toast('❌ ' + (e.message || e), 'err'); });
  }

  /* ---------- documentos cara A / cara B ---------- */
  function cargarDocs(it){
    var doc = v(it,'20'), box = $('pfmDocs'); if(!box) return;
    if(!doc){ box.innerHTML = '<div class="no" style="grid-column:1/-1;text-align:center;color:#7c8aa3;font-size:13px;padding:10px">Este contrato no tiene número de documento</div>'; return; }
    run('apiGetClientDocs', doc).then(function(r){
      if(ST.sel !== it || !$('pfmDocs')) return;
      pintarDocs(it, r && r.ok !== false ? r : { a:null, b:null });
    }).catch(function(){ pintarDocs(it, { a:null, b:null }); });
  }
  function pintarDocs(it, r){
    var box = $('pfmDocs'); if(!box) return;
    box.innerHTML = '';
    [['A', r.a], ['B', r.b]].forEach(function(x){
      var cara = x[0], f = x[1], c = D.createElement('div'); c.className = 'dcard';
      var esPdf = f && /\.pdf$/i.test(f.name || '');
      c.innerHTML = '<div class="dt">CARA ' + cara + (f ? ' · ✅' : '') + '</div><div class="dv">' +
        (f ? (esPdf ? '<div class="no" style="font-size:34px">📄<div style="font-size:12px">PDF</div></div>' : '<img alt="" src="https://drive.google.com/thumbnail?id=' + f.id + '&sz=w600">') : '<div class="no">Sin documento</div>') +
        '</div><div class="db">' + (f ? '<button data-a="ver">👁 Ver</button>' : '') + '<button data-a="subir">' + (f ? '⬆️ Cambiar' : '⬆️ Subir') + '</button></div>';
      var img = c.querySelector('img'); if(img) img.onerror = function(){ this.replaceWith(Object.assign(D.createElement('div'), { className:'no', textContent:'Pulsa «Ver» para abrirlo' })); };
      var ver = function(){ if(f) visor(f, esPdf); };
      c.querySelector('.dv').onclick = ver;
      var bv = c.querySelector('[data-a=ver]'); if(bv) bv.onclick = ver;
      c.querySelector('[data-a=subir]').onclick = function(){ subirDoc(it, cara, !!f); };
      box.appendChild(c);
    });
  }
  function visor(f, esPdf){
    var ov = D.createElement('div'); ov.id = 'pfmVisor';
    ov.innerHTML = (esPdf ? '<iframe src="https://drive.google.com/file/d/' + f.id + '/preview" allow="autoplay"></iframe>' : '<img alt="" src="https://drive.google.com/thumbnail?id=' + f.id + '&sz=w2400">') +
      '<a class="vd" href="https://drive.google.com/uc?export=download&id=' + f.id + '" target="_blank" rel="noopener">⬇️ Descargar</a><button class="vx" title="Cerrar">✕</button>';
    D.body.appendChild(ov);
    try{ history.pushState({ pfm:'visor' }, ''); }catch(e){}
    var cerrar = function(){ ov.remove(); };
    ov.querySelector('.vx').onclick = function(){ try{ history.back(); }catch(e){ cerrar(); } };
    ov.addEventListener('click', function(e){ if(e.target === ov){ try{ history.back(); }catch(x){ cerrar(); } } });
    ov.__cerrar = cerrar;
  }
  function subirDoc(it, cara, reemplazar){
    if(reemplazar && !confirm('Ya hay una cara ' + cara + '. ¿Quieres sustituirla por otra?')) return;
    var inp = D.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,application/pdf';
    inp.onchange = function(){
      var f = inp.files && inp.files[0]; if(!f) return;
      if(f.size > 20*1024*1024){ toast('El archivo es demasiado grande (máx. 20 MB)', 'err'); return; }
      carga(true);
      var rd = new FileReader();
      rd.onload = function(){
        var url = String(rd.result || ''), b64 = url.slice(url.indexOf(',') + 1);
        run('apiUploadDoc', v(it,'20'), cara, b64, f.type || 'application/octet-stream', f.name || ('cara' + cara)).then(function(r){
          carga(false);
          if(!r || r.ok === false){ toast('❌ ' + ((r && r.error) || 'No se ha podido subir'), 'err'); return; }
          vib([30,40,30]); toast('✅ Cara ' + cara + ' subida', 'ok'); cargarDocs(it);
        }).catch(function(e){ carga(false); toast('❌ ' + (e.message || e), 'err'); });
      };
      rd.onerror = function(){ carga(false); toast('No se ha podido leer el archivo', 'err'); };
      rd.readAsDataURL(f);
    };
    inp.click();
  }

  /* ---------- menú ---------- */
  function menu(){
    var m = D.createElement('div'); m.id = 'pfmMenu';
    m.innerHTML = '<div class="mm"><button data-a="normal">🖥️ Cambiar a formato normal</button><button data-a="ref">⟳ Actualizar datos</button><button data-a="salir">⏻ Cerrar sesión</button></div>';
    D.body.appendChild(m);
    m.onclick = function(e){
      var a = e.target.closest ? e.target.closest('button') : null; m.remove(); if(!a) return;
      var q = a.getAttribute('data-a');
      if(q === 'normal'){ try{ window.top.postMessage({ pf:'modo', m:'normal' }, '*'); }catch(x){} }
      else if(q === 'ref') refrescar();
      else if(q === 'salir'){ if(confirm('¿Cerrar la sesión?')){ try{ if(typeof logout === 'function') logout(); else window.top.postMessage({ pf:'logout' }, '*'); }catch(x){} } }
    };
  }
  function refrescar(){
    vib(15); toast('⟳ Actualizando…');
    ST.data = { borradores:null, contratos:null };
    pintarLista(true);
    Promise.all([cargar('borradores', true), cargar('contratos', true)]).then(function(){ pintarLista(true); toast('✅ Datos al día', 'ok'); if(ST.sel){ var l = ST.data[ST.tab], r = ST.sel.__row; ST.sel = l.filter(function(x){ return x.__row === r; })[0] || null; if(ST.sel) pintarFicha(); else cerrarFicha(true); } })
      .catch(function(e){ toast('❌ ' + (e.message||e), 'err'); });
  }

  /* ---------- eventos ---------- */
  [].forEach.call($('pfmTabs').querySelectorAll('button'), function(b){ b.onclick = function(){ vib(10); cambiarTab(b.getAttribute('data-t')); }; });
  var tQ = 0;
  $('pfmQ').addEventListener('input', function(){ $('pfmBusca').classList.toggle('lleno', !!this.value); var val = this.value; clearTimeout(tQ); tQ = setTimeout(function(){ ST.q = val.trim(); pintarLista(true); }, 180); });
  $('pfmQ').addEventListener('keydown', function(e){ if(e.key === 'Enter') this.blur(); });
  $('pfmQx').onclick = function(){ $('pfmQ').value = ''; $('pfmBusca').classList.remove('lleno'); ST.q = ''; pintarLista(true); $('pfmQ').focus(); };
  $('pfmRef').onclick = refrescar;
  $('pfmMas').onclick = menu;
  $('pfmEdit').onclick = function(){ ST.edit = true; pintarFicha(); };
  $('pfmAtras').onclick = function(){ if(ST.edit){ ST.edit = false; pintarFicha(); return; } try{ history.back(); }catch(e){ cerrarFicha(true); } };
  // botón «atrás» del móvil: cierra visor, sale de editar o vuelve a la lista
  window.addEventListener('popstate', function(){
    var vz = $('pfmVisor'); if(vz){ vz.remove(); return; }
    if(ST.edit){ ST.edit = false; pintarFicha(); try{ history.pushState({ pfm:'ficha' }, ''); }catch(e){} return; }
    if($('pfmDet').classList.contains('on')){ ST.sel = null; [].forEach.call(D.querySelectorAll('#pfm .card.sel'), function(c){ c.classList.remove('sel'); }); cerrarFicha(true); }
  });
  window.addEventListener('resize', function(){ if(ancho()){ $('pfmDet').classList.remove('on'); if(!ST.sel) cerrarFicha(true); } else if(ST.sel){ $('pfmDet').classList.add('on'); } });

  /* ---------- arranque ---------- */
  pintarLista(true);
  cargar('borradores').then(function(){ pintarLista(true); }).catch(function(e){ toast('❌ ' + (e.message||e), 'err'); $('pfmLista').innerHTML = '<div class="vacio"><b>⚠️</b>No se han podido cargar los borradores.<br>Pulsa ⟳ para reintentar.</div>'; });
  setTimeout(function(){ cargar('contratos').catch(function(){}); }, 600);
})();
