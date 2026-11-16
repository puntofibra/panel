/* ===== CEREBRO DE LUCAS (sin IA, sin coste) ===== */
(function(){
  var B = window.LucasBrain = {};

  // ---------- utilidades ----------
  function fold(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[¿?¡!.,;:()"'«»]/g,' ').replace(/\s+/g,' ').trim(); }
  function digits(s){ return String(s||'').replace(/\D/g,''); }
  function alnum(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
  var lastPick = {};
  function pick(key, arr){ if(arr.length<2) return arr[0]; var i, n=0; do{ i=Math.floor(Math.random()*arr.length); }while(i===lastPick[key] && ++n<12); lastPick[key]=i; return arr[i]; }
  function fill(t,o){ return String(t).replace(/\{(\w+)\}/g,function(_,k){ return o[k]!=null?o[k]:''; }); }
  function cap(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }
  function titleCase(s){ return String(s||'').toLowerCase().replace(/(^|\s)(\S)/g,function(m,a,b){ return a+b.toUpperCase(); }); }
  function plural(n,uno,varios){ return n===1?uno:varios; }
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
    // de enero a marzo / entre enero y marzo
    m = t.match(new RegExp('\\b(?:de|desde|entre)\\s+'+MRE+'\\s+(?:a|hasta|y)\\s+'+MRE));
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
    if(/\b(semana pasada|ultima semana|pasada semana)\b/.test(t)){ var wd=(now.getDay()+6)%7; var mon=d0(y,mo,now.getDate()-wd-7); return {from:mon, to:new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6,23,59,59,999), label:'de la semana pasada'}; }
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
  var STOP = ('a al algo algun alguna algunos ahora anda ano anos asi aqui ayer anteayer busca buscame buscar buscarme cliente clientes con contrato contratos cuanto cuantos cuanta cuantas cual cuales da dame de del desde dia dias dime documento dni el ella en ensena ensename ensenar entre es esa ese eso esos esta este esto estos ha han has hace hacer he hecho hechos hemos hicieron hizo hoy hubo hay iban la las le les lista listado listame llevo llevamos llevas lo los lucas me mes meses mi mis muestra muestrame mostrar movil nie numero o para pasado pasada pon ponme por porfa porfavor favor puedes podrias que quiero quisiera rapido saca sacame sacar se semana si sin solo solamente su sus tal te tengo tenemos tiene tienen todo todos toda todas total trae traeme tu un una uno unos ultimo ultimos ultima ver vamos y ya filtra filtrame filtrar filtro filtros abre abreme enseñame solicitud solicitudes alta altas cuenta cuentas bancaria numero telefono telefonos termina terminan terminada terminado acaba acaban acabada finaliza finalizan finalizada acabe termine finalice acabado finalizado empiece empieza ' +
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
  var CUANTOS=[ 'Llevas {n} {c} {d}.', 'En total hay {n} {c} {d}.', 'Tengo contados {n} {c} {d}.', 'La cuenta sale así: {n} {c} {d}.', 'He contado {n} {c} {d}.' ];

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
    var range = parseDates(t, now);
    var comps = findCompanies(t);
    var mode = null;   // 'cambiar' | 'baja'
    if(/\bcambi(ar|o|os)\b|\bcambio de (titular|nombre)\b/.test(t)) mode='cambiar';
    if(/\bdar(los|las)? de baja\b|\bbajas?\b|\bdar baja\b/.test(t)) mode='baja';
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
    if(mode){
      var back = mode==='cambiar'?3:6;
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
    if(range){ var f=range.from.getTime(), to=range.to.getTime(); base = base.filter(function(it){ var k=ts(it['14']); return k && k>=f && k<=to; }); }
    if(comps.length){ var cs=comps.map(function(c){ return c.toUpperCase().trim(); }); base = base.filter(function(it){ return cs.indexOf(String(it['2']||'').toUpperCase().trim())>=0; }); }
    if(mode){ base = base.filter(function(it){ var s=String(it['44']||''); return s.indexOf('❌')<0 && s.indexOf('⏸')<0; }); }
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
        var hasOther = range||comps.length||mode||dniM||ibanFull||ibanEnd||tel;
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
    else if(mode==='baja') d.push('para dar de baja '+range.target+' (solicitados en '+range.label+')');
    else if(range) d.push(range.label);
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
      return { say: fill(pick('cuantos',CUANTOS),{n:n,c:cword,d:desc||'en total',D:D}) };
    }
    if(!desc) return { say: pick('todos',['Aquí tienes todos los contratos.','Te enseño todos los contratos.','Listo, todos los contratos a la vista.']) };
    return { say: fill(pick('aqui',AQUI),{n:n,N:n,c:cword,d:desc}) };
  }

  // ---------- borradores ----------
  function blinkCount(){ var el=document.getElementById('countBorradores'); var n=parseInt(el?el.textContent:'0',10); return isNaN(n)?0:n; }
  B.blinkCount = blinkCount;
  function borradores(t, done){
    var p=blinkCount();
    var fin=function(total){
      var txt;
      if(total==null) txt = fill(pick('bp',['Para hoy te quedan {p} borradores pendientes de hacer.','Hoy tienes {p} pendientes por hacer.']),{p:p});
      else txt = fill(pick('bt',['Tienes {t} borradores en total, y para hoy te quedan pendientes {p}.','Hay {t} borradores en total. De esos, {p} son para hoy.','En borradores tienes {t}. Ojo, que para hoy te quedan {p} por hacer.','{t} borradores en total; los urgentes de hoy son {p}.']),{t:total,p:p});
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
    if(/^(adios|hasta luego|hasta manana|chao|chau|nos vemos|me voy|bye)\b/.test(t)) return pick('bye',['¡Hasta luego! Que vaya bien.','Nos vemos. Aquí me quedo vigilando los borradores.','¡Chao! Descansa.','Hasta pronto.']);
    if(/\b(quien eres|como te llamas|que eres|tu nombre)\b/.test(t)) return pick('who',['Soy Lucas, el asistente de Puntofibra. Busco contratos, clientes y te recuerdo lo pendiente.','Me llamo Lucas, tu robot ayudante. Pídeme contratos por fechas, clientes o compañías.','Lucas, para servirte. Mi especialidad: encontrar contratos en un segundo.']);
    if(/\b(como estas|que tal estas|como vas|que tal te va|como andas)\b/.test(t)) return pick('how',['¡Con las pilas cargadas al cien por cien!','Muy bien, engrasado y listo. ¿Y tú?','Funcionando perfectamente, gracias por preguntar.','De maravilla, sin un solo cortocircuito.']);
    if(/\bque hora es\b|\bhora es\b|\bdime la hora\b/.test(t)) return 'Son '+horaTxt(now)+'.';
    if(/\bque dia es\b|\ba que (dia )?estamos\b|\bque fecha es\b|\bfecha de hoy\b/.test(t)) return 'Hoy es '+DIAS[now.getDay()]+', '+now.getDate()+' de '+MESES[now.getMonth()]+' de '+now.getFullYear()+'.';
    if(/\b(chiste|algo gracioso|hazme reir)\b/.test(t)) return pick('joke',['¿Por qué el router fue al médico? Porque tenía mala conexión.','Mi fibra favorita es la óptica: nunca me deja colgado.','Le pedí a la nube que me guardara un secreto… y lo compartió con todo el mundo.','¿Qué le dice un cable a otro? Somos los mejores conductores.']);
    if(/\b(ayuda|que sabes hacer|que puedes hacer|que haces|como funcionas|comandos|instrucciones)\b/.test(t)) return 'Puedo hacer cosas como estas:\n• «Muéstrame los contratos de enero» (o de enero de 2025, de hace 3 meses, del mes pasado…)\n• «Contratos de Raquel» o por DNI\n• «Contratos con la cuenta que termina en 1234»\n• «¿Cuántos contratos llevo este mes de Simyo?»\n• «¿Qué contratos tengo para cambiar?» o «para dar de baja»\n• «¿Cuántos borradores tengo?»\n• «Quita los filtros»\nY cada media hora te recuerdo los pendientes de hoy.';
    if(/\b(quita|quitame|limpia|limpiame|borra|resetea|elimina)\b.*\bfiltros?\b|\bsin filtros\b/.test(t)) return '__CLEAR__';
    return null;
  }
  function isGreeting(t){ return /^(hola|holi|holaa+|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|saludos|que tal|que pasa|buen dia)\b/.test(t); }
  var CONTRACT_WORDS = /\b(contratos?|solicitud(es)?|altas?|clientes?|muestra\w*|ensena\w*|filtra\w*|busca\w*|saca\w*|dame|lista\w*|ver|ensenar|trae\w*|pon\w*|cuant[oa]s|llevo|llevamos|hicieron|hecho|hechos|cuenta|iban|dni|nie|telefono|cambiar|baja)\b/;

  // ---------- entrada principal ----------
  B.handle = function(raw, done){
    var now = new Date();
    var t = fold(raw);
    if(!t){ return done({ say: pick('vacio',['Dime algo y lo busco.','¿Sí? Te escucho.']) }); }
    t = t.replace(/^(oye |eh |lucas |hey lucas |hola lucas |oye lucas )+/,'').trim();
    var greet = isGreeting(t) || /^lucas$/.test(t);
    var rest = t.replace(/^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|saludos|buen dia)( lucas)?\s*/,'').trim();

    var st = smallTalk(rest||t, now);
    if(st==='__CLEAR__'){ ensureContratos(function(){ try{ clearSearch(); }catch(e){ render(contratos(),null); } done({ say: pick('clear',['Filtros quitados. Ya ves todos los contratos.','Listo, tabla limpia.','Hecho, sin filtros.']) }); }); return; }
    if(st) return done({ say: st });

    if(/\bborrador/.test(rest||t)) return borradores(rest||t, done);

    var hasDate = !!parseDates(rest||t, now);
    var hasComp = findCompanies(rest||t).length>0;
    var ctx = { contractWords: CONTRACT_WORDS.test(rest||t) };
    if(greet && !rest) return done({ say: B.greet(false) });

    ensureContratos(function(){
      var r = contratoQuery(rest||t, raw, now, ctx);
      if(r.notUnderstood){
        if(greet) return done({ say: B.greet(false) });
        return done({ say: pick('noentiendo',NO_ENTIENDO) });
      }
      if(greet && r.say) r.say = saludoHora(now)+'. '+r.say;
      done(r);
    });
  };

  // elegir cliente cuando hay varios con el mismo nombre
  B.pickClient = function(i, done){
    var lc=B._lastClients; if(!lc||!lc.list[i]) return;
    var c=lc.list[i], doc=alnum(c.doc);
    var list = contratos().filter(function(it){
      if(doc ? alnum(it['20'])!==doc : fold(it['21'])!==fold(c.nombre)) return false;
      if(lc.range){ var k=ts(it['14']); if(!k||k<lc.range.from.getTime()||k>lc.range.to.getTime()) return false; }
      if(lc.comps && lc.comps.length && lc.comps.map(function(x){return x.toUpperCase().trim();}).indexOf(String(it['2']||'').toUpperCase().trim())<0) return false;
      if(lc.mode){ var s=String(it['44']||''); if(s.indexOf('❌')>=0||s.indexOf('⏸')>=0) return false; }
      return true;
    });
    render(list, lc.range);
    done({ say: fill(pick('pickc',['Aquí tienes {todos}los contratos de {n}.','Perfecto, {n}: {k} {c}.','Te muestro los de {n}: {k} {c}.']),{n:titleCase(c.nombre), k:list.length, c:plural(list.length,'contrato','contratos'), todos: list.length>1?'todos ':''}) });
  };

  // ---------- recordatorio cada media hora ----------
  var lastSlot='';
  setInterval(function(){
    try{
      var now=new Date(), mi=now.getMinutes();
      if(!(mi<=3 || (mi>=30 && mi<=33))) return;   // margen por si el navegador está en segundo plano (Chrome solo despierta 1 vez/min)
      var slot=now.toDateString()+' '+now.getHours()+':'+(mi<30?'00':'30');
      now=new Date(now.getFullYear(),now.getMonth(),now.getDate(),now.getHours(),mi<30?0:30);
      if(slot===lastSlot) return;
      var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
      lastSlot=slot;
      var p=blinkCount(); if(p<=0) return;
      var hTxt=horaTxt(now);
      var msg=fill(pick('remind',[
        'Recuerda que son {h} y aún te quedan pendientes {p} {c} por hacer.',
        'Aviso: son {h}. Todavía tienes {p} {c} pendientes para hoy.',
        'Son {h}. Te quedan {p} {c} por hacer, ¡vamos!',
        'Un recordatorio rápido: {h}, y quedan {p} {c} pendientes.'
      ]),{h:hTxt,p:p,c:plural(p,'contrato','contratos')});
      if(window.__lucasSay) window.__lucasSay(msg);
    }catch(e){}
  }, 15000);
})();
