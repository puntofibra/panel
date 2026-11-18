/* ===== PANEL PUNTOFIBRA · EXTRAS: consola secreta + acceso restringido ===== */
(function(){
  if (window.__PF_EXTRA) return; window.__PF_EXTRA = true;
  var $ = function(id){ return document.getElementById(id); };
  // en un subpanel, la consola (solo con las claves de Manu) habla directamente con el servidor, sin pasar por el filtro del subpanel
  function RUN(){ return window.__pfRunReal || google.script.run; }

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
  var testTimer = null;
  var COMANDOS = [
    ['TEST', 'MUESTRA TODAS LAS PRUEBAS DISPONIBLES', function(arg, say){
      say('>> PRUEBAS DISPONIBLES 🧪', 'g big', 20);
      COMANDOS.filter(function(c){ return /^TEST\d+$/.test(c[0]); }).sort(function(x,y){ return x[0]<y[0]?-1:1; }).forEach(function(c){ say('   ' + c[0] + '  -  ' + c[1], 'y', 0, true); });
      say('   TODAS SE LANZAN 1 MINUTO DESPUÉS Y NO GUARDAN NADA.', 'd', 0, true);
    }],
    ['TEST5', 'PRUEBA EL AVISO DE CONTRATOS PENDIENTES EN 1 MINUTO', function(arg, say){
      clearTimeout(testTimer);
      var at = new Date(Date.now() + 60000), p = function(n){ return ('0'+n).slice(-2); };
      say('>> TEST PROGRAMADO ⏱️', 'g big', 22);
      say('   EL AVISO SONARÁ A LAS ' + p(at.getHours()) + ':' + p(at.getMinutes()) + ':' + p(at.getSeconds()) + ' (DENTRO DE 60 s), CON LA CONSOLA ABIERTA O CERRADA.', '', 10);
      say('   LA MÚSICA DE YOUTUBE / SPOTIFY BAJARÁ 2 s ANTES Y SUBIRÁ 2 s DESPUÉS.', 'd', 0, true);
      tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
      testTimer = setTimeout(function(){ if(window.LucasBrain && window.LucasBrain.remind) window.LucasBrain.remind(true); }, 60000);
    }],
    ['TEST6', 'PRUEBA UN AVISO DE RECORDATORIO EN 1 MINUTO · NO SE GUARDA', function(arg, say){
      clearTimeout(testTimer);
      var at = new Date(Date.now() + 60000), p = function(n){ return ('0'+n).slice(-2); };
      say('>> TEST PROGRAMADO ⏰', 'g big', 22);
      say('   EL RECORDATORIO DE PRUEBA SALDRÁ A LAS ' + p(at.getHours()) + ':' + p(at.getMinutes()) + ':' + p(at.getSeconds()) + ' (DENTRO DE 60 s).', '', 10);
      tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
      testTimer = setTimeout(function(){ if(window.LucasBrain && window.LucasBrain.recTest) window.LucasBrain.recTest(); }, 60000);
    }],
    ['TEST1', 'PRUEBA EL FICHAJE DE ENTRADA DE LA MAÑANA (10:30) EN 1 MINUTO · NO SE GUARDA', function(a, say){ fichTest('M-E', 'ENTRADA DE LA MAÑANA', say); }],
    ['TEST2', 'PRUEBA EL FICHAJE DE SALIDA DE LA MAÑANA (13:28) EN 1 MINUTO · NO SE GUARDA', function(a, say){ fichTest('M-S', 'SALIDA DE LA MAÑANA', say); }],
    ['TEST3', 'PRUEBA EL FICHAJE DE ENTRADA DE LA TARDE (17:30) EN 1 MINUTO · NO SE GUARDA', function(a, say){ fichTest('T-E', 'ENTRADA DE LA TARDE', say); }],
    ['TEST4', 'PRUEBA EL FICHAJE DE SALIDA DE LA TARDE (19:28) EN 1 MINUTO · NO SE GUARDA', function(a, say){ fichTest('T-S', 'SALIDA DE LA TARDE', say); }],
    ['FICHAJES', 'HISTORIAL DE ENTRADAS Y SALIDAS (SEBASTIAN, JORGE, MAICOL O TODOS)', function(a, say){ fichMenuEmp(say); }],
    ['PASSWORD', 'MUESTRA EL QR DE GOOGLE AUTHENTICATOR PARA VINCULAR OTRO MÓVIL', function(a, say){ pwComando(say); }],
    ['PIN', 'EMPLEADOS CON PIN DEL ASISTENTE: VER Y EDITAR SU NOMBRE Y SU PIN', function(a, say){ pinMenu(say); }],
    ['RECHARGE', 'RECARGA EL SALDO DEL ASISTENTE LUCAS (SE SUMA AL QUE YA HAY)', function(a, say){ recPaso1(say); }],
    ['SEMILLA', 'INSTALA O BORRA SEMILLAS EN ESTE ORDENADOR (DESACTIVAN COSAS SOLO AQUÍ)', function(a, say){ semMenu(say); }],
    ['PANEL', 'SUBPANELES (FEDE, WIL…): CONTRASEÑA, SEMILLA DEL PC, SALDO DE LUCAS Y NUEVO PANEL', function(a, say){ panMenu(say); }],
    ['EDIT', 'TRAS LISTAR FICHAJES: MUESTRA [ELIMINAR] AL LADO DE CADA REGISTRO', function(a, say){ fichEdit(say); }],
    ['SCRIPT', 'SCRIPTS DE TAMPERMONKEY: ELIGES UNO Y SE COPIA PARA PEGARLO', function(a, say){ scrMenu(say); }],
    ['SEBASTIAN', 'ATAJO: FICHAJES DE SEBASTIAN', function(a, say){ fichEmp = 'Sebastián'; fichMenu(say); }],
    ['JORGE', 'ATAJO: FICHAJES DE JORGE', function(a, say){ fichEmp = 'Jorge'; fichMenu(say); }],
    ['MAICOL', 'ATAJO: FICHAJES DE MAICOL', function(a, say){ fichEmp = 'Maicol'; fichMenu(say); }]
  ];
  // ---------- SCRIPTS de Tampermonkey: se copian al portapapeles para pegarlos ----------
  var SCRIPTS = [
    ['Bajar volumen de YouTube y Spotify cuando Lucas habla', 'https://puntofibra.github.io/panel/lucas-musica.user.js']
  ];
  var scrCache = {};
  function scrPrecarga(){ SCRIPTS.forEach(function(sc, i){ if(scrCache[i]) return; try{ fetch(sc[1] + '?t=' + Date.now(), { cache:'no-store' }).then(function(r){ return r.ok ? r.text() : null; }).then(function(t){ if(t) scrCache[i] = t; }).catch(function(){}); }catch(e){} }); }
  function copiar(txt){
    var ok = false;
    try{ var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, txt.length); ok = document.execCommand('copy'); ta.remove(); }catch(e){}
    try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(function(){}); }catch(e){}
    setTimeout(function(){ try{ conIn.focus({ preventScroll:true }); }catch(e){} }, 50);
    return ok;
  }
  function scrMenu(say){
    scrPrecarga();
    CON.ask = 'script';
    say('>> SCRIPTS DE TAMPERMONKEY 📜', 'g big', 20);
    SCRIPTS.forEach(function(sc, i){ say('   ' + (i+1) + ' - ' + sc[0].toUpperCase(), 'y', 0, true); });
    say('   ESCRIBE EL NÚMERO Y PULSA ENTER: SE COPIA PARA PEGARLO EN TAMPERMONKEY.', 'd', 0, true);
  }
  function scrCopia(n){
    var sc = SCRIPTS[n-1]; if(!sc){ say('OPCIÓN NO VÁLIDA · ESCRIBE UN NÚMERO DEL 1 AL ' + SCRIPTS.length + '.', 'r', 12); errTone(); CON.ask = 'script'; return; }
    var hecho = function(txt){
      var ok = copiar(txt);
      if(ok){
        say('>> SCRIPT COPIADO ✔', 'g big', 22);
        say('   «' + sc[0].toUpperCase() + '» (' + txt.split('\n').length + ' LÍNEAS) ESTÁ EN EL PORTAPAPELES.', '', 10);
        say('   TAMPERMONKEY › CREAR UN NUEVO SCRIPT › BORRA LO QUE HAY › CTRL+V › ARCHIVO › GUARDAR.', 'd', 0, true);
        tone(1200, 2000, 0.15, 'square', 0.05);
      } else { say('NO SE HA PODIDO COPIAR AUTOMÁTICAMENTE. PRUEBA OTRA VEZ CON EL NÚMERO.', 'r', 10); errTone(); CON.ask = 'script'; }
    };
    if(scrCache[n-1]) return hecho(scrCache[n-1]);
    say('   DESCARGANDO EL SCRIPT…', 'd', 0, true);
    fetch(sc[1] + '?t=' + Date.now(), { cache:'no-store' }).then(function(r){ return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function(t){ scrCache[n-1] = t; say('   LISTO. ESCRIBE OTRA VEZ ' + n + ' Y PULSA ENTER PARA COPIARLO.', 'y', 10); CON.ask = 'script'; })
      .catch(function(e){ say('ERROR AL DESCARGAR EL SCRIPT (' + e + ').', 'r', 10); errTone(); });
  }
  var lastFich = null;
  function fichEdit(say){
    if(!lastFich){ say('PRIMERO LISTA UNOS FICHAJES (ESCRIBE FICHAJES, O JORGE / MAICOL / SEBASTIAN) Y LUEGO EDIT.', 'y', 10); errTone(); return; }
    var lst = lastFich.items.slice().sort(function(a, b){ return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : (a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0); });
    say('>> MODO EDICIÓN · ' + lastFich.emp.toUpperCase() + ' · ' + FICH_OPC[lastFich.n] + ' ✏️', 'g big', 20);
    if(!lst.length){ say('   NO HAY REGISTROS QUE BORRAR EN ESTE LISTADO.', 'd', 0, true); return; }
    say('   PULSA [ ELIMINAR ] Y CONFIRMA CON UN SEGUNDO CLIC. SE BORRA EL REGISTRO COMPLETO DEL SHEET.', 'd', 0, true);
    var p2 = function(v){ return ('0'+v).slice(-2); };
    lst.forEach(function(x){
      var dd = new Date(x.fecha + 'T12:00:00');
      var row = document.createElement('div'); row.className = 'g'; row.style.cssText = 'display:flex;gap:14px;align-items:center;flex-wrap:wrap';
      var t = document.createElement('span');
      t.textContent = DIAS3[dd.getDay()] + ' ' + p2(dd.getDate()) + '/' + p2(dd.getMonth()+1) + '/' + dd.getFullYear() + '  ·  ' + (x.tipo === 'ENTRADA' ? 'ENTRADA' : 'SALIDA ') + ' ' + (lastFich.emp === 'Sebastián' ? (x.turno === 'MAÑANA' ? 'MAÑANA' : 'TARDE ') + '  ·  ' : ' ·  ') + x.hora;
      var b = document.createElement('span'); b.textContent = '[ ELIMINAR ]';
      b.style.cssText = 'color:#ff4a6a;text-shadow:0 0 6px rgba(255,74,106,.9);cursor:pointer;border:1px solid rgba(255,74,106,.6);border-radius:5px;padding:0 6px;font-size:.85em;user-select:none';
      var armed = 0;
      b.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
      b.addEventListener('click', function(e){
        e.stopPropagation(); if(b.dataset.done) return;
        if(!armed || Date.now() - armed > 4000){ armed = Date.now(); b.textContent = '[ ¿SEGURO? CLIC OTRA VEZ ]'; tone(700, 500, 0.12, 'square', 0.05); setTimeout(function(){ if(!b.dataset.done && Date.now() - armed >= 4000) b.textContent = '[ ELIMINAR ]'; }, 4100); return; }
        b.dataset.done = '1'; b.textContent = '[ BORRANDO… ]';
        try{
          RUN().withSuccessHandler(function(r){
            if(r && r.ok){ t.style.textDecoration = 'line-through'; t.style.opacity = '.45'; b.textContent = '✔ BORRADO'; b.style.color = '#35ff8a'; b.style.borderColor = 'rgba(53,255,138,.6)'; b.style.cursor = 'default';
              lastFich.items = lastFich.items.filter(function(y){ return y !== x; }); tone(900, 200, 0.3, 'sawtooth', 0.06); }
            else { delete b.dataset.done; armed = 0; b.textContent = '[ ERROR · ' + ((r && r.error) || 'NO SE PUDO') + ' ]'; errTone(); }
          }).withFailureHandler(function(er){ delete b.dataset.done; armed = 0; b.textContent = '[ ERROR DE CONEXIÓN ]'; errTone(); })
            .apiFichajeLucasBorrar(x.fecha, x.turno, x.tipo, x.hora, x.empleado || '');
        }catch(er){ b.textContent = '[ ERROR ]'; }
      });
      row.appendChild(t); row.appendChild(b);
      CON.q.push({ node: row }); if(!CON.typing) conPump();
    });
  }
  // ---------- ACCESO A LA CONSOLA CON GOOGLE AUTHENTICATOR ----------
  function conOculta(){ return !CON.auth || CON.ask === 'pinNum' || CON.ask === 'pwQR' || CON.ask === 'panPass' || CON.ask === 'panPin'; }
  CON.fails = 0; CON.lock = 0; CON.token = null;
  function pick1(a){ return a[Math.floor(Math.random() * a.length)]; }
  function conLoginInicio(){
    say('', '', 0, true);
    say('SISTEMA PROTEGIDO · SE REQUIERE AUTENTICACIÓN', 'y', 12);
    CON.esperando = true;
    try{
      RUN().withSuccessHandler(function(r){
        if(r && r.ok && r.configurado){ CON.esperando = false; say('USUARIO: MANU', '', 0, true); say('INTRODUZCA SU PASSWORD (CÓDIGO DE GOOGLE AUTHENTICATOR) Y PULSE ENTER.', 'd', 0, true); conNfcEsperar(); return; }
        say('>> PRIMER ARRANQUE DE SEGURIDAD 🔐', 'g big', 20);
        say('   ESCANEA EL CÓDIGO QR CON GOOGLE AUTHENTICATOR PARA VINCULAR TU MÓVIL.', 'y', 10);
        say('   DESPUÉS ESCRIBE AQUÍ EL CÓDIGO DE 6 CIFRAS QUE TE DÉ COMO PASSWORD.', 'y', 10);
        pwPedirQR(null);
      }).withFailureHandler(function(){ CON.esperando = false; say('ERROR DE CONEXIÓN CON EL SERVIDOR DE SEGURIDAD. CIERRA Y VUELVE A ABRIR LA CONSOLA.', 'r', 10); errTone(); }).apiConsolaTotpEstado();
    }catch(e){ CON.esperando = false; say('ERROR DEL SISTEMA DE SEGURIDAD.', 'r', 10); errTone(); }
  }
  function conNfcParar(){ try{ if(CON.nfcTimer) clearInterval(CON.nfcTimer); }catch(e){} CON.nfcTimer = null; if(CON.nfcCod){ CON.nfcCod = null; try{ window.top.postMessage({ pf:'nfcCerrar' }, '*'); }catch(e){} } }
  function conNfcSondear(){ var cod = CON.nfcCod; if(!cod || CON.nfcBusy) return; CON.nfcBusy = true;
    try{ RUN().withSuccessHandler(function(r){ CON.nfcBusy = false; if(cod !== CON.nfcCod || !CON.on || CON.auth) return;
      if(r && r.estado === 'ok' && r.token){ conNfcParar(); CON.esperando = false; CON.auth = true; CON.token = r.token; CON.fails = 0;
        say('>> ACCESO CONCEDIDO ✅', 'g big', 22); say('   LLAVE NFC RECONOCIDA. BIENVENIDO, MANU.', 'y', 10); say('SESIÓN ABIERTA ' + hoy(), 'y', 0, true);
        tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
      } else if(r && (r.estado === 'caducado' || r.estado === 'denegado')){ conNfcParar(); say('LECTOR NFC CERRADO. USE EL PASSWORD.', 'd', 0, true); }
    }).withFailureHandler(function(){ CON.nfcBusy = false; }).apiNfcEstado(cod); }catch(e){ CON.nfcBusy = false; } }
  function conNfcEsperar(){ if(window.PF_SUB) return; var wrap = false; try{ wrap = (typeof PF_WRAP !== 'undefined') && !!PF_WRAP; }catch(e){} if(!wrap) return; conNfcParar();
    try{ RUN().withSuccessHandler(function(r){ if(!r || !r.ok || !CON.on || CON.auth) return; CON.nfcCod = r.codigo;
      try{ window.top.postMessage({ pf:'nfc', codigo:r.codigo, modo:'consola', titulo:'Entrar en la consola', silencioso:true }, '*'); }catch(e){}
      CON.nfcTimer = setInterval(conNfcSondear, 1500); say('O PASE SU LLAVE NFC POR EL LECTOR DEL MÓVIL.', 'd', 0, true);
    }).apiNfcCrear('consola', '', ''); }catch(e){} }
  window.addEventListener('message', function(ev){ var d = ev && ev.data; if(!d || d.pf !== 'nfcError' || !CON.on || CON.auth || !CON.nfcCod) return; say('LLAVE NFC NO AUTORIZADA · ' + String(d.msg || '').toUpperCase(), 'r', 10); errTone(); });
  function conLogin(raw){
    var code = String(raw || '').replace(/\D/g, '');
    if(Date.now() < CON.lock){ say('SISTEMA BLOQUEADO · ESPERA ' + Math.ceil((CON.lock - Date.now()) / 1000) + ' SEGUNDOS ANTES DE VOLVER A INTENTARLO.', 'r', 10); errTone(); return; }
    if(code.length !== 6){ conFallo(); return; }
    CON.esperando = true; say('VERIFICANDO CREDENCIALES…', 'd', 14);
    try{
      RUN().withSuccessHandler(function(r){
        CON.esperando = false;
        if(!r || !r.ok){ conFallo(); return; }
        CON.auth = true; CON.token = r.token; CON.fails = 0; conNfcParar();
        say('>> ACCESO CONCEDIDO ✅', 'g big', 22);
        if(r.nuevo) say('   MÓVIL VINCULADO CORRECTAMENTE CON GOOGLE AUTHENTICATOR.', 'g', 0, true);
        say('   ' + pick1(['BIENVENIDO AL SISTEMA, MANU.', 'IDENTIDAD VERIFICADA. BIENVENIDO, MANU.', 'CREDENCIALES VÁLIDAS · CARGANDO ENTORNO DE USUARIO…', 'AUTENTICACIÓN COMPLETADA. HOLA, MANU.']), 'y', 10);
        say('SESIÓN ABIERTA ' + hoy(), 'y', 0, true);
        tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
      }).withFailureHandler(function(){ CON.esperando = false; say('ERROR DE CONEXIÓN AL VERIFICAR. PRUEBA OTRA VEZ.', 'r', 10); errTone(); }).apiConsolaTotpVerificar(code);
    }catch(e){ say('ERROR DEL SISTEMA DE SEGURIDAD.', 'r', 10); errTone(); }
  }
  function conFallo(){
    CON.fails++;
    say(pick1(['ACCESO DENEGADO · PASSWORD INCORRECTO.', 'ERROR 0x00000005: CREDENCIALES NO VÁLIDAS.', 'AUTENTICACIÓN FALLIDA. INTÉNTELO DE NUEVO.', 'PASSWORD RECHAZADO · INTENTO REGISTRADO EN EL SISTEMA.', 'SYSTEM ERROR: TOKEN DE SEGURIDAD NO VÁLIDO.', 'ACCESS DENIED · LA CONTRASEÑA NO COINCIDE.']), 'r', 12);
    errTone();
    if(CON.fails >= 5){ CON.fails = 0; CON.lock = Date.now() + 30000; say('DEMASIADOS INTENTOS FALLIDOS · TERMINAL BLOQUEADO 30 SEGUNDOS.', 'r big', 16); }
  }
  // comando PASSWORD: QR para vincular otro móvil (pide un código si no hay sesión verificada)
  function pwComando(say){
    say('>> VINCULAR OTRO MÓVIL 📱', 'g big', 20);
    if(CON.token){ pwPedirQR(CON.token); return; }
    say('   POR SEGURIDAD, ESCRIBE UN CÓDIGO ACTUAL DE GOOGLE AUTHENTICATOR:', 'y', 10);
    CON.ask = 'pwQR';
  }
  function pwVerificarYMostrar(raw){
    var code = String(raw || '').replace(/\D/g, '');
    if(code.length !== 6){ say('CÓDIGO NO VÁLIDO. VUELVE A ESCRIBIR PASSWORD PARA INTENTARLO.', 'r', 10); errTone(); return; }
    CON.esperando = true; say('VERIFICANDO…', 'd', 14);
    try{
      RUN().withSuccessHandler(function(r){
        if(!r || !r.ok){ CON.esperando = false; say('CÓDIGO INCORRECTO · NO SE PUEDE MOSTRAR EL QR.', 'r', 10); errTone(); return; }
        CON.token = r.token; pwPedirQR(CON.token);
      }).withFailureHandler(function(){ CON.esperando = false; say('ERROR DE CONEXIÓN.', 'r', 10); errTone(); }).apiConsolaTotpVerificar(code);
    }catch(e){ say('ERROR DEL SISTEMA.', 'r', 10); errTone(); }
  }
  function pwPedirQR(token){
    CON.esperando = true;
    try{
      RUN().withSuccessHandler(function(r){
        CON.esperando = false;
        if(!r || !r.ok){ say('NO SE HA PODIDO GENERAR EL QR' + (r && r.error ? ': ' + String(r.error).toUpperCase() : '') + '.', 'r', 10); errTone(); return; }
        say('   QR ABIERTO EN PANTALLA · ESCANÉALO CON GOOGLE AUTHENTICATOR.', 'g', 0, true);
        pwMostrarQR(r.otpauth, r.secret);
      }).withFailureHandler(function(){ CON.esperando = false; say('ERROR DE CONEXIÓN AL GENERAR EL QR.', 'r', 10); errTone(); }).apiConsolaTotpQR(token || '');
    }catch(e){ CON.esperando = false; say('ERROR DEL SISTEMA.', 'r', 10); errTone(); }
  }
  function pwCargarLib(cb){
    if(window.QRCode) return cb(true);
    var urls = ['https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', 'https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js'];
    var i = 0;
    (function probar(){
      if(i >= urls.length) return cb(false);
      var sc = document.createElement('script'); sc.src = urls[i++];
      sc.onload = function(){ if(window.QRCode) cb(true); else probar(); }; sc.onerror = probar; document.head.appendChild(sc);
    })();
  }
  // QR nítido en una ventana blanca encima de todo (fuera del efecto de pantalla antigua de la consola)
  function pwMostrarQR(otpauth, secret){
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:16px;';
    var c = document.createElement('div');
    c.style.cssText = 'background:#fff;color:#111;border-radius:18px;padding:22px 22px 16px;text-align:center;font-family:Arial,Helvetica,sans-serif;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);';
    c.innerHTML = '<div style="font-weight:800;font-size:17px;margin-bottom:4px">Google Authenticator</div><div style="font-size:13px;color:#555;margin-bottom:14px">Escanea este código con la app para vincular el móvil a la consola</div>';
    var q = document.createElement('div'); q.style.cssText = 'display:inline-block;padding:12px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;line-height:0;';
    c.appendChild(q);
    var grp = String(secret || '').replace(/(.{4})/g, '$1 ').trim();
    var info = document.createElement('div'); info.style.cssText = 'margin-top:12px;font-size:12px;color:#555;';
    info.innerHTML = '¿No puedes escanearlo? Clave manual:<br><b style="font-family:monospace;font-size:14px;color:#111;letter-spacing:1px">' + grp + '</b>';
    c.appendChild(info);
    var ok = document.createElement('button'); ok.type = 'button'; ok.textContent = 'Cerrar';
    ok.style.cssText = 'margin-top:16px;width:100%;border:none;border-radius:12px;padding:12px;font-size:15px;font-weight:800;cursor:pointer;background:#111;color:#fff;';
    ok.onclick = function(){ try{ ov.remove(); }catch(e){} try{ conIn.focus(); }catch(e){} };
    c.appendChild(ok); ov.appendChild(c); document.body.appendChild(ov);
    ov.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
    pwCargarLib(function(okLib){
      if(okLib){ try{ new window.QRCode(q, { text: otpauth, width: 260, height: 260, colorDark: '#000000', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); return; }catch(e){} }
      q.style.lineHeight = '1.4'; q.innerHTML = '<div style="font-size:13px;color:#b91c1c;max-width:260px">No se ha podido dibujar el QR. Añade la cuenta en Google Authenticator con la clave manual de abajo.</div>';
    });
  }
  // ---------- PIN DE EMPLEADOS (los guarda el servidor cifrados; aquí solo se ven nombres) ----------
  var pinEd = null;
  function pinMenu(say){
    say('>> EMPLEADOS CON PIN 🔐', 'g big', 20);
    try{
      RUN().withSuccessHandler(function(r){
        var l = (r && r.ok && r.items) || [];
        if(!l.length){ say('   NO HAY NINGÚN EMPLEADO CON PIN.', 'd', 0, true); return; }
        say('   PULSA [ EDITAR ] PARA CAMBIAR SU NOMBRE O SU PIN.', 'd', 0, true);
        l.forEach(function(it){
          var row = document.createElement('div'); row.className = 'g'; row.style.cssText = 'display:flex;gap:14px;align-items:center;flex-wrap:wrap';
          var t = document.createElement('span'); t.textContent = '   ' + String(it.nombre || it.id).toUpperCase() + '  ·  PIN ••••';
          var b = document.createElement('span'); b.textContent = '[ EDITAR ]';
          b.style.cssText = 'color:#ffd84a;text-shadow:0 0 6px rgba(255,216,74,.9);cursor:pointer;border:1px solid rgba(255,216,74,.6);border-radius:5px;padding:0 6px;font-size:.85em;user-select:none';
          b.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
          b.addEventListener('click', function(e){ e.stopPropagation(); pinEditar(it); try{ conIn.focus(); }catch(er){} });
          row.appendChild(t); row.appendChild(b);
          CON.q.push({ node: row }); if(!CON.typing) conPump();
        });
      }).withFailureHandler(function(){ say('   NO SE HA PODIDO LEER LA LISTA DE PIN.', 'r', 10); errTone(); }).apiPinesListar();
    }catch(e){ say('   NO SE HA PODIDO LEER LA LISTA DE PIN.', 'r', 10); errTone(); }
  }
  function pinEditar(it){
    pinEd = { id: it.id, nombre: it.nombre };
    say('>> EDITANDO A ' + String(it.nombre).toUpperCase() + ' ✏️', 'g big', 20);
    say('   ESCRIBE EL NUEVO NOMBRE (O PULSA ENTER PARA DEJAR «' + String(it.nombre).toUpperCase() + '»):', 'y', 10);
    CON.ask = 'pinNom';
  }
  function pinPasoNom(raw){
    if(!pinEd){ say('', '', 0, true); return; }
    var n = String(raw || '').trim();
    if(n){ pinEd.nombre = n.toLowerCase().replace(/(^|\s)(\S)/g, function(m, a, c){ return a + c.toUpperCase(); }).slice(0, 30); }
    say('   NOMBRE: ' + pinEd.nombre.toUpperCase(), 'd', 0, true);
    say('   ESCRIBE EL NUEVO PIN DE 4 CIFRAS (O PULSA ENTER PARA DEJAR EL ACTUAL):', 'y', 10);
    CON.ask = 'pinNum';
  }
  function pinPasoNum(raw){
    if(!pinEd){ say('', '', 0, true); return; }
    var v = String(raw || '').trim();
    if(v && !/^\d{4}$/.test(v)){ say('EL PIN TIENE QUE SER DE 4 CIFRAS. VUELVE A ESCRIBIRLO (O ENTER PARA DEJARLO IGUAL).', 'r', 12); errTone(); CON.ask = 'pinNum'; return; }
    var enviar = function(hash){
      var o = { id: pinEd.id, nombre: pinEd.nombre }; if(hash) o.hash = hash;
      say('   GUARDANDO…', 'd', 10);
      try{
        RUN().withSuccessHandler(function(r){
          if(!r || !r.ok){ say('   NO SE HA PODIDO GUARDAR' + (r && r.error ? ': ' + String(r.error).toUpperCase() : '') + '.', 'r', 10); errTone(); if(hash) CON.ask = 'pinNum'; return; }
          say('>> GUARDADO ✅', 'g big', 22);
          say('   NOMBRE: ' + pinEd.nombre.toUpperCase() + '  ·  PIN: ' + (hash ? 'CAMBIADO' : 'SIN CAMBIOS'), 'y', 10);
          tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
          try{ if(window.LucasBrain && window.LucasBrain.pinesRecargar) window.LucasBrain.pinesRecargar(); }catch(e){}
          pinEd = null;
        }).withFailureHandler(function(){ say('   NO SE HA PODIDO GUARDAR. PRUEBA OTRA VEZ.', 'r', 10); errTone(); }).apiPinGuardar(o);
      }catch(e){ say('   NO SE HA PODIDO GUARDAR.', 'r', 10); errTone(); }
    };
    if(!v) return enviar(null);
    try{
      crypto.subtle.digest('SHA-256', new TextEncoder().encode('lucasPin:' + v)).then(function(buf){ var h = ''; new Uint8Array(buf).forEach(function(b){ h += ('0' + b.toString(16)).slice(-2); }); enviar(h); })
        .catch(function(){ say('   NO SE HA PODIDO CIFRAR EL PIN.', 'r', 10); errTone(); });
    }catch(e){ say('   NO SE HA PODIDO CIFRAR EL PIN.', 'r', 10); errTone(); }
  }
  // ---------- RECARGA DEL SALDO DEL ASISTENTE (milésimas de euro en el servidor) ----------
  function eurTxt(m){ return (Math.floor(Math.max(0, m)/10)/100).toFixed(2).replace('.', ','); }
  function recPaso1(say){
    say('>> RECARGA DE SALDO 💳', 'g big', 20);
    try{
      RUN().withSuccessHandler(function(r){
        say('   SALDO ACTUAL: ' + (r && r.ok ? eurTxt(r.saldo) + ' €' : 'NO DISPONIBLE'), 'y', 10);
        say('>> ¿CUÁNTO QUIERES RECARGAR? ESCRIBE LA CANTIDAD EN FORMATO XXX,XX Y PULSA ENTER.', 'g', 16);
        CON.ask = 'recarga';
      }).withFailureHandler(function(){ say('   NO SE HA PODIDO LEER EL SALDO. PRUEBA OTRA VEZ.', 'r', 10); errTone(); }).apiSaldoVer();
    }catch(e){ say('   NO SE HA PODIDO LEER EL SALDO.', 'r', 10); errTone(); }
  }
  function recPaso2(m){
    var mil = parseInt(m[1], 10) * 1000 + (m[2] ? (m[2].length === 1 ? parseInt(m[2], 10) * 100 : parseInt(m[2], 10) * 10) : 0);
    if(!(mil > 0)){ say('LA CANTIDAD TIENE QUE SER MAYOR QUE 0.', 'r', 12); errTone(); CON.ask = 'recarga'; return; }
    say('   RECARGANDO ' + eurTxt(mil) + ' €…', 'd', 10);
    try{
      RUN().withSuccessHandler(function(r){
        if(!r || !r.ok){ say('   NO SE HA PODIDO RECARGAR' + (r && r.error ? ': ' + String(r.error).toUpperCase() : '') + '.', 'r', 10); errTone(); return; }
        say('>> RECARGA HECHA ✅  +' + eurTxt(mil) + ' €', 'g big', 22);
        say('   SALDO ACTUAL: ' + eurTxt(r.saldo) + ' €', 'y', 10);
        tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
        try{ if(window.LucasBrain && window.LucasBrain.saldoSet) window.LucasBrain.saldoSet(r.saldo); }catch(e){}
      }).withFailureHandler(function(){ say('   NO SE HA PODIDO RECARGAR. PRUEBA OTRA VEZ.', 'r', 10); errTone(); }).apiSaldoRecargar(mil);
    }catch(e){ say('   NO SE HA PODIDO RECARGAR.', 'r', 10); errTone(); }
  }
  // ---------- SUBPANELES (comando PANEL) ----------
  var PAN = { lista:[], sel:null };
  function tokPanel(){ if(CON.token) return CON.token; try{ return (typeof SESSION_TOKEN !== 'undefined' && SESSION_TOKEN) ? SESSION_TOKEN : ''; }catch(e){ return ''; } }
  function panApi(op, a, ok){
    try{
      RUN().withSuccessHandler(function(r){
        if(!r || !r.ok){ say('   ERROR: ' + String((r && r.error) || 'SIN RESPUESTA').toUpperCase(), 'r', 10); errTone(); return; }
        ok(r);
      }).withFailureHandler(function(e){ say('   ERROR DE CONEXIÓN: ' + String((e && e.message) || e).toUpperCase(), 'r', 10); errTone(); }).apiSubAdmin(tokPanel(), op, a || {});
    }catch(e){ say('   ERROR: ' + e.message, 'r', 10); errTone(); }
  }
  // La semilla del subpanel se guarda en la página de fuera (la del login), por eso se le pregunta a ella
  function semSub(msg, cb){
    var hecho = false;
    function oir(e){ var d = e.data || {}; if(d.pf !== 'subSemillaR') return; hecho = true; window.removeEventListener('message', oir); cb(d.sub || null); }
    window.addEventListener('message', oir);
    try{ window.top.postMessage(msg, '*'); }catch(e){}
    setTimeout(function(){ if(!hecho){ window.removeEventListener('message', oir); cb(undefined); } }, 2500);
  }
  function panMenu(say){
    say('>> SUBPANELES 🧩', 'g big', 20);
    say('   LEYENDO PANELES…', 'd', 0, true);
    panApi('listar', {}, function(r){
      PAN.lista = r.items || [];
      semSub({ pf:'subSemillaVer' }, function(cur){
        if(!PAN.lista.length) say('   TODAVÍA NO HAY SUBPANELES.', 'd', 0, true);
        PAN.lista.forEach(function(x, i){
          var aqui = cur && cur.id === x.id;
          say('   ' + (i+1) + ' - ' + x.nombre.toUpperCase() + '   · PESTAÑA ' + x.hoja + ' · CONTRASEÑA: ' + (x.conPass ? 'SÍ' : 'NO') + ' · SALDO LUCAS: ' + eurTxt(x.saldo) + ' €' + (aqui ? '   🌱 SEMILLA EN ESTE PC' : ''), aqui ? 'g' : 'y', 0, true);
        });
        say('   ' + (PAN.lista.length + 1) + ' - ➕ NUEVO PANEL', 'y', 0, true);
        say('   ESCRIBE EL NÚMERO Y PULSA ENTER.', 'd', 0, true);
        CON.ask = 'pan1';
      });
    });
  }
  function panElegir(n){
    if(n === PAN.lista.length + 1){ say('>> NUEVO PANEL ➕', 'g big', 20); say('   ESCRIBE EL NOMBRE DEL NUEVO PANEL (POR EJEMPLO WIL) Y PULSA ENTER. SE CREARÁ SU PESTAÑA EN EL SHEET CON LAS MISMAS COLUMNAS.', 'y', 10); CON.ask = 'panNuevo'; return; }
    var x = PAN.lista[n-1]; if(!x){ say('OPCIÓN NO VÁLIDA · ESCRIBE UN NÚMERO DEL 1 AL ' + (PAN.lista.length + 1) + '.', 'r', 12); errTone(); CON.ask = 'pan1'; return; }
    PAN.sel = x; panSubMenu(x);
  }
  function panSubMenu(x){
    semSub({ pf:'subSemillaVer' }, function(cur){
      var aqui = cur && cur.id === x.id;
      PAN.semAqui = !!aqui;
      say('>> PANEL ' + x.nombre.toUpperCase() + ' 🧩', 'g big', 20);
      say('   PESTAÑA DEL SHEET: ' + x.hoja + ' · CONTRASEÑA: ' + (x.conPass ? 'SÍ (OCULTA)' : 'NO TIENE') + ' · SALDO DE LUCAS: ' + eurTxt(x.saldo) + ' €', 'w', 10);
      say('   1 - ' + (x.conPass ? 'CAMBIAR LA CONTRASEÑA' : 'PONER CONTRASEÑA'), 'y', 0, true);
      say('   2 - BORRAR LA CONTRASEÑA (NADIE PODRÁ ENTRAR EN ESTE PANEL)', 'y', 0, true);
      say('   3 - ' + (aqui ? 'QUITAR LA SEMILLA DE ' + x.nombre.toUpperCase() + ' DE ESTE ORDENADOR' : 'INSTALAR LA SEMILLA DE ' + x.nombre.toUpperCase() + ' EN ESTE ORDENADOR'), 'y', 0, true);
      say('   4 - RECARGAR EL SALDO DE LUCAS DE ESTE PANEL (SE DESCUENTA DE TU SALDO)', 'y', 0, true);
      say('   5 - PONER O CAMBIAR EL PIN DE SUS TARJETAS', 'y', 0, true);
      say('   ESCRIBE EL NÚMERO Y PULSA ENTER.', 'd', 0, true);
      CON.ask = 'pan2';
    });
  }
  function panOpcion(n){
    var x = PAN.sel; if(!x){ panMenu(say); return; }
    if(n === 1){ say('   ESCRIBE LA NUEVA CONTRASEÑA DE ' + x.nombre.toUpperCase() + ' (MÍNIMO 4 CARACTERES) Y PULSA ENTER. NO DISTINGUE MAYÚSCULAS.', 'y', 10); CON.ask = 'panPass'; return; }
    if(n === 2){ panApi('borrarPass', { id:x.id }, function(r){ PAN.sel = r.item; say('>> CONTRASEÑA BORRADA ✔', 'g big', 22); say('   NADIE PODRÁ ENTRAR EN EL PANEL ' + x.nombre.toUpperCase() + ' HASTA QUE LE PONGAS UNA. SUS SESIONES ABIERTAS SE HAN CERRADO.', 'd', 0, true); tone(900, 300, 0.25, 'square', 0.05); }); return; }
    if(n === 3){
      var poner = !PAN.semAqui;
      semSub({ pf:'subSemilla', on:poner, id:x.id, nombre:x.nombre }, function(cur){
        if(cur === undefined){ say('   NO SE HA PODIDO GUARDAR LA SEMILLA (ABRE EL PANEL DESDE PUNTOFIBRA.GITHUB.IO/PANEL).', 'r', 10); errTone(); return; }
        if(poner){
          say('>> SEMILLA DE ' + x.nombre.toUpperCase() + ' INSTALADA 🌱', 'g big', 22);
          say('   CUANDO CIERRES SESIÓN, ESTE ORDENADOR MOSTRARÁ EL ACCESO DEL PANEL ' + x.nombre.toUpperCase() + '.', '', 10);
          say('   SI NECESITAS ENTRAR TÚ AQUÍ: MANTÉN PULSADO ENTRAR 3 s Y PASA TU LLAVE NFC.', 'd', 0, true);
        } else {
          say('>> SEMILLA DE ' + x.nombre.toUpperCase() + ' QUITADA ✔', 'g big', 22);
          say('   ESTE ORDENADOR VUELVE A MOSTRAR TU ACCESO NORMAL.', 'd', 0, true);
        }
        PAN.semAqui = poner;
        tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
      });
      return;
    }
    if(n === 4){ say('   SALDO ACTUAL DE ' + x.nombre.toUpperCase() + ': ' + eurTxt(x.saldo) + ' €. ¿CUÁNTO QUIERES RECARGAR? FORMATO XXX,XX Y ENTER.', 'y', 10); CON.ask = 'panSaldo'; return; }
    if(n === 5){ say('   ESCRIBE EL PIN DE TARJETAS DE ' + x.nombre.toUpperCase() + ' (MÍNIMO 4 CARACTERES) Y PULSA ENTER.', 'y', 10); CON.ask = 'panPin'; return; }
    say('OPCIÓN NO VÁLIDA · ESCRIBE UN NÚMERO DEL 1 AL 5.', 'r', 12); errTone(); CON.ask = 'pan2';
  }
  function panNuevo(nombre){
    nombre = String(nombre || '').trim();
    if(nombre.length < 2){ say('ESCRIBE UN NOMBRE DE AL MENOS 2 LETRAS.', 'r', 12); errTone(); CON.ask = 'panNuevo'; return; }
    say('   CREANDO EL PANEL ' + nombre.toUpperCase() + ' Y SU PESTAÑA EN EL SHEET… (TARDA UNOS SEGUNDOS)', 'd', 10);
    panApi('crear', { nombre:nombre }, function(r){
      say('>> PANEL ' + r.item.nombre.toUpperCase() + ' CREADO ✅', 'g big', 22);
      say('   PESTAÑA ' + r.item.hoja + ' CREADA EN EL SHEET CON LAS MISMAS COLUMNAS QUE LA TUYA, VACÍA.', '', 10);
      tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
      PAN.sel = r.item; setTimeout(function(){ panSubMenu(r.item); }, 400);
    });
  }
  function panPass(raw){
    var x = PAN.sel; var p = String(raw || '').trim();
    if(p.length < 4){ say('LA CONTRASEÑA TIENE QUE TENER AL MENOS 4 CARACTERES.', 'r', 12); errTone(); CON.ask = 'panPass'; return; }
    panApi('pass', { id:x.id, pass:p }, function(r){
      PAN.sel = r.item;
      say('>> CONTRASEÑA DE ' + x.nombre.toUpperCase() + ' GUARDADA 🔐', 'g big', 22);
      say('   YA PUEDE ENTRAR DESDE LOS ORDENADORES CON SU SEMILLA. SI TENÍA SESIONES ABIERTAS, SE HAN CERRADO.', 'd', 0, true);
      tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
    });
  }
  function panPin(raw){
    var x = PAN.sel; var p = String(raw || '').trim();
    if(p.length < 4){ say('EL PIN TIENE QUE TENER AL MENOS 4 CARACTERES.', 'r', 12); errTone(); CON.ask = 'panPin'; return; }
    panApi('pinTarjetas', { id:x.id, pin:p }, function(){ say('>> PIN DE TARJETAS DE ' + x.nombre.toUpperCase() + ' GUARDADO 💳', 'g big', 22); tone(1200, 1800, 0.12, 'square', 0.05); });
  }
  function panSaldo(m){
    var x = PAN.sel;
    var mil = parseInt(m[1], 10) * 1000 + (m[2] ? (m[2].length === 1 ? parseInt(m[2], 10) * 100 : parseInt(m[2], 10) * 10) : 0);
    if(!(mil > 0)){ say('LA CANTIDAD TIENE QUE SER MAYOR QUE 0.', 'r', 12); errTone(); CON.ask = 'panSaldo'; return; }
    panApi('saldo', { id:x.id, mil:mil, sumar:true }, function(r){
      PAN.sel = r.item;
      say('>> RECARGA HECHA ✅  +' + eurTxt(mil) + ' €', 'g big', 22);
      say('   SALDO DE LUCAS EN EL PANEL ' + x.nombre.toUpperCase() + ': ' + eurTxt(r.item.saldo) + ' €', 'y', 10);
      if(r.item.saldoMio != null){ say('   TU SALDO QUEDA EN: ' + eurTxt(r.item.saldoMio) + ' €', 'd', 0, true); try{ if(window.LucasBrain && window.LucasBrain.saldoSet && !window.PF_SUB) window.LucasBrain.saldoSet(r.item.saldoMio); }catch(e){} }
      tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
    });
  }
  // ---------- SEMILLAS: marcas guardadas solo en este ordenador ----------
  var SEMILLAS = [
    ['fichajeSeb', 'FICHAJE DE SEBASTIÁN', 'LUCAS PREGUNTA A SEBASTIÁN SUS ENTRADAS Y SALIDAS SOLO EN ESTE ORDENADOR (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['avisos',  'SIN AVISOS DE PENDIENTES', 'LUCAS NO RECUERDA LOS CONTRATOS PENDIENTES EN ESTE ORDENADOR'],
    ['borradores', 'SIN AVISOS DE BORRADORES NUEVOS', 'LUCAS NO AVISA DE BORRADORES NUEVOS SIN ACTUALIZAR EN ESTE ORDENADOR'],
    ['contratos', 'AVISOS DE CONTRATOS NUEVOS', 'LUCAS AVISA EN ESTE ORDENADOR CUANDO SE FINALIZA UN CONTRATO NUEVO (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['doblePausa', 'AVISOS DE DOBLE PAUSA', 'LUCAS AVISA EN ESTE ORDENADOR CUANDO UN CONTRATO EN ⏸️⏸️ YA TOCA DARLO DE BAJA, Y LO RECUERDA CADA HORA (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['avisosPausa', 'AVISOS DE PAUSA', 'LUCAS AVISA EN ESTE ORDENADOR CUANDO UN CONTRATO EN ⏸️ YA TOCA DARLO DE BAJA O HACERLE DOBLE PAUSA, Y LO RECUERDA CADA HORA (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['consolaSinPin', 'CONSOLA SIN PASSWORD', 'LA CONSOLA NO PIDE EL CÓDIGO DE GOOGLE AUTHENTICATOR EN ESTE ORDENADOR (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['recManu', 'RECORDATORIOS DE MANU', 'LUCAS AVISA EN ESTE ORDENADOR DE LOS RECORDATORIOS DE MANU (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['recSebastian', 'RECORDATORIOS DE SEBASTIÁN', 'LUCAS AVISA EN ESTE ORDENADOR DE LOS RECORDATORIOS DE SEBASTIÁN (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['recJorge', 'RECORDATORIOS DE JORGE', 'LUCAS AVISA EN ESTE ORDENADOR DE LOS RECORDATORIOS DE JORGE (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['recMaicol', 'RECORDATORIOS DE MAICOL', 'LUCAS AVISA EN ESTE ORDENADOR DE LOS RECORDATORIOS DE MAICOL (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['avisosFichaje', 'AVISOS DE FICHAJE', 'LUCAS AVISA EN ESTE ORDENADOR EN CUANTO UN EMPLEADO FICHA LA ENTRADA O LA SALIDA (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['chatManu', 'CHAT MANU', 'ESTE ORDENADOR ES EL DE MANU EN EL CHAT DE LUCAS: RECIBE SUS MENSAJES Y LOS ENVÍA EN SU NOMBRE (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['chatJorge', 'CHAT JORGE', 'ESTE ORDENADOR ES EL DE JORGE EN EL CHAT DE LUCAS: RECIBE SUS MENSAJES Y LOS ENVÍA EN SU NOMBRE (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['chatMaicol', 'CHAT MAICOL', 'ESTE ORDENADOR ES EL DE MAICOL EN EL CHAT DE LUCAS: RECIBE SUS MENSAJES Y LOS ENVÍA EN SU NOMBRE (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['chatSebas', 'CHAT SEBAS', 'ESTE ORDENADOR ES EL DE SEBAS EN EL CHAT DE LUCAS: RECIBE SUS MENSAJES Y LOS ENVÍA EN SU NOMBRE (SOLO FUNCIONA SI ESTÁ INSTALADA)'],
    ['borrar', 'PUEDE BORRAR CONTRATOS Y BORRADORES', 'ESTE ORDENADOR PUEDE ELIMINAR CONTRATOS Y BORRADORES EN EL PANEL PRINCIPAL (SIN ESTA SEMILLA SALE UN AVISO DE QUE SOLO MANU PUEDE BORRAR; LOS SUBPANELES SIEMPRE PUEDEN)'],
    ['vozSiempre', 'VOZ DE LUCAS SIEMPRE ACTIVA', 'LUCAS HABLA SIEMPRE EN ESTE ORDENADOR: SE OCULTA EL ALTAVOZ DEL ASISTENTE Y SU VOZ NO SE PUEDE SILENCIAR (SOLO FUNCIONA SI ESTÁ INSTALADA)']
  ];
  function semOn(k){ try{ return localStorage.getItem('pfSemilla_' + k) === '1'; }catch(e){ return false; } }
  function semSet(k, on){ try{ if(on) localStorage.setItem('pfSemilla_' + k, '1'); else localStorage.removeItem('pfSemilla_' + k); }catch(e){} }
  var semModo = null;
  function semMenu(say){
    CON.ask = 'sem1';
    say('>> GESTOR DE SEMILLAS 🌱', 'g big', 20);
    say('   LAS SEMILLAS SOLO AFECTAN A ESTE ORDENADOR. ESTADO ACTUAL:', 'w', 10);
    SEMILLAS.forEach(function(sm){ say('   ' + (semOn(sm[0]) ? '[✔] ' : '[ ] ') + sm[1] + '  -  ' + sm[2], semOn(sm[0]) ? 'g' : 'd', 0, true); });
    say('', '', 0, true);
    say('   ¿QUÉ QUIERES HACER?', 'w', 12);
    say('   1 - INSTALAR UNA SEMILLA', 'y', 0, true);
    say('   2 - BORRAR UNA SEMILLA', 'y', 0, true);
    say('   ESCRIBE EL NÚMERO Y PULSA ENTER.', 'd', 0, true);
  }
  function semPaso2(n){
    if(n !== 1 && n !== 2){ say('OPCIÓN NO VÁLIDA · ESCRIBE 1 O 2.', 'r', 12); errTone(); CON.ask = 'sem1'; return; }
    semModo = n === 1 ? 'instalar' : 'borrar'; CON.ask = 'sem2';
    say('>> ¿QUÉ SEMILLA QUIERES ' + (n === 1 ? 'INSTALAR' : 'BORRAR') + '?', 'g', 16);
    SEMILLAS.forEach(function(sm, i){ say('   ' + (i+1) + ' - ' + sm[1] + (semOn(sm[0]) ? '   (INSTALADA)' : ''), 'y', 0, true); });
    say('   ESCRIBE EL NÚMERO Y PULSA ENTER.', 'd', 0, true);
  }
  function semPaso3(n){
    var sm = SEMILLAS[n-1]; if(!sm){ say('OPCIÓN NO VÁLIDA · ESCRIBE UN NÚMERO DEL 1 AL ' + SEMILLAS.length + '.', 'r', 12); errTone(); CON.ask = 'sem2'; return; }
    var inst = semModo === 'instalar';
    if(inst === semOn(sm[0])){ say('   ESA SEMILLA YA ESTABA ' + (inst ? 'INSTALADA' : 'BORRADA') + ' EN ESTE ORDENADOR.', 'y', 10); return; }
    say(inst ? 'SEMBRANDO "' + sm[1] + '"…' : 'ARRANCANDO "' + sm[1] + '"…', 'd', 14);
    [20, 55, 85, 100].forEach(function(pc){ say('[' + '█'.repeat(pc/5) + ' '.repeat(20 - pc/5) + '] ' + pc + '%', pc === 100 ? 'g' : '', 0, true); });
    semSet(sm[0], inst);
    say(inst ? '>> SEMILLA INSTALADA 🌱' : '>> SEMILLA BORRADA 🗑️', inst ? 'g big' : 'r big', 22);
    say('   ' + (inst ? sm[2] + '.' : 'ESTE ORDENADOR VUELVE A FUNCIONAR CON NORMALIDAD PARA "' + sm[1] + '".'), '', 10);
    tone(inst ? 900 : 1400, inst ? 1600 : 700, 0.25, 'square', 0.05);
  }
  var fichTimers = {};
  function fichTest(id, nombre, say){
    clearTimeout(fichTimers[id]);
    var at = new Date(Date.now() + 60000), p = function(n){ return ('0'+n).slice(-2); };
    say('>> PRUEBA DE FICHAJE · ' + nombre + ' ⏱️', 'g big', 22);
    say('   LUCAS PREGUNTARÁ A LAS ' + p(at.getHours()) + ':' + p(at.getMinutes()) + ':' + p(at.getSeconds()) + '. CONTESTA POR EL CHAT DEL ASISTENTE.', '', 10);
    say('   ES UNA PRUEBA: LA RESPUESTA NO SE GUARDA EN EL REGISTRO.', 'd', 0, true);
    tone(1200, 1800, 0.12, 'square', 0.05); tone(1800, 2400, 0.12, 'square', 0.05, 0.13);
    fichTimers[id] = setTimeout(function(){ if(window.LucasBrain && window.LucasBrain.fichTest) window.LucasBrain.fichTest(id); }, 60000);
  }
  var FICH_OPC = [null, 'HOY', 'AYER', 'ÚLTIMOS 7 DÍAS', 'MES ACTUAL', 'MES PASADO', 'ÚLTIMOS 3 MESES', 'ESTE AÑO', 'AÑO PASADO'];
  var FICH_EMP = ['Sebastián', 'Jorge', 'Maicol'], fichEmp = 'Sebastián';
  function U(x){ return String(x||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }   // en la consola, sin acentos
  function fichMenuEmp(say){
    CON.ask = 'fichEmp';
    say('>> REGISTRO DE FICHAJES 🕘', 'g big', 20);
    say('   ¿DE QUIÉN QUIERES VER LOS FICHAJES?', 'w', 12);
    FICH_EMP.forEach(function(n, i){ say('   ' + (i+1) + ' - ' + n.toUpperCase(), 'y', 0, true); });
    say('   ' + (FICH_EMP.length+1) + ' - TODOS', 'y', 0, true);
    say('   ESCRIBE EL NÚMERO (O EL NOMBRE) Y PULSA ENTER.', 'd', 0, true);
  }
  function fichMenu(say){
    CON.ask = 'fich';
    say('>> FICHAJES DE ' + fichEmp.toUpperCase(), 'g big', 20);
    say('   ¿QUÉ PERIODO QUIERES CONSULTAR?', 'w', 12);
    for(var i=1;i<FICH_OPC.length;i++) say('   ' + i + ' - ' + FICH_OPC[i], 'y', 0, true);
    say('   ESCRIBE EL NÚMERO Y PULSA ENTER.', 'd', 0, true);
  }
  function d0(y,m,d){ return new Date(y,m,d); }
  function isoD(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function fichRango(n){
    var t = new Date(), y = t.getFullYear(), m = t.getMonth(), d = t.getDate(), hoy = d0(y,m,d);
    switch(n){
      case 1: return [hoy, hoy];
      case 2: return [d0(y,m,d-1), d0(y,m,d-1)];
      case 3: return [d0(y,m,d-6), hoy];
      case 4: return [d0(y,m,1), hoy];
      case 5: return [d0(y,m-1,1), d0(y,m,0)];
      case 6: return [d0(y,m-2,1), hoy];
      case 7: return [d0(y,0,1), hoy];
      case 8: return [d0(y-1,0,1), d0(y-1,11,31)];
    }
    return null;
  }
  var DIAS3 = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  var TURNOS = [ ['MAÑANA','ENTRADA','10:30'], ['MAÑANA','SALIDA','13:28'], ['TARDE','ENTRADA','17:30'], ['TARDE','SALIDA','19:28'] ];
  function minsOf(h){ var p = String(h||'').split(':'); return (+p[0])*60 + (+p[1]||0); }
  function fichListar(n, pre){
    var r = fichRango(n); if(!r){ say('OPCIÓN NO VÁLIDA · ESCRIBE UN NÚMERO DEL 1 AL 8.', 'r', 12); errTone(); CON.ask = 'fich'; return; }
    // TODOS: se lee el registro una vez y se enseña empleado por empleado
    if(fichEmp === 'Todos' && !pre){
      say('>> TODOS LOS EMPLEADOS · ' + FICH_OPC[n] + ' · CONSULTANDO EL REGISTRO…', 'g', 16);
      var todos = function(items, err){
        if(err){ say('ERROR AL LEER EL REGISTRO: ' + err, 'r', 10); errTone(); fichEmp = 'Todos'; return; }
        FICH_EMP.forEach(function(emp){ fichEmp = emp; say('', '', 0, true); say('══════════  ' + emp.toUpperCase() + '  ══════════', 'g big', 10); fichListar(n, items || []); });
        fichEmp = 'Todos'; lastFich = null;
      };
      try{
        RUN().withSuccessHandler(function(res){ if(res && res.ok) todos(res.items); else todos(null, (res && res.error) || 'sin respuesta'); })
          .withFailureHandler(function(e){ todos(null, (e && e.message) || String(e)); })
          .apiFichajeLucasLista(isoD(r[0]), isoD(r[1]));
      }catch(e){ todos(null, e.message); }
      return;
    }
    if(!pre) say('>> ' + fichEmp.toUpperCase() + ' · ' + FICH_OPC[n] + ' · CONSULTANDO EL REGISTRO…', 'g', 16);
    var fold = function(x){ return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var flexible = fichEmp !== 'Sebastián';      // Jorge y Maicol: horario flexible, sin marcar retrasos
    var finFlex = function(items){     // Jorge / Maicol: varias entradas y salidas al día (máx. 5)
      var porDia = {};
      (items||[]).forEach(function(x){ if(fold(x.empleado || 'Sebastián') !== fold(fichEmp)) return; (porDia[x.fecha] = porDia[x.fecha] || []).push(x); });
      var hoyIso = isoD(new Date()), p2 = function(v){ return ('0'+v).slice(-2); };
      var dias = 0, tot = 0, abiertas = 0, minsTot = 0;
      Object.keys(porDia).sort().reverse().forEach(function(fi){
        var lst = porDia[fi].sort(function(a, b){ return a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : (a.tipo === 'ENTRADA' ? -1 : 1); });
        var dd = new Date(fi + 'T12:00:00'), fTxt = DIAS3[dd.getDay()] + ' ' + p2(dd.getDate()) + '/' + p2(dd.getMonth()+1) + '/' + dd.getFullYear();
        dias++; say('', '', 0, true);
        var abierta = null, nE = 0, minsDia = 0;
        var cierraSinSalida = function(){
          if(fi === hoyIso){ say(fTxt + '  ·  SALIDA ' + nE + '   ·  — EN CURSO (ENTRÓ A LAS ' + abierta + ')', 'd', 0, true); }
          else { abiertas++; say(fTxt + '  ·  SALIDA ' + nE + '   ·  ✖ NO HA FICHADO LA SALIDA', 'r', 0, true); }
        };
        lst.forEach(function(x){
          tot++;
          if(x.tipo === 'ENTRADA'){
            if(abierta) cierraSinSalida();
            nE++; abierta = x.hora; say(fTxt + '  ·  ENTRADA ' + nE + '  ·  ' + x.hora, 'g', 0, true);
          } else {
            if(abierta){ var dm = minsOf(x.hora) - minsOf(abierta); if(dm > 0) minsDia += dm; say(fTxt + '  ·  SALIDA ' + nE + '   ·  ' + x.hora + (dm > 0 ? '   (' + Math.floor(dm/60) + 'h ' + p2(dm%60) + 'min)' : ''), 'g', 0, true); abierta = null; }
            else say(fTxt + '  ·  SALIDA      ·  ' + x.hora + '   ⚠ SIN ENTRADA PREVIA', 'y', 0, true);
          }
        });
        if(abierta) cierraSinSalida();
        minsTot += minsDia;
        if(minsDia) say('   TIEMPO TRABAJADO ESE DÍA: ' + Math.floor(minsDia/60) + 'h ' + p2(minsDia%60) + 'min', 'w', 0, true);
      });
      say('', '', 0, true);
      if(!dias){ say('   ' + fichEmp.toUpperCase() + ' NO TIENE FICHAJES EN ESTE PERIODO.', 'd', 0, true); return; }
      say('------------------------------------------', 'd', 0, true);
      say('RESUMEN · ' + dias + ' ' + (dias === 1 ? 'DÍA CON FICHAJES' : 'DÍAS CON FICHAJES') + ' · ' + tot + ' ' + (tot === 1 ? 'FICHAJE' : 'FICHAJES') + ' · ' + abiertas + ' ' + (abiertas === 1 ? 'SALIDA SIN FICHAR' : 'SALIDAS SIN FICHAR') + ' · TOTAL ' + Math.floor(minsTot/60) + 'h ' + ('0'+(minsTot%60)).slice(-2) + 'min', 'w', 0, true);
      tone(1500, 2200, 0.12, 'square', 0.04);
    };
    var fin = function(items, err){
      if(err){ say('ERROR AL LEER EL REGISTRO: ' + err, 'r', 10); errTone(); return; }
      lastFich = { emp: fichEmp, n: n, items: (items||[]).filter(function(x){ return fold(x.empleado || 'Sebastián') === fold(fichEmp); }) };
      if(flexible) return finFlex(items);
      var map = {}; (items||[]).forEach(function(x){ var e = x.empleado || 'Sebastián'; if(fold(e) !== fold(fichEmp)) return; map[x.fecha+'|'+x.turno+'|'+x.tipo] = x.hora; });
      var now = new Date(), nowM = now.getHours()*60 + now.getMinutes(), hoyIso = isoD(now);
      var ok = 0, falta = 0, tarde = 0, dias = 0, p2 = function(v){ return ('0'+v).slice(-2); };
      for(var d = new Date(r[1]); d >= r[0]; d.setDate(d.getDate()-1)){
        var dow = d.getDay(); if(dow === 0 || dow === 6) continue;
        var fi = isoD(d), fTxt = DIAS3[dow] + ' ' + p2(d.getDate()) + '/' + p2(d.getMonth()+1) + '/' + d.getFullYear();
        dias++;
        say('', '', 0, true);
        TURNOS.forEach(function(t){
          var h = map[fi+'|'+t[0]+'|'+t[1]];
          var etq = (t[1] === 'ENTRADA' ? 'ENTRADA ' : 'SALIDA  ') + (t[0] === 'MAÑANA' ? 'MAÑANA' : 'TARDE ');
          if(h){
            ok++;
            var extra = '';
            if(t[1] === 'ENTRADA' && !flexible){ var dif = minsOf(h) - minsOf(t[2]); if(dif > 5){ tarde++; extra = '   ⚠ +' + dif + ' MIN'; } }
            say(fTxt + '  ·  ' + etq + '  ·  ' + h + extra, extra ? 'y' : 'g', 0, true);
          } else if(fi === hoyIso && nowM < (flexible ? (t[0] === 'MAÑANA' ? 15*60 : 22*60) : minsOf(t[2]) + 60)){
            say(fTxt + '  ·  ' + etq + '  ·  — PENDIENTE', 'd', 0, true);
          } else { falta++; say(fTxt + '  ·  ' + etq + '  ·  ✖ NO HA FICHADO', 'r', 0, true); }
        });
      }
      say('', '', 0, true);
      if(!dias){ say('NO HAY DÍAS LABORABLES EN ESTE PERIODO.', 'd', 0, true); return; }
      say('------------------------------------------', 'd', 0, true);
      say('RESUMEN · ' + dias + ' ' + (dias === 1 ? 'DÍA LABORABLE' : 'DÍAS LABORABLES') + ' · ' + ok + ' ' + (ok === 1 ? 'FICHAJE' : 'FICHAJES') + ' · ' + falta + ' SIN FICHAR' + (tarde ? ' · ' + tarde + (tarde === 1 ? ' ENTRADA CON RETRASO' : ' ENTRADAS CON RETRASO') : ''), 'w', 0, true);
      tone(1500, 2200, 0.12, 'square', 0.04);
    };
    if(pre) return fin(pre);
    try{
      RUN().withSuccessHandler(function(res){ if(res && res.ok) fin(res.items); else fin(null, (res && res.error) || 'sin respuesta'); })
        .withFailureHandler(function(e){ fin(null, (e && e.message) || String(e)); })
        .apiFichajeLucasLista(isoD(r[0]), isoD(r[1]));
    }catch(e){ fin(null, e.message); }
  }

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
    conLine.innerHTML = (CON.auth ? '<span class="g">C:\\' + CON.dir + '&gt;</span>' : '<span class="y">PASSWORD:</span>') + ' <span class="w" id="pfconTx"></span><span class="cur">_</span>';
    conOut.appendChild(conLine); CON.busy = false; $('pfconTx').textContent = conOculta() ? conIn.value.replace(/./g, '•') : conIn.value; conScroll();
    if(CON.pend.length) conRun(CON.pend.shift());
  }
  function say(txt, cls, speed, fast){ CON.q.push({ txt:txt, cls:cls||'', speed:speed==null?18:speed, fast:!!fast }); if(!CON.typing) conPump(); }
  function conPump(){
    var it = CON.q.shift();
    if(!it){ CON.typing = false; CON.skip = false; if(CON.on && CON.busy && !CON.esperando) conPrompt(); return; }
    CON.typing = true;
    if(it.node){ conOut.appendChild(it.node); conScroll(); conTimer = setTimeout(conPump, 24); return; }
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
  // ---------- Móvil: la consola siempre en horizontal (Fold abierto: se adapta a ambas orientaciones) ----------
function conLayout(){
  var s = box.style, w = window.innerWidth, h = window.innerHeight;
  var tactil = false; try{ tactil = window.matchMedia('(pointer:coarse)').matches; }catch(e){}
  var pequena = Math.min(w, h) < 560;                 // móvil o Fold cerrado; el Fold abierto es mucho más ancho
  if(CON.on && tactil && pequena && h > w){           // en vertical: se gira 90º para verla en horizontal
    s.inset = 'auto'; s.top = '0'; s.left = w + 'px'; s.width = h + 'px'; s.height = w + 'px';
    s.transformOrigin = '0 0'; s.transform = 'rotate(90deg)';
  } else {
    s.inset = ''; s.top = ''; s.left = ''; s.width = ''; s.height = ''; s.transformOrigin = ''; s.transform = '';
  }
}
window.addEventListener('resize', function(){ if(CON.on) conLayout(); });
window.addEventListener('orientationchange', function(){ setTimeout(function(){ if(CON.on) conLayout(); }, 250); });
function openConsole(){
    CON.auth = !window.PF_SUB && semOn('consolaSinPin');   // en un subpanel siempre pide las claves de Google CON.ask = null; CON.esperando = false;
    audio(); CON.on = true; CON.dir = 'PANEL'; CON.q = []; CON.typing = false; CON.busy = true; CON.pend = []; conIn.value = ''; clearTimeout(conTimer); conOut.innerHTML = '';
    box.classList.remove('off'); box.classList.add('on', 'boot'); conLayout(); try{ if(window.matchMedia('(pointer:coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 560 && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function(){}); }catch(e){} setTimeout(function(){ box.classList.remove('boot'); }, 800); setTimeout(function(){ try{ conIn.focus({ preventScroll:true }); }catch(x){} }, 150); setTimeout(function(){ try{ conIn.focus({ preventScroll:true }); }catch(x){} }, 600);
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
      if(CON.auth){ say('SESIÓN ABIERTA ' + hoy(), 'y', 0, true); }
      else conLoginInicio();
    }, 650);
  }
  function closeConsole(){ conNfcParar();
    if(!CON.on) return; CON.on = false; try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} CON.q = []; clearTimeout(conTimer); try{ conIn.blur(); }catch(e){}
    box.classList.add('off'); tone(900, 50, 0.35, 'sawtooth', 0.06);
    setTimeout(function(){ box.classList.remove('on', 'off'); }, 460);
  }
  var HEX = '0123456789ABCDEF';
  function rh(n){ var o=''; for(var i=0;i<n;i++) o += HEX[Math.random()*16|0]; return o; }
  function errTone(){ tone(140, 90, 0.3, 'square', 0.08); }
  function conRun(raw){
    var cmd = raw.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    if(conLine){ var cu = conLine.querySelector('.cur'); if(cu) cu.remove(); var tx = conLine.querySelector('#pfconTx'); if(tx){ tx.textContent = (conOculta() && raw.trim()) ? raw.trim().replace(/./g, '•') : raw.toUpperCase(); tx.removeAttribute('id'); } }
    conIn.value = ''; CON.busy = true; conScroll(true);
    if(!CON.auth){ conLogin(raw); return; }
    if(CON.ask === 'pwQR'){ CON.ask = null; pwVerificarYMostrar(raw); return; }
    if(CON.ask === 'pinNom'){ CON.ask = null; pinPasoNom(raw); return; }
    if(CON.ask === 'pinNum'){ CON.ask = null; pinPasoNum(raw); return; }
    if(CON.ask === 'panPass'){ CON.ask = null; panPass(raw); return; }
    if(CON.ask === 'panPin'){ CON.ask = null; panPin(raw); return; }
    if(CON.ask === 'panNuevo'){ CON.ask = null; if(/^(CANCELAR|SALIR)$/.test(cmd)){ say('   CANCELADO.', 'd', 10); return; } panNuevo(raw); return; }
    if(!cmd){ say('', '', 0, true); return; }
    if(CON.ask === 'script'){ CON.ask = null; if(/^\d+$/.test(cmd)){ scrCopia(+cmd); return; } }
    if(CON.ask === 'fichEmp'){ CON.ask = null; if(cmd === String(FICH_EMP.length+1) || cmd === 'TODOS'){ fichEmp = 'Todos'; fichMenu(say); return; } if(/^[1-3]$/.test(cmd)){ fichEmp = FICH_EMP[+cmd - 1]; fichMenu(say); return; } for(var fe=0; fe<FICH_EMP.length; fe++){ if(cmd === U(FICH_EMP[fe])){ fichEmp = FICH_EMP[fe]; fichMenu(say); return; } } }
    if(CON.ask === 'fich'){ CON.ask = null; if(/^[1-8]$/.test(cmd)){ fichListar(+cmd); return; } }
    if(CON.ask === 'recarga'){ CON.ask = null;
      if(/^(CANCELAR|SALIR|NO|NADA)$/.test(cmd)){ say('   RECARGA CANCELADA.', 'd', 10); return; }
      var mR = cmd.replace(/\s|€|EUROS?/g, '').match(/^(\d{1,3})(?:[.,](\d{1,2}))?$/);
      if(mR){ recPaso2(mR); return; }
      say('IMPORTE NO VÁLIDO · ESCRIBE UNA CANTIDAD EN FORMATO XXX,XX (POR EJEMPLO 10 O 9,50).', 'r', 12); errTone(); CON.ask = 'recarga'; return;
    }
    if(CON.ask === 'pan1'){ CON.ask = null; if(/^\d{1,2}$/.test(cmd)){ panElegir(+cmd); return; } }
    if(CON.ask === 'pan2'){ CON.ask = null; if(/^\d$/.test(cmd)){ panOpcion(+cmd); return; } }
    if(CON.ask === 'panSaldo'){ CON.ask = null;
      if(/^(CANCELAR|SALIR|NO|NADA)$/.test(cmd)){ say('   RECARGA CANCELADA.', 'd', 10); return; }
      var mP = cmd.replace(/\s|€|EUROS?/g, '').match(/^(\d{1,3})(?:[.,](\d{1,2}))?$/);
      if(mP){ panSaldo(mP); return; }
      say('IMPORTE NO VÁLIDO · FORMATO XXX,XX (POR EJEMPLO 10 O 9,50).', 'r', 12); errTone(); CON.ask = 'panSaldo'; return;
    }
    if(CON.ask === 'sem1'){ CON.ask = null; if(/^\d$/.test(cmd)){ semPaso2(+cmd); return; } }
    if(CON.ask === 'sem2'){ CON.ask = null; if(/^\d{1,2}$/.test(cmd)){ semPaso3(+cmd); return; } }
    if(cmd === 'LIST' || cmd === 'LISTA' || cmd === 'HELP' || cmd === 'AYUDA'){
      say('>> LISTA DE COMANDOS', 'g big', 20);
      if(!COMANDOS.length){ say('   (VACÍA) · TODAVÍA NO HAY COMANDOS INSTALADOS EN ESTE SISTEMA.', 'd', 0, true); }
      else COMANDOS.forEach(function(c){ say(c[0] + '  -  ' + c[1], 'y', 0, true); });
      say('', '', 0, true);
      say('>> COMANDOS DEL SISTEMA', 'g', 10);
      [['LIST / LISTA / HELP / AYUDA', 'MUESTRA ESTA LISTA DE COMANDOS'],
       ['CLS / CLEAR / LIMPIAR / ERASE', 'BORRA LA PANTALLA DE LA CONSOLA'],
       ['DIR / LS', 'MUESTRA EL CONTENIDO DE LA CARPETA ACTUAL'],
       ['CD PANEL / CD .. / CD', 'CAMBIA DE CARPETA O MUESTRA LA CARPETA ACTUAL'],
       ['SALIR / EXIT', 'CIERRA LA CONSOLA (TAMBIÉN CON LA TECLA ESC)']
      ].forEach(function(c){ say(c[0] + '  -  ' + c[1], 'y', 0, true); });
      return;
    }
    if(/^CD\s*(\.\.|\\)$/.test(cmd)){ CON.dir = ''; say('', '', 0, true); return; }
    if(/^CD\s*\\?\s*PANEL$/.test(cmd)){ CON.dir = 'PANEL'; say('', '', 0, true); return; }
    if(/^CD\b/.test(cmd)){ var d = cmd.replace(/^CD\s*/, ''); if(!d){ say('C:\\' + CON.dir, '', 0, true); return; } say('RUTA NO ENCONTRADA: ' + d.slice(0, 20), 'r', 12); errTone(); return; }
    if(cmd === 'DIR' || cmd === 'LS'){ say(CON.dir ? ' DIRECTORIO DE C:\\PANEL\n\n   <DIR>  .\n   <DIR>  ..\n          0 ARCHIVOS' : ' DIRECTORIO DE C:\\\n\n   <DIR>  PANEL\n          0 ARCHIVOS', 'd', 0, true); return; }
    if(cmd === 'CLS' || cmd === 'CLEAR' || cmd === 'LIMPIAR' || cmd === 'ERASE'){ conOut.innerHTML = ''; say('', '', 0, true); return; }
    if(cmd === 'SALIR' || cmd === 'EXIT'){ closeConsole(); return; }
    for(var i=0;i<COMANDOS.length;i++){ var c = COMANDOS[i]; if(cmd === c[0] || cmd.indexOf(c[0]+' ')===0){ try{ c[2](cmd.slice(c[0].length).trim(), say); }catch(e){ say('ERROR · ' + e.message, 'r', 12); errTone(); } return; } }
    say('ERROR 0x' + rh(4) + ' · COMANDO "' + cmd.slice(0, 20) + '" NO RECONOCIDO', 'r', 12); errTone();
  }
  conIn.addEventListener('input', function(){ conIn.value = conIn.value.toUpperCase().slice(0, 30); var tx = $('pfconTx'); if(tx && !CON.busy) tx.textContent = conOculta() ? conIn.value.replace(/./g, '•') : conIn.value; tone(2200, 2200, 0.01, 'square', 0.03); conScroll(); });
  conIn.addEventListener('keydown', function(e){
    e.stopPropagation();
    if(e.key === ' ' && CON.typing){ e.preventDefault(); conTapSkip(); return; }
    if(e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown'){ e.preventDefault(); var stp = /Page/.test(e.key) ? conOut.clientHeight*0.8 : 60; conOut.scrollTop += /Up/.test(e.key) ? -stp : stp; return; }
    if(e.key === 'Enter'){ e.preventDefault(); if(!CON.busy) conRun(conIn.value); else if(conIn.value.trim()){ CON.pend.push(conIn.value); conIn.value = ''; } }
    else if(e.key === 'Escape') closeConsole();
  });
  box.addEventListener('pointerdown', function(e){ if(e.target.id !== 'pfconX') conTapSkip(); });
  box.addEventListener('pointerup', function(e){ if(e.target.id === 'pfconX') return; try{ conIn.focus({ preventScroll:true }); }catch(x){} });
  box.addEventListener('mousedown', function(e){ if(e.target.id !== 'pfconX') e.preventDefault(); });
  box.addEventListener('click', function(e){ if(e.target.id === 'pfconX') return; try{ conIn.focus({ preventScroll:true }); }catch(x){} });
  conIn.addEventListener('blur', function(){ setTimeout(function(){ if(CON.on && (!document.activeElement || document.activeElement === document.body)){ try{ conIn.focus({ preventScroll:true }); }catch(x){} } }, 120); });
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
  function showDeny(tit, txt, cod){
    clearTimeout(denyT);
    if(typeof tit !== 'string') tit = 'ACCESO RESTRINGIDO';   // sin argumentos: el cartel de Ajustes (llave NFC)
    if(typeof txt !== 'string') txt = 'Ajustes solo se abre con la llave NFC autorizada.';
    var dh = deny.querySelector('h2'), dp = deny.querySelector('p');
    dh.textContent = tit; dh.setAttribute('data-t', tit); dp.textContent = txt;
    $('pfDenyCode').textContent = (typeof cod === 'string') ? ('ERR 0x' + rh(4) + ' · ' + cod) : ('ERR 0x' + rh(4) + ' · LLAVE NO DETECTADA · INCIDENCIA REGISTRADA');
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
