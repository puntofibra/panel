/* ===== PANEL PUNTOFIBRA · EXTRAS: consola secreta + acceso restringido ===== */
(function(){
  if (window.__PF_EXTRA) return; window.__PF_EXTRA = true;
  var $ = function(id){ return document.getElementById(id); };

  // ---------- sonido (Web Audio, igual que en COSMOLUCAS) ----------
  var AC = null, master = null;
  function audio(){
    if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination); }catch(e){ return null; } }
    if(AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f0, f1, d, type, v, delay){
    if(!AC) return; type = type||'square'; v = v==null?0.12:v; delay = delay||0;
    var t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if(f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
  }

  /* =====================================================================
     CONSOLA SECRETA (escribir CONSOLA en cualquier parte del panel)
     ===================================================================== */
  var CON = { on:false, q:[], typing:false, busy:false, pend:[], dir:'PANEL', skip:false };
  // Comandos que hacen cosas (de momento ninguno). Formato: ['NOMBRE','DESCRIPCIÓN', function(arg){...}]
  var COMANDOS = [];

  var st = document.createElement('style');
  st.textContent =
  '#pfcon{position:fixed;inset:0;z-index:2147483000;display:none;background:#010309;font-family:"Lucida Console","Courier New",ui-monospace,monospace;color:#29e6ff;overflow:hidden}'+
  '#pfcon.on{display:block}'+
  '#pfcon .scr{position:absolute;inset:0;padding:18px 22px;background:radial-gradient(ellipse at 50% 45%,#06163a 0%,#020818 60%,#000 100%);transform-origin:50% 50%}'+
  '#pfcon.boot .scr{animation:pfcrt .7s cubic-bezier(.2,.8,.2,1) both}'+
  '@keyframes pfcrt{0%{transform:scale(1,.003);filter:brightness(6)}35%{transform:scale(1,.003);filter:brightness(6)}60%{transform:scale(1.02,1.06);filter:brightness(2)}100%{transform:scale(1,1);filter:brightness(1)}}'+
  '#pfcon.off .scr{animation:pfcrtoff .45s ease-in both}'+
  '@keyframes pfcrtoff{0%{transform:scale(1,1)}50%{transform:scale(1,.004);filter:brightness(5)}100%{transform:scale(0,.004);filter:brightness(8)}}'+
  '#pfcon .scr::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 2px,rgba(0,0,0,0) 2px 4px);z-index:2}'+
  '#pfcon .scr::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(0,0,0,.95),inset 0 0 30px rgba(41,230,255,.18);animation:pfflick 3.2s infinite;z-index:3}'+
  '@keyframes pfflick{0%,100%{opacity:1}47%{opacity:1}48%{opacity:.75}49%{opacity:1}82%{opacity:.92}}'+
  '#pfconOut{position:relative;z-index:1;height:100%;overflow-y:auto;font-size:clamp(12px,2.7vh,17px);line-height:1.45;text-shadow:0 0 6px rgba(41,230,255,.85),0 0 16px rgba(41,230,255,.35);white-space:pre-wrap;word-break:break-word;padding-bottom:30px;scrollbar-width:none}'+
  '#pfconOut::-webkit-scrollbar{display:none}'+
  '#pfconOut .g{color:#35ff8a;text-shadow:0 0 6px rgba(53,255,138,.9),0 0 18px rgba(53,255,138,.4)}'+
  '#pfconOut .r{color:#ff4a6a;text-shadow:0 0 6px rgba(255,74,106,.9)}'+
  '#pfconOut .y{color:#ffd23c;text-shadow:0 0 6px rgba(255,210,60,.9)}'+
  '#pfconOut .d{color:#3e7fa8;text-shadow:none}'+
  '#pfconOut .w{color:#fff;text-shadow:0 0 8px #29e6ff,0 0 20px #29e6ff}'+
  '#pfconOut .big{font-size:1.5em;font-weight:900;letter-spacing:.12em}'+
  '#pfcon .cur{display:inline-block;width:.62em;margin-left:1px;color:#29e6ff;font-weight:900;text-shadow:0 0 6px #29e6ff,0 0 14px #29e6ff,0 0 26px #29e6ff;animation:pfblink 1s steps(1) infinite}'+
  '@keyframes pfblink{50%{opacity:0}}'+
  '#pfconIn{position:absolute;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px}'+
  '#pfconX{position:absolute;z-index:4;top:10px;right:12px;font:inherit;font-size:13px;color:#29e6ff;background:rgba(2,10,30,.8);border:1px solid #29e6ff;border-radius:6px;padding:6px 10px;box-shadow:0 0 12px rgba(41,230,255,.5);cursor:pointer;letter-spacing:.1em}'+
  '#pfconBar{position:absolute;z-index:4;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,transparent,#29e6ff,transparent);opacity:.5;animation:pfsweep 2.6s linear infinite}'+
  '@keyframes pfsweep{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}';
  document.head.appendChild(st);

  var box = document.createElement('div'); box.id = 'pfcon';
  box.innerHTML = '<div class="scr"><div id="pfconOut"></div></div><button id="pfconX">[ X ] SALIR</button><div id="pfconBar"></div><input id="pfconIn" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="send">';
  document.body.appendChild(box);
  var conOut = $('pfconOut'), conIn = $('pfconIn'), conLine = null, conTimer = null, conHold = 0;

  function conScroll(force){ if(force) conHold = 0; if(!force && conHold > performance.now()) return; conOut.scrollTop = conOut.scrollHeight; }
  conOut.addEventListener('wheel', function(){ conHold = performance.now() + 4000; }, { passive:true });
  function conPrompt(){
    conLine = document.createElement('div');
    conLine.innerHTML = '<span class="g">C:\\' + CON.dir + '&gt;</span> <span class="w" id="pfconTx"></span><span class="cur">_</span>';
    conOut.appendChild(conLine); CON.busy = false; $('pfconTx').textContent = conIn.value; conScroll();
    if(CON.pend.length) conRun(CON.pend.shift());
  }
  function say(txt, cls, speed, fast){ CON.q.push({ txt:txt, cls:cls||'', speed:speed==null?18:speed, fast:!!fast }); if(!CON.typing) conPump(); }
  function conPump(){
    var it = CON.q.shift();
    if(!it){ CON.typing = false; CON.skip = false; if(CON.on && CON.busy) conPrompt(); return; }
    CON.typing = true;
    var el = document.createElement('div'); if(it.cls) el.className = it.cls; conOut.appendChild(el);
    if(it.fast || !it.txt || CON.skip){ el.textContent = it.txt || ' '; conScroll(); if(CON.skip) conPump(); else conTimer = setTimeout(conPump, it.fast ? 28 : 60); return; }
    var i = 0, cur = document.createElement('span'); cur.className = 'cur'; cur.textContent = '_';
    var step = function(){
      if(!CON.on) return;
      if(CON.skip){ el.textContent = it.txt; conScroll(); conPump(); return; }
      el.textContent = it.txt.slice(0, ++i); el.appendChild(cur);
      if(i % 2 === 0) tone(1800 + Math.random()*400, 1800, 0.012, 'square', 0.025);
      conScroll();
      if(i < it.txt.length) conTimer = setTimeout(step, it.speed); else { cur.remove(); conTimer = setTimeout(conPump, 90); }
    };
    step();
  }
  var conTaps = [];
  function conTapSkip(){
    if(!CON.typing) return false; var t = performance.now(); conTaps = conTaps.filter(function(x){ return t - x < 700; }); conTaps.push(t);
    if(conTaps.length >= 3){ conTaps = []; CON.skip = true; clearTimeout(conTimer); conPump(); return true; }
    return false;
  }
  function hoy(){ var d=new Date(), p=function(n){ return ('0'+n).slice(-2); }; return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+'  '+p(d.getHours())+':'+p(d.getMinutes()); }
  function openConsole(){
    audio(); CON.on = true; CON.dir = 'PANEL'; CON.q = []; CON.typing = false; CON.busy = true; CON.pend = []; conIn.value = ''; clearTimeout(conTimer); conOut.innerHTML = '';
    box.classList.remove('off'); box.classList.add('on', 'boot'); setTimeout(function(){ box.classList.remove('boot'); }, 800);
    try{ conIn.focus({ preventScroll:true }); }catch(e){}
    tone(60, 900, 0.5, 'sawtooth', 0.06); tone(3000, 3000, 0.25, 'sine', 0.03, 0.3);
    setTimeout(function(){
      say('PUNTOFIBRA-OS 5G  ·  (C) FUTURMOVIL SYSTEMS', 'w big', 22);
      say('------------------------------------------', 'd', 0, true);
      say('MEMORIA ............. 640K  OK', '', 0, true);
      say('NÚCLEO LUCAS ........ ONLINE', '', 0, true);
      say('BASE DE CONTRATOS ... ENLAZADA', '', 0, true);
      say('FIBRA ÓPTICA ........ 1 Gbps', '', 0, true);
      say('ENLACE 5G ........... CONECTADO', 'g', 0, true);
      say('', '', 0, true);
      say('SESIÓN ABIERTA ' + hoy() + '  ·  ESCRIBE LIST PARA VER LOS COMANDOS', 'y', 0, true);
    }, 650);
  }
  function closeConsole(){
    if(!CON.on) return; CON.on = false; CON.q = []; clearTimeout(conTimer); try{ conIn.blur(); }catch(e){}
    box.classList.add('off'); tone(900, 50, 0.35, 'sawtooth', 0.06);
    setTimeout(function(){ box.classList.remove('on', 'off'); }, 460);
  }
  var HEX = '0123456789ABCDEF';
  function rh(n){ var o=''; for(var i=0;i<n;i++) o += HEX[Math.random()*16|0]; return o; }
  function errTone(){ tone(140, 90, 0.3, 'square', 0.08); }
  function conRun(raw){
    var cmd = raw.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    if(conLine){ var cu = conLine.querySelector('.cur'); if(cu) cu.remove(); var tx = conLine.querySelector('#pfconTx'); if(tx){ tx.textContent = raw.toUpperCase(); tx.removeAttribute('id'); } }
    conIn.value = ''; CON.busy = true; conScroll(true);
    if(!cmd){ say('', '', 0, true); return; }
    if(cmd === 'LIST' || cmd === 'LISTA' || cmd === 'HELP' || cmd === 'AYUDA'){
      say('>> LISTA DE COMANDOS', 'g big', 20);
      if(!COMANDOS.length){ say('   (VACÍA) · TODAVÍA NO HAY COMANDOS INSTALADOS EN ESTE SISTEMA.', 'd', 0, true); }
      else COMANDOS.forEach(function(c){ say(c[0] + '  -  ' + c[1], 'y', 0, true); });
      return;
    }
    if(/^CD\s*(\.\.|\\)$/.test(cmd)){ CON.dir = ''; say('', '', 0, true); return; }
    if(/^CD\s*\\?\s*PANEL$/.test(cmd)){ CON.dir = 'PANEL'; say('', '', 0, true); return; }
    if(/^CD\b/.test(cmd)){ var d = cmd.replace(/^CD\s*/, ''); if(!d){ say('C:\\' + CON.dir, '', 0, true); return; } say('RUTA NO ENCONTRADA: ' + d.slice(0, 20), 'r', 12); errTone(); return; }
    if(cmd === 'DIR' || cmd === 'LS'){ say(CON.dir ? ' DIRECTORIO DE C:\\PANEL\n\n   <DIR>  .\n   <DIR>  ..\n          0 ARCHIVOS' : ' DIRECTORIO DE C:\\\n\n   <DIR>  PANEL\n          0 ARCHIVOS', 'd', 0, true); return; }
    if(cmd === 'CLS' || cmd === 'LIMPIAR' || cmd === 'ERASE'){ conOut.innerHTML = ''; say('', '', 0, true); return; }
    if(cmd === 'SALIR' || cmd === 'EXIT'){ closeConsole(); return; }
    for(var i=0;i<COMANDOS.length;i++){ var c = COMANDOS[i]; if(cmd === c[0] || cmd.indexOf(c[0]+' ')===0){ try{ c[2](cmd.slice(c[0].length).trim(), say); }catch(e){ say('ERROR · ' + e.message, 'r', 12); errTone(); } return; } }
    say('ERROR 0x' + rh(4) + ' · COMANDO "' + cmd.slice(0, 20) + '" NO RECONOCIDO', 'r', 12); errTone();
  }
  conIn.addEventListener('input', function(){ conIn.value = conIn.value.toUpperCase().slice(0, 30); var tx = $('pfconTx'); if(tx && !CON.busy) tx.textContent = conIn.value; tone(2200, 2200, 0.01, 'square', 0.03); conScroll(); });
  conIn.addEventListener('keydown', function(e){
    e.stopPropagation();
    if(e.key === ' ' && CON.typing){ e.preventDefault(); conTapSkip(); return; }
    if(e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown'){ e.preventDefault(); var stp = /Page/.test(e.key) ? conOut.clientHeight*0.8 : 60; conOut.scrollTop += /Up/.test(e.key) ? -stp : stp; return; }
    if(e.key === 'Enter'){ e.preventDefault(); if(!CON.busy) conRun(conIn.value); else if(conIn.value.trim()){ CON.pend.push(conIn.value); conIn.value = ''; } }
    else if(e.key === 'Escape') closeConsole();
  });
  box.addEventListener('pointerdown', function(e){ if(e.target.id !== 'pfconX') conTapSkip(); });
  box.addEventListener('pointerup', function(e){ if(e.target.id === 'pfconX') return; try{ conIn.focus({ preventScroll:true }); }catch(x){} });
  $('pfconX').addEventListener('click', closeConsole);

  // escribir CONSOLA en cualquier parte (teclado del PC o cualquier casilla de texto del móvil) abre la consola
  var conWord = '';
  window.addEventListener('keydown', function(e){
    if(CON.on || e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    conWord = (conWord + e.key.toUpperCase()).slice(-12);
    if(conWord.slice(-7) === 'CONSOLA'){
      conWord = ''; var t = e.target;
      if(t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) setTimeout(function(){ t.value = t.value.replace(/consol?a?$/i, ''); try{ t.dispatchEvent(new Event('input',{bubbles:true})); t.blur(); }catch(x){} }, 0);
      e.preventDefault(); setTimeout(openConsole, 30);
    }
  }, true);
  document.addEventListener('input', function(e){
    var t = e.target; if(CON.on || !t || t === conIn || !/^(INPUT|TEXTAREA)$/.test(t.tagName) || typeof t.value !== 'string') return;
    if(/consola/i.test(t.value)){ t.value = t.value.replace(/consola/ig, ''); try{ t.blur(); }catch(x){} conWord = ''; setTimeout(openConsole, 30); }
  }, true);
  window.PFConsola = { abrir: openConsole, cerrar: closeConsole, comandos: COMANDOS };

  /* =====================================================================
     ACCESO RESTRINGIDO (Ajustes sin la llave NFC)
     ===================================================================== */
  var st2 = document.createElement('style');
  st2.textContent =
  '#pfDeny{position:fixed;inset:0;z-index:2147482000;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 50%,rgba(70,0,10,.82),rgba(5,0,2,.94) 70%);font-family:system-ui,"Segoe UI",Arial,sans-serif;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent}'+
  '#pfDeny.on{display:flex;animation:pfdIn .25s ease-out both}'+
  '#pfDeny.out{animation:pfdOut .35s ease-in both}'+
  '@keyframes pfdIn{from{opacity:0}to{opacity:1}}@keyframes pfdOut{to{opacity:0;filter:blur(6px)}}'+
  '#pfDeny::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 2px,transparent 2px 4px);pointer-events:none}'+
  '#pfDeny .scan{position:absolute;left:0;right:0;height:120px;background:linear-gradient(180deg,transparent,rgba(255,40,70,.18),transparent);animation:pfdScan 1.6s linear infinite;pointer-events:none}'+
  '@keyframes pfdScan{from{top:-120px}to{top:100%}}'+
  '#pfDeny .tape{position:absolute;left:-10%;right:-10%;height:34px;background:repeating-linear-gradient(45deg,#ffd000 0 26px,#111 26px 52px);opacity:.9;box-shadow:0 0 20px rgba(0,0,0,.6);transform:rotate(-6deg)}'+
  '#pfDeny .tape.t1{top:9%;animation:pfdTape 12s linear infinite}#pfDeny .tape.t2{bottom:9%;transform:rotate(5deg);animation:pfdTape 12s linear infinite reverse}'+
  '@keyframes pfdTape{from{background-position:0 0}to{background-position:520px 0}}'+
  '#pfDeny .card{position:relative;text-align:center;padding:30px 44px 26px;border:2px solid #ff2a4a;border-radius:18px;background:rgba(20,0,4,.85);box-shadow:0 0 0 1px rgba(255,42,74,.3),0 0 40px rgba(255,42,74,.55),inset 0 0 40px rgba(255,42,74,.2);animation:pfdPop .55s cubic-bezier(.2,1.6,.4,1) both,pfdGlow 1s ease-in-out .6s infinite alternate}'+
  '@keyframes pfdPop{0%{transform:scale(.3) rotate(-8deg);opacity:0}100%{transform:none;opacity:1}}'+
  '@keyframes pfdGlow{to{box-shadow:0 0 0 1px rgba(255,42,74,.5),0 0 70px rgba(255,42,74,.85),inset 0 0 50px rgba(255,42,74,.3)}}'+
  '#pfDeny .lock{width:92px;height:92px;margin:0 auto 10px;animation:pfdShake .5s ease-in-out .5s 3}'+
  '@keyframes pfdShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-14deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(5deg)}}'+
  '#pfDeny .shackle{transform-origin:70px 40px;animation:pfdShackle .45s cubic-bezier(.5,-0.5,.5,1.5) .25s both}'+
  '@keyframes pfdShackle{from{transform:translateY(-14px)}to{transform:translateY(0)}}'+
  '#pfDeny h2{margin:0;font-size:clamp(22px,4.4vw,40px);font-weight:900;letter-spacing:.14em;color:#fff;text-shadow:0 0 10px #ff2a4a,0 0 28px #ff2a4a;position:relative;animation:pfdGlitch 2.4s steps(1) infinite}'+
  '#pfDeny h2::before,#pfDeny h2::after{content:attr(data-t);position:absolute;inset:0;pointer-events:none}'+
  '#pfDeny h2::before{color:#0ff;transform:translate(-2px,0);clip-path:inset(0 0 55% 0);opacity:.7;animation:pfdG1 2.4s steps(1) infinite}'+
  '#pfDeny h2::after{color:#ff0;transform:translate(2px,0);clip-path:inset(55% 0 0 0);opacity:.6;animation:pfdG2 2.4s steps(1) infinite}'+
  '@keyframes pfdGlitch{0%,92%,100%{transform:none}93%{transform:translate(3px,-1px) skewX(8deg)}95%{transform:translate(-3px,1px)}}'+
  '@keyframes pfdG1{0%,90%,100%{opacity:0}91%,96%{opacity:.8}}@keyframes pfdG2{0%,93%,100%{opacity:0}94%,98%{opacity:.7}}'+
  '#pfDeny p{margin:10px 0 0;color:#ffb3bf;font-size:14px;letter-spacing:.06em}'+
  '#pfDeny .code{margin-top:14px;font:700 12px "Lucida Console","Courier New",monospace;color:#ff6a82;letter-spacing:.12em;opacity:.85}';
  document.head.appendChild(st2);
  var deny = document.createElement('div'); deny.id = 'pfDeny';
  deny.innerHTML = '<div class="scan"></div><div class="tape t1"></div><div class="tape t2"></div>'+
    '<div class="card"><svg class="lock" viewBox="0 0 140 140"><defs><linearGradient id="pfdM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3e8"/><stop offset=".5" stop-color="#c9ced4"/><stop offset="1" stop-color="#6d737b"/></linearGradient></defs>'+
    '<path class="shackle" d="M42 66V46a28 28 0 0 1 56 0v20" fill="none" stroke="#1a1e23" stroke-width="16" stroke-linecap="round"/><path class="shackle" d="M42 66V46a28 28 0 0 1 56 0v20" fill="none" stroke="url(#pfdM)" stroke-width="9" stroke-linecap="round"/>'+
    '<rect x="26" y="62" width="88" height="66" rx="14" fill="url(#pfdM)" stroke="#1a1e23" stroke-width="5"/><rect x="34" y="70" width="72" height="8" rx="4" fill="#ff2a4a" opacity=".85"/>'+
    '<circle cx="70" cy="96" r="9" fill="#1a1e23"/><rect x="66" y="98" width="8" height="18" rx="3" fill="#1a1e23"/></svg>'+
    '<h2 data-t="ACCESO RESTRINGIDO">ACCESO RESTRINGIDO</h2><p>Ajustes solo se abre con la llave NFC autorizada.</p><div class="code" id="pfDenyCode"></div></div>';
  document.body.appendChild(deny);
  var denyT = null;
  function alarma(){
    if(!audio()) return;
    for(var i=0;i<3;i++){ tone(880, 880, 0.16, 'square', 0.07, i*0.36); tone(587, 587, 0.16, 'square', 0.07, i*0.36+0.18); }
    tone(160, 60, 0.5, 'sawtooth', 0.09, 0.05);
  }
  function hideDeny(){ if(!deny.classList.contains('on')) return; clearTimeout(denyT); deny.classList.add('out'); setTimeout(function(){ deny.classList.remove('on','out'); }, 340); }
  function showDeny(){
    clearTimeout(denyT);
    $('pfDenyCode').textContent = 'ERR 0x' + rh(4) + ' · LLAVE NO DETECTADA · INCIDENCIA REGISTRADA';
    deny.classList.remove('out'); deny.classList.remove('on'); void deny.offsetWidth; deny.classList.add('on');
    alarma();
    denyT = setTimeout(hideDeny, 3200);
  }
  deny.addEventListener('click', hideDeny);
  window.PFAccesoRestringido = showDeny;

  // Si se cierra la ventana de la llave de Ajustes sin haber entrado → cartel
  function hook(){
    if(typeof window.cerrarLlaveLogin !== 'function' || window.cerrarLlaveLogin.__pf) return !!(window.cerrarLlaveLogin && window.cerrarLlaveLogin.__pf);
    var orig = window.cerrarLlaveLogin;
    var nuevo = function(){
      var eraAjustes = false;
      try{ eraAjustes = !!LLAVE_AJ && !AJUSTES_OK; }catch(e){}
      var r = orig.apply(this, arguments);
      if(eraAjustes) setTimeout(function(){ var ok=false; try{ ok = !!AJUSTES_OK; }catch(e){} if(!ok) showDeny(); }, 400);
      return r;
    };
    nuevo.__pf = true;
    try{ cerrarLlaveLogin = nuevo; }catch(e){}
    window.cerrarLlaveLogin = nuevo;
    return true;
  }
  if(!hook()){ var tries = 0, iv = setInterval(function(){ if(hook() || ++tries > 40) clearInterval(iv); }, 250); }
})();
