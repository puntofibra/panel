/* ===== CEREBRO DE LUCAS (sin IA, sin coste) ===== */
(function(){
  var B = window.LucasBrain = {};

  // ---------- utilidades ----------
  function fold(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[¿?¡!.,;:()"'«»]/g,' ').replace(/\s+/g,' ').trim(); }
  function digits(s){ return String(s||'').replace(/\D/g,''); }
  function alnum(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
  var lastPick = {};
var lastPicks = {};
  function pick(key, arr){ if(arr.length<2) return arr[0]; var h=lastPicks[key]||(lastPicks[key]=[]); var mem=Math.min(h.length, Math.max(1, Math.floor(arr.length/2))); var recent=h.slice(-mem); var libres=[]; for(var j=0;j<arr.length;j++) if(recent.indexOf(j)<0) libres.push(j); var i=libres.length?libres[Math.floor(Math.random()*libres.length)]:Math.floor(Math.random()*arr.length); h.push(i); if(h.length>20) h.shift(); lastPick[key]=i; return arr[i]; }
  function fill(t,o){ return String(t).replace(/\{(\w+)\}/g,function(_,k){ return o[k]!=null?o[k]:''; }); }
  function cap(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }
  function titleCase(s){ return String(s||'').toLowerCase().replace(/(^|\s)(\S)/g,function(m,a,b){ return a+b.toUpperCase(); }); }
  function plural(n,uno,varios){ return n===1?uno:varios; }
  function numU(n){ return n===1?'un':String(n); }     // «un contrato», nunca «1 contrato» ni «uno contratos»
  function compName(c){ c=String(c||'').trim(); return c.length<=3 ? c.toUpperCase() : titleCase(c); }

  var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var MES_IDX={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};
  var DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var NUM={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,quince:15,veinte:20,treinta:30};
  function toNum(w){ if(/^\d+$/.test(w)) return parseInt(w,10); return NUM[w]||0; }

  function d0(y,m,d){ return new Date(y,m,d,0,0,0,0); }
  function endOfMonth(y,m){ return new Date(y,m+1,0,23,59,59,999); }
  function monthRange(y,m){ var a=d0(y,m,1); return {from:a, to:endOfMonth(a.getFullYear(),a.getMonth()), label: MESES[a.getMonth()]+' de '+a.getFullYear(), y:a.getFullYear(), m:a.getMonth()}; }
  function dayRange(dt,label){ return {from:d0(dt.getFullYear(),dt.getMonth(),dt.getDate()), to:new Date(dt.getFullYear(),dt.getMonth(),dt.getDate(),23,59,59,999), label:label}; }
  function fmtD(dt){ return ('0'+dt.getDate()).slice(-2)+'/'+('0'+(dt.getMonth()+1)).slice(-2)+'/'+dt.getFullYear(); }
  function iso(dt){ return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2); }

  // ---------- fechas en lenguaje natural ----------
  function parseYear(t, now){
    var m = t.match(/\b(20\d\d)\b/); if(m) return parseInt(m[1],10);
    if(/\bano pasado\b|\bpasado ano\b/.test(t)) return now.getFullYear()-1;
    if(/\bano que viene\b|\bproximo ano\b/.test(t)) return now.getFullYear()+1;
    var m2 = t.match(/\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de |del )?(\d{2})\b(?!\d)/);
    if(m2) return 2000+parseInt(m2[1],10);
    return 0;
  }
  function parseDates(t, now){
    var y=now.getFullYear(), mo=now.getMonth(), m;
    var yr = parseYear(t, now);
    var MRE='(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)';

    if(/\banteayer\b/.test(t)){ var a=new Date(now); a.setDate(a.getDate()-2); return dayRange(a,'de anteayer'); }
    if(/\bayer\b/.test(t)){ var b=new Date(now); b.setDate(b.getDate()-1); return dayRange(b,'de ayer'); }
    if(/\bhoy\b|\bde este dia\b/.test(t)) return dayRange(now,'de hoy');

    // del 1 al 15 de enero (de 2025)
    m = t.match(new RegExp('\\b(?:del?|desde el)?\\s*(\\d{1,2})\\s+(?:al|a|hasta el)\\s+(\\d{1,2})\\s+de\\s+'+MRE));
    if(m){ var mi=MES_IDX[m[3]], yy=yr||y; return {from:d0(yy,mi,+m[1]), to:new Date(yy,mi,+m[2],23,59,59,999), label:'del '+m[1]+' al '+m[2]+' de '+MESES[mi]+' de '+yy}; }
    // fecha exacta 15/01/2025 o 15-01
    m = t.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
    if(m && +m[2]>=1 && +m[2]<=12){ var yy2 = m[3] ? (m[3].length===2?2000+(+m[3]):+m[3]) : y; var dd=d0(yy2,+m[2]-1,+m[1]); return dayRange(dd,'del '+fmtD(dd)); }
    // el 15 de enero
    m = t.match(new RegExp('\\b(?:el|dia)\\s+(\\d{1,2})\\s+de\\s+'+MRE));
    if(m){ var dd2=d0(yr||y,MES_IDX[m[2]],+m[1]); return dayRange(dd2,'del '+m[1]+' de '+MESES[MES_IDX[m[2]]]+' de '+dd2.getFullYear()); }
    // varios meses sueltos: «septiembre y octubre», «septiembre, octubre y noviembre», «enero y marzo» (solo esos meses)
    var mmAll = t.match(new RegExp('\\b'+MRE+'\\b','g'));
    var esSpan = new RegExp('\\b(?:de|desde)\\s+'+MRE+'\\s+(?:a|hasta)\\s+'+MRE+'|\\bentre\\s+'+MRE+'\\s+y\\s+'+MRE).test(t);
    if(mmAll && !esSpan){
      var lst=[]; mmAll.forEach(function(w){ var ix=MES_IDX[w]; if(lst.indexOf(ix)<0) lst.push(ix); });
      if(lst.length>=2){
        var Y0 = yr||y, yy4=Y0, prevM=-1, items=[];
        lst.forEach(function(ix){ if(prevM>=0 && ix<prevM) yy4++; items.push({y:yy4, m:ix}); prevM=ix; });
        var last=items[items.length-1];
        if(!yr && yy4>Y0 && d0(last.y,last.m,1).getTime()>now.getTime()) items.forEach(function(o){ o.y--; });
        var first=items[0]; last=items[items.length-1];
        var keys=items.map(function(o){ return o.y+'-'+o.m; });
        var nombres=items.map(function(o){ return MESES[o.m]; });
        var lbl='de '+nombres.slice(0,-1).join(', ')+' y '+nombres[nombres.length-1];
        if(first.y!==y || last.y!==y) lbl += (first.y===last.y ? ' de '+first.y : ' ('+first.y+'-'+last.y+')');
        return { from:d0(first.y,first.m,1), to:endOfMonth(last.y,last.m), label:lbl, meses:keys };
      }
    }
    // de enero a marzo / entre enero y marzo
    m = t.match(new RegExp('\\b(?:de|desde)\\s+'+MRE+'\\s+(?:a|hasta)\\s+'+MRE)) || t.match(new RegExp('\\b(?:entre)\\s+'+MRE+'\\s+(?:y)\\s+'+MRE));
    if(m){ var yy3=yr||y, a1=MES_IDX[m[1]], a2=MES_IDX[m[2]]; var yA = a1>a2 ? yy3-1 : yy3; return {from:d0(yA,a1,1), to:endOfMonth(yy3,a2), label:'de '+MESES[a1]+' a '+MESES[a2]+' de '+yy3}; }
    // trimestres
    m = t.match(/\b(primer|1er|1|segundo|2|tercer|3er|3|cuarto|4)\s*(?:o\s*)?trimestre\b/);
    if(m){ var q={primer:0,'1er':0,'1':0,segundo:1,'2':1,tercer:2,'3er':2,'3':2,cuarto:3,'4':3}[m[1]]; var yq=yr||y; return {from:d0(yq,q*3,1), to:endOfMonth(yq,q*3+2), label:'del '+['primer','segundo','tercer','cuarto'][q]+' trimestre de '+yq}; }
    if(/\beste trimestre\b|\btrimestre actual\b/.test(t)){ var qa=Math.floor(mo/3); return {from:d0(y,qa*3,1), to:endOfMonth(y,qa*3+2), label:'de este trimestre'}; }
    // hace N meses / ultimo mes / mes pasado
    m = t.match(/\bhace\s+(\w+)\s+mes(?:es)?\b/);
    if(m){ var n=toNum(m[1])||1; var r=monthRange(y,mo-n); r.label='de hace '+n+' '+plural(n,'mes','meses')+' ('+r.label+')'; return r; }
    m = t.match(/\bultim[oa]s\s+(\w+)\s+dias\b/);
    if(m){ var nd=toNum(m[1])||7; var f=new Date(now); f.setDate(f.getDate()-(nd-1)); return {from:d0(f.getFullYear(),f.getMonth(),f.getDate()), to:new Date(y,mo,now.getDate(),23,59,59,999), label:'de los últimos '+nd+' días'}; }
    m = t.match(/\bultim[oa]s\s+(\w+)\s+meses\b/);
    if(m){ var nm=toNum(m[1])||3; return {from:d0(y,mo-(nm-1),1), to:new Date(y,mo,now.getDate(),23,59,59,999), label:'de los últimos '+nm+' meses'}; }
    if(/\b(mes pasado|ultimo mes|mes anterior|pasado mes)\b/.test(t)){ var rp=monthRange(y,mo-1); rp.label='del mes pasado ('+rp.label+')'; return rp; }
    if(/\b(este mes|mes actual|en el mes|del mes|lo que va de mes)\b/.test(t)){ var rc=monthRange(y,mo); rc.label='de este mes'; return rc; }
    if(/\b(ultima semana|esta ultima semana|ultimos siete dias|ultimos 7 dias)\b/.test(t)){ var f7=new Date(now); f7.setDate(f7.getDate()-6); return {from:d0(f7.getFullYear(),f7.getMonth(),f7.getDate()), to:new Date(y,mo,now.getDate(),23,59,59,999), label:'de la última semana (últimos 7 días)'}; }
    if(/\b(semana pasada|pasada semana|semana anterior)\b/.test(t)){ var wd=(now.getDay()+6)%7; var mon=d0(y,mo,now.getDate()-wd-7); return {from:mon, to:new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6,23,59,59,999), label:'de la semana pasada'}; }
    if(/\b(esta semana|semana actual)\b/.test(t)){ var wd2=(now.getDay()+6)%7; return {from:d0(y,mo,now.getDate()-wd2), to:new Date(y,mo,now.getDate(),23,59,59,999), label:'de esta semana'}; }
    // mes con nombre (+ año)
    m = t.match(new RegExp('\\b'+MRE+'\\b'));
    if(m){ var r2=monthRange(yr||y, MES_IDX[m[1]]); r2.label = 'de '+MESES[MES_IDX[m[1]]]+(yr && yr!==y ? ' de '+yr : ''); return r2; }
    // año suelto
    if(/\beste ano\b|\ben lo que va de ano\b/.test(t)) return {from:d0(y,0,1), to:endOfMonth(y,11), label:'de este año'};
    if(yr) return {from:d0(yr,0,1), to:endOfMonth(yr,11), label:(yr===y-1?'del año pasado ('+yr+')':'de '+yr)};
    return null;
  }

  // ---------- datos del panel ----------
  function contratos(){ try{ return (typeof CONTRATOS!=='undefined' && CONTRATOS) ? CONTRATOS : []; }catch(e){ return []; } }
  function enMeses(k, r){ if(!r || !r.meses) return true; var d=new Date(k); return r.meses.indexOf(d.getFullYear()+'-'+d.getMonth())>=0; }
  function ts(v){ try{ return dateToTS(v); }catch(e){ return 0; } }
  function companies(){
    var seen={}, out=[];
    contratos().forEach(function(it){ var c=String(it['2']||'').trim(); if(c && !seen[c.toUpperCase()]){ seen[c.toUpperCase()]=1; out.push(c); } });
    return out;
  }
  var COMP_ALIAS={ 'mas movil':'masmovil','mas-movil':'masmovil','masmobil':'masmovil','jaztel':'jazztel','simio':'simyo','o dos':'o2','movistar':'movistar','vodafon':'vodafone','orange':'orange','yoigo':'yoigo','lowi':'lowi','digi':'digi','pepephone':'pepephone','finetwork':'finetwork' };
  function findCompanies(t){
    var tn=' '+t+' ', tns=t.replace(/\s/g,''), out=[];
    Object.keys(COMP_ALIAS).forEach(function(a){ if(tn.indexOf(' '+a+' ')>=0) tns+=' '+COMP_ALIAS[a]; });
    companies().forEach(function(c){
      var f=fold(c), fs=f.replace(/[\s\-]/g,'');
      if(!fs) return;
      var hit = fs.length<=2 ? new RegExp('\\b'+fs+'\\b').test(t) : (tns.indexOf(fs)>=0 || tn.indexOf(' '+f+' ')>=0);
      if(hit) out.push(c);
    });
    return out;
  }

  // ---------- vocabulario ----------
  var STOP = ('vip vips ciclo fibra fibras pausa pausar pausarlos pausarlas pausados pausadas pendiente pendientes baja bajas dar toca tocan quitar falta faltan instalar instalados instaladas instalado instalada instalacion instalaciones sin por poner a al algo algun alguna algunos ahora anda ano anos asi aqui ayer anteayer busca buscame buscar buscarme cliente clientes con contrato contratos cuanto cuantos cuanta cuantas cual cuales da dame de del desde dia dias dime documento dni el ella en ensena ensename ensenar entre es esa ese eso esos esta este esto estos ha han has hace hacer he hecho hechos hemos hicieron hizo hoy hubo hay iban la las le les lista listado listame llevo llevamos llevas lo los lucas me mes meses mi mis muestra muestrame mostrar movil nie numero o para pasado pasada pon ponme por porfa porfavor favor puedes podrias que quiero quisiera rapido saca sacame sacar se semana si sin solo solamente su sus tal te tengo tenemos tiene tienen todo todos toda todas total trae traeme tu un una uno unos ultimo ultimos ultima ver vamos y ya filtra filtrame filtrar filtro filtros abre abreme enseñame solicitud solicitudes alta altas cuenta cuentas bancaria numero telefono telefonos termina terminan terminada terminado acaba acaban acabada finaliza finalizan finalizada acabe termine finalice acabado finalizado empiece empieza ' +
    'necesito mira mirame consulta busqueda encuentra encuentrame nombre nombres llamado llamada llama persona personas gente hola buenas buenos noches tardes dias gracias anterior actual va como quien donde cuando hacia trimestre primer segundo tercer cuarto').split(' ');
  var STOPSET={}; STOP.forEach(function(w){ STOPSET[w]=1; }); MESES.concat(['setiembre']).forEach(function(w){ STOPSET[w]=1; }); Object.keys(NUM).forEach(function(w){ STOPSET[w]=1; });

  // ---------- respuestas variadas ----------
  function saludoHora(now){ var h=now.getHours(); return h>=6&&h<13?'Buenos días':(h>=13&&h<21?'Buenas tardes':'Buenas noches'); }
  function franja(h){ return h>=6&&h<12?'de la mañana':(h>=12&&h<14?'del mediodía':(h>=14&&h<21?'de la tarde':'de la noche')); }
  function horaTxt(now){ var h=now.getHours(), mi=('0'+now.getMinutes()).slice(-2), h12=h%12||12; return (h12===1?'la ':'las ')+h12+':'+mi+' '+franja(h); }
  B.greet = function(first){
    var now=new Date(), s=saludoHora(now), h=now.getHours(), dow=now.getDay();
    var base=[ '{s}. ¿En qué te puedo ayudar?', '{s}. ¿Qué necesitas?', '{s}, aquí estoy. Dime qué buscamos.', '{s}. Soy Lucas, ¿qué te saco hoy?', '¡{s}! ¿Qué quieres que mire?', '{s}. Listo para trabajar, ¿qué hacemos?', '{s}. Pídeme lo que quieras: contratos, clientes, borradores…', '¡Hola! {s}. ¿Por dónde empezamos?' ];
    var txt=fill(pick('greet',base),{s:s});
    var extra=[];
    if(h>=22||h<6) extra=['¿Todavía trabajando? Eres una máquina.','Vaya horas… vamos a por ello.'];
    else if(dow===1 && h<13) extra=['Lunes otra vez, ¡a por la semana!'];
    else if(dow===5 && h>=13) extra=['Viernes por la tarde, ya casi lo tienes.'];
    if(extra.length && Math.random()<0.5) txt+=' '+pick('greetx',extra);
    if(first) txt += ' ' + pick('greet1',['Puedes pedirme, por ejemplo, «muéstrame los contratos de enero».','Prueba con algo como «contratos para cambiar este mes».','Por ejemplo: «cuántos contratos llevo este mes de Simyo».']);
    return txt;
  };
  var NO_ENTIENDO=[ 'Mmm, esa no la he pillado. ¿Me lo dices de otra forma?', 'Perdona, no he entendido la pregunta. Prueba con algo como «contratos de enero».', 'Ups, eso todavía no lo sé hacer. ¿Lo reformulas?', 'No estoy seguro de qué me pides. Puedo buscar contratos por fechas, clientes, cuentas o compañías.', 'Esa se me escapa. Dímelo con otras palabras y lo intento.', 'Me he quedado pensando… y no lo entiendo. ¿Me das una pista?', 'Todavía estoy aprendiendo y esa no me la sé. Escribe «ayuda» y te digo lo que sé hacer.', 'No te he entendido bien. ¿Quieres que busque contratos, clientes o borradores?' ];
  var AQUI=[ 'Aquí tienes {n} {c} {d}.', 'Listo: {n} {c} {d}.', 'He encontrado {n} {c} {d}.', 'Ahí tienes: {n} {c} {d}.', 'Te muestro {n} {c} {d}.', 'Hecho. {N} {c} {d}.' ];
  var NADA=[ 'No he encontrado ningún contrato {d}.', 'No hay contratos {d}.', 'Nada por aquí: cero contratos {d}.', 'He buscado bien y no aparece ningún contrato {d}.' ];
  var CUANTOS=[ 'Llevas {n} {c} {d}.', 'En total hay {n} {c} {d}.', 'Te cuento: {n} {c} {d}.', 'La cuenta sale así: {n} {c} {d}.', 'He contado {n} {c} {d}.' ];

  // ---------- mostrar en la tabla ----------
  function ensureContratos(cb){
    try{
      var v=document.getElementById('view-contratos');
      if(v && v.classList.contains('hidden') && typeof goView==='function') goView('contratos');
    }catch(e){}
    if(contratos().length) return cb();
    if(typeof loadContratos==='function'){ try{ loadContratos(function(){ cb(); }); return; }catch(e){} }
    cb();
  }
  // filtros por estado (col 44) y fibra/instalacion
  function esDoblePausa(it){ return (String(it['44']||'').match(/⏸/g)||[]).length>=2; }
  function tieneFibra(it){ var n=parseFloat(String(it['16']==null?'':it['16']).trim().replace(',','.')); return !isNaN(n) && n>=1; }
  function tieneFechaInst(it){ var v=it['15']; if(v instanceof Date) return !isNaN(v.getTime()); var s=String(v==null?'':v); return /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(s) || /\b\d{4}-\d{1,2}-\d{1,2}/.test(s); }
  function modoOK(it, mode){
    var s=String(it['44']||'');
    if(mode==='instalar') return tieneFibra(it) && !tieneFechaInst(it);
    if(mode==='baja') return s.indexOf('❌')<0;                         // todos menos los ❌ (los ⏸️⏸️ se preguntan)
    return s.indexOf('❌')<0 && s.indexOf('⏸')<0;                      // pausa / cambiar: fuera ❌, ⏸️ y ⏸️⏸️
  }
  B._bajaAsk = null;
  B._baja2P = function(si, done){
    var a=B._bajaAsk; B._bajaAsk=null;
    if(!a) return done({ say: pick('b2pX',['Esa pregunta ya ha caducado. Pídeme otra vez los contratos para dar de baja.','Ya no tengo esa lista a mano, vuelve a pedírmela.']) });
    if(!si) return done({ say: pick('b2pN',['Vale, los dejo todos en pantalla.','Perfecto, no quito ninguno.','De acuerdo, se quedan también los pausados por segunda vez.']) });
    B._bajaLast = a;
    var l=a.list.filter(function(it){ return !esDoblePausa(it); });
    render(l, a.range);
    return done({ say: fill(pick('b2pS',['Hecho. Quedan {n} {c} pendientes de dar de baja, sin los pausados por segunda vez.','Listo, quitados. Ahora ves {n} {c}.','Fuera los de segunda pausa: te quedan {n} {c} por dar de baja.']),{n:numU(l.length),c:plural(l.length,'contrato','contratos')}), buttons:[{t:'👁️ Volver a mostrar', v:'baja2P:ver'}] });
  };
  B._bajaLast = null;
  B._bajaToggle = function(quitar, done){
    var a=B._bajaLast;
    if(!a) return done({ say: pick('b2pX2',['Ya no tengo esa lista a mano. Pídeme otra vez los contratos para dar de baja.','Se me ha perdido esa lista, vuelve a pedírmela.']) });
    var l = quitar ? a.list.filter(function(it){ return !esDoblePausa(it); }) : a.list.slice();
    render(l, a.range);
    var c = plural(l.length,'contrato','contratos');
    if(quitar) return done({ say: fill(pick('b2pQ',['Quitados otra vez. Ves {n} {c}.','Hecho, fuera de nuevo los de segunda pausa: {n} {c}.','Listo, borrados de la pantalla otra vez. Quedan {n} {c}.']),{n:numU(l.length),c:c}), buttons:[{t:'👁️ Volver a mostrar', v:'baja2P:ver'}] });
    return done({ say: fill(pick('b2pV',['Ahí los tienes otra vez: {n} {c}, con los pausados por segunda vez.','Vueltos a mostrar. Ves {n} {c}.','Listo, otra vez todos: {n} {c}.']),{n:numU(l.length),c:c}), buttons:[{t:'🗑️ Borrar de nuevo', v:'baja2P:quitar'}] });
  };
  function render(list, range){
    try{
      var df=document.getElementById('dateFrom'), dt=document.getElementById('dateTo'), q=document.getElementById('q');
      if(q) q.value='';
      if(df) df.value = range ? iso(range.from) : '';
      if(dt) dt.value = range ? iso(range.to) : '';
      FILTERED = list.map(function(it){ var o={}; for(var k in it) o[k]=it[k]; if(o['14']) o['14']=formatDateDDMMYYYY(o['14']); if(o['15']) o['15']=formatDateDDMMYYYY(o['15']); return o; });
      try{ sortFilteredBySolicitud(); }catch(e){}
      PAGE=1; renderContratosPage();
      try{ document.getElementById('view-contratos').scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
    }catch(e){ console.error('[Lucas] render', e); }
  }
  B._lastClients=null;

  // ---------- motor de contratos ----------
  function contratoQuery(t, raw, now, ctx){
    // ciclo (ID 29): se quita del texto para que el número no se lea como fecha
    var ciclo = null;
    var cM = t.match(/\bciclo (de )?(\d{1,2}|uno|veinte)\b/);
    if(cM){ ciclo = cM[2]==='uno' ? '1' : (cM[2]==='veinte' ? '20' : String(parseInt(cM[2],10))); t = t.replace(cM[0],' ').replace(/\s+/g,' ').trim(); }
    var vip = /\bvips?\b/.test(t);
    var range = parseDates(t, now);
    var comps = findCompanies(t);
    var mode = null;   // 'cambiar' | 'pausa' | 'baja' | 'instalar'
    if(/\bcambi(ar|o|os)\b|\bcambio de (titular|nombre)\b/.test(t)) mode='cambiar';
    if(/\bpausar(los|las|les)?\b|\b(pendientes?|para|sin|falta\w*|toca\w*|hay que|tengo que)( de)? (poner (en )?)?pausa\b|\bponer(los|las|les)? (en )?pausa\b|\bdar(les)? (la )?pausa\b/.test(t)) mode='pausa';
    if(/\bdar(los|las)? de baja\b|\bbajas?\b|\bdar baja\b/.test(t)) mode='baja';
    if(/\b(pendientes?|sin|por|falta\w*|queda\w*)( de)? instal\w*|\bno (estan |esta )?instalad[oa]s?\b/.test(t)) mode='instalar';
    var count = /\bcuant[oa]s\b|\bnumero de\b|\btotal de\b|\bcuenta(me)? cuantos\b/.test(t);

    // documento / cuenta / telefono
    var up = raw.toUpperCase();
    var dniM = up.match(/\b([XYZ]\d{7}[A-Z]|\d{8}[A-Z])\b/);
    var ibanFull = null, ibanEnd = null, tel = null;
    var endM = t.match(/\b(?:termin\w*|acab\w*|finaliz\w*)\s+(?:en|por|con)?\s*([\d\s]{3,})/);
    if(endM){ ibanEnd = digits(endM[1]); }
    var ibanM = up.replace(/\s+/g,'').match(/ES\d{6,22}/) ;
    if(ibanM && !ibanEnd) ibanFull = alnum(ibanM[0]);
    if(!ibanFull && !ibanEnd){ var longD = t.match(/\b\d[\d ]{11,}\d\b/); if(longD) ibanFull = digits(longD[0]); }
    var telM = t.replace(/(\d) (?=\d)/g,'$1').match(/\b[6789]\d{8}\b/);
    if(telM && !ibanFull && !ibanEnd) tel = telM[0];

    // modos especiales: rango por meses atras
    if(mode==='pausa' || mode==='baja'){
      var backM = mode==='pausa'?3:6;
      var refD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if(range && range.m!=null && !(range.m===now.getMonth() && range.y===now.getFullYear())) refD = new Date(range.y, range.m+1, 0); // hasta final de ese mes
      var tY = refD.getFullYear(), tM = refD.getMonth()-backM; while(tM<0){ tM+=12; tY--; }
      var tD = Math.min(refD.getDate(), new Date(tY, tM+1, 0).getDate());
      var hastaD = new Date(tY, tM, tD, 23,59,59,999);
      var minK = 0; contratos().forEach(function(it){ var k=ts(it['14']); if(k && (!minK || k<minK)) minK=k; });
      range = { from: minK ? new Date(minK) : d0(2000,0,1), to: hastaD, label: 'hasta el '+fmtD(hastaD) };
    }
    else if(mode==='cambiar'){
      var back = 3;
      var baseM = now.getMonth(), baseY=now.getFullYear();
      var targetTxt = 'este mes';
      if(range && range.m!=null){ baseM = range.m; baseY = range.y; if(!(range.m===now.getMonth() && range.y===now.getFullYear())) targetTxt = 'en '+MESES[range.m]; } // mes en el que toca cambiar / dar de baja
      var mr = monthRange(baseY, baseM - back);
      mr.target = targetTxt;
      range = mr;
    }

    // nombre: palabras que no son vocabulario
    var nameTokens = [];
    t.split(' ').forEach(function(w){ if(w.length>=3 && /^[a-zñ]+$/.test(w) && !STOPSET[w]) nameTokens.push(w); });
    comps.forEach(function(c){ fold(c).split(/[\s\-]+/).forEach(function(p){ nameTokens = nameTokens.filter(function(x){ return x!==p && p.indexOf(x)<0; }); }); });
    Object.keys(COMP_ALIAS).forEach(function(a){ a.split(' ').forEach(function(p){ nameTokens = nameTokens.filter(function(x){ return x!==p; }); }); });

    var base = contratos().slice();
    if(range){ var f=range.from.getTime(), to=range.to.getTime(); base = base.filter(function(it){ var k=ts(it['14']); return k && k>=f && k<=to && enMeses(k, range); }); }
    if(comps.length){ var cs=comps.map(function(c){ return c.toUpperCase().trim(); }); base = base.filter(function(it){ return cs.indexOf(String(it['2']||'').toUpperCase().trim())>=0; }); }
    if(mode){ base = base.filter(function(it){ return modoOK(it, mode); }); }
    if(vip){
      base = base.filter(function(it){ return String(it['50']||'').trim()==='1'; });
      var best={}, ordenV=[];
      base.forEach(function(it){ var doc=alnum(it['20']); var key=doc||('__'+fold(it['21'])+'_'+Math.random()); var k=ts(it['14']); if(!best[key]){ best[key]=it; ordenV.push(key); } else if(k>=ts(best[key]['14'])) best[key]=it; });
      base = ordenV.map(function(k){ return best[k]; });
    }
    if(ciclo){ base = base.filter(function(it){ return String(it['29']==null?'':it['29']).trim()===ciclo; }); }
    // pausa / baja: preguntar si solo los que tienen fibra o todos
    var fibChoice = B._fibChoice || (/\bfibras?\b/.test(t) ? 'fibra' : null); B._fibChoice = null;
    if((mode==='pausa' || mode==='baja') && !fibChoice){
      B._fibAsk = { t:t, raw:raw, at:Date.now() };
      var qq = mode==='pausa' ? 'pausar' : 'dar de baja';
      return { say: fill(pick('fibQ',['¿Quieres ver solo los que tienen fibra o todos los pendientes de {q}?','Antes de enseñártelos: ¿solo los que tienen fibra, o todos?','¿Te saco solo los contratos con fibra o todos los pendientes de {q}?','Una pregunta: ¿los que tienen fibra nada más, o todos?']),{q:qq}), buttons:[{t:'🛜 Solo con fibra', v:'fib:fibra'},{t:'📋 Todos', v:'fib:todos'}] };
    }
    if(fibChoice==='fibra' && mode!=='instalar') base = base.filter(tieneFibra);
    var doblePausa = (mode==='baja') ? base.filter(function(it){ return esDoblePausa(it); }).length : 0;
    if(dniM){ var dn=dniM[1]; base = base.filter(function(it){ return alnum(it['20'])===dn; }); }
    if(ibanFull){ base = base.filter(function(it){ var a=alnum(it['24']); return a && (a===ibanFull || a.indexOf(ibanFull)>=0 || digits(a).indexOf(digits(ibanFull))>=0); }); }
    if(ibanEnd){ base = base.filter(function(it){ var a=digits(it['24']); return a && a.slice(-ibanEnd.length)===ibanEnd; }); }
    if(tel){ base = base.filter(function(it){ return digits(it['22']).indexOf(tel)>=0; }); }

    var nameUsed = null;
    if(nameTokens.length){
      var byName = base.filter(function(it){ var n=fold(it['21']); return nameTokens.every(function(tk){ return (' '+n+' ').indexOf(' '+tk)>=0; }); });
      if(byName.length){ base = byName; nameUsed = nameTokens.join(' '); }
      else {
        // ¿quizá alguna palabra si es nombre?
        var some = base.filter(function(it){ var n=fold(it['21']); return nameTokens.some(function(tk){ return (' '+n+' ').indexOf(' '+tk)>=0; }); });
        var hasOther = range||comps.length||mode||vip||ciclo||dniM||ibanFull||ibanEnd||tel;
        if(!hasOther && !ctx.contractWords){
          return { notUnderstood:true };
        }
        if(!hasOther){ return { say: fill(pick('noname',['No encuentro ningún cliente que se llame «{n}».','No me sale nadie con el nombre «{n}». ¿Lo has escrito bien?','Ningún contrato a nombre de «{n}», lo siento.']),{n:titleCase(nameTokens.join(' '))}) }; }
        if(some.length && nameTokens.length>1){ base=some; nameUsed=nameTokens.join(' '); }
      }
    }

    // descripcion
    var d=[];
    if(comps.length) d.push('de '+comps.map(compName).join(' y '));
    if(mode==='cambiar') d.push('para cambiar '+range.target+' (solicitados en '+range.label+')');
    else if(mode==='baja') d.push('pendientes de dar de baja hasta la fecha (solicitados '+range.label+')');
    else if(mode==='pausa') d.push('pendientes de pausar hasta la fecha (solicitados '+range.label+')');
    else if(mode==='instalar'){ d.push('pendientes de instalar'); if(range) d.push(range.label); }
    else if(range) d.push(range.label);
    if(fibChoice==='fibra' && mode!=='instalar') d.push('con fibra');
    if(vip) d.push('de clientes VIP'+(ciclo?' de ciclo '+ciclo:''));
    else if(ciclo) d.push('de ciclo '+ciclo);
    if(nameUsed) d.push('de '+titleCase(nameUsed));
    if(dniM) d.push('del documento '+dniM[1]);
    if(ibanFull) d.push('con ese número de cuenta');
    if(ibanEnd) d.push('con la cuenta terminada en '+ibanEnd);
    if(tel) d.push('con el teléfono '+tel);
    var desc = d.join(' ');
    var n = base.length;
    var cword = plural(n,'contrato','contratos');

    // varios clientes con el mismo nombre
    if(nameUsed && !dniM){
      var groups={}, order=[];
      base.forEach(function(it){ var k=alnum(it['20'])||('?'+fold(it['21'])); if(!groups[k]){ groups[k]={doc:String(it['20']||'').trim(), nombre:String(it['21']||'').trim(), n:0}; order.push(k); } groups[k].n++; });
      if(order.length>1){
        render(base, range);
        B._lastClients = { list: order.map(function(k){ return groups[k]; }), range: range, comps: comps, mode: mode };
        return { say: fill(pick('multi',['He encontrado {k} clientes distintos con el nombre {nm}. ¿Cuál de ellos quieres?','Ojo, hay {k} clientes que se llaman {nm}. Te los dejo aquí para que elijas.','Tengo {k} personas diferentes con el nombre {nm}. Dime cuál es.']),{k:order.length,nm:titleCase(nameUsed)}), clients: B._lastClients.list };
      }
    }

    if(!n){ render(base, range); return { say: fill(pick('nada',NADA),{d:desc||'con esos datos'}) }; }
    render(base, range);
    if(count){
      var D = desc ? cap(desc) : 'Ahora mismo';
      return { say: fill(pick('cuantos',CUANTOS),{n:numU(n),c:cword,d:desc||'en total',D:D}) };
    }
    if(vip && !count){
      var dv = ciclo ? ' de ciclo '+ciclo : '';
      if(!n){ render(base, range); return { say: fill(pick('vip0',['No tienes ningún cliente VIP{d}.','No me sale ningún VIP{d}.','Cero clientes VIP{d}, por ahora.']),{d:dv}) }; }
      render(base, range);
      return { say: fill(pick('vipL',['Aquí tienes tus {n} clientes VIP{d}, con su contrato más reciente.','Te enseño {n} clientes VIP{d}: uno por cliente, el último que hicieron.','Listo: {n} VIP{d}, un contrato por documento, el más nuevo.','Ahí van tus {n} clientes VIP{d}, solo el contrato más reciente de cada uno.']),{n:numU(n),d:dv}) };
    }
    if(mode==='baja' && doblePausa){
      B._bajaAsk = { list: base, range: range, t: Date.now() };
      var fibTxt = fibChoice==='fibra' ? ' con fibra' : '';
      var preg = fill(pick('bajaQ',['Estos son los contratos pendientes de dar de baja hasta la fecha: {n} {c}. De ellos, {k} siguen pausados por segunda vez. ¿Quieres que los quite de la lista?','Te enseño los pendientes de dar de baja hasta hoy: {n} {c}. Hay {k} que aún están pausados por segunda vez, ¿los quito de la pantalla?','Pendientes de baja hasta la fecha: {n} {c}. Ojo, {k} están todavía en segunda pausa. ¿Quieres que no te los muestre?']),{n:numU(n),c:cword+fibTxt,k:numU(doblePausa)});
      return { say: preg, buttons:[{t:'✅ Sí',v:'baja2P:si'},{t:'❌ No',v:'baja2P:no'}] };
    }
    if(!desc) return { say: pick('todos',['Aquí tienes todos los contratos.','Te enseño todos los contratos.','Listo, todos los contratos a la vista.']) };
    return { say: fill(pick('aqui',AQUI),{n:numU(n),N:(n===1?'Un':n),c:cword,d:desc}) };
  }

  // ---------- borradores ----------
  function blinkCount(){ var el=document.getElementById('countBorradores'); var n=parseInt(el?el.textContent:'0',10); return isNaN(n)?0:n; }
  B.blinkCount = blinkCount;
  function borradores(t, done){
    var p=blinkCount();
    var fin=function(total){
      var txt;
      var hoyTxt = p===0 ? pick('b0',['y para hoy no te queda ninguno pendiente','y hoy ya no tienes ninguno pendiente']) : (p===1 ? pick('b1',['y para hoy te queda uno pendiente','y hoy solo te queda uno por hacer']) : fill(pick('bn',['y para hoy te quedan {p} pendientes','y hoy te quedan {p} por hacer']),{p:p}));
      if(total==null) txt = p===0 ? 'Para hoy no te queda ningún borrador pendiente.' : (p===1 ? pick('bp1',['Para hoy te queda un borrador pendiente de hacer.','Hoy tienes uno pendiente por hacer.']) : fill(pick('bp',['Para hoy te quedan {p} borradores pendientes de hacer.','Hoy tienes {p} pendientes por hacer.']),{p:p}));
      else { var tTxt = total===1 ? 'un borrador' : total+' borradores'; txt = fill(pick('bt',['Tienes {t} en total, {h}.','En borradores tienes {t}, {h}.','Hay {t} en total, {h}.']),{t:tTxt,h:hoyTxt}); }
      if(/\b(muestra|ensena|abre|ver|llevame|ir a|ve a)\w*/.test(t) && typeof goView==='function'){ try{ goView('borradores'); }catch(e){} }
      done({ say: txt });
    };
    try{
      if(typeof BORRADORES!=='undefined' && BORRADORES && BORRADORES.length) return fin(BORRADORES.length);
    }catch(e){}
    try{
      google.script.run.withSuccessHandler(function(res){ fin(res && res.items ? res.items.length : null); }).withFailureHandler(function(){ fin(null); }).apiGetContratos('borradores');
    }catch(e){ fin(null); }
  }

  // ---------- charla ----------
  function smallTalk(t, now){
    if(/\b(gracias|muchas gracias|te lo agradezco|genial gracias|mil gracias)\b/.test(t)) return pick('thx',['¡De nada! Aquí estoy para lo que necesites.','Para eso estoy.','¡Un placer!','No hay de qué. ¿Algo más?','A mandar.']);
    if(/^(adios|adeu|hasta luego|hasta manana|hasta pronto|hasta la vista|hasta otra|hasta ahora|hasta despues|chao|chau|ciao|xao|bye|bye bye|agur|nos vemos|me voy|me piro|me marcho|bueno me voy|venga me voy|hasta el lunes|buen finde|feliz finde|que descanses)\b/.test(t)) return B.bye(now);
    if(/\b(quien eres|como te llamas|que eres|tu nombre)\b/.test(t)) return pick('who',['Soy Lucas, el asistente de Puntofibra. Busco contratos, clientes y te recuerdo lo pendiente.','Me llamo Lucas, tu robot ayudante. Pídeme contratos por fechas, clientes o compañías.','Lucas, para servirte. Mi especialidad: encontrar contratos en un segundo.']);
    if(/\b(como estas|que tal estas|como vas|que tal te va|como andas)\b/.test(t)) return pick('how',['¡Con las pilas cargadas al cien por cien!','Muy bien, engrasado y listo. ¿Y tú?','Funcionando perfectamente, gracias por preguntar.','De maravilla, sin un solo cortocircuito.']);
    if(/\bque hora es\b|\bhora es\b|\bdime la hora\b/.test(t)) return 'Son '+horaTxt(now)+'.';
    if(/\bque dia es\b|\ba que (dia )?estamos\b|\bque fecha es\b|\bfecha de hoy\b/.test(t)) return 'Hoy es '+DIAS[now.getDay()]+', '+now.getDate()+' de '+MESES[now.getMonth()]+' de '+now.getFullYear()+'.';
    if(/\b(chiste|algo gracioso|hazme reir)\b/.test(t)) return pick('joke',['¿Por qué el router fue al médico? Porque tenía mala conexión.','Mi fibra favorita es la óptica: nunca me deja colgado.','Le pedí a la nube que me guardara un secreto… y lo compartió con todo el mundo.','¿Qué le dice un cable a otro? Somos los mejores conductores.']);
    if(/\b(ayuda|que sabes hacer|que puedes hacer|que haces|como funcionas|comandos|instrucciones)\b/.test(t)) return '__AYUDA__';
    if(/\b(quita|quitame|limpia|limpiame|borra|resetea|elimina)\b.*\bfiltros?\b|\bsin filtros\b/.test(t)) return '__CLEAR__';
    return null;
  }
  B.bye = function(now){
    var h=now.getHours(), dow=now.getDay();
    var base=['¡Hasta luego! Que vaya bien.','Nos vemos. Aquí me quedo vigilando los borradores.','¡Chao! Cuídate.','Hasta pronto, aquí estaré.','¡Adiós! Ha sido un placer.','Venga, hasta luego. Yo no me muevo de aquí.','¡Nos vemos! Me quedo de guardia.','Hasta la próxima, jefe.','¡Ciao! Te espero por aquí.','Cuídate mucho. ¡Hasta otra!','Hasta ahora. Si pasa algo, te aviso.','¡Adiós, adiós! Lucas se queda al mando.'];
    var extra=[];
    if(h>=20||h<5) extra=['¡Buenas noches! Descansa, que te lo has ganado.','Que descanses. Mañana más.','¡Hasta mañana! Apago motores… bueno, no del todo.'];
    else if(h>=13 && h<16) extra=['¡Buen provecho! Nos vemos luego.','Que aproveche la comida. ¡Hasta luego!'];
    if(dow===5 && h>=13 || dow===6) extra=extra.concat(['¡Buen finde! Nos vemos el lunes.','Disfruta del fin de semana. ¡Hasta el lunes!']);
    var lista = base.concat(extra);
    return pick('bye', lista);
  };
  B.greetReply = function(t, now){
    now = now || new Date();
    var h=now.getHours(), dow=now.getDay();
    var dice = /\bbuenos dias\b|\bbuen dia\b/.test(t) ? 'Buenos días' : (/\bbuenas tardes\b/.test(t) ? 'Buenas tardes' : (/\bbuenas noches\b/.test(t) ? 'Buenas noches' : null));
    var horaS = (h>=6&&h<14) ? 'Buenos días' : ((h>=14&&h<21) ? 'Buenas tardes' : 'Buenas noches');
    var txt;
    if(dice){
      txt = fill(pick('gD',['¡{s}! ¿En qué te ayudo?','{s}. ¿Qué necesitas?','¡{s}! Aquí estoy, dime.','{s}, jefe. ¿Qué buscamos?','¡Muy {sl}! ¿Por dónde empezamos?','{s}. Lucas listo para trabajar.','¡{s} también para ti! ¿Qué te saco?','{s}. ¿Qué hacemos hoy?']),{s:dice, sl:dice.toLowerCase()});
    } else if(/^buenas\b/.test(t)){
      txt = pick('gB',['¡Buenas! ¿Qué necesitas?','¡Buenas, buenas! ¿Qué te saco?','Buenas. Aquí me tienes.','¡Muy buenas! ¿En qué te ayudo?','¡Buenas! Dime qué buscamos.','Buenas, jefe. ¿Qué hacemos?']);
    } else {
      txt = pick('gH',['¡Hola! ¿En qué te puedo ayudar?','¡Hola, hola! ¿Qué necesitas?','¡Hey! Aquí estoy.','¡Holaaa! ¿Qué buscamos hoy?','¡Hola! Lucas a tu servicio.','¿Qué tal? Dime qué te saco.','¡Hola! Me alegra verte. ¿Qué hacemos?','¡Ey! ¿Qué se te ofrece?','¡Hola! Listo para trabajar.','Hola, jefe. ¿Por dónde empezamos?','¡Saludos, humano! ¿En qué te ayudo?','¡Hola! Pídeme contratos, clientes o borradores.','¡Buenas! ¿Qué necesitas?','¡' + horaS + '! ¿Qué te saco?']);
    }
    var extra=[];
    if(h>=22||h<6) extra=['¿Todavía trabajando? Eres una máquina.','Vaya horas… vamos a por ello.'];
    else if(dow===1 && h<14) extra=['Lunes otra vez, ¡a por la semana!'];
    else if(dow===5 && h>=14) extra=['Viernes por la tarde, ya casi lo tienes.'];
    if(extra.length && Math.random()<0.4) txt+=' '+pick('greetx',extra);
    return txt;
  };
  B.greetPrefix = function(t, now){
    var h=(now||new Date()).getHours();
    if(/\bbuenos dias\b|\bbuen dia\b/.test(t)) return 'Buenos días';
    if(/\bbuenas tardes\b/.test(t)) return 'Buenas tardes';
    if(/\bbuenas noches\b/.test(t)) return 'Buenas noches';
    if(/^buenas\b/.test(t)) return pick('gpB',['¡Buenas!','Buenas']);
    return pick('gpH',['¡Hola!','Hola','¡Hey!','¡Hola, hola!']);
  };
  function isGreeting(t){ return /^(hola|holi|holaa+|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|saludos|que tal|que pasa|buen dia)\b/.test(t); }
  var CONTRACT_WORDS = /\b(contratos?|solicitud(es)?|altas?|clientes?|muestra\w*|ensena\w*|filtra\w*|busca\w*|saca\w*|dame|lista\w*|ver|ensenar|trae\w*|pon\w*|cuant[oa]s|llevo|llevamos|hicieron|hecho|hechos|cuenta|iban|dni|nie|telefono|cambiar|baja)\b/;

  // ---------- entrada principal ----------
  B.handle = function(raw, done){
    var now = new Date();
    var t = fold(raw);
    if(B.fichPending()){ return B._fichAnswer(done); }   // contestación al fichaje: cualquier respuesta vale
    if(B._fichFlow && B._fichFlow(fold(raw), done)) return;
    if(B._fibAsk){ if(Date.now()-B._fibAsk.at > 5*60000) B._fibAsk=null; else { var fa=fold(raw).trim(); if(/\bfibras?\b/.test(fa)) return B._fibAnswer('fibra', done); if(/^(todos|todas|todo|los dos|ambos|todos los contratos|da igual)\b/.test(fa)) return B._fibAnswer('todos', done); B._fibAsk=null; } }
    if(B._bajaAsk){ if(Date.now()-B._bajaAsk.t > 5*60000) B._bajaAsk=null; else { var yn=fold(raw).trim(); if(/^(si|sip|vale|ok|claro|venga|dale|quitalos|hazlo)\b/.test(yn)) return B._baja2P(true, done); if(/^(no|nop|dejalos|deja)\b/.test(yn)) return B._baja2P(false, done); B._bajaAsk=null; } }   // fichaje manual (Jorge / Maicol)
    if(!t){ return done({ say: pick('vacio',['Dime algo y lo busco.','¿Sí? Te escucho.']) }); }
    t = t.replace(/^(oye |eh |lucas |hey lucas |hola lucas |oye lucas )+/,'').trim();
    var greet = isGreeting(t) || /^lucas$/.test(t);
    var rest = t.replace(/^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|saludos|buen dia)( lucas)?\s*/,'').trim();

    var st = smallTalk(rest||t, now);
    if(st==='__CLEAR__'){ ensureContratos(function(){ try{ clearSearch(); }catch(e){ render(contratos(),null); } done({ say: pick('clear',['Filtros quitados. Ya ves todos los contratos.','Listo, tabla limpia.','Hecho, sin filtros.']) }); }); return; }
    if(st && typeof st==='string' && st==='__AYUDA__') return done({ say: pick('ayudaQ',['Aquí tienes los accesos rápidos. Pulsa uno y te lo saco:','Atajos rápidos, pulsa el que quieras:','Toma, accesos directos. Dale a uno:']), buttons: B.AYUDA_BTNS });
    if(st) return done({ say: st });

    if(/\bborrador/.test(rest||t)) return borradores(rest||t, done);

    var hasDate = !!parseDates(rest||t, now);
    var hasComp = findCompanies(rest||t).length>0;
    var ctx = { contractWords: CONTRACT_WORDS.test(rest||t) };
    if(greet && !rest) return done({ say: B.greetReply(t, now) });

    ensureContratos(function(){
      var r = contratoQuery(rest||t, raw, now, ctx);
      if(r.notUnderstood){
        if(greet) return done({ say: B.greetReply(t, now) });
        return done({ say: pick('noentiendo',NO_ENTIENDO) });
      }
      if(greet && r.say){ var gp=B.greetPrefix(t, now); r.say = gp+(/[!.]$/.test(gp)?' ':'. ')+r.say; }
      done(r);
    });
  };

  // accesos rápidos de «ayuda» (añadir aquí más botones: t = texto del botón, v = 'q:' + la frase que entiende Lucas)
  B.AYUDA_BTNS = [
    { t:'📉 Contratos para dar de baja', v:'q:muestrame los contratos para dar de baja' },
    { t:'⏸️ Contratos para pausar',      v:'q:muestrame los contratos para pausar' }
  ];
  // respuesta a «¿solo con fibra o todos?»
  B._fibAsk = null; B._fibChoice = null;
  B._fibAnswer = function(ch, done){
    var a=B._fibAsk; B._fibAsk=null;
    if(!a || Date.now()-a.at > 5*60000) return done({ say: pick('fibX',['Esa pregunta ya ha caducado. Pídemelo otra vez.','Se me ha pasado el momento, vuelve a pedírmelo.']) });
    ensureContratos(function(){ B._fibChoice = ch; var r = contratoQuery(a.t, a.raw, new Date(), { contractWords:true }); B._fibChoice = null; B._fibLast = { t:a.t, raw:a.raw, ch:ch }; var fb=fibBtn(); if(r && fb) r.buttons = (r.buttons||[]).concat(fb); done(r); });
  };
  // botón para cambiar entre «solo con fibra» y «todos» (va y vuelve)
  B._fibLast = null;
  function fibBtn(){ var f=B._fibLast; if(!f) return null; return f.ch==='fibra' ? { t:'📋 Mostrar todos', v:'fib2:todos' } : { t:'🛜 Mostrar solo con fibra', v:'fib2:fibra' }; }
  B._fibSwitch = function(ch, done){
    var f=B._fibLast;
    if(!f) return done({ say: pick('fibX2',['Ya no tengo esa lista a mano, pídemela otra vez.','Se me ha perdido esa lista, vuelve a pedírmela.']) });
    B._fibAsk = { t:f.t, raw:f.raw, at:Date.now() };
    return B._fibAnswer(ch, done);
  };
  // en las bajas, los botones de los ⏸️⏸️ también llevan el de fibra/todos
  ['_baja2P','_bajaToggle'].forEach(function(k){ var f0=B[k]; B[k]=function(x, done){ return f0(x, function(r){ var fb=fibBtn(); if(r && fb && B._bajaLast) r.buttons=(r.buttons||[]).concat(fb); done(r); }); }; });
  // elegir cliente cuando hay varios con el mismo nombre
  B.pickClient = function(i, done){
    var lc=B._lastClients; if(!lc||!lc.list[i]) return;
    var c=lc.list[i], doc=alnum(c.doc);
    var list = contratos().filter(function(it){
      if(doc ? alnum(it['20'])!==doc : fold(it['21'])!==fold(c.nombre)) return false;
      if(lc.range){ var k=ts(it['14']); if(!k||k<lc.range.from.getTime()||k>lc.range.to.getTime()||!enMeses(k, lc.range)) return false; }
      if(lc.comps && lc.comps.length && lc.comps.map(function(x){return x.toUpperCase().trim();}).indexOf(String(it['2']||'').toUpperCase().trim())<0) return false;
      if(lc.mode && !modoOK(it, lc.mode)) return false;
      return true;
    });
    render(list, lc.range);
    done({ say: fill(pick('pickc',['Aquí tienes {todos}los contratos de {n}.','Perfecto, {n}: {k} {c}.','Te muestro los de {n}: {k} {c}.']),{n:titleCase(c.nombre), k:numU(list.length), c:plural(list.length,'contrato','contratos'), todos: list.length>1?'todos ':''}) });
  };

  // ---------- recordatorio de pendientes ----------
  // Solo de lunes a viernes, de 10:25 a 13:35 y de 17:25 a 19:35 (a en punto y a y media)
  // + refuerzos a las 13:15 y 19:15, que se acerca la hora de cerrar.
  var AVISOS = ['10:30','11:00','11:30','12:00','12:30','13:00','13:15','13:30','17:30','18:00','18:30','19:00','19:15','19:30'];
  var REFUERZO = { '13:15':1, '19:15':1 };
  // avisa a la música de otras pestañas (YouTube/Spotify, con el script de Tampermonkey) para que baje mientras habla Lucas
  function duckPost(st){ var m={pfDuck:st, t:Date.now()}; try{ window.top.postMessage(m,'*'); }catch(e){} try{ if(window.parent && window.parent!==window.top) window.parent.postMessage(m,'*'); }catch(e){} }
  // ---- timbre de teléfono antiguo (campana con martillo), sintetizado: sin archivos de sonido ----
  var BELL_AC=null;
  function ringBell(){
    try{
      if(!BELL_AC) BELL_AC=new (window.AudioContext||window.webkitAudioContext)();
      var a=BELL_AC; if(a.state==='suspended') a.resume();
      var out=a.createGain(); out.gain.value=0.35; out.connect(a.destination);
      var t0=a.currentTime+0.05, RING=1.0, GAP=0.45, HZ=24;     // 2 timbrazos de 1 s, martillo a 24 golpes/s
      for(var r=0;r<2;r++){
        var rs=t0+r*(RING+GAP);
        for(var k=0;k<RING*HZ;k++){
          var t=rs+k/HZ, f=(k%2)?1320:1180;                     // dos campanas alternas
          [[1,0.5],[2.76,0.22],[5.4,0.1]].forEach(function(pt){
            var o=a.createOscillator(), g=a.createGain();
            o.type='sine'; o.frequency.value=f*pt[0];
            g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(pt[1],t+0.003); g.gain.exponentialRampToValueAtTime(0.0001,t+0.22);
            o.connect(g); g.connect(out); o.start(t); o.stop(t+0.25);
          });
        }
      }
    }catch(e){}
  }
  B.ringBell = ringBell;
  var sayQ=[], sayBusy=false;
  B.duckSay = function(msg, buttons){ sayQ.push({ m:msg, b:buttons||null }); if(!sayBusy) nextSay(); };
  // botones en el chat del asistente (para los avisos que no vienen de una pregunta)
  var fichBtns = [];
  B.renderButtons = function(list){
    var box = document.getElementById('iaChatMsgs'); if(!box || !list || !list.length) return;
    var bx = document.createElement('div'); bx.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px;max-width:90%;';
    list.forEach(function(o){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = o.t;
      b.style.cssText = 'border:1px solid #17ff5f;background:#0f1512;color:#d9ffe6;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(23,255,95,.35);transition:transform .15s;';
      b.onmouseenter = function(){ b.style.transform = 'scale(1.06)'; }; b.onmouseleave = function(){ b.style.transform = ''; };
      b.onclick = function(){
        if(b.disabled) return;
        bx.querySelectorAll('button').forEach(function(x){ x.disabled = true; x.style.opacity = x === b ? '1' : '.35'; x.style.cursor = 'default'; });
        B.pick(o.v, function(rr){ if(rr && rr.say && window.__lucasSay) window.__lucasSay(rr.say); if(rr && rr.buttons) B.renderButtons(rr.buttons); });
      };
      bx.appendChild(b);
      if(String(o.v).indexOf('fichOK')===0) fichBtns.push(b);
    });
    box.appendChild(bx); box.scrollTop = box.scrollHeight;
  };
  function apagaFichBtns(){ fichBtns.forEach(function(b){ b.disabled = true; b.style.opacity = '.35'; b.style.cursor = 'default'; }); fichBtns = []; }
  B._apagaFichBtns = apagaFichBtns;
  function nextSay(){
    var it=sayQ.shift(); if(it==null){ sayBusy=false; return; } sayBusy=true; var msg=it.m;
    duckPost('down');                                            // la música empieza a bajar
    setTimeout(ringBell, 350);                                   // 🔔 timbre de teléfono antiguo, 2 veces, antes de que hable Lucas
    setTimeout(function(){
      // abre el asistente (aunque Lucas esté dormido) para que el aviso quede también por escrito, por si el sonido está apagado
      try{ var dk=document.getElementById('lucasDock'), pk=document.getElementById('lucasPeek'); if(dk && pk && dk.classList.contains('on') && !dk.classList.contains('open')) pk.click(); }catch(e){}
      if(window.__lucasSay) window.__lucasSay(msg);
      if(it.b) B.renderButtons(it.b);
      var t0=Date.now(), saw=false;
      var iv=setInterval(function(){
        var ss=window.speechSynthesis, busy=!!(ss && (ss.speaking||ss.pending));
        if(busy) saw=true;
        var el=Date.now()-t0;
        if((saw && !busy) || (!saw && el>6000) || el>60000){ clearInterval(iv); setTimeout(function(){ duckPost('up'); setTimeout(nextSay, 1600); }, 2000); }   // 2 s después: vuelve a subir
      }, 200);
    }, 3300);
  };
  // construye y dice el aviso (force = prueba desde la consola, ignora el horario)
  B.remind = function(force, slot){
    var now=new Date(), p=blinkCount();
    var at = slot ? (function(){ var hm=slot.split(':'); return new Date(now.getFullYear(),now.getMonth(),now.getDate(),+hm[0],+hm[1]); })() : now;
    var o={h:horaTxt(at),p:numU(p),c:plural(p,'contrato','contratos')}, msg;
    if(p<=0){
      if(!force) return;
      msg=fill(pick('remind0',['Prueba de aviso: son {h} y ahora mismo no te queda ningún contrato pendiente. ¡Todo al día!','Esto es una prueba. Son {h} y no hay contratos pendientes para hoy.']),o);
    } else if(p===1) msg=fill(pick(slot && REFUERZO[slot]?'remind1R':'remind1', slot && REFUERZO[slot] ? [
        'Atención: son {h} y se acerca la hora de cerrar. Aún te queda un contrato pendiente por hacer.',
        'Ojo, que son {h} y queda poco para cerrar. Tienes un contrato sin hacer todavía.',
        'Son {h}. Antes de cerrar, recuerda que te queda un contrato por hacer.'
      ] : [
        'Recuerda que son {h} y aún te queda un contrato pendiente por hacer.',
        'Aviso: son {h}. Todavía tienes un contrato pendiente para hoy.',
        'Son {h}. Solo te queda un contrato por hacer, ¡vamos!',
        'Un recordatorio rápido: {h}, y queda un contrato pendiente.'
      ]),o);
    else if(slot && REFUERZO[slot]) msg=fill(pick('remindR',[
        'Atención: son {h} y se acerca la hora de cerrar. Aún te quedan {p} {c} pendientes por hacer.',
        'Ojo, que son {h} y queda poco para cerrar. Tienes {p} {c} sin hacer todavía.',
        'Último empujón: son {h}, casi la hora de cerrar, y quedan {p} {c} pendientes.',
        'Son {h}. Antes de cerrar, recuerda que te quedan {p} {c} por hacer.'
      ]),o);
    else msg=fill(pick('remind',[
        'Recuerda que son {h} y aún te quedan pendientes {p} {c} por hacer.',
        'Aviso: son {h}. Todavía tienes {p} {c} pendientes para hoy.',
        'Son {h}. Te quedan {p} {c} por hacer, ¡vamos!',
        'Un recordatorio rápido: {h}, y quedan {p} {c} pendientes.'
      ]),o);
    B.duckSay(msg);
  };
  function semilla(k){ try{ return localStorage.getItem('pfSemilla_'+k)==='1'; }catch(e){ return false; } }   // marcas de la consola (SEMILLA), solo en este ordenador
  B.semilla = semilla;
  var lastSlot='';
  setInterval(function(){
    try{
      var now=new Date(), dow=now.getDay();
      if(dow===0 || dow===6) return;                       // fines de semana, nada
      var mins=now.getHours()*60+now.getMinutes(), slot=null;
      for(var i=0;i<AVISOS.length;i++){ var hm=AVISOS[i].split(':'), s0=(+hm[0])*60+(+hm[1]); if(mins>=s0 && mins<=s0+3){ slot=AVISOS[i]; break; } }  // margen de 3 min por si la pestaña está en segundo plano
      if(!slot) return;
      var key=now.toDateString()+' '+slot;
      if(key===lastSlot) return;
      var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
      lastSlot=key;
      if(semilla('avisos')) return;            // semilla: en este ordenador no se avisa
      B.remind(false, slot);
    }catch(e){}
  }, 15000);

  /* =====================================================================
     FICHAJE DE SEBASTIÁN POR EL CHAT (lunes a viernes)
     ===================================================================== */
  var EMPLEADO = 'Sebastián';
  var FICH = [
    { id:'M-E', turno:'MAÑANA', tipo:'ENTRADA', at:'10:30', every:2, max:30, saludo:'Buenos días' },   // cada 2 min durante 1 hora
    { id:'M-S', turno:'MAÑANA', tipo:'SALIDA',  at:'13:28', every:5, max:5,  saludo:'Buenas tardes' },
    { id:'T-E', turno:'TARDE',  tipo:'ENTRADA', at:'17:30', every:2, max:30, saludo:'Buenas tardes' },
    { id:'T-S', turno:'TARDE',  tipo:'SALIDA',  at:'19:28', every:5, max:10, saludo:'Buenas noches' }
  ];
  B.FICH = FICH;
  function fichById(id){ for(var i=0;i<FICH.length;i++) if(FICH[i].id===id) return FICH[i]; return null; }
  function hhmm(d){ return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }
  function fKey(d){ return iso(d); }
  function loadF(){ try{ var o=JSON.parse(localStorage.getItem('lucasFich')||'{}'); if(o.date!==fKey(new Date())) o={date:fKey(new Date()), s:{}}; o.s=o.s||{}; return o; }catch(e){ return {date:fKey(new Date()), s:{}}; } }
  function saveF(o){ try{ localStorage.setItem('lucasFich', JSON.stringify(o)); }catch(e){} }
  var pendingF = null;   // {id, test, until}
  B.fichPending = function(){ return pendingF && Date.now() < pendingF.until ? pendingF : null; };

  function fichAskText(f, n, test){
    var tipoTxt = f.tipo==='ENTRADA' ? 'entrada' : 'salida';
    var first = [
      '{s}, {e}. Necesito que me confirmes que ya estás en tu puesto de trabajo. Pulsa el botón de abajo y guardaré la hora como tu entrada.',
      '{s}, {e}. ¿Ya estás en tu puesto? Confírmamelo con el botón y apunto tu hora de entrada.',
      '{s}, {e}. Toca fichar la entrada {x2}: un toque en el botón y queda registrada.',
      '{s}, {e}. Empezamos el turno {x2}. Cuando estés listo, pulsa «confirmar» y registro tu entrada.',
      '{s}, {e}. Te espero para fichar la entrada: dale al botón verde y listo.'
    ];
    var firstS = [
      '{s}, {e}. Es la hora de salida del turno de {t}. Pulsa el botón para confirmar y guardaré tu hora de salida.',
      '{s}, {e}. Antes de irte, confírmame la salida con el botón y la dejo registrada.',
      '{s}, {e}. Se acaba el turno de {t}: un toque en el botón y tu salida queda guardada.',
      '{s}, {e}. Hora de cerrar el turno de {t}. Confirma tu salida con el botón, por favor.',
      '{s}, {e}. No te vayas sin fichar: pulsa el botón y registro tu salida.'
    ];
    var again = [
      '{e}, sigo esperando que confirmes tu {x}. Pulsa el botón, por favor.',
      '{e}, ¿estás por ahí? Solo falta que pulses el botón para registrar tu {x}.',
      'Recordatorio para {e}: todavía no has confirmado la {x}. Te dejo el botón aquí abajo.',
      '{e}, un toque en el botón y tu {x} queda registrada.',
      '{e}, no me olvido de ti: falta confirmar tu {x}.',
      'Otra vez yo, {e}. Confirma tu {x} con el botón cuando puedas.'
    ];
    var o = {s:f.saludo, e:EMPLEADO, t:f.turno.toLowerCase(), x:tipoTxt+(f.turno==='MAÑANA'?' de la mañana':' de la tarde'), x2:(f.turno==='MAÑANA'?'de la mañana':'de la tarde')};
    var txt = n<=1 ? fill(pick('fa'+f.tipo, f.tipo==='ENTRADA'?first:firstS), o) : fill(pick('fr', again), o);
    return test ? '(Prueba) ' + txt : txt;
  }
  function fichAsk(f, n, test){
    var win = f.every * 60000 + 30000;       // margen para contestar hasta el siguiente aviso
    var until = test ? Date.now() + 10*60000 : Date.now() + win;
    if(!test && n>=f.max) until = Date.now() + f.every*60000;   // el último aviso deja contestar un rato
    pendingF = { id:f.id, test:!!test, until:until };
    apagaFichBtns();
    var bt = f.tipo==='ENTRADA' ? pick('fbtE',['✅ Confirmar entrada','✅ Ya estoy en mi puesto','✅ Confirmo mi entrada']) : pick('fbtS',['✅ Confirmar salida','✅ Me voy, confirmo salida','✅ Confirmo mi salida']);
    B.duckSay(fichAskText(f, n, test), [{ t:bt, v:'fichOK' }]);
  }
  // la respuesta del empleado por el chat
  function fichAnswer(done){
    var pf = pendingF, f = fichById(pf.id), now = new Date(), h = hhmm(now);
    pendingF = null; apagaFichBtns();
    var tipoTxt = f.tipo==='ENTRADA' ? 'entrada' : 'salida', turnoTxt = f.turno==='MAÑANA' ? 'de la mañana' : 'de la tarde';
    var okMsgs = f.tipo==='ENTRADA' ? [
      'Perfecto, {e}. He registrado tu entrada {t} a las {h}. ¡Que tengas un buen turno!',
      'Anotado: entrada {t} a las {h}. ¡A por el día, {e}!',
      'Listo, {e}. Entrada {t} registrada a las {h}. Mucho ánimo.',
      'Gracias, {e}. Tu entrada {t} queda guardada a las {h}. ¡Vamos allá!',
      'Confirmado, {e}: entrada {t} a las {h}. Que sea un gran turno.'
    ] : [
      'Perfecto, {e}. He registrado tu salida {t} a las {h}. ¡Buen descanso!',
      'Anotado: salida {t} a las {h}. ¡Gracias por el trabajo de hoy, {e}!',
      'Listo, {e}. Salida {t} registrada a las {h}. ¡Hasta luego!',
      'Gracias, {e}. Tu salida {t} queda guardada a las {h}. ¡A descansar!',
      'Confirmado, {e}: salida {t} a las {h}. Buen trabajo.'
    ];
    var o = {e:EMPLEADO, t:turnoTxt, h:h};
    if(pf.test){ done({ say: fill(pick('fok'+f.tipo, okMsgs), o) + ' (Era una prueba: no se ha guardado.)' }); return; }
    var st = loadF(); st.s[f.id] = st.s[f.id] || {}; st.s[f.id].done = h; saveF(st);
    try{
      google.script.run
        .withSuccessHandler(function(r){
          if(r && r.dup) done({ say: fill('Ya tenía registrada tu {x} {t} a las {h0}, {e}. La dejo como estaba.', {x:tipoTxt, t:turnoTxt, h0:r.hora, e:EMPLEADO}) });
          else if(r && r.ok) done({ say: fill(pick('fok'+f.tipo, okMsgs), o) });
          else { st.s[f.id].done = null; saveF(st); pendingF = pf; pendingF.until = Date.now()+5*60000; done({ say: 'Uy, no he podido guardar el fichaje ('+((r&&r.error)||'error')+'). Contéstame otra vez en un momento, por favor.' }); }
        })
        .withFailureHandler(function(e){ st.s[f.id].done = null; saveF(st); pendingF = pf; pendingF.until = Date.now()+5*60000; done({ say: 'Uy, no he podido guardar el fichaje. Revisa la conexión y contéstame otra vez, por favor.' }); })
        .apiFichajeLucasGuardar(iso(now), f.turno, f.tipo, h, EMPLEADO);
    }catch(e){ done({ say: 'No he podido guardar el fichaje ahora mismo.' }); }
  }
  B._fichAnswer = fichAnswer;

  // reloj del fichaje (también despierta a Lucas: abre el chat)
  setInterval(function(){
    try{
      var now=new Date(), dow=now.getDay();
      if(dow===0 || dow===6) return;
      if(!(B.semilla && B.semilla('fichajeSeb'))) return;   // solo pregunta a Sebastián en el ordenador que tenga la semilla «FICHAJE DE SEBASTIÁN»
      var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
      var mins=now.getHours()*60+now.getMinutes(), st=loadF();
      FICH.forEach(function(f){
        var hm=f.at.split(':'), s0=(+hm[0])*60+(+hm[1]);
        var lastAsk = s0 + (f.max-1)*f.every;
        if(mins < s0 || mins > lastAsk + 1) return;
        var r = st.s[f.id] = st.s[f.id] || {n:0, last:0};
        if(r.done) return;
        if(r.checking && Date.now() - r.checking < 30000) return;
        if(r.n >= f.max) return;
        if(r.last && Date.now() - r.last < f.every*60000 - 5000) return;
        if(pendingF && pendingF.id!==f.id && Date.now() < pendingF.until) return;
        r.checking = Date.now(); saveF(st);
        var go = function(already){
          var st2 = loadF(); var r2 = st2.s[f.id] = st2.s[f.id] || {n:0,last:0}; r2.checking = false;
          if(already){ r2.done = already; saveF(st2); return; }   // ya fichó (quizá desde otro ordenador)
          r2.n = (r2.n||0) + 1; r2.last = Date.now(); saveF(st2);
          fichAsk(f, r2.n, false);
        };
        try{
          google.script.run.withSuccessHandler(function(res){ var h=null; (res&&res.items||[]).forEach(function(x){ if(x.turno===f.turno && x.tipo===f.tipo && (!x.empleado || fold(x.empleado)===fold(EMPLEADO))) h=x.hora; }); go(h); })
            .withFailureHandler(function(){ go(null); }).apiFichajeLucasDia(iso(now));
        }catch(e){ go(null); }
      });
    }catch(e){}
  }, 15000);
  // pruebas desde la consola (no se guardan)
  B.fichTest = function(id){ var f=fichById(id); if(f) fichAsk(f, 1, true); };

  /* =====================================================================
     FICHAJE MANUAL POR EL CHAT: escribir "fichar" → ¿quién eres? → ¿entrada o salida?
     ===================================================================== */
  var EMPLEADOS_CHAT = ['Jorge', 'Maicol'];
  var flow = null;   // {paso:'emp'|'tipo', emp}
  function turnoAhora(d){ return d.getHours() < 15 ? 'MAÑANA' : 'TARDE'; }
  function sugerencia(d){
    var m = d.getHours()*60 + d.getMinutes();
    if((m >= 9*60 && m <= 11*60+30) || (m >= 16*60+30 && m <= 18*60+30)) return 'ENTRADA';
    if((m >= 13*60 && m <= 14*60+30) || (m >= 19*60 && m <= 21*60)) return 'SALIDA';
    return null;
  }
  function empDe(t){ for(var i=0;i<EMPLEADOS_CHAT.length;i++){ var n=fold(EMPLEADOS_CHAT[i]); if((' '+t+' ').indexOf(' '+n+' ')>=0 || (n==='maicol' && /\b(michael|maikol|maicoll|mailcol)\b/.test(t))) return EMPLEADOS_CHAT[i]; } return null; }
  function tipoDe(t){ if(/\bentrada|\bentrar|\bentro\b|\bllego\b|\bempiezo\b/.test(t)) return 'ENTRADA'; if(/\bsalida|\bsalir|\bsalgo\b|\bme voy\b|\bacabo\b|\btermino\b/.test(t)) return 'SALIDA'; return null; }
  function askEmp(done){
    flow = { paso:'emp', t:Date.now() };
    done({ say: pick('fq1',['¡Vamos a fichar! ¿Quién eres?','Claro, te ayudo a fichar. Primero dime: ¿quién eres?','Perfecto, registro tu fichaje ahora mismo. ¿Eres Jorge o Maicol?','Sin problema. ¿Quién va a fichar?']),
      buttons: EMPLEADOS_CHAT.map(function(n){ return { t:'👤 '+n, v:'emp:'+n }; }) });
  }
  var MAX_TURNOS = 5;
  // estado de hoy de un empleado: cuántas entradas lleva y si tiene una abierta
  function estadoHoy(emp, cb){
    var now=new Date();
    try{
      google.script.run.withSuccessHandler(function(res){
        var lst=(res&&res.items||[]).filter(function(x){ return fold(x.empleado||'')===fold(emp); }).sort(function(a,b){ return a.hora<b.hora?-1:a.hora>b.hora?1:(a.tipo==='ENTRADA'?-1:1); });
        var nE=0, abierta=null; lst.forEach(function(x){ if(x.tipo==='ENTRADA'){ nE++; abierta=x.hora; } else abierta=null; });
        cb({nE:nE, abierta:abierta, ok:true});
      }).withFailureHandler(function(){ cb({nE:0, abierta:null, ok:false}); }).apiFichajeLucasDia(iso(now));
    }catch(e){ cb({nE:0, abierta:null, ok:false}); }
  }
  var BTN_E={ t:'🟢 Entrada', v:'tipo:ENTRADA' }, BTN_S={ t:'🔴 Salida', v:'tipo:SALIDA' };
  function askTipo(emp, done){
    flow = { paso:'tipo', emp:emp, t:Date.now() };
    estadoHoy(emp, function(st){
      if(st.abierta) return done({ say: fill(pick('fqA',['Hola, {e}. Tienes una entrada abierta desde las {h}. ¿Registro tu salida?','{e}, entraste a las {h} y todavía no has salido. ¿Fichamos la salida?','Muy bien, {e}. Veo tu entrada de las {h}: ¿te vas ya? Ficho la salida cuando me digas.']),{e:emp,h:st.abierta}), buttons:[BTN_S, BTN_E] });
      if(st.nE>=MAX_TURNOS){ flow=null; return done({ say: fill(pick('fqM',['{e}, hoy ya has completado las {m} entradas y salidas que se permiten. Si es un error, avisa a Manu.','Hoy ya llevas {m} entradas y salidas, {e}: es el máximo diario.']),{e:emp,m:MAX_TURNOS}) }); }
      var txt = st.nE ? fill(pick('fqV',['¡Hola de nuevo, {e}! ¿Vuelves? Registro tu entrada número {n} de hoy.','Bienvenido otra vez, {e}. ¿Ficho tu entrada? Sería la {n}ª de hoy.']),{e:emp,n:st.nE+1})
                      : fill(pick('fq2',['Hola, {e}. ¿Vienes a fichar la entrada?','Perfecto, {e}. ¿Registro tu entrada de hoy?','Muy bien, {e}. ¿Entrada o salida?']),{e:emp});
      done({ say: txt, buttons:[BTN_E, BTN_S] });
    });
  }
  function guardarManual(emp, tipo, done){
    estadoHoy(emp, function(st){
      if(tipo==='ENTRADA' && st.abierta){ flow={paso:'tipo',emp:emp,t:Date.now()}; return done({ say: fill(pick('fwE',['Espera, {e}: ya tienes una entrada abierta desde las {h}. Primero ficha la salida.','{e}, todavía no has salido desde las {h}. ¿Querías fichar la salida?']),{e:emp,h:st.abierta}), buttons:[BTN_S] }); }
      if(tipo==='SALIDA' && !st.abierta && st.ok){ flow={paso:'tipo',emp:emp,t:Date.now()}; return done({ say: fill(pick('fwS',['{e}, no tienes ninguna entrada abierta hoy, así que no puedo registrar una salida. ¿Quieres fichar la entrada?','Ojo, {e}: no veo ninguna entrada sin cerrar. ¿Te ficho la entrada?']),{e:emp}), buttons:[BTN_E] }); }
      if(tipo==='ENTRADA' && st.nE>=MAX_TURNOS){ flow=null; return done({ say: fill('{e}, hoy ya has llegado al máximo de {m} entradas. Si es un error, avisa a Manu.',{e:emp,m:MAX_TURNOS}) }); }
      flow = null;
      var now=new Date(), h=hhmm(now), turno=turnoAhora(now);
      var dur=''; if(tipo==='SALIDA' && st.abierta){ var dm=(now.getHours()*60+now.getMinutes())-(+st.abierta.split(':')[0]*60+ +st.abierta.split(':')[1]); if(dm>0) dur=' Has estado '+(dm>=60?Math.floor(dm/60)+' h y ':'')+(dm%60)+' min.'; }
      var okE=['¡Gracias, {e}! Se ha registrado tu entrada a las {h}. Que vaya muy bien.','Hecho, {e}: entrada registrada a las {h}. ¡A por ello!','Perfecto, {e}. Tu entrada queda guardada a las {h}.'];
      var okS=['¡Gracias, {e}! Se ha registrado tu salida a las {h}.{d} ¡Hasta luego!','Hecho, {e}: salida registrada a las {h}.{d}','Perfecto, {e}. Tu salida queda guardada a las {h}.{d} ¡Buen descanso!'];
      try{
        google.script.run
          .withSuccessHandler(function(r){
            if(r && r.ok) done({ say: fill(pick('fman'+tipo, tipo==='ENTRADA'?okE:okS),{e:emp,h:h,d:dur}) });
            else done({ say: 'Uy, no he podido guardar el fichaje ('+((r&&r.error)||'error')+'). Escribe «fichar» y lo intentamos otra vez.' });
          })
          .withFailureHandler(function(){ done({ say: 'Uy, no he podido guardar el fichaje. Revisa la conexión y escribe «fichar» otra vez.' }); })
          .apiFichajeLucasGuardar(iso(now), turno, tipo, h, emp);
      }catch(e){ done({ say: 'No he podido guardar el fichaje ahora mismo.' }); }
    });
  }
  // botones del chat
  B.pick = function(v, done){
    v = String(v||'');
    if(v.indexOf('q:')===0) return B.handle(v.slice(2), done);
    if(v.indexOf('fib2:')===0) return B._fibSwitch(v.slice(5)==='fibra' ? 'fibra' : 'todos', done);
    if(v.indexOf('fib:')===0) return B._fibAnswer(v.slice(4)==='fibra' ? 'fibra' : 'todos', done);
    if(v==='baja2P:ver') return B._bajaToggle(false, done);
    if(v==='baja2P:quitar') return B._bajaToggle(true, done);
    if(v.indexOf('baja2P:')===0) return B._baja2P(v.slice(7)==='si', done);
    if(v==='refreshB') return B._refreshB(done);
    if(v==='refreshC') return B._refreshC(done);
    if(v==='fichOK'){ if(B.fichPending()) return B._fichAnswer(done); return done({ say: pick('fpas',['Ese aviso ya ha caducado, pero no pasa nada: el próximo te llegará a su hora.','Ya no hay ningún fichaje esperando confirmación ahora mismo.']) }); }
    if(v.indexOf('emp:')===0) return askTipo(v.slice(4), done);
    if(v.indexOf('tipo:')===0){ if(!flow || !flow.emp) return askEmp(done); return guardarManual(flow.emp, v.slice(5), done); }
  };
  // texto escrito: "fichar", o seguir la conversación escribiendo en vez de pulsar
  B._fichFlow = function(t, done){
    if(flow && Date.now() - flow.t > 5*60000) flow = null;
    var isF = /\bfich(a|ar|o|aje|ajes|e|ad|en)?\b/.test(t);
    var emp = empDe(t), tipo = tipoDe(t);
    if(flow && flow.paso==='emp' && emp){ if(tipo) { guardarManual(emp, tipo, done); return true; } askTipo(emp, done); return true; }
    if(flow && flow.paso==='tipo' && tipo){ guardarManual(flow.emp, tipo, done); return true; }
    if(!isF) return false;
    if(emp && tipo){ guardarManual(emp, tipo, done); return true; }
    if(emp){ askTipo(emp, done); return true; }
    askEmp(done); return true;
  };

  /* =====================================================================
     BORRADORES NUEVOS: si en el servidor hay borradores que esta pantalla aún no muestra, avisa
     ===================================================================== */
  function firmaB(it){ return [String(it['14']||'').trim(), String(it['20']||'').trim().toUpperCase(), fold(it['21']), String(it['2']||'').trim().toUpperCase(), String(it['22']||'').replace(/\D/g,'')].join('|'); }
  var knownB = null, avisadosB = {};
  function localB(){ try{ return (typeof BORRADORES!=='undefined' && BORRADORES) ? BORRADORES : []; }catch(e){ return []; } }
  function vigilaBorradores(){
    try{
      var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
      if(semilla('borradores')) return;
      google.script.run.withSuccessHandler(function(res){
        if(!res || !res.ok || !res.items) return;
        var loc = localB();
        if(!knownB){ knownB = {}; (loc.length ? loc : res.items).forEach(function(it){ knownB[firmaB(it)] = 1; }); return; }
        loc.forEach(function(it){ knownB[firmaB(it)] = 1; });       // lo que ya se ve en pantalla
        var nuevos = res.items.filter(function(it){ var k = firmaB(it); return !knownB[k] && !avisadosB[k]; });
        if(!nuevos.length) return;
        nuevos.forEach(function(it){ avisadosB[firmaB(it)] = 1; });
        var n = nuevos.length, it0 = nuevos[0];
        var quien = titleCase(String(it0['21']||'').trim()), comp = compName(it0['2']);
        var msg = n===1
          ? fill(pick('bnew1',[
              'Ojo: acaba de entrar un borrador nuevo{q}{c}. Tu pantalla todavía no lo muestra: pulsa el botón para actualizar borradores.',
              'Tienes un borrador nuevo{q}{c} que aún no ves en pantalla. ¿Actualizo borradores?',
              'Novedad en borradores: ha llegado uno nuevo{q}{c}. Dale al botón y te lo pongo a la vista.'
            ]),{q: quien ? ' de '+quien : '', c: comp ? ' ('+comp+')' : ''})
          : fill(pick('bnewN',[
              'Ojo: han entrado {n} borradores nuevos que tu pantalla todavía no muestra. Pulsa el botón para actualizarlos.',
              'Tienes {n} borradores nuevos sin ver. ¿Actualizo la lista de borradores?',
              'Novedad: {n} borradores nuevos acaban de llegar. Dale al botón y los verás en pantalla.'
            ]),{n:n});
        B.duckSay(msg, [{ t:'🔄 Actualizar borradores', v:'refreshB' }]);
      }).withFailureHandler(function(){}).apiGetContratos('borradores');
    }catch(e){}
  }
  setInterval(vigilaBorradores, 90000);
  setTimeout(vigilaBorradores, 20000);
  B._refreshB = function(done){
    try{ if(typeof goView==='function') goView('borradores'); }catch(e){}
    try{
      if(typeof loadBorradores==='function') return loadBorradores(function(){
        localB().forEach(function(it){ (knownB = knownB || {})[firmaB(it)] = 1; });
        done({ say: pick('bok',['Listo, borradores actualizados. Ya lo tienes en pantalla.','Hecho: lista de borradores al día.','Actualizado. Ahí lo tienes.']) });
      });
    }catch(e){}
    done({ say: 'Pulsa el botón 🔄 Actualizar de borradores para verlo.' });
  };

  /* =====================================================================
     CONTRATOS NUEVOS (solo en los ordenadores con la semilla «contratos» instalada)
     Compara el contador de contratos de hoy (se refresca solo) con los que ya se ven en esta pantalla.
     ===================================================================== */
  function hoyIsoL(){ return iso(new Date()); }
  function contratosHoyLocal(){ var h = new Date(); h = new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime(); return contratos().filter(function(it){ return ts(it['14']) === h; }); }
  var avisadoC = { dia:'', n:0 };
  function vigilaContratos(){
    try{
      if(!semilla('contratos')) return;                         // semilla al revés: si no está instalada, no hace nada
      var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
      if(!contratos().length) return;
      var el = document.getElementById('countContratos'); if(!el) return;
      var badge = parseInt(el.textContent, 10); if(isNaN(badge)) return;
      var dia = hoyIsoL(); if(avisadoC.dia !== dia) avisadoC = { dia:dia, n:0 };
      var local = contratosHoyLocal().length;
      if(badge <= local || badge <= avisadoC.n) return;
      avisadoC.n = badge;
      var n = badge - local;
      var msg = n===1
        ? pick('cnew1',['¡Contrato nuevo! Se acaba de finalizar uno que tu pantalla todavía no muestra. Pulsa el botón para actualizar.','Buenas noticias: ha entrado un contrato nuevo. ¿Actualizo la lista para que lo veas?','Novedad en contratos: hay uno nuevo de hoy que aún no ves. Dale al botón y te lo enseño.'])
        : fill(pick('cnewN',['¡Contratos nuevos! Se han finalizado {n} que tu pantalla todavía no muestra. Pulsa el botón para actualizar.','Buenas noticias: han entrado {n} contratos nuevos. ¿Actualizo la lista?','Novedad: {n} contratos nuevos de hoy sin ver. Dale al botón y los verás.']),{n:n});
      B.duckSay(msg, [{ t:'🔄 Actualizar contratos', v:'refreshC' }]);
    }catch(e){}
  }
  setInterval(vigilaContratos, 30000);
  B._refreshC = function(done){
    var antes = {}; contratosHoyLocal().forEach(function(it){ antes[firmaB(it)] = 1; });
    try{ if(typeof goView==='function') goView('contratos'); }catch(e){}
    try{
      if(typeof loadContratos==='function') return loadContratos(function(){
        var nuevos = contratosHoyLocal().filter(function(it){ return !antes[firmaB(it)]; });
        var det = '';
        if(nuevos.length===1){ var it=nuevos[0]; det = ' Es el de ' + titleCase(String(it['21']||'').trim()) + (it['2'] ? ' (' + compName(it['2']) + ')' : '') + '.'; }
        else if(nuevos.length>1) det = ' Son ' + nuevos.length + ' nuevos: ' + nuevos.slice(0,3).map(function(it){ return titleCase(String(it['21']||'').trim()); }).join(', ') + (nuevos.length>3 ? '…' : '') + '.';
        done({ say: pick('cok',['Listo, contratos actualizados.','Hecho: lista de contratos al día.','Actualizado.']) + det });
      });
    }catch(e){}
    done({ say: 'Pulsa el botón 🔄 Actualizar de contratos para verlo.' });
  };
})();
