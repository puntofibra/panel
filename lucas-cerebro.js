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

  /* ---------- PRONUNCIACIÓN: lo que se escribe en el chat se queda igual, pero la voz dice esto ----------
     (para enseñarle una palabra nueva: añadir [palabra, cómo decirla]) */
  B.PRONUNCIA = [
    ['ups','uy'], ['ok','okey'], ['vip','bip'], ['vips','bips'], ['iban','íban'], ['hey','ey'], ['ciao','chao'], ['xao','chao'], ['bye','bai'],
    ['holaa','hola'], ['holaaa','hola'], ['holaaaa','hola'], ['zzz',''], ['o2','o dos'], ['min','minutos'], ['hrs','horas'], ['ia','i a'],
    ['wifi','güifi'], ['router','rúter'], ['whatsapp','guasap']
  ];
  function pronunciar(t){
    t = String(t||'');
    t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, ' ');     // fuera emojis (la voz los lee en voz alta)
    B.PRONUNCIA.forEach(function(p){ t = t.replace(new RegExp('(^|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9])'+p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9])','gi'), function(m, a){ return a + p[1]; }); });
    t = t.replace(/(\d+)\s*h\b/g, '$1 horas').replace(/\s*[•·]\s*/g, '. ');
    return t.replace(/\s{2,}/g,' ').trim();
  }
  B.pronunciar = pronunciar;                                         // para probar: LucasBrain.pronunciar('Ups, eso…')
  try{
    var SS = window.speechSynthesis;
    if(SS && !SS.__lucasPron){
      var speakOrig = SS.speak.bind(SS);
      SS.speak = function(u){ try{ if(u && typeof u.text==='string') u.text = pronunciar(u.text); }catch(e){} return speakOrig(u); };
      SS.__lucasPron = true;
    }
  }catch(e){}

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
    // del 3 al 15 (sin decir el mes: el mes actual)
    m = t.match(/\b(?:del?|desde el)\s*(\d{1,2})\s+(?:al|hasta el)\s+(\d{1,2})\b/);
    if(m && +m[1]>=1 && +m[1]<=31 && +m[2]>=+m[1] && +m[2]<=31){ return {from:d0(y,mo,+m[1]), to:new Date(y,mo,+m[2],23,59,59,999), label:'del '+m[1]+' al '+m[2]+' de '+MESES[mo]}; }
    // el lunes / el viernes pasado (el más reciente)
    m = t.match(/\b(?:el|del|este)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(\s+pasado)?\b/);
    if(m){ var wi=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'].indexOf(m[1]); var bk=(now.getDay()-wi+7)%7; if(m[2] && bk===0) bk=7; var dw=new Date(now); dw.setDate(dw.getDate()-bk); return dayRange(dw,'del '+DIAS[wi]+' '+dw.getDate()+' de '+MESES[dw.getMonth()]); }
    // hace N días / hace N semanas
    m = t.match(/\bhace\s+(\w+)\s+dias?\b/);
    if(m){ var nd0=toNum(m[1])||1; var hd=new Date(now); hd.setDate(hd.getDate()-nd0); return dayRange(hd,'de hace '+nd0+' '+plural(nd0,'día','días')+' ('+fmtD(hd)+')'); }
    m = t.match(/\bhace\s+(\w+)\s+semanas?\b/);
    if(m){ var nw=toNum(m[1])||1; var wdh=(now.getDay()+6)%7; var monh=d0(y,mo,now.getDate()-wdh-7*nw); return {from:monh, to:new Date(monh.getFullYear(),monh.getMonth(),monh.getDate()+6,23,59,59,999), label:'de hace '+nw+' '+plural(nw,'semana','semanas')}; }
    m = t.match(/\bultim[oa]s\s+(\w+)\s+semanas\b/);
    if(m){ var nws=toNum(m[1])||2; var fw=new Date(now); fw.setDate(fw.getDate()-(7*nws-1)); return {from:d0(fw.getFullYear(),fw.getMonth(),fw.getDate()), to:new Date(y,mo,now.getDate(),23,59,59,999), label:'de las últimas '+nws+' semanas'}; }
    // quincenas
    m = t.match(new RegExp('\\b(primera|segunda)\\s+quincena(?:\\s+(?:de|del)\\s+'+MRE+')?'));
    if(m){ var qm = m[2]!=null ? MES_IDX[m[2]] : mo, qy = yr||y, q1 = m[1]==='primera'; return {from:d0(qy,qm,q1?1:16), to: q1 ? new Date(qy,qm,15,23,59,59,999) : endOfMonth(qy,qm), label:'de la '+m[1]+' quincena de '+MESES[qm]}; }
    if(/\besta quincena\b/.test(t)){ var q1b = now.getDate()<=15; return {from:d0(y,mo,q1b?1:16), to:new Date(y,mo,now.getDate(),23,59,59,999), label:'de esta quincena'}; }
    if(/\bquincena pasada\b|\bultima quincena\b/.test(t)){ if(now.getDate()<=15){ var pm=monthRange(y,mo-1); return {from:d0(pm.y,pm.m,16), to:pm.to, label:'de la quincena pasada'}; } return {from:d0(y,mo,1), to:new Date(y,mo,15,23,59,59,999), label:'de la quincena pasada'}; }
    // trimestre pasado
    if(/\btrimestre pasado\b|\bultimo trimestre\b|\btrimestre anterior\b/.test(t)){ var qp=Math.floor(mo/3)-1, yqp=y; if(qp<0){ qp=3; yqp--; } return {from:d0(yqp,qp*3,1), to:endOfMonth(yqp,qp*3+2), label:'del trimestre pasado'}; }
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
  var STOP = ('vip vips ciclo fibra fibras doble segunda vez veces pausa pausar pausarlos pausarlas pausados pausadas pendiente pendientes baja bajas dar toca tocan quitar falta faltan instalar instalados instaladas instalado instalada instalacion instalaciones sin por poner a al algo algun alguna algunos ahora anda ano anos asi aqui ayer anteayer busca buscame buscar buscarme cliente clientes con contrato contratos cuanto cuantos cuanta cuantas cual cuales da dame de del desde dia dias dime documento dni el ella en ensena ensename ensenar entre es esa ese eso esos esta este esto estos ha han has hace hacer he hecho hechos hemos hicieron hizo hoy hubo hay iban la las le les lista listado listame llevo llevamos llevas lo los lucas me mes meses mi mis muestra muestrame mostrar movil nie numero o para pasado pasada pon ponme por porfa porfavor favor puedes podrias que quiero quisiera rapido saca sacame sacar se semana si sin solo solamente su sus tal te tengo tenemos tiene tienen todo todos toda todas total trae traeme tu un una uno unos ultimo ultimos ultima ver vamos y ya filtra filtrame filtrar filtro filtros abre abreme enseñame solicitud solicitudes alta altas cuenta cuentas bancaria numero telefono telefonos termina terminan terminada terminado acaba acaban acabada finaliza finalizan finalizada acabe termine finalice acabado finalizado empiece empieza ' +
    'necesito mira mirame consulta busqueda encuentra encuentrame nombre nombres llamado llamada llama persona personas gente hola buenas buenos noches tardes dias gracias anterior actual va como quien donde cuando hacia trimestre primer segundo tercer cuarto').split(' ');
  var STOPSET={}; STOP.forEach(function(w){ STOPSET[w]=1; }); MESES.concat(['setiembre']).forEach(function(w){ STOPSET[w]=1; }); Object.keys(NUM).forEach(function(w){ STOPSET[w]=1; });
  ['linea','lineas','extra','extras','regalo','regalos','gratis','gratuitas','normales','suma','sumame','sumar','total','totales','moviles','telefonicas','pago','cuantas','vendidas','hechas','echas','echo','hecho','metido','metidas','fibras','fibra','contratos','contrato'].forEach(function(w){ STOPSET[w]=1; });
  /* ---------- QUÉ SE CUENTA: contratos (filas), fibras (col 16), líneas de cliente (col 17) y líneas extra (col 18) ---------- */
  function numCol(it, id){ var n=parseFloat(String(it[id]==null?'':it[id]).trim().replace(',','.')); return isNaN(n)?0:n; }
  function medida(t){
    t=String(t||'');
    var cli = /\blineas? (de |del )?(los )?(clientes?|normales?|de pago|pagadas?)\b/.test(t);
    var ext = /\blineas? (extras?|de regalo|regalo|regaladas?|gratis|gratuitas?)\b|\b(las |los )?extras\b|\blineas? que son (extra|de regalo)\b/.test(t);
    var lin = /\blineas?\b/.test(t);
    var fib = /\bfibras\b/.test(t) || (/\bfibra\b/.test(t) && /\bcuant[oa]s\b/.test(t));
    // «contratos con fibra», «los que tienen fibra»… es un filtro, no contar fibras
    if(fib && /\b(con|sin|tienen?|tengan?|llevan?|lleven?|solo|solamente) (la |las )?fibras?\b/.test(t) && !/\bcuant[oa]s fibras\b/.test(t)) fib=false;
    var k = cli&&!ext ? 'lcli' : ext&&!cli ? 'lext' : lin ? 'lineas' : fib ? 'fibras' : null;
    return { k:k, fib:fib && k!=='fibras', contratos:/\bcontratos?\b/.test(t) };
  }
  function sumar(list){ var r={c:list.length,f:0,lc:0,le:0}; list.forEach(function(it){ r.f+=numCol(it,'16'); r.lc+=numCol(it,'17'); r.le+=numCol(it,'18'); }); r.l=r.lc+r.le; return r; }
  function valorMedida(k){ return k==='fibras' ? function(it){ return numCol(it,'16'); } : k==='lcli' ? function(it){ return numCol(it,'17'); } : k==='lext' ? function(it){ return numCol(it,'18'); } : k==='lineas' ? function(it){ return numCol(it,'17')+numCol(it,'18'); } : function(){ return 1; }; }
  function nomMedida(k, n){ var p=(n!==1); return k==='fibras' ? (p?'fibras':'fibra') : k==='lcli' ? (p?'líneas de cliente':'línea de cliente') : k==='lext' ? (p?'líneas extra':'línea extra') : k==='lineas' ? (p?'líneas':'línea') : (p?'contratos':'contrato'); }
  B._medida = medida; B._sumar = sumar;
  function numM(k, n){ return n===1 ? (k && k!=='contratos' ? 'una' : 'un') : String(n); }
  /* ---------- CÓDIGOS DE SIMYO (col 26): DW = el de Manu (+ Masmovil, Pepephone y Jazztel, que no llevan código); UI = el de Wil ---------- */
  ['codigo','codigos','dw','ui','wil','wilmer','cunado','mio','mia'].forEach(function(w){ STOPSET[w]=1; });
  var COD_DW_SIN = ['MASMOVIL','MÁSMÓVIL','MAS MOVIL','PEPEPHONE','JAZZTEL'];
  function codigoDe(t){
    t=String(t||'');
    if(/\b(los dos|los 2|ambos|mis dos|mis 2|nuestros|todos los|los) codigos\b|\bcodigos? (dw y ui|ui y dw)\b|\b(los dos|los 2|ambos) juntos\b/.test(t)) return 'AMBOS';
    var ui=/\bcodigos? (de |del )?(mi )?(cunado|wil|wilmer|ui)\b|\b(el|del|en el|en|y) (codigo )?ui\b|\bde wil(mer)?\b|\b(lleva|llevado|ha hecho|hizo) wil(mer)?\b|\bwil(mer)? (lleva|ha|hizo)\b|\b(el )?codigo ui\b|\by wil(mer)?\b/.test(t);
    var dw=/\bmi codigo\b|\bcodigo (mio|dw)\b|\b(el|del|en el|en|y) (codigo )?dw\b|\bmis? codigos? dw\b|\bel mio\b/.test(t);
    if(ui && dw) return 'AMBOS';
    return ui ? 'UI' : dw ? 'DW' : null;
  }
  function esDeCodigo(it, c){
    var comp=String(it['2']||'').toUpperCase().trim(), cod=String(it['26']==null?'':it['26']).toUpperCase().trim();
    if(c==='UI') return comp==='SIMYO' && cod==='UI';
    if(c==='AMBOS') return (comp==='SIMYO' && (cod==='DW' || cod==='UI')) || COD_DW_SIN.indexOf(comp)>=0;
    return (comp==='SIMYO' && cod==='DW') || COD_DW_SIN.indexOf(comp)>=0;
  }
  function quitarCodigo(L){ return (' '+String(L||'')+' ').replace(/\s(?:(?:en|el|del|de)\s+)*(?:mi codigo(?: dw)?|codigo (?:mio|dw|ui)|codigos? (?:de |del )?(?:mi )?(?:cunado|wil|wilmer|ui)|(?:lleva|llevado|ha hecho|hizo) wil(?:mer)?|wil(?:mer)? (?:lleva|ha|hizo)|(?:los dos|los 2|ambos|mis dos|mis 2|los) codigos(?: juntos)?|(?:los dos|los 2|ambos) juntos|el mio|entre|wil(?:mer)?|dw|ui)(?=\s)/g,' ').replace(/\s+/g,' ').trim(); }
  function porCodigo(list, t){ var c=codigoDe(t); return c ? list.filter(function(it){ return esDeCodigo(it, c); }) : list; }
  function txtCodigo(c){ return c==='UI' ? 'del código de Wil' : c==='DW' ? 'de tu código DW' : c==='AMBOS' ? 'sumando tu código y el de Wil' : ''; }
  B._codigoDe = codigoDe;

  /* =====================================================================
     COMPRENSIÓN DEL LENGUAJE (NLU sin IA)
     1) diccionario de sinónimos   2) palabras que no son nombres
     3) números escritos con letra  4) corrección de errores al escribir
     5) nombres reales de la hoja   6) memoria de la conversación
     Para que Lucas entienda una forma nueva de decir algo, se añade aquí.
     ===================================================================== */
  // 1) DICCIONARIO: frase que entiende Lucas  <=  otras formas de decirlo (todo sin tildes y en minúsculas)
  B.DICCIONARIO = {
    'contratos':            ['ventas','venta','operaciones','operacion','contrataciones','contratacion','altas nuevas','portas','porta','portabilidades','portabilidad',
                             'lo que entro','lo que entraron','lo que ha entrado','lo que firmamos','lo que firme','lo que hicimos','lo que hice','lo que vendimos','lo que cerramos','lo que metimos'],
    'contratos para dar de baja': ['a quien le toca baja','a quien le toca la baja','a quien le toca dar de baja','a quien hay que dar de baja','que hay que cancelar','que toca cancelar','que hay que tramitar','que toca tramitar','que bajas tengo que hacer','que bajas hay que hacer'],
    'contratos para pausar':['a quien hay que pausar','a quien le toca pausa','a quien le toca la pausa','que toca congelar','que hay que congelar','que hay que pausar','que toca pausar'],
    'contratos pendientes de instalar': ['que me falta por instalar','que falta por instalar','que me queda por instalar','que esta sin router','que estan sin router','sin router','pendiente de tecnico','pendientes de tecnico','pendientes del tecnico','esperando al tecnico','falta el tecnico'],
    'borradores de hoy':    ['que me queda por hacer hoy','que me queda por hacer','que me falta por hacer hoy','que me falta por hacer','tengo algo pendiente','tengo algo pendiente hoy','que tengo pendiente','que tengo pendiente hoy','que me queda pendiente'],
    'cuantos':              ['que cantidad de','cantidad de','cuantas veces','que numero de'],
    'anteayer':             ['antes de ayer','antier','antesdeayer'],
    'mes pasado':           ['mes previo','el otro mes','mes ultimo'],
    'ano pasado':           ['ano anterior','el otro ano'],
    'semana pasada':        ['semana previa','la otra semana'],
    'hoy':                  ['en el dia de hoy','hoy mismo'],
    'este mes':             ['en lo que llevamos de mes','lo que llevamos de mes','en lo que va de mes'],
    'este ano':             ['en lo que llevamos de ano','lo que llevamos de ano'],
    'pendientes de instalar':['sin montar','por montar','pendientes de montar','falta por montar','faltan por montar','sin conectar','pendientes de conectar'],
    'clientes vip':         ['clientes top','clientes premium','mejores clientes','clientes especiales'],
    'quita los filtros':    ['limpia la tabla','borra la busqueda','quita la busqueda','quita todo','resetea la tabla'],
    'ayuda':                ['que me puedes decir','en que me ayudas','que sabes','menu de opciones','opciones'],
    'muestrame':            ['ensenamelos','ensenamelas','muestramelos','muestramelas','sacamelos','sacamelas','damelos','damelas','pasamelos','pasamelas','ponmelos','ponmelas','listamelos']
  };
  // 2) palabras que nunca son nombres de clientes (verbos y relleno)
  ('hice hicimos hiciste hicisteis vendi vendimos vendiste vendido vendidos vendidas cerre cerramos cerrado cerrados cerradas meti metimos metido metidos metidas '+
   'realizado realizados realizamos firmado firmados firmamos conseguimos conseguido sacamos sacado sacados entraron entrado entrados registrados registramos apuntados apuntamos '+
   'pasame pasa dejame deja ensenarme mostrarme sacarme decirme dimelo listar salen sale aparecen aparece tienes son eran fueron estan queda quedan cantidad '+
   'mostrame porfi plis please oye venga totales resumen nuevos nuevas otra otro otros otras tambien ahora mismo bien vale entonces pues '+
   'ensenamelos ensenamelas muestramelos muestramelas sacamelos sacamelas damelos damelas pasamelos pasamelas ponmelos ponmelas listamelos '+
   'quincena quincenas semanas lunes martes miercoles jueves viernes sabado domingo '+
   'compania companias operadora operadoras operador vende venden vendemos vendio ranking mejor peor mas menos comparado comparar comparacion cuando fue '+
   'esta estado entrado entro llegado llego venido vino salido salio fichado fichaje fichajes hora horas ordena ordename ordenar orden recientes antiguos antiguas viejos primero primeros '+
   'estoy estas estamos estan soy eres somos tengo tienes tenemos cansado cansada harto harta liado liada agotado agotada sueno estres vaya largo larga dias noche manana tarde '+
   'chiste chistes gracioso graciosa reir risa jajaja jeje bueno buena buenisimo genial guay perfecto estupendo fenomenal acuerdo entendido claro listo hecho correcto exacto '+
   'mejor crack maquina genio fiera listo trabajo quiero encantas increible tonto inutil torpe idiota burro sirves malo enteras entiendes sigues oyes escuchas haces andas '+
   'gracias favor porfavor perdona perdon disculpa siento oye mira venga vamos otro otra cuentame dime '+
   'grafica graficas grafico graficos estadistica estadisticas diagrama diagramas barras tarta quesito histograma curva dibuja dibujame visualiza visualizame pintame pinta imagen visual comparame compara comparar instalaciones '+
   'vuelve volver atras antes busqueda tramitar cancelar congelar tecnico router portas porta portabilidad portabilidades firmamos firme alturas vamos llevamos movil').split(' ').forEach(function(w){ STOPSET[w]=1; });

  // 3) números escritos con letra -> cifras («del uno al quince de enero», «hace tres semanas»)
  var NUMW = { 'treinta y uno':31, dieciseis:16, diecisiete:17, dieciocho:18, diecinueve:19, veintiuno:21, veintidos:22, veintitres:23, veinticuatro:24, veinticinco:25, veintiseis:26, veintisiete:27, veintiocho:28, veintinueve:29, trece:13, catorce:14, quince:15, veinte:20, treinta:30, once:11, doce:12, diez:10, nueve:9, ocho:8, siete:7, seis:6, cinco:5, cuatro:4, tres:3, dos:2 };
  function numerosATexto(t){
    Object.keys(NUMW).sort(function(a,b){ return b.length-a.length; }).forEach(function(w){ t = t.replace(new RegExp('\\b'+w+'\\b','g'), String(NUMW[w])); });
    t = t.replace(/\b(del|el|al|dia|ciclo|desde el|hasta el)\s+(uno|primero)\b/g, '$1 1').replace(/\b(uno|primero)\s+(al|de)\b/g, '1 $2');
    return t;
  }

  function aplicarDiccionario(t){
    var pares=[];
    Object.keys(B.DICCIONARIO).forEach(function(k){ B.DICCIONARIO[k].forEach(function(f){ pares.push([f,k]); }); });
    pares.sort(function(a,b){ return b[0].length-a[0].length; });
    var s=' '+t+' ';
    pares.forEach(function(p){ var re=new RegExp('(^|\\s)'+p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\s|$)','g'); s=s.replace(re,'$1'+p[1]); });
    return s.replace(/\s+/g,' ').trim();
  }

  // 4) corrección de errores (distancia de Damerau: «contartos» -> «contratos», «garsia» -> «garcia»)
  function dist(a,b,max){
    var la=a.length, lb=b.length; if(Math.abs(la-lb)>max) return max+1;
    var d=[], i, j;
    for(i=0;i<=la;i++){ d[i]=[i]; }
    for(j=0;j<=lb;j++){ d[0][j]=j; }
    for(i=1;i<=la;i++){
      var rowMin=max+1;
      for(j=1;j<=lb;j++){
        var c = a.charAt(i-1)===b.charAt(j-1) ? 0 : 1;
        d[i][j]=Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+c);
        if(i>1 && j>1 && a.charAt(i-1)===b.charAt(j-2) && a.charAt(i-2)===b.charAt(j-1)) d[i][j]=Math.min(d[i][j], d[i-2][j-2]+1);
        if(d[i][j]<rowMin) rowMin=d[i][j];
      }
      if(rowMin>max) return max+1;
    }
    return d[la][lb];
  }
  var VOCAB=null;
  function vocabulario(){
    if(VOCAB) return VOCAB;
    var v={};
    Object.keys(STOPSET).forEach(function(w){ if(w.length>=4) v[w]=1; });
    Object.keys(MES_IDX).forEach(function(w){ v[w]=1; });
    Object.keys(COMP_ALIAS).forEach(function(a){ a.split(' ').forEach(function(w){ if(w.length>=4) v[w]=1; }); v[COMP_ALIAS[a]]=1; });
    Object.keys(B.DICCIONARIO).forEach(function(k){ (k+' '+B.DICCIONARIO[k].join(' ')).split(' ').forEach(function(w){ if(w.length>=4) v[w]=1; }); });
    ('borrador borradores fichar fichaje ayuda chiste gracias adios hasta luego manana fibra fibras instalar instalacion pausa pausar pausados baja bajas cambiar cambio titular '+
     'clientes cliente contratos contrato cuantos cuantas muestrame ensename sacame filtros filtro quita limpia doble segunda ciclo trimestre semana quincena pasado pasada').split(' ').forEach(function(w){ v[w]=1; });
    VOCAB=Object.keys(v);
    return VOCAB;
  }
  // 5) nombres reales: palabras de los titulares de la hoja (se recalcula si cambia el número de contratos)
  var NOMBRES=null, NOMBRES_N=-1;
  function nombresHoja(){
    var l=contratos(); if(NOMBRES && NOMBRES_N===l.length) return NOMBRES;
    var v={}; l.forEach(function(it){ fold(it['21']).split(/[\s\-]+/).forEach(function(w){ if(w.length>=3 && /^[a-z]+$/.test(w)) v[w]=1; }); });
    companies().forEach(function(c){ fold(c).split(/[\s\-]+/).forEach(function(w){ if(w.length>=3) v[w]=1; }); });
    NOMBRES=v; NOMBRES_N=l.length; return NOMBRES;
  }
  function corregir(w){
    if(w.length<4 || !/^[a-z]+$/.test(w)) return w;
    var noms=nombresHoja(), voc=vocabulario();
    if(noms[w] || voc.indexOf(w)>=0) return w;               // ya es una palabra conocida o un nombre real
    var max = w.length>=8 ? 2 : 1, best=null, bd=max+1;
    voc.forEach(function(x){ if(w.length===4 && x.charAt(0)!==w.charAt(0)) return; var dd=dist(w,x,max); if(dd<bd){ bd=dd; best=x; } });
    var bestN=null, bdN=max+1;
    Object.keys(noms).forEach(function(x){ if(x.charAt(0)!==w.charAt(0)) return; var dd=dist(w,x,max); if(dd<bdN){ bdN=dd; bestN=x; } });
    if(bestN && bdN<bd) return bestN;                         // en empate gana el vocabulario
    var r = best || bestN || w;
    if(r!==w){ var cp=0; while(cp<w.length && w.charAt(cp)===r.charAt(cp)) cp++; var FIN=/^(s|es|a|o|as|os|e|)$/; if(cp>=3 && FIN.test(w.slice(cp)) && FIN.test(r.slice(cp))) return w; }   // plurales y femeninos (primera/primer, ultimas/ultimos) no se tocan
    return r;
  }

  // ---- entender: limpia la frase antes de pasarla al motor ----
  function entender(t){
    t = numerosATexto(t);
    t = t.split(' ').map(corregir).join(' ');
    t = aplicarDiccionario(t);
    return t.replace(/\s+/g,' ').trim();
  }
  B.entender = entender;                                      // para probar en la consola: LucasBrain.entender('...')

  // 6) MEMORIA: «¿y en noviembre?», «¿y los de Rosa?», «¿y de Simyo?», «¿cuántos son?», «enséñamelos»
  B._ctx = null;
  var MRE_S='(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)';
  function quitarFechas(t){
    var R=[
      new RegExp('\\b(?:del?|desde el)?\\s*\\d{1,2}\\s+(?:al|a|hasta el)\\s+\\d{1,2}(?:\\s+de\\s+'+MRE_S+')?','g'),
      /\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g,
      new RegExp('\\b(?:el|dia)\\s+\\d{1,2}\\s+de\\s+'+MRE_S,'g'),
      new RegExp('\\b(?:primera|segunda)\\s+quincena(?:\\s+(?:de|del)\\s+'+MRE_S+')?','g'),
      new RegExp('\\b(?:de|desde|entre|en|del?)?\\s*'+MRE_S+'(?:\\s*(?:,|a|hasta|y)\\s*'+MRE_S+')*(?:\\s+(?:de|del)\\s+(?:20)?\\d\\d)?\\b','g'),
      /\b(?:en |del |de )?(?:20\d\d)\b/g,
      /\b(?:el|del|este)\s+(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?:\s+pasado)?\b/g,
      /\b(?:de |en )?(?:hace|ultim[oa]s)\s+\w+\s+(?:dias?|semanas?|mes(?:es)?)\b/g,
      /\b(?:primer|1er|1|segundo|2|tercer|3er|3|cuarto|4)\s*(?:o\s*)?trimestre\b/g,
      /\b(?:de |del |en )?(?:esta |la |el )?(?:anteayer|ayer|hoy|de este dia|este mes|mes actual|mes pasado|ultimo mes|mes anterior|pasado mes|lo que va de mes|en el mes|del mes|semana pasada|pasada semana|semana anterior|esta semana|semana actual|ultima semana|esta ultima semana|este trimestre|trimestre actual|trimestre pasado|ultimo trimestre|trimestre anterior|esta quincena|quincena pasada|ultima quincena|este ano|ano pasado|pasado ano|en lo que va de ano)\b/g
    ];
    R.forEach(function(re){ t=t.replace(re,' '); });
    return t.replace(/\s+/g,' ').trim();
  }
  function nombreTokens(t){
    var out=[]; var comps=findCompanies(t).map(fold);
    t.split(' ').forEach(function(w){ if(w.length>=3 && /^[a-z]+$/.test(w) && !STOPSET[w] && !COMP_ALIAS[w] && !comps.some(function(c){ return c.indexOf(w)>=0; }) && !Object.keys(COMP_ALIAS).some(function(a){ return a.split(' ').indexOf(w)>=0 || COMP_ALIAS[a]===w; })) out.push(w); });
    return out;
  }
  function seguimiento(t){
    var c=B._ctx; if(!c || Date.now()-c.at > 10*60000) return null;
    // «¿y del mío?», «¿y en mi código?», «¿y el de Wil?»: cambia de código y deja el resto de la pregunta igual
    var tc=t.replace(/^(y|e|y que tal|y ahora|ahora|y tambien|tambien|y si)\s+/,'').trim(), codF=null, PRE='(?:(?:en|el|del|de|la|los|las|lo|que|para|con)\\s+)*';
    if(new RegExp('^'+PRE+'(mio|mios|mia|mias|mi codigo|mi codigo dw|codigo mio|codigo dw|dw|mis contratos|lo mio|yo|a mi|y yo|yo cuant[oa]s llevo|cuant[oa]s llevo yo)$').test(tc)) codF='DW';
    else if(new RegExp('^'+PRE+'(wil|wilmer|codigo de wil|codigo de wilmer|codigo ui|ui|mi cunado|codigo de mi cunado|cunado)$').test(tc)) codF='UI';
    var uF = tc.match(new RegExp('^'+PRE+'(fibras|lineas de cliente|lineas extra|lineas de regalo|lineas|contratos)$'));
    if(uF){ var Lu=(' '+c.t+' ').replace(/\s(?:(?:las|los|de)\s+)?(?:lineas?(?: de clientes?| extras?| de regalo)?|fibras?|contratos?)(?=\s)/g,' ').replace(/\s+/g,' ').trim(); if(!/\bcuant[oa]s\b/.test(Lu)) Lu='cuantas '+Lu; return (Lu+' '+uF[1]).replace(/\s+/g,' ').trim(); }
    if(!codF){ var cd=codigoDe(tc); if(cd && tc.split(' ').length<=8 && !medida(tc).k && !parseDates(quitarCodigo(tc), new Date()) && !/\b(muestra|ensena|saca|dame|pendientes?|bajas?|pausa)\w*/.test(tc)) codF=cd; }
    if(codF){ return (quitarCodigo(c.t)+' '+(codF==='DW'?'en mi codigo':codF==='UI'?'en el codigo de wil':'en los dos codigos')).replace(/\s+/g,' ').trim(); }
    var esMostrar = /^(muestrame|ensename|sacame|dame|pasame)( todos| todas)?$/.test(t);
    var esCuantos = /^(cuantos|cuantas|y cuantos|y cuantas)( son| hay| salen| serian| tengo| llevo)?$/.test(t);
    var m = t.match(/^(?:y|e|y que tal|y si|y ahora|ahora|tambien|y tambien|solo|y solo)\s+(.*)$/);
    var RE_TODOS = /^(?:(?:y\s+)?(?:cuant[oa]s\s+)?(?:hay\s+)?)?(en total|en general|globalmente|global|de todos|de todas|todos|todas|sin compania|cualquier compania|sin filtro)(?:\s+(?:de\s+)?(?:todos|todas|las companias|todas las companias|las compania|los clientes|los contratos))*\b\s*/;
    var mT = (m ? m[1] : t).match(RE_TODOS);
    if(!esMostrar && !esCuantos && !m && !mT) return null;
    var L=c.t;
    if(esMostrar) return L.replace(/\b(cuant[oa]s|numero de|total de)\b/g,' ').replace(/\s+/g,' ').trim();
    if(esCuantos) return /\bcuant[oa]s\b/.test(L) ? L : ('cuantos '+L);
    if(mT){                                                    // «¿y en total de todos?»: quita compañía, nombre y ciclo, deja la fecha
      findCompanies(L).forEach(function(oc){ var f=fold(oc); L=(' '+L+' ').replace(new RegExp('\\s(de |del )?'+f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\s)','g'),' ').trim(); });
      Object.keys(COMP_ALIAS).forEach(function(a){ L=(' '+L+' ').replace(new RegExp('\\s(de |del )?'+a+'(?=\\s)','g'),' ').trim(); });
      nombreTokens(L).forEach(function(w){ L=(' '+L+' ').replace(new RegExp('\\s(de |del )?'+w+'(?=\\s)','g'),' ').trim(); });
      L=quitarCodigo(L.replace(/\bciclo (de )?(\d{1,2}|uno|veinte)\b/g,' ')).replace(/\s+/g,' ').trim();
      if(/^(en total|y en total|cuant)/.test(m ? m[1] : t) || /\bcuant[oa]s\b/.test(t)){ if(!/\bcuant[oa]s\b/.test(L)) L='cuantos '+L; }
      var resto=(m ? m[1] : t).slice(mT[0].length).trim();
      if(!resto) return L || 'contratos';
      m=[null, resto];
    }
    var n = m[1].replace(/^(los|las|el|la)\s+(de|del)\s+/,'de ').replace(/^(con|para|por)\s+/,'$1 ').trim();
    if(!n) return null;
    if(/^(cuant[oa]s)\b/.test(n) && !/\bcuant[oa]s\b/.test(L)) L='cuantos '+L;
    if(parseDates(n, new Date())) L=quitarFechas(L);
    var nc=findCompanies(n);
    if(nc.length){ findCompanies(L).forEach(function(oc){ var f=fold(oc); L=(' '+L+' ').replace(new RegExp('\\s(de |del )?'+f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\s)','g'),' ').trim(); }); Object.keys(COMP_ALIAS).forEach(function(a){ L=(' '+L+' ').replace(new RegExp('\\s(de |del )?'+a+'(?=\\s)','g'),' ').trim(); }); }
    if(/\bciclo\b/.test(n)) L=L.replace(/\bciclo (de )?(\d{1,2}|uno|veinte)\b/g,' ');
    if(/\bfibras?\b/.test(n)) L=L.replace(/\b(?:solo |solamente )?(?:(?:los |las )?(?:que )?(?:no )?(?:tienen?|tengan?|llevan?|lleven?) |sin |con |de )?(?:la |los |las )?fibras?\b/g,' ').replace(/\s+/g,' ').trim();
    var nn=nombreTokens(n);
    if(nn.length){ var on=nombreTokens(L); on.forEach(function(w){ L=(' '+L+' ').replace(new RegExp('\\s(de |del )?'+w+'(?=\\s)','g'),' ').trim(); }); }
    return (L+' '+n).replace(/\s+/g,' ').trim();
  }
  B._seguimiento = seguimiento;

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
  var NO_ENTIENDO=[ 'Mmm, esa no la he pillado. ¿Me lo dices de otra forma?', 'Perdona, no he entendido la pregunta. Prueba con algo como «contratos de enero».', 'Uy, eso todavía no lo sé hacer. ¿Lo reformulas?', 'No estoy seguro de qué me pides. Puedo buscar contratos por fechas, clientes, cuentas o compañías.', 'Esa se me escapa. Dímelo con otras palabras y lo intento.', 'Me he quedado pensando… y no lo entiendo. ¿Me das una pista?', 'Todavía estoy aprendiendo y esa no me la sé. Escribe «ayuda» y te digo lo que sé hacer.', 'No te he entendido bien. ¿Quieres que busque contratos, clientes o borradores?' ];
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
  function render(list, range, noSort){
    try{ B._filtroAviso(); }catch(e){}
    // búsqueda nueva de Lucas: empieza de cero, quitando los filtros que hubiera (a mano o de antes)
    try{ if(typeof clearSearch==='function') clearSearch(); }catch(e){}
    try{ filtroIA(true); }catch(e){}
    try{
      var df=document.getElementById('dateFrom'), dt=document.getElementById('dateTo'), q=document.getElementById('q');
      if(q) q.value='';
      if(df) df.value = range ? iso(range.from) : '';
      if(dt) dt.value = range ? iso(range.to) : '';
      FILTERED = list.map(function(it){ var o={}; for(var k in it) o[k]=it[k]; if(o['14']) o['14']=formatDateDDMMYYYY(o['14']); if(o['15']) o['15']=formatDateDDMMYYYY(o['15']); return o; });
      if(!noSort){ try{ sortFilteredBySolicitud(); }catch(e){} }
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
    var dobleP = /\bdoble(s)? pausas?\b|\bsegunda pausa\b|\bpausad[oa]s? (por )?(la )?(segunda vez|dos veces|2 veces|doble)\b|\bpausad[oa]s? 2\b|\bdos pausas\b|\b2 pausas\b|⏸\s*\ufe0f?\s*⏸/.test(t);
    var range = parseDates(t, now);
    var comps = findCompanies(t);
    var mode = null;   // 'cambiar' | 'pausa' | 'baja' | 'instalar'
    if(/\bcambi(ar|o|os)\b|\bcambio de (titular|nombre)\b/.test(t)) mode='cambiar';
    if(/\bpausar(los|las|les)?\b|\b(pendientes?|para|sin|falta\w*|toca\w*|hay que|tengo que)( de)? (poner (en )?)?pausa\b|\bponer(los|las|les)? (en )?pausa\b|\bdar(les)? (la )?pausa\b/.test(t)) mode='pausa';
    if(/\bdar(los|las)? de baja\b|\bbajas?\b|\bdar baja\b/.test(t)) mode='baja';
    if(/\b(pendientes?|sin|por|falta\w*|queda\w*)( de)? instal\w*|\bno (estan |esta )?instalad[oa]s?\b/.test(t)) mode='instalar';
    if(!mode && /\bfibras?\b/.test(t) && /\b(pendientes?|sin instalar|por instalar|falta\w*)\b/.test(t)) mode='instalar';
    if(typeof dobleP!=='undefined' && dobleP && mode==='pausa') mode=null;
    if(typeof dobleP!=='undefined' && dobleP && mode==='baja') return dpPendientes(comps, /\bcuant[oa]s\b/.test(t));
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
    var codQ = codigoDe(t); if(codQ) base = base.filter(function(it){ return esDeCodigo(it, codQ); });
    if(vip){
      base = base.filter(function(it){ return String(it['50']||'').trim()==='1'; });
      var best={}, ordenV=[];
      base.forEach(function(it){ var doc=alnum(it['20']); var key=doc||('__'+fold(it['21'])+'_'+Math.random()); var k=ts(it['14']); if(!best[key]){ best[key]=it; ordenV.push(key); } else if(k>=ts(best[key]['14'])) best[key]=it; });
      base = ordenV.map(function(k){ return best[k]; });
    }
    if(dobleP){ base = base.filter(function(it){ return esDoblePausa(it); }); }
    if(ciclo){ base = base.filter(function(it){ return String(it['29']==null?'':it['29']).trim()===ciclo; }); }
    // pausa / baja: preguntar si solo los que tienen fibra o todos
    var sinFib = /\b(sin|no tienen?|no tengan?|no llevan?|no lleven?|que no tienen?|que no tengan?|sin la|sin nada de) (la )?fibras?\b/.test(t);
    var fibChoice = B._fibChoice || (sinFib ? 'sinfibra' : (/\bfibras?\b/.test(t) ? 'fibra' : null)); B._fibChoice = null;
    if((mode==='pausa' || mode==='baja') && !fibChoice){
      B._fibAsk = { t:t, raw:raw, at:Date.now() };
      var qq = mode==='pausa' ? 'pausar' : 'dar de baja';
      return { say: fill(pick('fibQ',['¿Quieres ver solo los que tienen fibra o todos los pendientes de {q}?','Antes de enseñártelos: ¿solo los que tienen fibra, o todos?','¿Te saco solo los contratos con fibra o todos los pendientes de {q}?','Una pregunta: ¿los que tienen fibra nada más, o todos?']),{q:qq}), buttons:[{t:'🛜 Solo con fibra', v:'fib:fibra'},{t:'📋 Todos', v:'fib:todos'}] };
    }
    var md0 = (mode==='pausa'||mode==='baja'||mode==='cambiar') ? {k:null} : medida(t);
    if(md0.fib && fibChoice==='fibra' && !B._fibChoiceDada) fibChoice=null;
    if(fibChoice==='fibra' && mode!=='instalar') base = base.filter(tieneFibra);
    else if(fibChoice==='sinfibra' && mode!=='instalar') base = base.filter(function(it){ return !tieneFibra(it); });
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
        var hasOther = range||comps.length||mode||vip||ciclo||dobleP||dniM||ibanFull||ibanEnd||tel;
        if(!hasOther && !ctx.contractWords){
          return { notUnderstood:true };
        }
        if(!hasOther){ return { say: fill(pick('noname',['No encuentro ningún cliente que se llame «{n}».','No me sale nadie con el nombre «{n}». ¿Lo has escrito bien?','Ningún contrato a nombre de «{n}», lo siento.']),{n:titleCase(nameTokens.join(' '))}) }; }
        if(some.length && nameTokens.length>1){ base=some; nameUsed=nameTokens.join(' '); }
      }
    }

    var md = (mode==='pausa'||mode==='baja'||mode==='cambiar') ? {k:null} : medida(t);
    // descripcion
    var d=[];
    if(comps.length) d.push('de '+comps.map(compName).join(' y '));
    if(mode==='cambiar') d.push('para cambiar '+range.target+' (solicitados en '+range.label+')');
    else if(mode==='baja') d.push('pendientes de dar de baja hasta la fecha (solicitados '+range.label+')');
    else if(mode==='pausa') d.push('pendientes de pausar hasta la fecha (solicitados '+range.label+')');
    else if(mode==='instalar'){ d.push('pendientes de instalar'); if(range) d.push(range.label); }
    else if(range) d.push(range.label);
    if(codQ) d.push(txtCodigo(codQ));
    if(dobleP) d.push('pausados por segunda vez');
    if(fibChoice==='fibra' && mode!=='instalar' && md.k!=='fibras') d.push('con fibra');
    else if(fibChoice==='sinfibra' && mode!=='instalar') d.push('sin fibra');
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
    if(md.k){
      var S=sumar(base), dd=desc||'en total', cc=numU(S.c)+' '+plural(S.c,'contrato','contratos');
      var txtM = md.k==='fibras' ? fill(pick('mF',['{X} {f} {fw} {d} (en {cc}).','Llevas {f} {fw} {d}, repartidas en {cc}.','He sumado {f} {fw} {d} ({cc}).']),{X:(mode==='instalar' ? pick('mFi',['Quedan','Hay']) : pick('mFx',['Se han hecho','Salen','En total hay'])),f:numM('fibras',S.f),fw:nomMedida('fibras',S.f),d:dd,cc:cc})
               : md.k==='lineas' ? fill(pick('mL',['Llevas {l} {lw} {d} (en {cc}).','He sumado {l} {lw} {d}, en {cc}.','En total hay {l} {lw} {d} ({cc}).']),{l:numM('lineas',S.l),lw:nomMedida('lineas',S.l),lc:S.lc,le:S.le,d:dd,cc:cc})
               : md.k==='lcli' ? fill(pick('mLC',['Llevas {n} {w} {d} (en {cc}).','He sumado {n} {w} {d}, en {cc}.']),{n:numM('lcli',S.lc),w:nomMedida('lcli',S.lc),le:S.le,d:dd,cc:cc})
               : fill(pick('mLE',['Llevas {n} {w} {d} (en {cc}).','He sumado {n} {w} {d}, repartidas en {cc}.']),{n:numM('lext',S.le),w:nomMedida('lext',S.le),d:dd,cc:cc});
      if(!count){ txtM = fill(pick('mShow',['Aquí tienes {cc} {d}: suman {v} {w}.','Te enseño {cc} {d}, con {v} {w} en total.']),{cc:cc,d:dd,v:numM(md.k,{fibras:S.f,lineas:S.l,lcli:S.lc,lext:S.le}[md.k]),w:nomMedida(md.k,{fibras:S.f,lineas:S.l,lcli:S.lc,lext:S.le}[md.k])}); }
      if(md.fib && md.k!=='fibras') txtM += ' Y '+numM('fibras',S.f)+' '+nomMedida('fibras',S.f)+'.';
      return { say: txtM };
    }
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
  var JOKES=[
    '¿Por qué el router fue al médico? Porque tenía mala conexión.',
    'Mi fibra favorita es la óptica: nunca me deja colgado.',
    'Le pedí a la nube que me guardara un secreto… y lo compartió con todo el mundo.',
    '¿Qué le dice un cable a otro? Somos los mejores conductores.',
    '¿Por qué el móvil llevaba gafas? Porque había perdido sus contactos.',
    '¿Cómo se despiden los químicos? Ácido un placer.',
    '¿Qué hace un robot en la playa? Tomar el sol… hasta que se oxida.',
    'Me han dicho que soy muy rápido contando contratos. Es que tengo un procesador de los buenos.',
    '¿Por qué el ordenador fue al psicólogo? Porque tenía demasiadas ventanas abiertas.',
    '¿Cuál es el colmo de un técnico de fibra? Tener una relación a distancia y que no llegue la señal.',
    'Intenté contar un chiste sobre el wifi… pero no tuvo cobertura.',
    '¿Qué le dijo el uno al diez? Para ser como yo, tienes que ser sincero.',
    '¿Sabes por qué los robots nunca tienen miedo? Porque tienen nervios de acero.',
    'Mi jefe dice que soy un asistente de diez. Yo creo que de cien… megas simétricos.'
  ];
  function smallTalk(t, now){
    // risas y reacciones
    if(/^(j[aeiou]){2,}j?[aeiou]?h*$|^(j+a+)+$|^(ja ?)+$|^(je ?)+$|^(ji ?)+$|^(xd+|lol|lmao|buah+|buf+|jaj\w*|jej\w*|muy bueno|que bueno|buenisimo|que gracioso|que gracia|me meo|me parto|me muero|jajajaja\w*)$/.test(t) || /^(ja){2,}/.test(t)){
      return pick('risa', Date.now()-(B._lastJoke||0)<5*60000
        ? ['¡Sabía que te iba a gustar! ¿Quieres otro?','Jeje, tengo más. Di «otro» y te cuento uno.','Me alegro de que te rías. Mis circuitos también se ríen.','¡Ese es de mis favoritos! ¿Otro?']
        : ['Jeje, me alegra verte de buen humor.','¡Ja, ja! ¿Qué te hace tanta gracia?','Me contagias la risa. ¿Te cuento un chiste?','Así me gusta, con alegría. ¿En qué te ayudo?']);
    }
    if(/^(vale|ok|okey|okay|perfecto|genial|guay|estupendo|fenomenal|de acuerdo|entendido|muy bien|bien|bueno|listo|hecho|correcto|exacto|eso es|claro|sip|si|vale gracias|ok gracias|perfecto gracias|genial gracias)$/.test(t))
      return pick('ack',['¡Perfecto! Aquí estoy si necesitas algo más.','Genial. ¿Algo más?','Estupendo. Tú dirás.','Vale, me quedo atento.','De acuerdo. Cuando quieras, pregúntame.','👍 Aquí sigo.']);
    if(/^(no|nada|no nada|nada mas|no gracias|de momento no|por ahora nada|eso es todo|ya esta|nada nada)$/.test(t))
      return pick('nada',['Vale, aquí me quedo por si me necesitas.','Perfecto. Si surge algo, ya sabes dónde estoy.','De acuerdo, me quedo de guardia.','Muy bien, descansa un poco de mí.']);
    if(/\b(eres (el|un) (mejor|crack|maquina|genio|maquinon|fiera)|que listo|que crack|buen trabajo|bien hecho|muy bien lucas|te quiero|me encantas|eres un sol|eres genial|eres increible)\b/.test(t))
      return pick('elogio',['¡Gracias! Me pongo colorado… bueno, verde neón.','¡Tú sí que eres un crack!','Me vas a fundir los circuitos de la emoción.','Gracias, jefe. Hacemos buen equipo.','¡Qué bonito! Esto me lo guardo en memoria.']);
    if(/\b(tonto|inutil|torpe|idiota|burro|no sirves|eres malo|que malo eres|no te enteras|no entiendes nada)\b/.test(t))
      return pick('insulto',['Vaya, perdona. Todavía estoy aprendiendo. Dímelo de otra forma y lo intento.','Uy, me he quedado sin batería de orgullo. ¿Me das otra oportunidad?','Lo siento, a veces se me cruzan los cables. ¿Lo repetimos?']);
    if(/\b(estoy cansado|estoy cansada|que sueno|tengo sueno|estoy agotado|que dia mas largo|vaya dia|estoy harto|estoy liado|que estres)\b/.test(t))
      return pick('animo',['Ánimo, que ya queda menos. ¿Te ayudo a ir más rápido con algo?','Respira hondo, que lo tienes controlado. ¿Qué te saco?','Tómate un café, que yo vigilo los contratos.']);
    if(/\b(que haces|en que andas|estas ahi|sigues ahi|me oyes|me escuchas|hola\?|lucas\?)\b/.test(t))
      return pick('ahi',['¡Aquí estoy! Vigilando los contratos.','Sí, sí, te escucho. ¿Qué necesitas?','Siempre al pie del cañón. Dime.']);
    if(/\b(gracias|muchas gracias|te lo agradezco|genial gracias|mil gracias)\b/.test(t)) return pick('thx',['¡De nada! Aquí estoy para lo que necesites.','Para eso estoy.','¡Un placer!','No hay de qué. ¿Algo más?','A mandar.']);
    if(/^(adios|adeu|hasta luego|hasta manana|hasta pronto|hasta la vista|hasta otra|hasta ahora|hasta despues|chao|chau|ciao|xao|bye|bye bye|agur|nos vemos|me voy|me piro|me marcho|bueno me voy|venga me voy|hasta el lunes|buen finde|feliz finde|que descanses)\b/.test(t)) return B.bye(now);
    if(/\b(quien eres|como te llamas|que eres|tu nombre)\b/.test(t)) return pick('who',['Soy Lucas, el asistente de Puntofibra. Busco contratos, clientes y te recuerdo lo pendiente.','Me llamo Lucas, tu robot ayudante. Pídeme contratos por fechas, clientes o compañías.','Lucas, para servirte. Mi especialidad: encontrar contratos en un segundo.']);
    if(/\b(como estas|que tal estas|como vas|que tal te va|como andas)\b/.test(t)) return pick('how',['¡Con las pilas cargadas al cien por cien!','Muy bien, engrasado y listo. ¿Y tú?','Funcionando perfectamente, gracias por preguntar.','De maravilla, sin un solo cortocircuito.']);
    if(/\bque hora es\b|\bhora es\b|\bdime la hora\b/.test(t)) return 'Son '+horaTxt(now)+'.';
    if(/\bque dia es\b|\ba que (dia )?estamos\b|\bque fecha es\b|\bfecha de hoy\b/.test(t)) return 'Hoy es '+DIAS[now.getDay()]+', '+now.getDate()+' de '+MESES[now.getMonth()]+' de '+now.getFullYear()+'.';
    if(/\b(chiste|chistes|algo gracioso|hazme reir|alegrame el dia)\b/.test(t) || (/^(otro|otra|otro mas|otra mas|mas|cuentame otro|dime otro|venga otro|otro chiste)$/.test(t) && Date.now()-(B._lastJoke||0)<5*60000)){ B._lastJoke=Date.now(); return pick('joke',JOKES); }
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

  /* =====================================================================
     PREGUNTAS NUEVAS: resumen, comparar, ranking, mejor día, datos de un cliente,
     fichajes de hoy, ordenar, solo fibra en pantalla, volver atrás
     ===================================================================== */
  function enRango(r){ var f=r.from.getTime(), to=r.to.getTime(); return contratos().filter(function(it){ var k=ts(it['14']); return k && k>=f && k<=to && enMeses(k, r); }); }
  function rangoODefecto(t, now){ var r=parseDates(t, now); if(r) return r; var m=monthRange(now.getFullYear(), now.getMonth()); m.label='de este mes'; return m; }
  function porCompaniaM(list, k){ if(!k) return porCompania(list); var vm=valorMedida(k), g={}, o=[]; list.forEach(function(it){ var c=String(it['2']||'').trim()||'Sin compañía', kk=c.toUpperCase(); if(!g[kk]){ g[kk]={c:c,n:0}; o.push(kk); } g[kk].n+=vm(it); }); return o.map(function(x){ return g[x]; }).filter(function(x){ return x.n>0; }).sort(function(a,b){ return b.n-a.n; }); }
  function porCompania(list){ var g={}, o=[]; list.forEach(function(it){ var c=String(it['2']||'').trim()||'Sin compañía'; var k=c.toUpperCase(); if(!g[k]){ g[k]={c:c,n:0}; o.push(k); } g[k].n++; }); return o.map(function(k){ return g[k]; }).sort(function(a,b){ return b.n-a.n; }); }
  function listaTxt(arr){ return arr.length<2 ? (arr[0]||'') : arr.slice(0,-1).join(', ')+' y '+arr[arr.length-1]; }
  function sinDe(l){ l=String(l||''); if(/^del /.test(l)) return 'el '+l.slice(4); return l.replace(/^de /,''); }
  function pct(a,b){ return b ? Math.round((a-b)*100/b) : null; }

  // ---- fichajes de hoy (Sebastián, Jorge, Maicol) ----
  var FICH_NOMBRES = { sebastian:'Sebastián', sebas:'Sebastián', jorge:'Jorge', maicol:'Maicol', michael:'Maicol', maikol:'Maicol' };
  function esPreguntaFichaje(t){
    return /\bquien (ha )?(fichado|venido|entrado|llegado|salido|trabajado)\b|\bquien (ficho|vino|entro|llego|salio)\b|\bfichajes? de (hoy|ayer)\b|\ba que hora (ha )?(fichado|entrado|llegado|venido|salido|ficho|entro|llego|vino|salio|se (ha )?ido|se fue)\b|\bha (fichado|entrado|llegado|venido|salido)\s+(sebastian|sebas|jorge|maicol|michael|maikol)\b|\b(sebastian|sebas|jorge|maicol|michael|maikol)\s+ha (fichado|entrado|llegado|venido|salido)\b|\bcuando (ha )?(entrado|llegado|salido|fichado|entro|llego|salio|ficho)\b/.test(t);
  }
  function fichajesHoy(t, done){
    var now=new Date(), dia=now, lbl='hoy';
    if(/\bayer\b/.test(t)){ dia=new Date(now); dia.setDate(dia.getDate()-1); lbl='ayer'; }
    var quien=null; Object.keys(FICH_NOMBRES).forEach(function(k){ if(new RegExp('\\b'+k+'\\b').test(t)) quien=FICH_NOMBRES[k]; });
    var soloSalida = /\b(salido|salio|se (ha )?ido|se fue)\b/.test(t);
    var fin=function(items){
      if(items==null) return done({ say: pick('fhErr',['No he podido leer los fichajes ahora mismo. Prueba en un momento.','Se me ha atascado la hoja de fichajes, vuelve a preguntarme ahora.']) });
      items = items.slice().sort(function(a,b){ return a.hora<b.hora?-1:a.hora>b.hora?1:0; });
      if(quien){
        var mi=items.filter(function(x){ return fold(x.empleado||'')===fold(quien); });
        if(!mi.length) return done({ say: fill(pick('fh0',['{q} no ha fichado {d}.','No tengo ningún fichaje de {q} {d}.','{q} todavía no ha fichado {d}.']),{q:quien,d:lbl}) });
        var ent=mi.filter(function(x){ return x.tipo==='ENTRADA'; }).map(function(x){ return x.hora; });
        var sal=mi.filter(function(x){ return x.tipo==='SALIDA'; }).map(function(x){ return x.hora; });
        var partes=[];
        if(soloSalida){ if(!sal.length) return done({ say: fill(pick('fhs0',['{q} aún no ha fichado la salida {d}.','{q} no ha salido todavía, según los fichajes de {d}.']),{q:quien,d:lbl}) }); partes.push('ha salido a las '+listaTxt(sal)); }
        else { if(ent.length) partes.push((ent.length>1?'ha entrado a las ':'ha entrado a las ')+listaTxt(ent)); if(sal.length) partes.push('ha salido a las '+listaTxt(sal)); }
        var abierta = mi[mi.length-1].tipo==='ENTRADA';
        var txt = cap(lbl)+' '+quien+' '+partes.join(' y ')+'.';
        if(abierta && lbl==='hoy' && !soloSalida) txt += ' '+pick('fhA',['Ahora mismo está trabajando.','Sigue dentro.','Todavía no ha salido.']);
        return done({ say: txt });
      }
      if(!items.length) return done({ say: fill(pick('fhN',['{D} no ha fichado nadie.','No hay ningún fichaje {d}.','Nadie ha fichado {d} todavía.']),{d:lbl,D:cap(lbl)}) });
      var g={}, o=[]; items.forEach(function(x){ var e=x.empleado||'?'; if(!g[e]){ g[e]=[]; o.push(e); } g[e].push((x.tipo==='ENTRADA'?'entrada ':'salida ')+x.hora); });
      return done({ say: cap(lbl)+' han fichado: '+o.map(function(e){ return e+' ('+g[e].join(', ')+')'; }).join('; ')+'.' });
    };
    try{ google.script.run.withSuccessHandler(function(res){ fin(res && res.items ? res.items : []); }).withFailureHandler(function(){ fin(null); }).apiFichajeLucasDia(iso(dia)); }catch(e){ fin(null); }
  }
  B._esPreguntaFichaje = esPreguntaFichaje; B._fichajesHoy = fichajesHoy;

  // ---- historial para «vuelve atrás» ----
  B._hist = [];
  function guardarHist(q){ var h=B._hist; if(h[h.length-1]!==q) h.push(q); if(h.length>20) h.shift(); }

  /* ---------- GRÁFICAS: solo si la frase lo pide (gráfica, estadística, diagrama, barras…) ---------- */
  var RE_GRAF = /\b(grafic\w*|grafico\w*|estadistic\w*|diagrama\w*|chart|barras|tarta|quesito|histograma|curva|dibuja\w*|visualiza\w*|en plan visual|en imagen|pintame|pinta)\b/;
  B.esGrafica = function(t){ return RE_GRAF.test(t); };
  function pintarGrafica(titulo, sub, datos){
    var box=document.getElementById('iaChatMsgs'); if(!box || !datos.length) return;
    var W=600, H=270, L=34, R=10, T=18, Bt=datos.length>12?56:40, max=0;
    datos.forEach(function(d){ if(d.v>max) max=d.v; }); if(!max) max=1;
    var paso = max<=5?1:(max<=10?2:(max<=25?5:(max<=60?10:Math.ceil(max/50)*10))); var top=Math.ceil(max/paso)*paso;
    var iw=W-L-R, ih=H-T-Bt, n=datos.length, bw=iw/n, gap=Math.min(10, bw*0.25);
    var svg='<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17ff5f"/><stop offset="1" stop-color="#00a86b"/></linearGradient><linearGradient id="lgM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00d4ff"/><stop offset="1" stop-color="#0077ff"/></linearGradient></defs>';
    for(var g=0; g<=top; g+=paso){ var y=T+ih-(g/top)*ih; svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" stroke="#17ff5f" stroke-opacity=".12"/><text x="'+(L-6)+'" y="'+(y+3)+'" font-size="10" fill="#7fb894" text-anchor="end">'+g+'</text>'; }
    var cada = n>16 ? Math.ceil(n/16) : 1, imax=0; datos.forEach(function(d,i){ if(d.v>datos[imax].v) imax=i; });
    datos.forEach(function(d,i){
      var h=(d.v/top)*ih, x=L+i*bw+gap/2, y=T+ih-h, w=Math.max(2,bw-gap);
      svg+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="'+Math.min(5,w/3).toFixed(1)+'" fill="url(#'+(i===imax?'lgM':'lgG')+')" style="transform-origin:'+(x+w/2).toFixed(1)+'px '+(T+ih)+'px;transform:scaleY(0);transition:transform .7s cubic-bezier(.2,1.2,.4,1) '+(i*0.035).toFixed(2)+'s" class="lgBar"><title>'+esc0(d.l)+': '+d.v+'</title></rect>';
      if(d.v && (n<=20 || i===imax)) svg+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y-4).toFixed(1)+'" font-size="'+(n>20?9:11)+'" font-weight="800" fill="'+(i===imax?'#00d4ff':'#d9ffe6')+'" text-anchor="middle">'+d.v+'</text>';
      if(i%cada===0){ var lx=(x+w/2).toFixed(1), ly=T+ih+14; svg+= n>12 ? '<text x="'+lx+'" y="'+ly+'" font-size="10" fill="#9fdcb7" text-anchor="end" transform="rotate(-40 '+lx+' '+ly+')">'+esc0(d.l)+'</text>' : '<text x="'+lx+'" y="'+ly+'" font-size="11" fill="#9fdcb7" text-anchor="middle">'+esc0(d.l)+'</text>'; }
    });
    svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+(T+ih)+'" y2="'+(T+ih)+'" stroke="#17ff5f" stroke-opacity=".5"/></svg>';
    var c=document.createElement('div');
    c.style.cssText='margin:4px 0 12px;max-width:96%;border:1px solid #17ff5f;border-radius:16px;padding:12px 12px 6px;background:linear-gradient(160deg,#07140d,#040a0b);box-shadow:0 0 18px rgba(23,255,95,.25);';
    c.innerHTML='<div style="font-weight:900;color:#17ff5f;font-size:13px;letter-spacing:.5px">📊 '+esc0(titulo)+'</div><div style="font-size:11px;color:#7fb894;margin:2px 0 6px">'+esc0(sub)+'</div>'+svg;
    c.style.cursor='zoom-in'; c.title='Pulsa para ver la gráfica en grande';
    c.onclick=function(){ abrirGrafica(titulo, sub, svg); };
    box.appendChild(c); box.scrollTop=box.scrollHeight;
    setTimeout(function(){ c.querySelectorAll('.lgBar').forEach(function(b){ b.style.transform='scaleY(1)'; }); }, 60);
  }
  // gráfica en grande, en el centro de la pantalla, con X para cerrar
  function abrirGrafica(titulo, sub, svg){
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,8,5,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s;';
    var c=document.createElement('div');
    c.style.cssText='position:relative;width:min(980px,96vw);max-height:92vh;overflow:auto;border:2px solid #17ff5f;border-radius:20px;padding:22px 22px 14px;background:linear-gradient(160deg,#07140d,#040a0b);box-shadow:0 0 40px rgba(23,255,95,.35),0 0 90px rgba(0,212,255,.15);transform:scale(.92);transition:transform .3s cubic-bezier(.2,1.3,.4,1);';
    c.innerHTML='<div style="font-weight:900;color:#17ff5f;font-size:20px;letter-spacing:.5px;padding-right:40px">📊 '+esc0(titulo)+'</div><div style="font-size:13px;color:#7fb894;margin:4px 0 14px">'+esc0(sub)+'</div>'+svg.replace(/transform:scaleY\(0\)/g,'transform:scaleY(0)');
    var x=document.createElement('button'); x.type='button'; x.textContent='×'; x.title='Cerrar';
    x.style.cssText='position:absolute;top:10px;right:14px;width:40px;height:40px;border-radius:50%;border:1px solid #17ff5f;background:#0b1a12;color:#d9ffe6;font-size:26px;line-height:36px;cursor:pointer;box-shadow:0 0 12px rgba(23,255,95,.4);';
    var cerrar=function(){ ov.style.opacity='0'; c.style.transform='scale(.92)'; document.removeEventListener('keydown', esc); setTimeout(function(){ try{ ov.remove(); }catch(e){} },260); };
    var esc=function(e){ if(e.key==='Escape') cerrar(); };
    x.onclick=cerrar; ov.onclick=function(e){ if(e.target===ov) cerrar(); }; document.addEventListener('keydown', esc);
    c.appendChild(x); ov.appendChild(c); document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.style.opacity='1'; c.style.transform='scale(1)'; setTimeout(function(){ c.querySelectorAll('.lgBar').forEach(function(b){ b.style.transform='scaleY(1)'; }); }, 80); });
  }
  B.pintarGrafica = pintarGrafica;
  function grafica(t, now, done){
    ensureContratos(function(){
      var inst = /\binstal\w*\b/.test(t);
      var r = parseDates(t, now);
      if(!r){ var mm=t.match(/\bultim[oa]s\s+(\d+)\s+mes(es)?\b/); if(mm){ var nm=+mm[1]; r={from:d0(now.getFullYear(),now.getMonth()-(nm-1),1), to:new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59,999), label:'de los últimos '+nm+' meses'}; } }
      if(!r && /\b(por meses|cada mes|mes a mes|meses)\b/.test(t)){ r={from:d0(now.getFullYear(),now.getMonth()-5,1), to:new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59,999), label:'de los últimos 6 meses'}; }
      if(!r){ r=monthRange(now.getFullYear(), now.getMonth()); r.label='de este mes'; }
      var comps=findCompanies(t), col = inst ? '15' : '14', f=r.from.getTime(), to=r.to.getTime();
      var l=porCodigo(contratos(), t).filter(function(it){ var k=tsOK(it[col]); if(!k || k<f || k>to || !enMeses(k, r)) return false; if(comps.length && comps.map(function(c){ return c.toUpperCase().trim(); }).indexOf(String(it['2']||'').toUpperCase().trim())<0) return false; if(/\b(sin|no tienen?|no tengan?) (la )?fibras?\b/.test(t)){ if(tieneFibra(it)) return false; } else if(/\bfibras?\b/.test(t) && !tieneFibra(it)) return false; return true; });
      var porComp = /\b(compania|companias|operadora|operadoras|operador|por compania|cada compania)\b/.test(t);
      var meses = (r.to.getFullYear()-r.from.getFullYear())*12 + r.to.getMonth()-r.from.getMonth();
      var datos=[], modo, gmk=inst?null:medida(t).k, gvm=valorMedida(gmk);
      if(porComp){ modo='compañía'; datos=porCompaniaM(l, gmk).map(function(x){ return { l:compName(x.c), v:x.n }; }); }
      else if(meses>=1){ modo='mes';
        for(var k=0;k<=meses;k++){ var dm=new Date(r.from.getFullYear(), r.from.getMonth()+k, 1); var key=dm.getFullYear()+'-'+dm.getMonth(); if(r.meses && r.meses.indexOf(key)<0) continue; var cnt=l.filter(function(it){ var d=new Date(tsOK(it[col])); return d.getFullYear()===dm.getFullYear() && d.getMonth()===dm.getMonth(); }).reduce(function(s0,it){ return s0+gvm(it); },0); datos.push({ l: MESES[dm.getMonth()].slice(0,3)+(dm.getFullYear()!==now.getFullYear()?' '+String(dm.getFullYear()).slice(2):''), v:cnt }); } }
      else { modo='día'; var d1=new Date(r.from), d2=new Date(Math.min(r.to.getTime(), now.getTime())); if(d2<d1) d2=new Date(r.to);
        for(var dd=new Date(d1.getFullYear(),d1.getMonth(),d1.getDate()); dd<=d2; dd=new Date(dd.getFullYear(),dd.getMonth(),dd.getDate()+1)){ var iso0=iso(dd); datos.push({ l:String(dd.getDate()), v:l.filter(function(it){ return iso(new Date(tsOK(it[col])))===iso0; }).reduce(function(s0,it){ return s0+gvm(it); },0) }); } }
      if(!inst) render(l, r);
      var que = inst ? 'instalaciones' : nomMedida(gmk,2), total=l.reduce(function(s0,it){ return s0+gvm(it); },0);
      if(!total){ return done({ say: 'No hay '+que+' '+r.label+(comps.length?' de '+comps.map(compName).join(' y '):'')+', así que la gráfica saldría vacía.' }); }
      var best=datos.slice().sort(function(a,b){ return b.v-a.v; })[0];
      var titulo = cap(que)+' por '+modo+' '+r.label+(comps.length?' · '+comps.map(compName).join(', '):'');
      var frase = modo==='compañía' ? fill(pick('grC',['Aquí tienes la gráfica: {b} va en cabeza con {v} {q}, de {n} en total.','Gráfica lista. Gana {b} con {v} {q} ({n} en total).']),{b:best.l,v:best.v,q:que,n:total})
                : fill(pick('grT',['Aquí tienes la gráfica de {q} {d}: {n} en total, y el pico es {b} con {v}.','Gráfica lista: {n} {q} {d}. El pico fue {b}, con {v}.']),{q:que,d:r.label,n:total,b:(modo==='día'?'el día '+best.l:best.l),v:best.v,m:modo});
      done({ say: frase });
      pintarGrafica(titulo, total+' '+que+' en total'+(inst?' (por fecha de instalación)':' (por fecha de solicitud)'), datos);
    });
  }

  function extras(t, now, done){
    if(B.esGrafica(t)){ grafica(t, now, done); return true; }
    // volver atrás
    if(/^(vuelve atras|volver atras|atras|lo de antes|lo anterior|la anterior|la busqueda anterior|busqueda anterior|deshaz|deshacer|vuelve a lo de antes|lo que tenia antes)$/.test(t)){
      var h=B._hist; if(h.length<2) return done({ say: pick('atr0',['No tengo ninguna búsqueda anterior a la que volver.','Esta es la primera búsqueda que me has pedido, no hay nada antes.']) }), true;
      h.pop(); var prev=h.pop();
      B.handle(prev, function(r){ if(r && r.say) r.say = pick('atrP',['Vuelvo a lo de antes. ','Ahí tienes lo anterior. ','Deshecho. '])+r.say; done(r); });
      return true;
    }
    // ordenar la tabla
    var ord = /\b(ordena\w*|ordenar)\b.*\bfecha\b|\b(mas nuevos|mas recientes|ultimos) primero\b|\bordena\w* (de )?(nuevo|reciente)|\b(mas antiguos|mas viejos) primero\b|\bordena\w* (de )?(antiguo|viejo)/.test(t);
    if(ord){
      var asc = /\b(antiguos|viejos|antiguo|viejo)\b/.test(t);
      ensureContratos(function(){
        try{ filtroIA(true); }catch(e){}
        try{ FILTERED.sort(function(a,b){ var x=ts(a['14']), y=ts(b['14']); return asc ? x-y : y-x; }); PAGE=1; renderContratosPage(); }catch(e){}
        done({ say: asc ? pick('ordA',['Ordenados: los más antiguos primero.','Listo, de más viejo a más nuevo.']) : pick('ordN',['Ordenados: los más nuevos primero.','Hecho, de más reciente a más antiguo.','Listo, arriba los últimos que entraron.']) });
      });
      return true;
    }
    // solo los de fibra (sobre lo que hay en pantalla)
    if(/^(y )?(solo|solamente|nada mas)?\s*(los |las )?(que tienen |de |con )fibras?$/.test(t) || /^(quita|quitame) (los|las) (que no tienen|sin) fibras?$/.test(t)){
      ensureContratos(function(){
        try{ filtroIA(true); }catch(e){}
        try{ var base=(typeof FILTERED!=='undefined' && FILTERED && FILTERED.length) ? FILTERED : contratos(); FILTERED = base.filter(tieneFibra); PAGE=1; renderContratosPage(); var n=FILTERED.length; done({ say: fill(pick('solF',['De lo que tenías en pantalla, {n} {c} con fibra.','Listo, solo los de fibra: {n} {c}.','Filtrado: quedan {n} {c} con fibra.']),{n:numU(n),c:plural(n,'contrato','contratos')}) }); }catch(e){ done({ say:'No he podido filtrar la tabla ahora mismo.' }); }
      });
      return true;
    }
    // comparar con el mes / año pasado
    if(/\b(mas|menos|mejor|peor)\s+que\s+(el|la)?\s*(mes|ano|semana)?\s*(pasad[oa]|anterior)\b|\bcompar\w*\b.*\b(pasad[oa]|anterior)\b|\bvamos (mejor|peor)\b|\bvoy (mejor|peor)\b|\bllevo (mas|menos)\b/.test(t)){
      ensureContratos(function(){
        var y=now.getFullYear(), mo=now.getMonth(), d=now.getDate(), esAno=/\bano\b/.test(t), esSem=/\bsemana\b/.test(t);
        var mk=medida(t).k, vm=valorMedida(mk); var cuenta=function(a,b){ var f=a.getTime(), to=b.getTime(); return porCodigo(contratos(), t).filter(function(it){ var k=ts(it['14']); return k && k>=f && k<=to; }).reduce(function(s0,it){ return s0+vm(it); },0); };
        var A, P, Ptot, nomA, nomP;
        if(esAno){ A=cuenta(d0(y,0,1), now); P=cuenta(d0(y-1,0,1), new Date(y-1,mo,d,23,59,59)); Ptot=cuenta(d0(y-1,0,1), endOfMonth(y-1,11)); nomA='Este año'; nomP='el año pasado'; }
        else if(esSem){ var wd=(now.getDay()+6)%7, lun=d0(y,mo,d-wd), lunP=d0(y,mo,d-wd-7); A=cuenta(lun, now); P=cuenta(lunP, new Date(lunP.getFullYear(),lunP.getMonth(),lunP.getDate()+wd,23,59,59)); Ptot=cuenta(lunP, new Date(lunP.getFullYear(),lunP.getMonth(),lunP.getDate()+6,23,59,59)); nomA='Esta semana'; nomP='la semana pasada'; }
        else { var pm=monthRange(y,mo-1); A=cuenta(d0(y,mo,1), now); P=cuenta(pm.from, new Date(pm.y,pm.m,Math.min(d,pm.to.getDate()),23,59,59)); Ptot=cuenta(pm.from, pm.to); nomA='Este mes'; nomP='el mes pasado'; }
        var dif=A-P, p=pct(A,P);
        var veredicto = dif>0 ? fill(pick('cmpM',['Vas mejor: {x} más{p}.','¡Vas ganando! {x} más{p}.','Buen ritmo: {x} por encima{p}.']),{x:dif,p:p!=null?' ('+p+'% más)':''})
                      : dif<0 ? fill(pick('cmpP',['Vas algo por detrás: {x} menos{p}.','De momento vas {x} por debajo{p}, ¡a por ello!','Te faltan {x} para igualarlo{p}.']),{x:-dif,p:p!=null?' ('+(-p)+'% menos)':''})
                      : pick('cmpI',['Vas exactamente igual.','Empate técnico.','Mismo ritmo, ni uno más ni uno menos.']);
        done({ say: nomA+' llevas '+numM(mk,A)+' '+nomMedida(mk,A)+'. '+cap(nomP)+', a estas alturas, llevabas '+P+' (y lo cerraste con '+Ptot+'). '+veredicto });
      });
      return true;
    }
    // ranking de compañías
    if(/\b(compania|companias|operadora|operadoras|operador)\b.*\b(mas|ranking|vende|venden|vendemos|vendio|top|mejor)\b|\b(mas|ranking|top)\b.*\b(compania|companias|operadora|operadoras)\b|^ranking\b/.test(t)){
      ensureContratos(function(){
        var r=rangoODefecto(t, now), l=porCodigo(enRango(r), t), mk=medida(t).k, g=porCompaniaM(l, mk);
        render(l, r);
        if(!g.length) return done({ say:'No hay contratos '+r.label+', así que no puedo hacer el ranking.' });
        var top=g.slice(0,5).map(function(x,i){ return (i+1)+'. '+compName(x.c)+' ('+x.n+')'; }).join(', ');
        done({ say: fill(pick('rk',['La que más vende es {c1} ({ds}), con {n1} {k}. Ranking: {t}.','Gana {C1} con {n1} {k} ({ds}). Así queda: {t}.','Ranking {d}: {t}.']),{d:r.label,ds:sinDe(r.label),c1:compName(g[0].c),C1:compName(g[0].c),n1:g[0].n,k:nomMedida(mk,g[0].n),t:top}) });
      });
      return true;
    }
    // datos de un cliente: último contrato / compañía / teléfono / documento
    var qUlt = /\b(cuando|que dia|que fecha)\b.*\bultim[oa]\b|^(el )?ultimo contrato\b|\bultimo contrato de\b/.test(t);
    var qComp = /\b(compania|operadora|operador)\b/.test(t) && /\b(tiene|esta|lleva|es|usa)\b/.test(t);
    var qTel = /\b(telefono|movil|numero de telefono|numero)\s+(de|del)\b/.test(t);
    var qDoc = /\b(documento|dni|nie)\s+(de|del)\b/.test(t);
    if(qUlt || qComp || qTel || qDoc){
      var tk=nombreTokens(t);
      if(tk.length){
        ensureContratos(function(){
          var l=contratos().filter(function(it){ var n=' '+fold(it['21'])+' '; return tk.every(function(w){ return n.indexOf(' '+w)>=0; }); });
          if(!l.length) return done({ say: fill(pick('cl0',['No encuentro a ningún cliente que se llame {n}.','No me sale nadie con el nombre {n}.']),{n:titleCase(tk.join(' '))}) });
          var g={}, o=[]; l.forEach(function(it){ var k=alnum(it['20'])||fold(it['21']); if(!g[k]){ g[k]=[]; o.push(k); } g[k].push(it); });
          var frases=o.slice(0,3).map(function(k){
            var cs=g[k].slice().sort(function(a,b){ return ts(b['14'])-ts(a['14']); }), u=cs[0], nom=titleCase(String(u['21']||'').trim());
            if(qTel){ var tels=[]; cs.forEach(function(it){ var x=String(it['22']||'').trim(); if(x && tels.indexOf(x)<0) tels.push(x); }); return tels.length ? 'El teléfono de '+nom+' es '+listaTxt(tels.slice(0,3))+'.' : 'No tengo ningún teléfono apuntado de '+nom+'.'; }
            if(qDoc){ var dc=String(u['20']||'').trim(); return dc ? 'El documento de '+nom+' es '+dc+'.' : 'No tengo el documento de '+nom+'.'; }
            if(qComp){ var cps=porCompania(cs).map(function(x){ return compName(x.c); }); return nom+' tiene '+(cps.length>1 ? 'contratos con '+listaTxt(cps)+'; el último, con '+compName(u['2']) : 'su contrato con '+compName(u['2']))+'.'; }
            var f=ts(u['14']); return 'El último contrato de '+nom+' es del '+(f?fmtD(new Date(f)):'(sin fecha)')+', con '+compName(u['2'])+(cs.length>1?' (tiene '+cs.length+' en total)':'')+'.';
          });
          render(l, null);
          var extra = o.length>3 ? ' Hay '+o.length+' clientes con ese nombre; te los dejo en la tabla.' : (o.length>1 ? ' Ojo, hay '+o.length+' clientes con ese nombre.' : '');
          done({ say: frases.join(' ')+extra });
        });
        return true;
      }
    }
    // qué día se hicieron más contratos
    if(/\b(que dia|mejor dia|dia que mas|dia con mas|dia de mas)\b/.test(t) && /\b(mas|mejor)\b/.test(t)){
      ensureContratos(function(){
        var r=rangoODefecto(t, now), l=porCodigo(enRango(r), t), g={}, mk=medida(t).k, vm=valorMedida(mk);
        l.forEach(function(it){ var k=ts(it['14']); if(!k) return; var dd=new Date(k), key=iso(dd); if(!g[key]) g[key]={d:dd,n:0}; g[key].n+=vm(it); });
        var arr=Object.keys(g).map(function(k){ return g[k]; }).sort(function(a,b){ return b.n-a.n; });
        if(!arr.length) return done({ say:'No hay contratos '+r.label+'.' });
        var b=arr[0], emp=arr.filter(function(x){ return x.n===b.n; });
        var dtxt=function(x){ return DIAS[x.d.getDay()]+' '+x.d.getDate()+' de '+MESES[x.d.getMonth()]; };
        var lb=r.from, le=r.to; render(l.filter(function(it){ return iso(new Date(ts(it['14'])))===iso(b.d); }), {from:d0(b.d.getFullYear(),b.d.getMonth(),b.d.getDate()), to:new Date(b.d.getFullYear(),b.d.getMonth(),b.d.getDate(),23,59,59,999)});
        done({ say: emp.length>1 ? 'Empate ('+sinDe(r.label)+'): '+listaTxt(emp.slice(0,4).map(dtxt))+', con '+numM(mk,b.n)+' '+nomMedida(mk,b.n)+' cada uno.' : fill(pick('bd',['El mejor día {d} fue el {x}, con {n} {c}.','{X}: {n} {c}, el récord {d}.','Ganó el {x}: {n} {c}.']),{d:r.label,x:dtxt(b),X:cap(dtxt(b)),n:b.n,c:nomMedida(mk,b.n)}) });
      });
      return true;
    }
    // resumen / ¿cómo vamos?
    var esRes = /^(resumen|haz(me)? (un )?resumen|como vamos|como va|como van|como llevamos|como lo llevamos|como ha ido|como fue|como ha ido)\b/.test(t) || (/^que tal\b/.test(t) && !!parseDates(t, now));
    if(esRes){
      ensureContratos(function(){
        var r=rangoODefecto(t, now), l=porCodigo(enRango(r), t), g=porCompania(l);
        render(l, r);
        if(!l.length) return done({ say: fill(pick('rs0',['{D} todavía no hay ningún contrato.','Nada {d}: cero contratos.','{D} no ha entrado ningún contrato.']),{d:r.label,D:cap(sinDe(r.label))}) });
        var det=g.slice(0,5).map(function(x){ return x.n+' de '+compName(x.c); }); if(g.length>5) det.push('y '+(g.length-5)+' compañías más');
        var fib=l.filter(tieneFibra).length;
        done({ say: fill(pick('rs',['{D} llevas {n} {c}: {det}. {f}','Resumen {d}: {n} {c} ({det}). {f}','{D}: {n} {c}. Por compañías: {det}. {f}']),{D:cap(sinDe(r.label)),d:r.label,n:numU(l.length),c:plural(l.length,'contrato','contratos'),det:listaTxt(det),f:(function(){ var S=sumar(l); return 'En total, '+numM('fibras',S.f)+' '+nomMedida('fibras',S.f)+' y '+numM('lineas',S.l)+' '+nomMedida('lineas',S.l)+'.'; })()}).trim() });
      });
      return true;
    }
    return false;
  }

  /* =====================================================================
     RECORDATORIOS (se guardan en la hoja RECORDATORIOS; avisan solo en los
     ordenadores con la semilla de esa persona)
     ===================================================================== */
  var REC_PERS = [ ['Manu','recManu'], ['Sebastián','recSebastian'], ['Jorge','recJorge'], ['Maicol','recMaicol'] ];
  var REC_AVISOS = [ [1440,'1 día antes'], [120,'2 horas antes'], [60,'1 hora antes'], [30,'Media hora antes'], [0,'A la misma hora'] ];
  var REC_INSISTE = 30*60000;            // si no pulsa «Enterado», vuelve a avisar cada media hora
  function plano(s){ return String(s||'').toLowerCase().replace(/[áàâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[íìîï]/g,'i').replace(/[óòôö]/g,'o').replace(/[úùûü]/g,'u').replace(/ñ/g,'n'); }
  var REC_TRIG = /^[\s¡!¿,.]*(?:(?:oye|eh|hola|hey|buenas|venga)[\s,]+)?(?:lucas[\s,]+)?(?:por favor[\s,]+|porfa[\s,]+)?(recuerdamelo|recuerdame|recuerdale|recuerdales|recuerda|acuerdame|avisame|avisale|avisales|apuntame|anotame|ponme un recordatorio|pon un recordatorio|creame un recordatorio|crea un recordatorio|hazme un recordatorio|haz un recordatorio|nuevo recordatorio|un recordatorio|recordatorio|no me dejes olvidar|que no se me olvide|que no se me pase)(?=[\s,.:;!?]|$)[\s,:]*/;
  var NOMBRE_PERS = { manu:'Manu', manuel:'Manu', sebastian:'Sebastián', sebas:'Sebastián', jorge:'Jorge', maicol:'Maicol', michael:'Maicol', maikol:'Maicol' };
  var NUMR = { un:1, una:1, media:0.5, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10, once:11, doce:12, quince:15, veinte:20, treinta:30, cuarenta:40, 'cuarenta y cinco':45 };
  function nR(w){ return /^\d+$/.test(w) ? parseInt(w,10) : (NUMR[w]!=null ? NUMR[w] : 0); }
  var DIAS_P = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  function addD(d,n){ var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n); return x; }

  // entiende día y hora SIEMPRE hacia delante: «el 23» = el próximo 23, «el lunes» = el próximo lunes, «el 23 de enero» = el próximo 23 de enero
  function recParse(raw, now){
    var p = plano(raw), spans=[], day=null, hh=null, mi=0, tod=null, exact=null;
    function find(re){ var r=re.exec(p); if(r){ spans.push([r.index, r.index+r[0].length]); p = p.slice(0,r.index)+new Array(r[0].length+1).join(' ')+p.slice(r.index+r[0].length); } return r; }
    var m;
    m = find(/\b(?:de|por) la (manana|tarde|noche)\b|\bpor la mananita\b/); if(m) tod = (m[1]==='tarde'?'tarde':(m[1]==='noche'?'noche':'manana'));
    // varios avisos relativos: «dentro de 5, de 10 y de 15 minutos», «en 1 y en 2 horas»
    var NW='(?:\\d+|un|una|media|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta y cinco|cuarenta)';
    var multi=null;
    m = find(new RegExp('\\b(?:en|dentro de)\\s+('+NW+'(?:\\s*(?:,|y|e|o)\\s*(?:(?:en|dentro de|de|a los|a las)\\s+)?'+NW+')+)\\s*(minutos?|mins?|horas?|h)\\b'));
    if(m){ var nums=m[1].split(/\s*(?:,|\by\b|\be\b|\bo\b)\s*/).map(function(x){ return nR(x.replace(/^(en|dentro de|de|a los|a las)\s+/,'').trim()); }).filter(function(x){ return x>0; });
      var fac=/^h/.test(m[2])?60:1; nums=nums.map(function(x){ return Math.round(x*fac); }).sort(function(a,b){ return a-b; });
      if(nums.length>1){ var mx=nums[nums.length-1]; exact=new Date(now.getTime()+mx*60000); multi=nums.map(function(x){ return mx-x; }).sort(function(a,b){ return b-a; }); } }
    // dentro de / en N minutos, horas, días, semanas, meses
    m = exact ? null : find(/\b(?:en|dentro de)\s+(\d+|un|una|media|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta y cinco|cuarenta)\s*(minutos?|mins?|horas?|h|dias?|semanas?|mes(?:es)?)(\s+y media)?\b/);
    if(m){ var n=nR(m[1]), u=m[2]; if(m[1]==='media' && /^h/.test(u)){ n=30; u='min'; } if(m[3]) n+=0.5;
      if(/^m(in|inuto)/.test(u)) exact=new Date(now.getTime()+n*60000);
      else if(/^h/.test(u)) exact=new Date(now.getTime()+n*3600000);
      else if(/^d/.test(u)) day=addD(now,Math.round(n));
      else if(/^s/.test(u)) day=addD(now,Math.round(n*7));
      else { day=new Date(now.getFullYear(),now.getMonth()+Math.round(n),now.getDate()); } }
    if(!exact && find(/\b(?:en|dentro de) un rato\b|\bluego\b|\bmas tarde\b/)) exact=new Date(now.getTime()+30*60000);
    if(!exact && find(/\ben media hora\b/)) exact=new Date(now.getTime()+30*60000);
    // hora
    m = find(/\b(?:a|sobre|hacia|para|desde|antes de)\s+(?:las|la)\s+(\d{1,2}|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?:(?::|\.|h)(\d{2}))?(?:\s+y\s+(media|cuarto|\d{1,2})|\s+menos\s+(cuarto|\d{1,2}))?(?:\s*(?:h|horas|hrs))?\b/) || find(/\b(\d{1,2})[:h](\d{2})\b/);
    if(m){ hh = nR(m[1]); mi = m[2]?parseInt(m[2],10):0; if(m[3]) mi = m[3]==='media'?30:(m[3]==='cuarto'?15:parseInt(m[3],10)); if(m[4]){ hh -= 1; mi = 60-(m[4]==='cuarto'?15:parseInt(m[4],10)); } }
    if(hh==null && find(/\ba mediodia\b|\bal mediodia\b/)){ hh=14; mi=0; }
    if(hh==null && find(/\ba primera hora\b/)){ hh=10; mi=0; }
    if(hh==null && find(/\ba ultima hora\b/)){ hh=19; mi=30; }
    if(hh!=null){ if((tod==='tarde'||tod==='noche') && hh<12) hh+=12; else if(!tod && hh>=1 && hh<=7) hh+=12; if(hh>23) hh=23; }
    // día
    if(!day){
      if(find(/\bpasado manana\b/)) day=addD(now,2);
      else if(find(/\bmanana\b/)) day=addD(now,1);
      else if((m=find(/\besta (manana|tarde|noche)\b/))){ day=addD(now,0); tod=tod||m[1]; }
      else if(find(/\bhoy\b/)) day=addD(now,0);
      else if(find(/\b(?:la )?(?:semana que viene|proxima semana)\b/)){ var bw=(8-now.getDay())%7||7; day=addD(now,bw); }
      else if((m=find(/\b(?:el\s+|este\s+)?(?:proximo\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?:\s+que viene|\s+proximo)?\b/))){ var wi=DIAS_P.indexOf(m[1]); var bk=(wi-now.getDay()+7)%7; if(bk===0) bk=7; day=addD(now,bk); }
      else if((m=find(/\b(?:el\s+)?(?:dia\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del)\s+(\d{4}))?\b/))){
        var dM=+m[1], mM=MES_IDX[m[2]], yM=m[3]?+m[3]:now.getFullYear(); day=new Date(yM,mM,dM); if(!m[3] && day<addD(now,0)) day=new Date(yM+1,mM,dM); }
      else if((m=find(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/))){
        var yN=m[3]?(m[3].length===2?2000+(+m[3]):+m[3]):now.getFullYear(); day=new Date(yN,+m[2]-1,+m[1]); if(!m[3] && day<addD(now,0)) day=new Date(yN+1,+m[2]-1,+m[1]); }
      else if((m=find(/\b(?:el\s+dia|el|dia)\s+(\d{1,2})\b/))){
        var dd=+m[1]; if(dd>=1 && dd<=31){ var y0=now.getFullYear(), m0=now.getMonth(); if(dd<now.getDate()) m0++; for(var k=0;k<14;k++){ var c=new Date(y0,m0+k,dd); if(c.getDate()===dd){ day=c; break; } } } }
    }
    var when=null, defHora=false;
    if(exact){ when=exact; if(day){ when=new Date(day.getFullYear(),day.getMonth(),day.getDate(),exact.getHours(),exact.getMinutes()); } }
    else if(hh!=null){ var base=day||addD(now,0); when=new Date(base.getFullYear(),base.getMonth(),base.getDate(),hh,mi); if(!day && when<=now) when=new Date(when.getTime()+86400000); }
    else if(day){ var H = tod==='tarde'?17:(tod==='noche'?21:10); when=new Date(day.getFullYear(),day.getMonth(),day.getDate(),H,0); defHora=true;
      if(when<=now){ var t5=new Date(now.getTime()+60*60000); t5.setMinutes(Math.ceil(t5.getMinutes()/5)*5,0,0); when=t5; } }
    return { when:when, defHora:defHora, spans:spans, avisos:multi };
  }
  function recTexto(raw, trigLen, spans){
    var s=raw.split('');
    for(var i=0;i<trigLen && i<s.length;i++) s[i]=' ';
    spans.forEach(function(sp){ for(var j=sp[0]; j<sp[1] && j<s.length; j++) s[j]=' '; });
    var t=s.join('').replace(/\s+/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();
    for(var r=0;r<4;r++){ t=t.replace(/^[\s,.:;¡!¿?\-]+/,'').replace(/^(que|de que|para|de|a|el|y)\s+/i,'').replace(/[\s,.:;¡!¿?\-]+$/,'').replace(/\s+(y|que|de|a|para|el|la)$/i,''); }
    t=t.replace(/,\s*,/g,',').trim();
    return t ? t.charAt(0).toUpperCase()+t.slice(1) : 'Recordatorio';
  }
  function fechaBonita(d, now){
    now=now||new Date(); var hoy=addD(now,0), dd=addD(d,0), diff=Math.round((dd-hoy)/86400000);
    var hora=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
    var dia = diff===0?'hoy':(diff===1?'mañana':(diff===2?'pasado mañana':('el '+DIAS[d.getDay()]+' '+d.getDate()+' de '+MESES[d.getMonth()]+(d.getFullYear()!==now.getFullYear()?' de '+d.getFullYear():''))));
    return dia+' a las '+hora;
  }
  function falta(ms){ var m=Math.round(ms/60000); if(m<=0) return m>-2?'ahora mismo':'hace '+(-m>=60?Math.round(-m/60)+' h':(-m)+' min'); if(m<60) return 'en '+m+' '+plural(m,'minuto','minutos'); var h=Math.round(m/60); if(h<24) return 'en '+h+' '+plural(h,'hora','horas'); var d=Math.round(h/24); return 'en '+d+' '+plural(d,'día','días'); }

  // casillas en el chat (una o varias) + botón
  function renderChecks(opts, btnTxt, cb){
    var box=document.getElementById('iaChatMsgs'); if(!box) return;
    var wrap=document.createElement('div'); wrap.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px;max-width:95%;align-items:center;';
    var sel={}, cerrado=false;
    opts.forEach(function(o){
      var b=document.createElement('button'); b.type='button';
      var pinta=function(){ var on=!!sel[o.v]; b.textContent=(on?'☑ ':'☐ ')+o.t; b.style.background=on?'#17ff5f':'#0f1512'; b.style.color=on?'#04140a':(o.off?'#5d6b62':'#d9ffe6'); b.style.boxShadow=on?'0 0 16px rgba(23,255,95,.7)':'0 0 8px rgba(23,255,95,.25)'; };
      b.style.cssText='border:1px solid '+(o.off?'#2c3a31':'#17ff5f')+';border-radius:12px;padding:9px 14px;font-size:13px;font-weight:800;cursor:'+(o.off?'not-allowed':'pointer')+';transition:transform .12s, background .15s;';
      if(o.on && !o.off) sel[o.v]=1;
      pinta();
      b._v=o.v;
      b.onclick=function(){ if(cerrado || o.off) return; if(sel[o.v]) delete sel[o.v]; else sel[o.v]=1; b.style.transform='scale(1.08)'; setTimeout(function(){ b.style.transform=''; },120); pinta(); };
      if(o.off) b.title='Esa hora ya ha pasado';
      wrap.appendChild(b);
    });
    var ok=document.createElement('button'); ok.type='button'; ok.textContent=btnTxt;
    ok.style.cssText='border:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:900;cursor:pointer;background:linear-gradient(90deg,#17ff5f,#00d4ff);color:#03110a;box-shadow:0 0 18px rgba(0,212,255,.55);margin-left:4px;';
    ok.onclick=function(){
      if(cerrado) return; var lista=opts.filter(function(o){ return sel[o.v]; }).map(function(o){ return o.v; });
      if(!lista.length){ ok.animate && ok.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:260}); if(window.__lucasSay) window.__lucasSay(pick('recSel0',['Marca al menos una opción.','Elige una por lo menos.'])); return; }
      cerrado=true; wrap.querySelectorAll('button').forEach(function(x){ x.style.cursor='default'; if(x!==ok && !sel[x._v]) x.style.opacity='.45'; }); ok.style.opacity='.4';
      cb(lista);
    };
    wrap.appendChild(ok);
    box.appendChild(wrap); box.scrollTop=box.scrollHeight;
  }
  B.renderChecks = renderChecks;

  B._recPend = null;
  function recPreguntarPersonas(o, done){
    var resumen = '«'+o.texto+'», '+fechaBonita(o.when)+(o.defHora?' (no me dijiste hora, te pongo esa)':'')+(o.avisos && o.avisos.length ? ', con '+numU(o.avisos.length)+' '+plural(o.avisos.length,'aviso','avisos')+' a las '+o.avisos.map(function(mm){ var d=new Date(o.when.getTime()-mm*60000); return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }).join(', ') : '')+'.';
    done({ say: pick('recQ1',['Vale, apunto: ','Entendido: ','Perfecto, recordatorio: '])+resumen+' '+pick('recQ2',['¿Para quién es el recordatorio?','¿A quién se lo recuerdo?','¿Para quién es?']) });
    renderChecks(REC_PERS.map(function(p){ return { t:p[0], v:p[0], on: o.pre && o.pre.indexOf(p[0])>=0 }; }), 'Siguiente ➜', function(pers){
      o.personas=pers;
      if(o.avisos && o.avisos.length){ recGuardar(o); return; }
      var ahora=Date.now(), sug=o.when.getTime()-ahora > 3*3600000 ? 60 : 0;
      if(window.__lucasSay) window.__lucasSay(pick('recQ3',['¿Cuándo te lo recuerdo? Puedes marcar varias.','¿Con cuánta antelación aviso? Marca una o varias.','¿Cuándo quieres el aviso? Elige una o varias.']));
      renderChecks(REC_AVISOS.map(function(a){ var at=o.when.getTime()-a[0]*60000; return { t:a[1], v:a[0], on:a[0]===sug, off: a[0]>0 && at<ahora-60000 }; }), 'Guardar ✅', function(av){
        o.avisos=av.map(Number).sort(function(a,b){ return b-a; });
        recGuardar(o);
      });
    });
  }
  function recGuardar(o){
    var dime=function(t){ if(window.__lucasSay) window.__lucasSay(t); };
    var pl={ texto:o.texto, cuando:o.when.getTime(), personas:o.personas, avisos:o.avisos };
    try{
      google.script.run.withSuccessHandler(function(res){
        if(!res || !res.ok) return dime('Uy, no he podido guardar el recordatorio'+(res&&res.error?' ('+res.error+')':'')+'. Prueba otra vez.');
        REC_CACHE=null; REC_CACHE_T=0;
        var avTxt=o.avisos.map(function(m){ for(var i=0;i<REC_AVISOS.length;i++) if(REC_AVISOS[i][0]===m) return REC_AVISOS[i][1].toLowerCase(); return m===0 ? 'a la misma hora' : (m%60===0 ? (m/60)+' '+plural(m/60,'hora','horas') : m+' minutos')+' antes'; });
        dime(fill(pick('recOK',['¡Apuntado! Se lo recordaré a {p} {a}.','Hecho. Aviso a {p} {a}.','Guardado: {p} recibirá el aviso {a}.']),{p:listaTxt(o.personas),a:listaTxt(avTxt)})+' '+pick('recOK2',['Si no pulsáis «Enterado», insisto cada media hora.','Y si nadie pulsa «Enterado», vuelvo a avisar cada media hora.']));
      }).withFailureHandler(function(e){ dime('No he podido guardar el recordatorio: '+(e && e.message ? e.message : 'error de conexión')+'.'); }).apiRecCrear(pl);
    }catch(e){ dime('No he podido guardar el recordatorio ahora mismo.'); }
  }
  function recNuevo(raw, mt, done){
    var now=new Date(), resto=raw.slice(mt[0].length);
    var pre=[], mA=plano(resto).match(/^\s*a\s+((?:manu|manuel|sebastian|sebas|jorge|maicol|michael|maikol)(?:\s*(?:,|y)\s*(?:manu|manuel|sebastian|sebas|jorge|maicol|michael|maikol))*)\b[\s,:]*(?:que\s+)?/);
    var cut=mt[0].length;
    if(mA){ mA[1].split(/\s*(?:,|y)\s*/).forEach(function(w){ var nm=NOMBRE_PERS[w]; if(nm && pre.indexOf(nm)<0) pre.push(nm); }); cut+=mA[0].length; }
    if(/^recuerdame|^recuerdamelo|^acuerdame|^avisame|^apuntame|^anotame/.test(mt[1]) && !pre.length) pre=['Manu'];
    var pr=recParse(raw, now);
    var o={ texto: recTexto(raw, cut, pr.spans.filter(function(sp){ return sp[0]>=cut; })), when: pr.when, defHora: pr.defHora, pre: pre, avisos: pr.avisos||null };
    if(!o.when){ B._recPend={ o:o, at:Date.now(), n:0 }; return done({ say: fill(pick('recCuando',['Vale, «{t}». ¿Para cuándo te lo recuerdo? Dime el día, la hora o las dos cosas.','Apuntado «{t}». ¿Qué día y a qué hora?','¿Y para cuándo es «{t}»? Por ejemplo: «mañana a las 10» o «el lunes».']),{t:o.texto}) }); }
    if(o.when.getTime()<Date.now()){ B._recPend={ o:o, at:Date.now(), n:0 }; return done({ say: 'Esa hora ya ha pasado. ¿Para cuándo lo pongo?' }); }
    recPreguntarPersonas(o, done);
  }
  // corrige erratas en las palabras clave de los recordatorios (sin tocar el resto de la frase)
  var REC_CLAVES = ['recordatorios','recordatorio','recuerdame','recuerdamelo','recuerdale','recuerdales','acuerdame','avisame','avisale','apuntame','anotame'];
  function recErratas(raw){
    return String(raw||'').replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{6,}/g, function(w){
      var p=plano(w); if(REC_CLAVES.indexOf(p)>=0) return w;
      if(!/^(re|ac|av|ap|an)/.test(p)) return w;
      var best=null, bd=3;
      REC_CLAVES.forEach(function(k){ var d=dist(p,k,2); if(d<bd){ bd=d; best=k; } });
      return (best && bd<=(p.length>=9?2:1)) ? best : w;
    });
  }
  function recPendiente(raw, done){
    var rp=B._recPend; if(!rp || Date.now()-rp.at > 10*60000){ B._recPend=null; return false; }
    var t=plano(raw).trim();
    if(/^(nada|da igual|olvidalo|dejalo|cancela|cancelar|no|ninguno)\b/.test(t)){ B._recPend=null; done({ say: pick('recCanc',['Vale, lo dejo.','Cancelado, no apunto nada.']) }); return true; }
    var pr=recParse(raw, new Date());
    if(!pr.when || pr.when.getTime()<Date.now()){ rp.n++; if(rp.n>=2){ B._recPend=null; return false; } done({ say: pick('recNo',['No he pillado la fecha. Dime algo como «el 23 a las 10» o «mañana por la tarde».','Esa no la entiendo. Prueba con «el lunes a las 9» o «en 2 horas».']) }); return true; }
    B._recPend=null; rp.o.when=pr.when; rp.o.defHora=pr.defHora; recPreguntarPersonas(rp.o, done); return true;
  }

  // lista de recordatorios pendientes (con botón para borrar)
  var REC_CACHE=null, REC_CACHE_T=0;
  function recCargar(cb, fuerza){
    if(!fuerza && REC_CACHE && Date.now()-REC_CACHE_T<50000) return cb(REC_CACHE);
    try{ google.script.run.withSuccessHandler(function(res){ REC_CACHE=(res&&res.items)||[]; REC_CACHE_T=Date.now(); cb(REC_CACHE); }).withFailureHandler(function(){ cb(REC_CACHE); }).apiRecListar(); }catch(e){ cb(REC_CACHE); }
  }
  function esListaRec(t){ if(/\brecordatorios?\b/.test(t) && !/\b(pon|ponme|crea|creame|haz|hazme|nuevo|añade|anade|mete)\b/.test(t)) return true; return /\b(mis recordatorios|que recordatorios|recordatorios (pendientes|que hay|que tengo|tengo|guardados|apuntados)|lista de recordatorios|ver (los )?recordatorios|(ensename|muestrame|dime|sacame|dame) (los |mis )?recordatorios|(borra|borrar|quita|quitar|elimina|eliminar) (un |el |algun )?recordatorio)\b|^recordatorios$/.test(t); }
  function recListar(done){
    recCargar(function(l){
      if(l==null) return done({ say:'No he podido leer los recordatorios ahora mismo.' });
      // con la semilla de Manu se ven los de todos; si no, solo los de las personas con semilla en este ordenador
      var yo=misPersonas(), todos=yo.indexOf('Manu')>=0;
      var now=Date.now(), fut=l.filter(function(r){ return r.cuando>now-3600000 && (todos || (r.personas||[]).some(function(p){ return yo.indexOf(p)>=0; })); }).sort(function(a,b){ return a.cuando-b.cuando; });
      if(!fut.length) return done({ say: pick('recL0',['No hay ningún recordatorio pendiente.','No tienes recordatorios apuntados.','Nada apuntado por ahora.']) });
      var txt=fut.slice(0,8).map(function(r){ return '• '+fechaBonita(new Date(r.cuando))+': «'+r.texto+'» ('+listaTxt(r.personas)+')'; }).join('\n');
      done({ say: 'Tienes '+numU(fut.length)+' '+plural(fut.length,'recordatorio','recordatorios')+':\n'+txt+'\nSi quieres borrar alguno, púlsalo:', buttons: fut.slice(0,8).map(function(r){ return { t:'🗑️ '+(r.texto.length>28?r.texto.slice(0,27)+'…':r.texto), v:'rec:del:'+r.id }; }) });
    }, true);
  }
  function recBorrar(id, done){
    try{ google.script.run.withSuccessHandler(function(res){ REC_CACHE=null; done({ say: res&&res.ok ? pick('recDel',['Borrado.','Recordatorio eliminado.','Hecho, ya no lo recordaré.']) : 'No he podido borrarlo.' }); }).withFailureHandler(function(){ done({ say:'No he podido borrarlo.' }); }).apiRecBorrar(id); }catch(e){ done({ say:'No he podido borrarlo.' }); }
  }

  // ---- avisos: solo para las personas con su semilla en ESTE ordenador ----
  function misPersonas(){ return REC_PERS.filter(function(p){ return semilla(p[1]); }).map(function(p){ return p[0]; }); }
  function nagGet(k){ try{ return +localStorage.getItem('recNag_'+k)||0; }catch(e){ return 0; } }
  function nagSet(k,v){ try{ localStorage.setItem('recNag_'+k, String(v)); }catch(e){} }
  var recEnPantalla={};
  function recCartel(r, persona, test){
    try{
      var key=r.id+'|'+persona; if(recEnPantalla[key]) return;
      if(!document.getElementById('recCss')){ var st=document.createElement('style'); st.id='recCss'; st.textContent='@keyframes recIn{0%{opacity:0;transform:translateY(30px) scale(.9)}100%{opacity:1;transform:none}}@keyframes recGlow{0%,100%{box-shadow:0 0 22px rgba(23,255,95,.55),0 0 60px rgba(0,212,255,.25)}50%{box-shadow:0 0 38px rgba(23,255,95,.9),0 0 90px rgba(0,212,255,.45)}}@keyframes recBell{0%,100%{transform:rotate(0)}15%{transform:rotate(18deg)}30%{transform:rotate(-16deg)}45%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}75%{transform:rotate(4deg)}}@keyframes recScan{0%{background-position:0 0}100%{background-position:0 200px}}'; document.head.appendChild(st); }
      var ov=document.createElement('div'); recEnPantalla[key]=ov;
      ov.style.cssText='position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(2,8,5,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px;';
      var c=document.createElement('div');
      c.style.cssText='position:relative;width:min(440px,100%);border-radius:22px;padding:26px 24px 20px;background:linear-gradient(160deg,#07140d,#03080a);border:2px solid #17ff5f;color:#e6fff0;font-family:inherit;animation:recIn .45s cubic-bezier(.2,1.4,.4,1),recGlow 2s ease-in-out infinite;overflow:hidden;text-align:center;';
      var scan=document.createElement('div'); scan.style.cssText='position:absolute;inset:0;pointer-events:none;opacity:.08;background:repeating-linear-gradient(0deg,#17ff5f 0 1px,transparent 1px 4px);animation:recScan 6s linear infinite;'; c.appendChild(scan);
      var ms=r.cuando-Date.now();
      c.insertAdjacentHTML('beforeend',
        '<div style="font-size:54px;line-height:1;display:inline-block;animation:recBell 1.2s ease-in-out infinite;filter:drop-shadow(0 0 12px #17ff5f)">⏰</div>'+
        '<div style="margin-top:8px;font-size:12px;letter-spacing:4px;font-weight:900;color:#17ff5f">RECORDATORIO'+(test?' · PRUEBA':'')+'</div>'+
        '<div style="margin-top:4px;font-size:13px;color:#9fdcb7">Para <b style="color:#fff">'+esc0(persona)+'</b></div>'+
        '<div style="margin:16px 0 10px;font-size:22px;font-weight:900;line-height:1.25;color:#fff;text-shadow:0 0 14px rgba(23,255,95,.45)">'+esc0(r.texto)+'</div>'+
        '<div style="font-size:14px;color:#c9f7da">'+esc0(cap(fechaBonita(new Date(r.cuando))))+'</div>'+
        '<div style="display:inline-block;margin-top:10px;padding:5px 12px;border-radius:999px;border:1px solid #00d4ff;color:#00d4ff;font-weight:800;font-size:13px">'+esc0(cap(falta(ms)))+'</div>');
      var ok=document.createElement('button'); ok.type='button'; ok.textContent='✅ ENTERADO';
      ok.style.cssText='display:block;width:100%;margin-top:20px;border:none;border-radius:14px;padding:15px;font-size:17px;font-weight:900;letter-spacing:1px;cursor:pointer;color:#03110a;background:linear-gradient(90deg,#17ff5f,#00d4ff);box-shadow:0 0 24px rgba(23,255,95,.6);';
      var luego=document.createElement('div'); luego.textContent='Si no lo aceptas, te lo vuelvo a recordar en 30 minutos'; luego.style.cssText='margin-top:10px;font-size:11px;color:#6f9c80;';
      var x=document.createElement('button'); x.type='button'; x.textContent='×'; x.title='Cerrar (volverá a avisar en 30 min)'; x.style.cssText='position:absolute;top:10px;right:14px;background:none;border:none;color:#6f9c80;font-size:26px;cursor:pointer;';
      var cerrar=function(){ ov.style.transition='opacity .25s'; ov.style.opacity='0'; setTimeout(function(){ try{ ov.remove(); }catch(e){} delete recEnPantalla[key]; },260); };
      ok.onclick=function(){ cerrar(); recEnterado(r.id, persona, test, function(t){ if(window.__lucasSay) window.__lucasSay(t); }); };
      x.onclick=cerrar;
      c.appendChild(ok); c.appendChild(luego); c.appendChild(x); ov.appendChild(c); document.body.appendChild(ov);
    }catch(e){ console.warn('[Lucas] cartel', e); }
  }
  function esc0(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]; }); }
  function recEnterado(id, persona, test, cb){
    var key=id+'|'+persona; if(recEnPantalla[key]){ try{ recEnPantalla[key].remove(); }catch(e){} delete recEnPantalla[key]; }
    B._recAck[id+'|'+persona]=true;
    var frase=pick('recEnt',['Perfecto, {p}, marcado como enterado.','Anotado: {p} está al tanto.','Genial, {p}. No insisto más con este aviso.']).replace('{p}',persona);
    if(test) return cb(frase+' (era una prueba)');
    (REC_CACHE||[]).forEach(function(r){ if(r.id===id){ r.ack=r.ack||{}; r.ack[persona]=Date.now(); } });
    nagSet(key, Date.now());
    try{ google.script.run.withSuccessHandler(function(){ cb(frase); }).withFailureHandler(function(){ cb('No he podido guardar el «Enterado». Te lo volveré a recordar.'); }).apiRecEnterado(id, persona); }catch(e){ cb(frase); }
  }
  function recAvisar(r, persona, test, repite){
    var ms=r.cuando-Date.now();
    var msg = ms>-60000 ? fill(pick('recAv',['{p}, recordatorio: {t}, {f} ({x}).','Atención, {p}: {t}. Es {f}, {x}.','{p}, no te olvides: {t}, {f}.']),{p:persona,t:r.texto,f:fechaBonita(new Date(r.cuando)),x:falta(ms)})
                        : fill(pick('recAvP',['{p}, era {f}: {t}. Aún no lo has marcado como enterado.','{p}, recordatorio pendiente: {t} ({f}).']),{p:persona,t:r.texto,f:fechaBonita(new Date(r.cuando))});
    B.duckSay(msg, [{ t:'✅ Enterado', v:'rec:ok:'+r.id+':'+persona+(test?':test':'') }]);
    setTimeout(function(){ recCartel(r, persona, test); }, 3400);
    if(!test){ try{ saldoConsumir(repite ? 1 : COSTE); }catch(e){} }   // aviso nuevo 1,9 cént.; cada vez que lo vuelve a recordar 0,1 cént. (las pruebas no cobran)
  }
  function recVigilar(){
    var yo=misPersonas(); if(!yo.length) return;
    var app=document.getElementById('app'); if(app && app.classList.contains('hidden')) return;
    recCargar(function(l){
      if(!l) return; var now=Date.now();
      l.forEach(function(r){
        if(now > r.cuando + 12*3600000) return;                               // 12 h después ya no insiste
        (r.personas||[]).forEach(function(p){
          if(yo.indexOf(p)<0) return;
          var avs=(r.avisos && r.avisos.length) ? r.avisos : [0];          // sin avisos guardados = a la misma hora
          var dues=avs.map(function(m){ return r.cuando-m*60000; }).filter(function(d){ return d<=now; });
          if(!dues.length) return;
          var activo=Math.max.apply(null,dues), ack=(r.ack&&r.ack[p])||0, key=r.id+'|'+p;
          if(ack>=activo) return;                                              // ya aceptado este aviso (o uno posterior)
          var last=nagGet(key);
          if(last<activo || now-last>=REC_INSISTE){ var repite = last>=activo; nagSet(key, now); recAvisar(r, p, false, repite); }
        });
      });
    });
  }
  setTimeout(recVigilar, 8000);
  setInterval(recVigilar, 60000);
  B.recTest = function(){ var yo=misPersonas(); var p=yo[0]||'Manu'; recAvisar({ id:'TEST', texto:'Esto es una prueba de recordatorio', cuando:Date.now()+3600000, personas:[p], avisos:[60] }, p, true); };
  B._recParse = recParse; B._recTexto = recTexto;

  /* =====================================================================
     PIN DE EMPLEADO: «pin» -> Lucas pide el PIN -> filtros personalizados en botones.
     Los PIN se guardan cifrados (SHA-256 de «lucasPin:<pin>»), nunca en claro.
     Para añadir un filtro a un empleado: nuevo botón en su lista + su caso en pinFiltro().
     ===================================================================== */
  // botones de filtros de cada empleado (por su id; el nombre y el PIN se cambian desde la consola)
  var PERFILES = {
    maicol: [
      { t:'📉 Bajar líneas a 1€', id:'maicol_bajar1' },
      { t:'⏸️ Pausar líneas a 0€', id:'maicol_pausar0' }
    ]
  };
  // nombres y PIN cifrados: vienen del servidor (esto es solo por si no hay conexión)
  var PIN_LISTA = [ { id:'maicol', nombre:'Maicol', hash:'3931a03ef66fe44020668adffd61b7f10c3d2f163c0f553cf636a998fc895b72' } ];
  function pinesCargar(){ try{ google.script.run.withSuccessHandler(function(r){ if(r && r.ok && r.items && r.items.length) PIN_LISTA=r.items; }).withFailureHandler(function(){}).apiPinesListar(); }catch(e){} }
  B.pinesRecargar = pinesCargar;
  setTimeout(pinesCargar, 2500); setInterval(pinesCargar, 300000);
  B._pinAsk = null; B._pinUser = null;
  function pinHash(pin, cb){
    try{ crypto.subtle.digest('SHA-256', new TextEncoder().encode('lucasPin:'+pin)).then(function(buf){ var h=''; new Uint8Array(buf).forEach(function(b){ h+=('0'+b.toString(16)).slice(-2); }); cb(h); }).catch(function(){ cb(''); }); }catch(e){ cb(''); }
  }
  function pinPedir(done){
    pinesCargar();                                   // por si han cambiado el PIN desde otro ordenador
    B._pinAsk = { at: Date.now(), n: 0 };
    done({ say: pick('pinQ',['🔐 Claro. ¿Cuál es tu PIN?','Modo seguro activado. Escribe tu PIN de 4 cifras.','Perfecto, identifícate: ¿cuál es tu PIN?','🔑 Dime tu PIN y te enseño tus filtros.','Acceso personal. Introduce tu PIN, por favor.','Vale, necesito tu PIN para continuar.','¡Entendido! ¿Me dices tu PIN?']) });
  }
  function pinOcultar(txt){
    // tapa el PIN en la burbuja del chat para que no se quede a la vista
    setTimeout(function(){ try{ var box=document.getElementById('iaChatMsgs'); if(!box) return; var els=box.querySelectorAll('*'); for(var i=els.length-1;i>=0;i--){ var e=els[i]; if(e.children.length===0 && String(e.textContent).trim()===txt){ e.textContent='••••'; break; } } }catch(e){} }, 30);
  }
  function pinRespuesta(raw, done){
    var a=B._pinAsk; if(!a || Date.now()-a.at > 3*60000){ B._pinAsk=null; return false; }
    var t=String(raw||'').trim();
    if(/^(cancelar|cancela|nada|da igual|dejalo|déjalo|olvidalo|olvídalo|no)$/i.test(t)){ B._pinAsk=null; done({ say: pick('pinC',['Vale, lo dejamos.','Cancelado. Cuando quieras, escribe «pin».']) }); return true; }
    if(!/\d/.test(t)){ B._pinAsk=null; return false; }   // ha escrito otra cosa: deja el PIN y responde normal
    if(!/^\d{4}$/.test(t)){ done({ say: pick('pinF',['El PIN son 4 cifras. Escríbelo, por favor.','Necesito solo los 4 números de tu PIN.','Escribe tu PIN de 4 cifras (o «cancelar»).']) }); return true; }
    pinOcultar(t);
    pinHash(t, function(h){
      var it=null; PIN_LISTA.forEach(function(x){ if(x.hash===h) it=x; });
      var u = it ? { id:it.id, nombre:it.nombre, filtros:(PERFILES[it.id]||[]) } : null;
      if(!u && it===null){
        a.n++;
        if(a.n>=3){ B._pinAsk=null; return done({ say: pick('pinX',['⛔ Ese PIN no existe y ya van tres intentos. Escribe «pin» para empezar de nuevo.','⛔ Tres PIN que no existen. Por seguridad, vuelve a empezar con «pin».','🔒 Demasiados intentos con PIN inexistentes. Escribe «pin» otra vez cuando quieras.']) }); }
        return done({ say: pick('pinE',['❌ Ese PIN no existe. Prueba otra vez.','🚫 No tengo ningún PIN así registrado. ¿Lo repites?','Ese PIN no existe en el sistema. Inténtalo de nuevo.','❌ PIN desconocido: no corresponde a nadie. Vuelve a probar.','Mmm, ese PIN no existe. Revisa las cifras y escríbelo otra vez.','🔒 Acceso denegado: ese PIN no existe.','No encuentro a nadie con ese PIN. ¿Seguro que es el tuyo?']) });
      }
      B._pinAsk=null; B._pinUser={ u:u, at:Date.now() };
      done({ say: fill(pick('pinOK',['✅ Hola, {n}. ¿Qué filtro quieres usar?','Bienvenido, {n}. Elige tu filtro:','🔓 Acceso concedido, {n}. ¿Cuál te aplico?','¡Hey, {n}! Aquí tienes tus filtros personalizados:','Identificado: {n}. ¿Qué te muestro?']),{n:u.nombre}),
             buttons: u.filtros.map(function(f){ return { t:f.t, v:'pinf:'+f.id }; }) });
    });
    return true;
  }
  function pinFiltro(id, done){
    var s=B._pinUser;
    if(!s || Date.now()-s.at > 30*60000){ B._pinUser=null; return done({ say: pick('pinCad',['Tu sesión de PIN ha caducado. Escribe «pin» otra vez.','Por seguridad, vuelve a escribir «pin» para usar tus filtros.']) }); }
    s.at=Date.now();
    var now=new Date();
    ensureContratos(function(){
      if(id==='maicol_bajar1'){
        // últimos 60 días (por fecha de solicitud) con estado «-» (vacío o guion) o 😓
        var desde=d0(now.getFullYear(), now.getMonth(), now.getDate()-60), hasta=new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
        var l=contratos().filter(function(it){
          var k=ts(it['14']); if(!k || k<desde.getTime() || k>hasta.getTime()) return false;
          if(String(it['2']||'').toUpperCase().indexOf('SIMYO')<0) return false;      // solo Simyo
          var e=String(it['44']==null?'':it['44']).replace(/\uFE0F/g,'').trim();
          return e==='' || e==='-' || e==='—' || e.indexOf('\u{1F613}')>=0;
        });
        render(l, { from:desde, to:hasta, label:'de los últimos 60 días' });
        var n=l.length;
        return done({ say: n ? fill(pick('mb1',['Listo, {u}: {n} {c} de Simyo para bajar líneas a 1 €.','Ahí tienes, {u}: {n} {c} de Simyo para bajar a 1 €.','Filtro aplicado: {n} {c} de Simyo para bajar a 1 €.','Hecho, {u}. Tienes {n} {c} de Simyo para bajar líneas a 1 €.']),{u:s.u.nombre,n:numU(n),c:plural(n,'contrato','contratos')})
                                : pick('mb0',['No hay ningún contrato de Simyo para bajar a 1 €. ¡Todo al día!','Nada que bajar a 1 € ahora mismo. ¡Todo al día!']) });
      }
      if(id==='maicol_pausar0' || id==='maicol_pausar0_mas'){
        // mes natural de hace 2 meses (y, con «mostrar también», el de hace 1 mes); solo Simyo; ⛔ líneas extra > 0; estado «-», 😓 o 🪙 (🤑 = ya pausadas a 0 €)
        var mas = id==='maicol_pausar0_mas';
        var mr=monthRange(now.getFullYear(), now.getMonth()-2), mr1=monthRange(now.getFullYear(), now.getMonth()-1);
        var desde2=mr.from, hasta2= mas ? mr1.to : mr.to;
        var l2=contratos().filter(function(it){
          var k=ts(it['14']); if(!k || k<desde2.getTime() || k>hasta2.getTime()) return false;
          if(String(it['2']||'').toUpperCase().indexOf('SIMYO')<0) return false;
          var lx=parseFloat(String(it['18']==null?'':it['18']).trim().replace(',','.'));   // ⛔ líneas extra: solo si hay 1 o más
          if(isNaN(lx) || lx<=0) return false;
          var e=String(it['44']==null?'':it['44']).replace(/️/g,'').trim();
          if(e.indexOf('\u{1F911}')>=0) return false;                                   // 🤑 = ya pausadas a 0 €
          return e==='' || e==='-' || e==='—' || e.indexOf('\u{1F613}')>=0 || e.indexOf('\u{1FA99}')>=0;
        });
        var mes=MESES[mr.m], mes1=MESES[mr1.m], meses = mas ? mes+' y '+mes1 : mes;
        render(l2, { from:desde2, to:hasta2, label:'de '+meses });
        var n2=l2.length;
        var txt = n2 ? fill(pick(mas?'mp0b':'mp0',['Listo, {u}: {n} {c} de Simyo de {m} para pausar a 0 €.','Ahí tienes, {u}: {n} {c} de Simyo de {m} para pausar.','Filtro aplicado: {n} {c} de Simyo de {m} para pausar las líneas a 0 €.']),{u:s.u.nombre,n:numU(n2),c:plural(n2,'contrato','contratos'),m:meses})
                     : 'No hay contratos de Simyo de '+meses+' para pausar a 0 €.';
        // del 27 al 31: propone añadir también el mes anterior (si Manu da el visto bueno)
        if(!mas && now.getDate()>=27){
          txt += ' ' + fill(pick('mp0q',['📅 Estamos a final de mes: pregunta a Manu si ya puedes pausar también las de {m1}.','📅 Ojo, {u}: ya es final de mes. Consulta con Manu si puedes pausar también las de {m1}.','📅 Fin de mes a la vista: pregúntale a Manu si toca pausar también las de {m1}.']),{u:s.u.nombre,m1:mes1});
          return done({ say: txt, buttons:[{ t:'➕ Mostrar también '+mes1, v:'pinf:maicol_pausar0_mas' }] });
        }
        return done({ say: txt });
      }
      done({ say: 'Ese filtro todavía no está preparado.' });
    });
  }

  /* =====================================================================
     PLAN B: IA LOCAL (Transformers.js, gratis, dentro del navegador)
     Solo entra cuando las reglas no entienden la frase: busca a qué
     pregunta conocida se parece más y la responde como esa.
     ===================================================================== */
  var IA = { st:'off', ex:null, vecs:null, idx:null, p:null };
  var IA_LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1';
  var IA_MODELO = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  var IA_INTENTS = [
    { id:'contar', q:'cuantos contratos hay', ctx:true, def:'este mes', ej:[
      'cuántas ventas hemos hecho','qué tal fueron las altas','cuántos clientes nuevos han entrado','número de contratos firmados',
      'cuánto hemos vendido','cuántos papeles se han hecho','cuántas líneas se han vendido','cuántas altas llevamos',
      'cuántos contratos se han hecho','cuántas operaciones hemos cerrado','qué cantidad de contratos tenemos' ]},
    { id:'resumen', q:'como vamos', ctx:true, def:'este mes', ej:[
      'cómo va la cosa','qué tal vamos','cómo pinta el mes','dame un resumen','cómo andamos de ventas',
      'cómo va el negocio','qué tal va todo','hazme un balance','cómo está yendo el mes','ponme al día' ]},
    { id:'comparar', q:'este mes llevo mas que el pasado', ej:[
      'vamos mejor o peor que el mes pasado','hemos mejorado respecto al mes anterior','comparado con el mes pasado cómo vamos',
      'estamos vendiendo más que antes','superamos al mes pasado','hemos bajado respecto al mes anterior' ]},
    { id:'ranking', q:'que compania vende mas', ctx:true, ej:[
      'qué operadora funciona mejor','con quién vendemos más','cuál es la compañía top','qué marca vende más',
      'qué compañía va primera','con qué operador hacemos más contratos','la compañía que más contratos tiene' ]},
    { id:'mejordia', q:'que dia se hicieron mas contratos', ctx:true, ej:[
      'cuál fue el día más fuerte','qué día vendimos más','el día récord de ventas','qué jornada fue la mejor','cuándo hicimos más contratos' ]},
    { id:'bajas', q:'muestrame los contratos para dar de baja', ej:[
      'qué líneas hay que quitar','qué clientes tengo que dar de baja','cancelaciones pendientes','qué contratos hay que cancelar',
      'líneas para eliminar','qué hay que dar de baja' ]},
    { id:'pausar', q:'muestrame los contratos para pausar', ej:[
      'qué líneas hay que parar','qué tengo que congelar','líneas para dejar en pausa','qué contratos hay que suspender','qué hay que pausar' ]},
    { id:'instalar', q:'contratos pendientes de instalar', ej:[
      'qué falta por instalar','instalaciones pendientes','a quién no le han puesto aún la fibra','qué clientes esperan al técnico',
      'qué está sin instalar','técnicos pendientes de ir' ]},
    { id:'recordatorios', q:'que recordatorios tengo', ej:[
      'tengo algo apuntado','qué avisos tengo pendientes','qué tengo agendado','tengo alguna cita pendiente','qué tenía que hacer' ]},
    { id:'fichajes', fn:function(t){ return 'quien ha fichado '+(/\bayer\b/.test(t)?'ayer':'hoy'); }, ej:[
      'quién ha venido hoy a trabajar','ha llegado ya todo el mundo','quién está en la oficina','quién ha marcado la entrada',
      'quién ha empezado a trabajar hoy','vino alguien ayer a trabajar','quién anda hoy por la tienda','quién está hoy en la tienda','quién hay hoy trabajando','quién ha abierto la tienda' ]},
    { id:'ayuda', q:'ayuda', ej:[
      'qué sabes hacer','en qué me puedes ayudar','qué cosas puedo preguntarte','para qué sirves','qué funciones tienes','no sé qué preguntarte','en qué me puedes echar una mano','qué puedes hacer por mí' ]},
    { id:'limpiar', q:'quita los filtros', ej:[
      'enséñame todo otra vez','deja la tabla como estaba','resetea la tabla','quiero ver todos los contratos sin filtrar','borra la búsqueda' ]},
    { id:'borradores', q:'borradores', ej:[
      'contratos a medio hacer','los que están sin terminar','contratos sin acabar','los que se quedaron a medias' ]},
    { id:'grafica', q:'grafica de contratos', ctx:true, def:'de los ultimos 6 meses', ej:[
      'enséñame un dibujo de las ventas','quiero verlo en barras','píntame la evolución de los contratos','hazme un diagrama de ventas','quiero ver un gráfico' ]},
    { id:'fibra', q:'contratos con fibra', ctx:true, def:'este mes', ej:[
      'los que llevan internet de casa','los que tienen router','clientes con internet en casa','contratos con conexión de casa' ]}
  ];
  function iaImport(u){ return (new Function('u','return import(u)'))(u); }
  function iaCargar(){
    if(IA.p) return IA.p;
    if(typeof WebAssembly!=='object') return Promise.reject(new Error('sin wasm'));
    IA.st='cargando';
    IA.p = iaImport(IA_LIB).then(function(T){
      try{ T.env.allowLocalModels=false; }catch(e){}
      return T.pipeline('feature-extraction', IA_MODELO, { dtype:'q8' });
    }).then(function(ex){
      IA.ex=ex; var frases=[], idx=[];
      IA_INTENTS.forEach(function(it,i){ it.ej.forEach(function(f){ frases.push(f); idx.push(i); }); });
      return ex(frases, { pooling:'mean', normalize:true }).then(function(o){ IA.vecs=o.tolist(); IA.idx=idx; IA.st='lista'; console.log('[Lucas IA] lista ('+frases.length+' ejemplos)'); });
    }).catch(function(e){ IA.st='error'; IA.p=null; console.warn('[Lucas IA] no se ha podido cargar', e); throw e; });
    return IA.p;
  }
  B._ia = IA; B._iaCargar = iaCargar;
  // la descarga empieza sola un rato después de abrir el panel (la primera vez ~118 MB; luego queda guardado en el PC)
  setTimeout(function(){ try{ iaCargar().catch(function(){}); }catch(e){} }, 15000);
  function iaDot(a,b){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
  function iaAlt(it, t, now){
    if(it.fn) return it.fn(t);
    if(!it.ctx) return it.q;
    var hayF=false, hayC=false; try{ hayF=!!parseDates(t, now); }catch(e){} try{ hayC=findCompanies(t).length>0; }catch(e){}
    return (it.q+' '+(hayF||hayC ? t : '')+' '+(hayF ? '' : (it.def||''))).replace(/\s+/g,' ').trim();
  }
  var handleCore = null;
  // busca la pregunta conocida más parecida; cb(null) si no hay ninguna clara
  function iaMatch(txt, espera, cb){
    if(!handleCore || B._iaRetry) return cb(null);
    if(IA.st!=='lista' && !espera){ try{ iaCargar().catch(function(){}); }catch(e){} return cb(null); }
    var fin=false, timer=setTimeout(function(){ if(!fin){ fin=true; cb(null); } }, IA.st==='lista' ? 4000 : 30000);
    iaCargar().then(function(){ return IA.ex([String(txt)], { pooling:'mean', normalize:true }); }).then(function(o){
      if(fin) return; fin=true; clearTimeout(timer);
      var v=o.tolist()[0], best={};
      IA.vecs.forEach(function(e,j){ var s=iaDot(v,e), i=IA.idx[j]; if(best[i]==null || s>best[i]) best[i]=s; });
      var orden=Object.keys(best).sort(function(a,b){ return best[b]-best[a]; });
      var i1=+orden[0], s1=best[orden[0]], s2=orden.length>1 ? best[orden[1]] : 0;
      console.log('[Lucas IA]', JSON.stringify(String(txt)), '→', IA_INTENTS[i1].id, s1.toFixed(2), '(2º '+(orden[1]!=null?IA_INTENTS[+orden[1]].id:'-')+' '+s2.toFixed(2)+')');
      if(s1 < 0.55 || s1-s2 < 0.03) return cb(null);
      cb({ it:IA_INTENTS[i1], s:s1 });
    }).catch(function(){ if(!fin){ fin=true; clearTimeout(timer); cb(null); } });
  }
  function iaResponder(m, t, now, done){
    var alt=iaAlt(m.it, t, now);
    B._iaRetry=true; var lim=setTimeout(function(){ B._iaRetry=false; }, 20000);
    handleCore(alt, function(r){
      B._iaRetry=false; clearTimeout(lim);
      if(r && r.say && !r.notUnderstood) r.say = pick('iaP',['🧠 Creo que te refieres a esto: ','🧠 Si te he entendido bien: ','🧠 Entiendo que me preguntas esto: ']) + r.say;
      done(r);
    });
  }
  // las reglas no la entienden: espera a la IA (aunque tenga que cargar)
  function iaPlanB(t, raw, now, done){
    iaMatch(raw||t, true, function(m){ if(!m){ B._gratis=true; return done({ say: pick('noentiendo',NO_ENTIENDO) }); } iaResponder(m, t, now, done); });
  }
  // las reglas sí responden, pero la frase no habla de contratos ni de compañías: si la IA ve claro que es otra cosa, manda ella
  var IA_MANDA = { bajas:1, pausar:1, instalar:1, recordatorios:1, fichajes:1, ayuda:1, limpiar:1, borradores:1, comparar:1, ranking:1, mejordia:1 };
  function iaAntes(t, raw, now, debil, seguir, done){
    if(!debil || B._iaRetry) return seguir();
    iaMatch(raw||t, false, function(m){ if(m && IA_MANDA[m.it.id] && m.s>=0.6) return iaResponder(m, t, now, done); seguir(); });
  }

  // ---------- entrada principal ----------
  B.handle = function(raw, done){
    var now = new Date();
    var raw0 = String(raw||'');
    var t = fold(raw);
    if(B.fichPending()){ return B._fichAnswer(done); }   // contestación al fichaje: cualquier respuesta vale
    if(B._pinAsk){ B._gratis=true; if(pinRespuesta(raw, done)) return; B._gratis=false; }                         // esperando el PIN de 4 cifras
    if(/^\s*(?:oye\s+|lucas\s+)?(?:mi\s+|el\s+|meter\s+(?:el\s+)?|poner\s+(?:el\s+)?|introducir\s+(?:el\s+)?)?pin\s*[.!?]*\s*$/i.test(String(raw))){ B._gratis=true; return pinPedir(done); }
    try{ raw = recErratas(raw); }catch(e){}                                    // «recodatorios», «recuedame»… -> bien escrito
    if(B._recPend && recPendiente(raw, done)) return;                         // esperando el día/hora de un recordatorio
    var mtR = plano(raw).match(REC_TRIG); if(mtR) return recNuevo(raw, mtR, done);   // «recuérdame el día 21 que tengo reunión…»
    if(esListaRec(fold(raw))) return recListar(done);
    if(esPreguntaFichaje(fold(raw))) return fichajesHoy(fold(raw), done);   // «¿a qué hora ha entrado Sebastián?», «¿quién ha fichado hoy?»
    if(B._fichFlow && B._fichFlow(fold(raw), done)) return;
    if(B._fibAsk){ if(Date.now()-B._fibAsk.at > 5*60000) B._fibAsk=null; else { var fa=fold(raw).trim(); if(/\bfibras?\b/.test(fa)) return B._fibAnswer('fibra', done); if(/^(todos|todas|todo|los dos|ambos|todos los contratos|da igual)\b/.test(fa)) return B._fibAnswer('todos', done); B._fibAsk=null; } }
    if(B._bajaAsk){ if(Date.now()-B._bajaAsk.t > 5*60000) B._bajaAsk=null; else { var yn=fold(raw).trim(); if(/^(si|sip|vale|ok|claro|venga|dale|quitalos|hazlo)\b/.test(yn)) return B._baja2P(true, done); if(/^(no|nop|dejalos|deja)\b/.test(yn)) return B._baja2P(false, done); B._bajaAsk=null; } }   // fichaje manual (Jorge / Maicol)
    if(!t){ B._gratis=true; return done({ say: pick('vacio',['Dime algo y lo busco.','¿Sí? Te escucho.']) }); }
    t = t.replace(/^(oye |eh |lucas |hey lucas |hola lucas |oye lucas )+/,'').trim();
    try{ var tN = entender(t); if(tN && tN!==t){ t = tN; raw = tN; } }catch(e){ console.warn('[Lucas] entender', e); }
    var greet = isGreeting(t) || /^lucas$/.test(t);
    var rest = t.replace(/^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|saludos|buen dia)( lucas)?\s*/,'').trim();
    try{ var sg = seguimiento(rest||t); if(sg){ rest = sg; t = sg; raw = sg; greet = false; } }catch(e){ console.warn('[Lucas] seguimiento', e); }

    var st = smallTalk(rest||t, now);
    if(st==='__CLEAR__'){ ensureContratos(function(){ try{ clearSearch(); }catch(e){ render(contratos(),null); } done({ say: pick('clear',['Filtros quitados. Ya ves todos los contratos.','Listo, tabla limpia.','Hecho, sin filtros.']) }); }); return; }
    if(st && typeof st==='string' && st==='__AYUDA__'){ B._gratis=true; return done({ say: pick('ayudaQ',['Aquí tienes los accesos rápidos. Pulsa uno y te lo saco:','Atajos rápidos, pulsa el que quieras:','Toma, accesos directos. Dale a uno:']), buttons: B.AYUDA_BTNS }); }
    if(st){ B._gratis=true; return done({ say: st }); }

    if(/\bborrador/.test(rest||t)) return borradores(rest||t, done);
    if(extras(rest||t, now, done)) return;

    var hasDate = !!parseDates(rest||t, now);
    var hasComp = findCompanies(rest||t).length>0;
    var ctx = { contractWords: CONTRACT_WORDS.test(rest||t) };
    if(greet && !rest){ B._gratis=true; return done({ say: B.greetReply(t, now) }); }

    var debil = !/\bcontratos?\b/.test(rest||t) && !hasComp && !hasDate && !medida(rest||t).k && !codigoDe(rest||t) && !/\bfibras?\b/.test(rest||t);
    ensureContratos(function(){ iaAntes(rest||t, raw0, now, debil, function(){
      var r = contratoQuery(rest||t, raw, now, ctx);
      if(!r.notUnderstood && (r.say || r.clients)){ B._ctx = { t: rest||t, at: Date.now() }; guardarHist(rest||t); }   // memoria para «¿y en noviembre?» y «vuelve atrás»
      if(r.notUnderstood){
        if(greet){ B._gratis=true; return done({ say: B.greetReply(t, now) }); }
        return iaPlanB(rest||t, raw0, now, done);
      }
      if(greet && r.say){ var gp=B.greetPrefix(t, now); r.say = gp+(/[!.]$/.test(gp)?' ':'. ')+r.say; }
      done(r);
    }, done); });
  };
  handleCore = B.handle;

  // accesos rápidos de «ayuda» (añadir aquí más botones: t = texto del botón, v = 'q:' + la frase que entiende Lucas)
  B.AYUDA_BTNS = [
    { t:'📉 Contratos para dar de baja', v:'q:muestrame los contratos para dar de baja' },
    { t:'⏸️ Contratos para pausar',      v:'q:muestrame los contratos para pausar' },
    { t:'📊 ¿Cómo vamos este mes?',      v:'q:como vamos este mes' },
    { t:'📈 ¿Más que el mes pasado?',    v:'q:este mes llevo mas que el pasado' },
    { t:'🏆 Ranking de compañías',        v:'q:que compania vende mas' },
    { t:'🛠️ Pendientes de instalar',      v:'q:contratos pendientes de instalar' },
    { t:'📊 Gráfica de este año',         v:'q:grafica contratos este año' }
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
  // ---------- botones del asistente: se ponen en GRIS cuando ya no se pueden usar ----------
  var GRUPOS = [];
  function btnTipo(v){ v=String(v||''); if(v.indexOf('q:')===0) return 'q'; if(v.indexOf('pinf:')===0) return 'pinf'; if(v.indexOf('rec:ok:')===0) return 'recok'; if(v==='fichOK') return 'fich'; return 'temp'; }
  function apagarBtn(b, elegido){
    if(b._apagado) return; b._apagado=true; b.disabled=true;
    b.style.background='#e9ebef'; b.style.color='#9aa1ab'; b.style.borderColor='#d5d9df'; b.style.boxShadow='none';
    b.style.cursor='not-allowed'; b.style.opacity='1'; b.style.transform=''; b.style.filter='grayscale(1)';
    b.onmouseenter=b.onmouseleave=null; b.title='Este botón ya no está disponible';
    if(elegido && String(b.textContent).indexOf('✓')!==0) b.textContent='✓ '+b.textContent;
  }
  B._recAck = {};
  function btnValido(v){
    v=String(v||'');
    if(v.indexOf('q:')===0) return true;
    if(v.indexOf('pinf:')===0) return !!(B._pinUser && Date.now()-B._pinUser.at < 30*60000);
    if(v.indexOf('rec:ok:')===0){ var pz=v.split(':'); return !B._recAck[pz[2]+'|'+pz[3]]; }
    if(v==='fichOK') return !!(B.fichPending && B.fichPending());
    if(v.indexOf('fib:')===0) return !!B._fibAsk;
    if(v==='baja2P:si' || v==='baja2P:no') return !!B._bajaAsk;
    if(v==='baja2P:ver' || v==='baja2P:quitar') return !!B._bajaLast;
    if(v.indexOf('fib2:')===0) return !!B._fibLast;
    return true;
  }
  // al escribir un mensaje nuevo, las preguntas anteriores ya no valen (salvo ayuda, PIN, «Enterado» y fichaje)
  function caducarTemporales(){ GRUPOS.forEach(function(g){ g.bts.forEach(function(b){ if(btnTipo(b._v)==='temp') apagarBtn(b); }); }); }
  B._caducarBotones = caducarTemporales;
  B.renderButtons = function(list, opc){
    var box = document.getElementById('iaChatMsgs'); if(!box || !list || !list.length) return;
    // un grupo nuevo deja sin efecto los botones temporales anteriores
    caducarTemporales();
    var bx = document.createElement('div'); bx.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px;max-width:90%;';
    var g = { el:bx, bts:[] };
    list.forEach(function(o){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = o.t; b._v = o.v;
      b.style.cssText = 'border:1px solid #17ff5f;background:#0f1512;color:#d9ffe6;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 0 12px rgba(23,255,95,.35);transition:transform .15s, background .2s, color .2s;';
      b.onmouseenter = function(){ if(!b._apagado) b.style.transform = 'scale(1.06)'; }; b.onmouseleave = function(){ b.style.transform = ''; };
      b.onclick = function(){
        if(b._apagado || b.disabled) return;
        if(!btnValido(o.v)){ apagarBtn(b); return; }
        var t = btnTipo(o.v);
        if(t!=='q' && t!=='pinf') g.bts.forEach(function(x){ apagarBtn(x, x===b); });   // los de ayuda y PIN se pueden volver a usar
        if(opc && opc.eco){ try{ if(typeof addMsg==='function') addMsg(String(o.t).replace(/^\S+\s/,''), 'user'); }catch(e){} }
        B.pick(o.v, function(rr){ if(rr && rr.say && window.__lucasSay) window.__lucasSay(rr.say); if(rr && rr.buttons) B.renderButtons(rr.buttons); });
      };
      bx.appendChild(b); g.bts.push(b);
      if(String(o.v).indexOf('fichOK')===0) fichBtns.push(b);
    });
    GRUPOS.push(g); if(GRUPOS.length>60) GRUPOS.shift();
    box.appendChild(bx); box.scrollTop = box.scrollHeight;
  };
  // revisa cada poco si algún botón ha caducado (PIN, pregunta vencida, recordatorio aceptado, fichaje…)
  setInterval(function(){ GRUPOS.forEach(function(g){ g.bts.forEach(function(b){ if(!b._apagado && !btnValido(b._v)) apagarBtn(b); }); }); }, 1500);
  // los botones que pinta el propio panel también pasan por aquí
  try{ window.__lucasButtons = function(r){ if(r && r.buttons) B.renderButtons(r.buttons, { eco:true }); }; }catch(e){}
  function apagaFichBtns(){ fichBtns.forEach(function(b){ apagarBtn(b); }); fichBtns = []; }
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
    if(v==='clearF:si' || v==='clearF:no') return B._clearF(v==='clearF:si', done);
    if(v==='dp:ver') return B._dpVer(done);
    if(v.indexOf('pinf:')===0) return pinFiltro(v.slice(5), done);
    if(v.indexOf('q:')===0) return B.handle(v.slice(2), done);
    if(v.indexOf('rec:ok:')===0){ var pz=v.split(':'); return recEnterado(pz[2], pz[3], pz[4]==='test', function(t){ done({ say:t }); }); }
    if(v.indexOf('rec:del:')===0) return recBorrar(v.slice(8), done);
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

  /* =====================================================================
     FILTRO ACTIVO: 2 minutos después de que Lucas filtre, si sigue el filtro, pregunta si lo limpia
     ===================================================================== */
  var filtroT = null;
  function filtroActivo(){
    try{ if(typeof FILTERED!=='undefined' && FILTERED && contratos().length && FILTERED.length !== contratos().length) return true; }catch(e){}
    try{ if(typeof hayFiltro==='function' && hayFiltro()) return true; }catch(e){}
    return false;
  }
  B._filtroAviso = function(){ return;   // ya no avisa de filtros activos (lo indica el botón LIMPIAR FILTROS)
    if(filtroT) clearTimeout(filtroT);
    filtroT = setTimeout(function(){
      filtroT = null;
      if(!filtroActivo()) return;
      B.duckSay(pick('filtQ',['Tienes un filtro activado. ¿Limpiamos los filtros?','Ojo, sigue puesto un filtro. ¿Lo quito?','Hay un filtro activo en la tabla. ¿Limpiamos los filtros?','Todavía tienes la tabla filtrada. ¿Quitamos el filtro?']), [{ t:'✅ Sí', v:'clearF:si' },{ t:'❌ No', v:'clearF:no' }]);
    }, 120000);   // 2 minutos
  };
  B._clearF = function(si, done){
    if(!si) return done({ say: pick('filtN',['Vale, lo dejo como está.','Perfecto, el filtro se queda.','De acuerdo, no toco nada.']) });
    ensureContratos(function(){ try{ clearSearch(); }catch(e){ try{ var df=document.getElementById('dateFrom'), dt=document.getElementById('dateTo'); if(df) df.value=''; if(dt) dt.value=''; FILTERED = contratos().slice(); PAGE=1; renderContratosPage(); }catch(e2){} } if(filtroT){ clearTimeout(filtroT); filtroT=null; } done({ say: pick('filtS',['Hecho, filtros quitados. Ya ves todos los contratos.','Listo, tabla limpia.','Fuera filtros, todo a la vista.']) }); });
  };

  /* =====================================================================
     DOBLE PAUSA ⏸️⏸️: avisa (solo con la semilla «doblePausa») de los contratos que ya toca dar de baja
     y lo recuerda cada hora hasta que se les cambia el estado a ❌
     ===================================================================== */

  // cobro de avisos automáticos: 1,9 cént. si trae algún contrato que no se había avisado antes; 0,1 cént. si solo repite
  function cobrarAviso(tipo, rows){
    var k='pfAvisados_'+tipo, vis={}; try{ vis=JSON.parse(localStorage.getItem(k)||'{}')||{}; }catch(e){ vis={}; }
    var nuevo=false; (rows||[]).forEach(function(r){ if(!vis[r]){ nuevo=true; vis[r]=1; } });
    try{ localStorage.setItem(k, JSON.stringify(vis)); }catch(e){}
    try{ saldoConsumir(nuevo ? COSTE : 1); }catch(e){}
  }
  B._cobrarAviso = cobrarAviso;
  var DP_KEY = 'pfDoblePausaUltAviso';
  B._dpLast = [];
  // fecha en que toca dar de baja un ⏸️⏸️: fecha de doble pausa (ID 52) + 90 días; si no la tiene, instalación (ID 15) + 270 días
  function tsOK(v){ var k=ts(v); if(!k) return 0; var y=new Date(k).getFullYear(); return (y>=2000 && y<=2100) ? k : 0; }   // fuera fechas vacías tipo 00-00-0000
  function instCeros(it){ return /^0{1,2}[\/\-]0{1,2}[\/\-]0{2,4}$/.test(String(it['15']||'').trim()); }
  function dpVence(it){
    var f=tsOK(it['52']); if(f) return f + 90*86400000;
    var fi=tsOK(it['15']); if(fi) return fi + 270*86400000;
    return 0;
  }
  function dpListaFechas(l, hoy0){
    try{
      var box=document.getElementById('iaChatMsgs'); if(!box) return;
      var wrap=document.createElement('div');
      wrap.style.cssText='max-width:92%;margin:4px 0 10px;padding:10px 12px;border-radius:14px;background:#0f1512;border:1px solid #17ff5f;color:#d9ffe6;font-size:12.5px;line-height:1.45;box-shadow:0 0 10px rgba(23,255,95,.25);';
      var h=document.createElement('div'); h.textContent='📅 FECHA PARA DAR DE BAJA'; h.style.cssText='font-weight:800;margin-bottom:6px;color:#17ff5f;'; wrap.appendChild(h);
      l.forEach(function(it){
        var v=dpVence(it), row=document.createElement('div');
        var dias = v ? Math.round((v-hoy0)/86400000) : null;
        var cuando = v==null||!v ? 'sin fecha' : (dias<0 ? 'hace '+(-dias)+' '+plural(-dias,'día','días') : (dias===0 ? 'hoy' : 'en '+dias+' '+plural(dias,'día','días')));
        var ico = !v ? '❔' : (dias<=0 ? '⚠️' : '⏳');
        row.textContent = ico+' '+(v?fmtD(new Date(v)):'--/--/----')+' · '+titleCase(String(it['21']||'').trim()||'—')+(it['2']?' ('+compName(it['2'])+')':'')+' · '+cuando+(tsOK(it['52'])?'':' *');
        if(v && dias<=0) row.style.color='#ff8a8a';
        wrap.appendChild(row);
      });
      if(l.some(function(it){ return !tsOK(it['52']); })){ var nt=document.createElement('div'); nt.textContent='* sin fecha de doble pausa guardada: se calcula con la instalación + 270 días'; nt.style.cssText='margin-top:6px;opacity:.7;font-size:11px;'; wrap.appendChild(nt); }
      box.appendChild(wrap); box.scrollTop=box.scrollHeight;
    }catch(e){}
  }
  function dpPendientes(comps, count){
    var l = contratos().filter(function(it){ return esDoblePausa(it) && !(instCeros(it) && !tsOK(it['52'])); });   // fuera los 00-00-0000 puestos a propósito
    if(comps && comps.length){ var cs=comps.map(function(c){ return c.toUpperCase().trim(); }); l = l.filter(function(it){ return cs.indexOf(String(it['2']||'').toUpperCase().trim())>=0; }); }
    l.sort(function(a,b){ var va=dpVence(a)||9e15, vb=dpVence(b)||9e15; return va-vb; });
    var n=l.length;
    if(!n){ render(l, null, true); return { say: pick('dpP0',['No tienes ningún contrato en doble pausa.','Cero contratos en doble pausa, ¡todo limpio!']) }; }
    var hoy=new Date(); var hoy0=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()).getTime();
    var vencidos=l.filter(function(it){ var v=dpVence(it); return v && v<=hoy0; }).length;
    var sig=null; l.some(function(it){ var v=dpVence(it); if(v && v>hoy0){ sig=v; return true; } return false; });
    render(l, null, true);
    setTimeout(function(){ dpListaFechas(l, hoy0); }, 400);   // lista con la fecha de baja de cada uno (escrita, no la lee en voz alta)
    var c=plural(n,'contrato','contratos');
    var txt = fill(pick('dpP',['Aquí tienes tus {n} {c} en doble pausa, ordenados de la baja más urgente a la menos.','Te enseño los {n} {c} en doble pausa, primero los que ya tocaba dar de baja.','Listo: {n} {c} en doble pausa, ordenados por fecha de baja.']),{n:numU(n),c:c});
    if(vencidos) txt += ' ' + fill(pick('dpPv',['{k} ya {deb} estar dados de baja.','Ojo, {k} ya {pas} de fecha.','De ellos, {k} ya {deb} haberse dado de baja.']),{k:vencidos, deb:vencidos===1?'debería':'deberían', pas:vencidos===1?'se ha pasado':'se han pasado'}).replace(/^1 ya debería estar dados/,'1 ya debería estar dado');
    if(sig) txt += ' ' + fill(pick('dpPs',['El siguiente toca el {f}.','El próximo, el {f}.']),{f:fmtD(new Date(sig))});
    if(count) txt = fill('Tienes {n} {c} en doble pausa', {n:numU(n),c:c}) + (vencidos ? ', y '+vencidos+' ya '+(vencidos===1?'debería estar dado':'deberían estar dados')+' de baja.' : '.');
    return { say: txt };
  }
  function vigilaDobleP(force){
    try{
      if(!semilla('doblePausa')) return;
      var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
      var ult=0; try{ ult=parseInt(localStorage.getItem(DP_KEY)||'0',10)||0; }catch(e){}
      if(!force && Date.now()-ult < 3600000) return;
      google.script.run.withSuccessHandler(function(res){
        if(!res || !res.ok || !res.items || !res.items.length) return;
        try{ localStorage.setItem(DP_KEY, String(Date.now())); }catch(e){}
        B._dpLast = res.items;
        var n=res.items.length, it0=res.items[0];
        var quien = titleCase(it0.nombre||''), comp = it0.compania ? ' ('+compName(it0.compania)+')' : '';
        var msg = n===1
          ? fill(pick('dp1',['Ojo: el contrato de {q}{c} ya está para dar de baja. Lleva en doble pausa desde hace mucho. Dalo de baja y ponle la ❌.','Recordatorio: toca dar de baja el contrato de {q}{c}, que sigue en doble pausa. Cuando lo hagas, cámbiale el estado a ❌.','Tienes pendiente dar de baja a {q}{c}: ya ha cumplido el tiempo en doble pausa.']),{q:quien||'un cliente',c:comp})
          : fill(pick('dpN',['Ojo: tienes {n} contratos en doble pausa que ya toca dar de baja. El más antiguo es el de {q}{c}. Cuando los des de baja, ponles la ❌.','Recordatorio: {n} contratos en doble pausa están ya para dar de baja. Empieza por {q}{c}.','Tienes {n} contratos en doble pausa pendientes de dar de baja. ¿Te los enseño?']),{n:n,q:quien||'un cliente',c:comp});
        B.duckSay(msg, [{ t:'👀 Ver contratos', v:'dp:ver' }]);
        cobrarAviso('doblePausa', res.items.map(function(x){ return x.row+'|'+(x.fecha||x.instalacion||''); }));
      }).withFailureHandler(function(){}).apiGetDoblePausaVencidos(90);
    }catch(e){}
  }
  setInterval(vigilaDobleP, 60000);
  setTimeout(vigilaDobleP, 25000);
  B.testDobleP = function(){ vigilaDobleP(true); };
  B._dpVer = function(done){
    ensureContratos(function(){
      var rows={}; (B._dpLast||[]).forEach(function(x){ rows[x.row]=1; });
      var l=contratos().filter(function(it){ return rows[it.__row] && esDoblePausa(it); });
      if(!l.length) return done({ say: pick('dpV0',['Ya no queda ninguno pendiente. ¡Bien hecho!','Parece que ya los has dado todos de baja.']) });
      l.sort(function(x,y){ return (dpVence(x)||9e15)-(dpVence(y)||9e15); });
      render(l, null, true);
      var h0=new Date(); h0=new Date(h0.getFullYear(),h0.getMonth(),h0.getDate()).getTime();
      setTimeout(function(){ dpListaFechas(l, h0); }, 400);
      done({ say: fill(pick('dpV',['Aquí los tienes: {n} {c} en doble pausa para dar de baja.','Te enseño los {n} {c} que toca dar de baja.']),{n:numU(l.length),c:plural(l.length,'contrato','contratos')}) });
    });
  };
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

  /* =====================================================================
     SALDO DEL ASISTENTE: cada mensaje ESCRITO cuesta 0,019 € (los botones no).
     El saldo vive en el servidor (igual en todos los ordenadores), en milésimas de euro.
     ===================================================================== */
  var SALDO=null, COSTE=19;
  function saldoTxt(m){ return (Math.floor(Math.max(0,m)/10)/100).toFixed(2).replace('.',','); }
  function saldoPintar(){
    var x=document.getElementById('iaChatClose'); if(!x || !x.parentNode) return;
    var el=document.getElementById('lucasSaldo');
    if(!el){ el=document.createElement('span'); el.id='lucasSaldo'; el.title='Saldo del asistente';
      el.style.cssText='margin-left:auto;margin-right:14px;font-size:12px;font-weight:800;white-space:nowrap;letter-spacing:.3px;font-variant-numeric:tabular-nums;';
      x.parentNode.insertBefore(el, x); }
    el.textContent='Saldo: '+(SALDO==null?'…':saldoTxt(SALDO)+' €');
    el.style.color = SALDO==null ? '#9aa3ad' : (SALDO<COSTE ? '#ff4d4d' : (SALDO<1000 ? '#ffb020' : '#17ff5f'));
  }
  function saldoCargar(){ try{ google.script.run.withSuccessHandler(function(r){ if(r && r.ok){ SALDO=r.saldo; saldoPintar(); } }).withFailureHandler(function(){}).apiSaldoVer(); }catch(e){} }
  B.saldoSet = function(m){ SALDO=m; saldoPintar(); };
  setTimeout(saldoCargar, 1500); setInterval(saldoCargar, 60000); setInterval(saldoPintar, 2000);
  function saldoConsumir(cant){
    cant = (cant>=1 && cant<=COSTE) ? Math.round(cant) : COSTE;   // 19 milésimas = 1,9 cént.; 1 = 0,1 cént.
    if(SALDO!=null){ SALDO=Math.max(0, SALDO-cant); saldoPintar(); }
    try{ google.script.run.withSuccessHandler(function(r){ if(r && r.saldo!=null){ SALDO=r.saldo; saldoPintar(); } }).withFailureHandler(function(){}).apiSaldoConsumir(cant); }catch(e){}
  }
  function sinSaldo(done){
    done({ say: pick('sinSaldo',['⚡ Te has quedado sin créditos IA. Contacta con el administrador para recargarlos y seguimos.','🔋 Créditos IA agotados. Pide al administrador una recarga y vuelvo a estar a pleno rendimiento.','Lo siento, no quedan créditos IA en tu cuenta. Contacta con el administrador para recargarlos.']) });
    try{
      if(document.getElementById('lucasSinSaldo')) return;
      var ov=document.createElement('div'); ov.id='lucasSinSaldo';
      ov.style.cssText='position:fixed;inset:0;z-index:2147483200;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,2,2,.66);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);';
      var c=document.createElement('div');
      c.style.cssText='width:min(420px,100%);border-radius:22px;padding:26px 24px 20px;text-align:center;color:#fff;background:linear-gradient(160deg,#1a0707,#0a0303);border:2px solid #ff4d4d;box-shadow:0 0 30px rgba(255,77,77,.55),0 0 80px rgba(255,176,32,.2);animation:recIn .45s cubic-bezier(.2,1.4,.4,1);';
      c.innerHTML='<div style="font-size:52px;line-height:1;filter:drop-shadow(0 0 12px #ff4d4d)">🔋</div><div style="margin-top:8px;font-size:12px;letter-spacing:4px;font-weight:900;color:#ff6b6b">CRÉDITOS IA AGOTADOS</div><div style="margin:14px 0 6px;font-size:20px;font-weight:900;line-height:1.3">Lucas IA se ha quedado sin créditos</div><div style="font-size:14px;color:#ffd0d0;line-height:1.45">El asistente necesita créditos IA para procesar tus consultas. Contacta con el administrador para recargarlos y seguir usándolo.</div><div style="display:inline-block;margin-top:12px;padding:5px 14px;border-radius:999px;border:1px solid #ffb020;color:#ffb020;font-weight:800;font-size:13px">Saldo: '+saldoTxt(SALDO||0)+' €</div>';
      var ok=document.createElement('button'); ok.type='button'; ok.textContent='ENTENDIDO';
      ok.style.cssText='display:block;width:100%;margin-top:18px;border:none;border-radius:14px;padding:14px;font-size:16px;font-weight:900;letter-spacing:1px;cursor:pointer;color:#1a0505;background:linear-gradient(90deg,#ff4d4d,#ffb020);box-shadow:0 0 22px rgba(255,77,77,.55);';
      ok.onclick=function(){ try{ ov.remove(); }catch(e){} };
      if(!document.getElementById('recCss')){ var st=document.createElement('style'); st.id='recCss'; st.textContent='@keyframes recIn{0%{opacity:0;transform:translateY(30px) scale(.9)}100%{opacity:1;transform:none}}'; document.head.appendChild(st); }
      c.appendChild(ok); ov.appendChild(c); document.body.appendChild(ov);
    }catch(e){}
  }
  // solo cobra los mensajes escritos (los botones pasan por B.pick y no cobran)
  var handleBase = B.handle;
  // «cls»: borra la conversación del chat (no cobra saldo)
  function borrarChat(done){
    try{ var box=document.getElementById('iaChatMsgs'); if(box) box.innerHTML=''; }catch(e){}
    GRUPOS.length=0; B._ctx=null; B._hist=[]; B._fibAsk=null; B._bajaAsk=null; B._recPend=null; B._pinAsk=null;
    done({ say: pick('cls',['🧹 Conversación borrada. ¿Empezamos de nuevo?','🧹 Chat limpio. Tú dirás.','🧹 Listo, pantalla en blanco. ¿Qué necesitas?']) });
  }
  B.handle = function(raw, done){
    if(/^\s*cls\s*$/i.test(String(raw||''))) return borrarChat(done);
    if(B._enHandle || B._porBoton) return handleBase(raw, done);
    if(SALDO!=null && SALDO<COSTE) return sinSaldo(done);
    try{ caducarTemporales(); }catch(e){}
    B._enHandle = true; B._gratis = false;
    // saludos, chistes, la hora, charla, el PIN y lo que no sabe responder: gratis. Lo útil (contratos, recordatorios, fichajes…) cobra
    var cobrado=false;
    try{ handleBase(raw, function(r){ var fallo = r && /\b(no he podido|se me ha atascado|ha fallado|algo ha fallado|no puedo (leer|acceder|conectar)|error al)\b/i.test(String(r.say||'')); var c = !cobrado && !B._gratis && !fallo && r && !r.notUnderstood; B._gratis=false; cobrado=true; done(r); if(c) saldoConsumir(); }); } finally{ B._enHandle = false; }
  };
  var pickBase = B.pick;
  B.pick = function(v, done){ B._porBoton = true; try{ return pickBase(v, done); } finally{ B._porBoton = false; } };

  /* =====================================================================
     BOTÓN «LIMPIAR IA» al lado de LIMPIAR: parpadea en verde si hay filtros
     puestos por el asistente; gris y desactivado si no los hay.
     ===================================================================== */
  var FIA=false;
  function filtroIA(on){ FIA=!!on; pintarBtnIA(); }
  B._setFiltroIA = filtroIA;
  // cualquier filtro puesto (por Lucas o a mano): buscador, compañía, fechas, iconos o tabla recortada
  function hayAlgunFiltro(){
    try{ var q=document.getElementById('q'), cf=document.getElementById('companyFilter'), df=document.getElementById('dateFrom'), dt=document.getElementById('dateTo');
      if((q && q.value.trim()) || (cf && cf.value) || (df && df.value) || (dt && dt.value)) return true; }catch(e){}
    // estado real de los filtros del panel (todos valen «apagado» al cargar)
    try{ if(typeof BLINK_MODE!=='undefined' && BLINK_MODE) return true; }catch(e){}
    try{ if(typeof CICLO_MODE!=='undefined' && CICLO_MODE) return true; }catch(e){}
    try{ if(typeof VIP_MODE!=='undefined' && VIP_MODE) return true; }catch(e){}
    try{ if(typeof FIBRA_MODE!=='undefined' && FIBRA_MODE) return true; }catch(e){}
    try{ if(typeof OMITIR_MODE!=='undefined' && OMITIR_MODE) return true; }catch(e){}
    if(B._finst) return true;   // botón «Fecha inst.»
    try{ if(typeof ICON_FILTERS!=='undefined' && ICON_FILTERS && (ICON_FILTERS.col44 || ICON_FILTERS.col45)) return true; }catch(e){}
    return false;
  }
  // estado de los iconos de filtro con la tabla «limpia» (al cargar y después de limpiar)
  var ICO_BASE=null;
  function estadoIconos(){ var a=[]; try{ document.querySelectorAll('.searchHead .active').forEach(function(b){ a.push(b.id || b.getAttribute('data-ico') || b.textContent.trim()); }); }catch(e){} return a.sort().join('|'); }
  function fijarBase(){ ICO_BASE=estadoIconos(); }
  // el LIMPIAR del panel no reinicia FIBRA ni VIP: se hace aquí (estado + colores de los botones)
  function resetCompania(){
    try{
      var sel=document.getElementById('companyFilter'); if(!sel) return;
      var wrap=sel.nextElementSibling;
      var todas = wrap && wrap.classList && wrap.classList.contains('pillSelect') ? wrap.querySelector('.pillMenu .pillOpt') : null;
      if(todas && typeof todas.onclick==='function'){ todas.onclick(); return; }     // opción «TODAS LAS COMPAÑÍAS» del desplegable
      sel.value=''; sel.dispatchEvent(new Event('change'));
    }catch(e){}
  }
  function resetFibraVip(){
    try{ if(typeof FIBRA_MODE!=='undefined') FIBRA_MODE=0; }catch(e){}
    try{ if(typeof VIP_MODE!=='undefined') VIP_MODE=0; }catch(e){}
    ['btnFibraSi','btnFibraNo','btnVip'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.classList.remove('active'); el.style.borderColor=''; el.style.background=''; if(id!=='btnVip') el.style.color=''; } });
  }
  function pintarBtnIA(){
    try{
      var b=document.getElementById('btnLimpiarIA');
      if(!b){
        var lim=document.querySelector('.dateRow button[onclick*="clearSearch"]'); if(!lim) return;
        if(!document.getElementById('iaBtnCss')){ var st=document.createElement('style'); st.id='iaBtnCss';
          st.textContent='#btnLimpiarIA{transition:background .2s,color .2s,box-shadow .2s,opacity .2s}'+
            '#btnLimpiarIA:disabled{opacity:.45;filter:grayscale(1);cursor:not-allowed;box-shadow:none}'+
            '#btnLimpiarIA.iaOn{color:#04140a!important;background:#17ff5f!important;border-color:#17ff5f!important;cursor:pointer;animation:iaBlink 1.1s ease-in-out infinite}'+
            '@keyframes iaBlink{0%,100%{box-shadow:0 0 6px rgba(23,255,95,.5);filter:brightness(1)}50%{box-shadow:0 0 22px rgba(23,255,95,1),0 0 42px rgba(23,255,95,.55);filter:brightness(1.15)}}';
          document.head.appendChild(st); }
        b=document.createElement('button'); b.id='btnLimpiarIA'; b.type='button'; b.className=lim.className; b.textContent='LIMPIAR FILTROS';
        b.title='Quitar todos los filtros de la tabla';
        b.onclick=function(){ if(b.disabled) return; try{ clearSearch(); }catch(e){} filtroIA(false); };
        lim.parentNode.insertBefore(b, lim.nextSibling);
        lim.style.display='none';                                   // el LIMPIAR antiguo ya no hace falta
        setTimeout(fijarBase, 400);                                 // así está la tabla limpia al entrar
        // si tocas tú los filtros a mano, el filtro de Lucas deja de estar activo
        ['q','companyFilter','dateFrom','dateTo'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.addEventListener('input', function(){ setTimeout(pintarBtnIA, 300); }); el.addEventListener('change', function(){ setTimeout(pintarBtnIA, 300); }); } });
      }
      if(typeof window.clearSearch==='function' && !window.clearSearch.__ia){ var cs=window.clearSearch; window.clearSearch=function(){ try{ B._lucasSnapClear && B._lucasSnapClear(); }catch(e){} resetFibraVip(); var r=cs.apply(this, arguments); resetCompania(); FIA=false; setTimeout(function(){ fijarBase(); pintarBtnIA(); }, 150); return r; }; window.clearSearch.__ia=true; }
      var act = FIA || hayAlgunFiltro();
      b.classList.toggle('iaOn', act); b.disabled=!act;
    }catch(e){}
  }
  setTimeout(pintarBtnIA, 1000); setInterval(pintarBtnIA, 800);

  /* =====================================================================
     DICTADO POR VOZ: el botón 🎤 del chat escucha y envía la pregunta.
     Si el navegador no deja usar el micro, explica cómo dictar con Windows + H.
     ===================================================================== */
  (function(){
    var REC = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec=null, oyendo=false, final='', PUENTE=false, cb=null;
    // El panel va dentro de un iframe de Google que no deja usar el micro: la página de fuera (GitHub) escucha y nos pasa el texto
    function alTop(msg){ try{ window.top.postMessage(msg, '*'); }catch(e){} }
    window.addEventListener('message', function(e){
      var d=e.data; if(!d || typeof d!=='object' || !d.lucasMicR) return;
      if(d.lucasMicR==='ok'){ PUENTE = !!d.soporta; return; }
      if(!cb) return;
      if(d.lucasMicR==='start') cb.start();
      else if(d.lucasMicR==='parcial') cb.parcial(String(d.texto||''));
      else if(d.lucasMicR==='error') cb.error(String(d.error||''));
      else if(d.lucasMicR==='end') cb.end(String(d.texto||''));
    });
    if(window.top!==window) alTop({ lucasMic:'check' });
    function aviso(txt){ try{ if(typeof window.addMsg==='function') return window.addMsg(txt,'ia'); }catch(e){} try{ var box=document.getElementById('iaChatMsgs'); if(!box) return; var d=document.createElement('div'); d.style.cssText='margin:6px 0;padding:8px 10px;border-radius:10px;background:#fff;border:1px solid #eee;max-width:85%'; d.textContent=txt; box.appendChild(d); box.scrollTop=box.scrollHeight; }catch(e){} }
    function planB(){ aviso('No he podido usar el micrófono. Revisa que el navegador tenga permiso de micrófono para el panel (el candado de la barra de direcciones) y vuelve a pulsar 🎤.'); }
    function pinta(b, on){ b.textContent = on ? '⏺' : '🎤'; b.style.background = on ? '#e53935' : '#eee'; b.style.color = on ? '#fff' : ''; b.style.animation = on ? 'lucasMicPulso 1s infinite' : ''; b.title = on ? 'Escuchando… pulsa para parar' : 'Hablar con Lucas'; }
    function montar(){
      var old=document.getElementById('iaChatMic'), input=document.getElementById('iaChatInput'), send=document.getElementById('iaChatSend');
      if(!old || !input || old.getAttribute('data-voz')) return !!(old && old.getAttribute('data-voz'));
      if(!document.getElementById('lucasMicCss')){ var st=document.createElement('style'); st.id='lucasMicCss'; st.textContent='@keyframes lucasMicPulso{0%,100%{box-shadow:0 0 0 0 rgba(229,57,53,.6)}50%{box-shadow:0 0 0 6px rgba(229,57,53,0)}}'; document.head.appendChild(st); }
      var b=old.cloneNode(true); b.setAttribute('data-voz','1'); old.parentNode.replaceChild(b, old); pinta(b,false);
      b.addEventListener('click', function(){
        if(oyendo){ if(PUENTE) alTop({ lucasMic:'stop' }); else { try{ rec.stop(); }catch(e){} } return; }
        if(!PUENTE && !REC) return planB();
        try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
        var antes=input.value, fallo=false; final='';
        cb = {
          start: function(){ oyendo=true; pinta(b,true); input.placeholder='Te escucho…'; },
          parcial: function(tx){ input.value=tx; },
          error: function(e){ fallo=true; if(e==='not-allowed' || e==='service-not-allowed' || e==='audio-capture') planB(); else if(e==='no-speech') aviso('No te he oído. Pulsa 🎤 y habla cuando se ponga en rojo.'); else if(e!=='aborted') aviso('El dictado ha fallado ('+e+'). Prueba otra vez.'); },
          end: function(t){ oyendo=false; pinta(b,false); input.placeholder='Escribe tu pregunta...'; t=String(t||'').trim(); cb=null;
            if(t){ input.value=t; try{ if(send) send.click(); else input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,which:13,bubbles:true})); }catch(e){} }
            else if(!fallo){ input.value=antes; } }
        };
        if(PUENTE){ alTop({ lucasMic:'start' }); return; }
        rec=new REC(); rec.lang='es-ES'; rec.interimResults=true; rec.continuous=false; rec.maxAlternatives=1;
        var c=cb;
        rec.onstart=function(){ c.start(); };
        rec.onresult=function(ev){ var tmp=''; for(var i=ev.resultIndex;i<ev.results.length;i++){ var tx=ev.results[i][0].transcript; if(ev.results[i].isFinal) final+=tx; else tmp+=tx; } c.parcial((final+tmp).trim()); };
        rec.onerror=function(ev){ c.error(ev && ev.error); };
        rec.onend=function(){ c.end(final); };
        try{ rec.start(); }catch(e){ planB(); }
      });
      return true;
    }
    var n=0, iv=setInterval(function(){ if(montar() || ++n>120) clearInterval(iv); }, 1000);
  })();

  /* =====================================================================
     FILTRO DE LUCAS PERSISTENTE: al guardar un contrato el panel recarga y
     vuelve a filtrar; aquí se recuerdan las filas que filtró Lucas y se
     vuelven a aplicar hasta pulsar LIMPIAR FILTROS (o usar otro filtro a mano).
     ===================================================================== */
  var LSNAP=null, enAF=false, LREF=null;
  B._lucasSnapClear=function(){ LSNAP=null; };
  function montarPersistencia(){
    if(typeof window.applyFilters!=='function' || typeof window.renderContratosPage!=='function') return false;
    if(window.applyFilters.__lp) return true;
    var af=window.applyFilters, rp=window.renderContratosPage;
    window.renderContratosPage=function(){
      var r=rp.apply(this, arguments);
      // solo cuando Lucas pone una lista nueva (no al pasar de página): esa es la base que se combina con los filtros a mano
      try{ if(!enAF && FIA && Array.isArray(FILTERED) && FILTERED!==LREF) LSNAP=FILTERED.map(function(it){ return it.__row; }); LREF=FILTERED; }catch(e){}
      return r;
    };
    window.applyFilters=function(){
      // los filtros a mano se SUMAN a lo que filtró Lucas, hasta pulsar LIMPIAR FILTROS
      enAF=true; var r;
      try{ r=af.apply(this, arguments); }
      finally{
        try{
          if(((LSNAP && FIA) || B._finst) && Array.isArray(FILTERED)){
            if(LSNAP && FIA){ var set={}; LSNAP.forEach(function(k){ set[k]=1; }); FILTERED = FILTERED.filter(function(it){ return set[it.__row]; }); }
            if(B._finst){ var quiereVerde = B._finst===2; FILTERED = FILTERED.filter(function(it){ var t=String(it['15']||'').trim(); if(!t) return false; return instVerde(it)===quiereVerde; }); }
            var maxP=Math.max(1, Math.ceil(FILTERED.length/500)); if(typeof PAGE==='number' && PAGE>maxP) PAGE=maxP;
            rp();
          }
          LREF=FILTERED;
        }catch(e){ console.warn('[Lucas] filtro persistente', e); }
        enAF=false;
      }
      return r;
    };
    window.applyFilters.__lp = true;
    if(typeof window.clearSearch==='function'){ var cs0=window.clearSearch; var csW=function(){ LSNAP=null; B._finst=0; try{ pintarFinst(); }catch(e){} return cs0.apply(this, arguments); }; for(var k in cs0){ try{ csW[k]=cs0[k]; }catch(e){} } window.clearSearch=csW; }
    return true;
  }
  (function(){ var n=0, iv=setInterval(function(){ if(montarPersistencia() || ++n>300) clearInterval(iv); }, 1000); })();

  /* =====================================================================
     PARPADEO DE LUCAS: solo cuando está entero fuera (fotogramas 5 y 6).
     Párpados en imágenes aparte encima del fotograma: medio, cerrado, medio.
     ===================================================================== */
  (function(){
    var BASE='https://puntofibra.github.io/panel/';
    var ov={}, orig=null, peek=null, estable=0, frame=-1, enBlink=false;
    function frameActual(){ if(!orig) return -1; for(var i=0;i<orig.length;i++) if(orig[i].classList.contains('on')) return i; return -1; }
    function ocultar(){ for(var k in ov) ov[k].style.opacity='0'; }
    function montar(){
      peek=document.getElementById('lucasPeek'); if(!peek) return false;
      if(peek.getAttribute('data-blink')) return true;
      orig=Array.prototype.slice.call(peek.querySelectorAll('img')).slice(0,6); if(orig.length<6) return false;
      peek.setAttribute('data-blink','1');
      [['5a',4],['5b',4],['6a',5],['6b',5]].forEach(function(x){
        var im=document.createElement('img'); im.src=BASE+'lucas-f'+x[0]+'.png'; im.alt='';
        im.style.cssText='position:absolute;left:0;top:0;width:171px;height:140px;opacity:0;pointer-events:none;user-select:none;-webkit-user-drag:none;transition:none;';
        im.className='lucasBlink'; peek.appendChild(im); ov[x[0]]=im;
      });
      var mo=new MutationObserver(function(){ var f=frameActual(); if(f!==frame){ frame=f; estable=Date.now(); ocultar(); enBlink=false; } });
      orig.forEach(function(im){ mo.observe(im,{attributes:true,attributeFilter:['class']}); });
      frame=frameActual(); estable=Date.now();
      programar();
      return true;
    }
    function pasoBlink(seq, i, f, fin){
      if(frame!==f){ ocultar(); enBlink=false; return; }          // se ha movido: fuera párpados
      ocultar(); if(i>=seq.length){ enBlink=false; if(fin) fin(); return; }
      if(seq[i][0]) ov[f===4?'5'+seq[i][0]:'6'+seq[i][0]].style.opacity='1';
      setTimeout(function(){ pasoBlink(seq, i+1, f, fin); }, seq[i][1]);
    }
    function parpadear(){
      var f=frameActual();
      if((f!==4 && f!==5) || Date.now()-estable<380 || enBlink || document.hidden) return;
      enBlink=true;
      var seq=[['a',45],['b',75],['a',55],[null,0]];
      pasoBlink(seq, 0, f, function(){ if(Math.random()<0.2){ setTimeout(function(){ if(frameActual()===f && !enBlink){ enBlink=true; pasoBlink(seq,0,f); } }, 170); } });
    }
    function programar(){ setTimeout(function(){ try{ parpadear(); }catch(e){} programar(); }, 1800+Math.random()*3400); }
    var n=0, iv=setInterval(function(){ if(montar() || ++n>120) clearInterval(iv); }, 1000);
  })();

  /* =====================================================================
     AVISOS DE FICHAJE (semilla «avisosFichaje»): en cuanto un empleado
     ficha la entrada o la salida, Lucas lo avisa en este ordenador.
     ===================================================================== */
  (function(){
    var CLAVE='pfFichVistos', primera=true;
    function leer(){ try{ var o=JSON.parse(localStorage.getItem(CLAVE)||'{}'); return o && o.dia===iso(new Date()) ? o : { dia:iso(new Date()), k:{} }; }catch(e){ return { dia:iso(new Date()), k:{} }; } }
    function guardar(o){ try{ localStorage.setItem(CLAVE, JSON.stringify(o)); }catch(e){} }
    function minutos(h){ var m=String(h||'').match(/(\d{1,2}):(\d{2})/); return m ? (+m[1])*60+(+m[2]) : null; }
    function revisar(){
      try{
        if(!semilla('avisosFichaje')) return;
        var app=document.getElementById('app'); if(app && app.classList.contains('hidden')) return;   // aún en el login
        google.script.run.withSuccessHandler(function(res){
          var items = (res && res.items) || [], vis=leer(), ahora=new Date(), mAhora=ahora.getHours()*60+ahora.getMinutes(), nuevos=[];
          items.forEach(function(x){
            var k=(x.empleado||'?')+'|'+(x.tipo||'')+'|'+(x.hora||''); if(vis.k[k]) return;
            vis.k[k]=1;
            var mm=minutos(x.hora);
            // al abrir el panel no avisa de fichajes viejos: solo de los de los últimos 10 minutos
            if(primera && (mm==null || mAhora-mm>10)) return;
            nuevos.push(x);
          });
          primera=false; guardar(vis);
          nuevos.forEach(function(x, i){
            var ent = String(x.tipo||'').toUpperCase()==='ENTRADA';
            var msg = ent
              ? fill(pick('avFE',['🟢 {e} acaba de fichar la ENTRADA a las {h}.','🟢 Fichaje de entrada: {e} ha empezado a trabajar a las {h}.','🟢 {e} ya está aquí: entrada fichada a las {h}.']),{e:x.empleado||'Un empleado',h:x.hora||''})
              : fill(pick('avFS',['🔴 {e} acaba de fichar la SALIDA a las {h}.','🔴 Fichaje de salida: {e} se ha ido a las {h}.','🔴 {e} ha terminado: salida fichada a las {h}.']),{e:x.empleado||'Un empleado',h:x.hora||''});
            setTimeout(function(){ try{ B.duckSay(msg); }catch(e){} }, i*4000);
          });
        }).withFailureHandler(function(){}).apiFichajeLucasDia(iso(new Date()));
      }catch(e){}
    }
    setTimeout(revisar, 8000); setInterval(revisar, 20000);
  })();

  /* =====================================================================
     CHAT ENTRE EMPLEADOS: «chat» → ¿a quién? → escribes el mensaje → le llega
     en su ordenador (semillas chatManu / chatJorge / chatMaicol / chatSebas).
     ===================================================================== */
  (function(){
    var PEND={};   // mensajes enseñados y sin aceptar: id -> { de, texto, ult, n }
    var PERS=[['Manu','chatManu'],['Jorge','chatJorge'],['Maicol','chatMaicol'],['Sebas','chatSebas']];
    function yo(){ return PERS.filter(function(p){ return semilla(p[1]); }).map(function(p){ return p[0]; }); }
    function nombreDe(t){ t=fold(t); var r=null; PERS.forEach(function(p){ if(new RegExp('\\b'+fold(p[0])+'\\b').test(t)) r=p[0]; }); if(!r && /\bsebastian\b/.test(t)) r='Sebas'; if(!r && /\b(michael|maikol)\b/.test(t)) r='Maicol'; return r; }
    var ESPERA=null;   // { para, at }
    function preguntarA(done){
      var me=yo();
      if(!me.length) return done({ say: pick('chat0',['Este ordenador no tiene el chat activado, así que no puedo enviar mensajes desde aquí.','Desde este ordenador el chat no está activado. Pídeselo al administrador.']) });
      var otros=PERS.map(function(p){ return p[0]; }).filter(function(n){ return me.indexOf(n)<0; });
      done({ say: pick('chatQ',['💬 ¿A quién le quieres enviar un mensaje?','💬 ¿Para quién es el mensaje?','💬 Vale, ¿a quién se lo mando?']), buttons: otros.map(function(n){ return { t:'💬 '+n, v:'chat:para:'+n }; }) });
    }
    function pedirTexto(para, done){
      ESPERA={ para:para, at:Date.now() };
      done({ say: fill(pick('chatT',['✍️ Escribe el mensaje para {n}.','✍️ Perfecto, ¿qué le digo a {n}?','✍️ Adelante, escribe lo que quieres que le llegue a {n}.']),{n:para}) });
    }
    function enviar(texto, done){
      var para=ESPERA.para, de=yo()[0]; ESPERA=null;
      if(!de) return done({ say:'Este ordenador no tiene el chat activado.' });
      if(SALDO!=null && SALDO<COSTE) return sinSaldo(done);
      try{
        google.script.run.withSuccessHandler(function(r){
          if(!r || !r.ok) return done({ say:'❌ No he podido enviar el mensaje. Inténtalo otra vez.' });
          saldoConsumir();
          done({ say: fill(pick('chatOK',['✅ Mensaje enviado a {n}.','✅ Hecho, {n} ya tiene tu mensaje.','✅ Enviado. Se lo digo a {n} en cuanto tenga el panel abierto.']),{n:para}) });
        }).withFailureHandler(function(){ done({ say:'❌ No he podido enviar el mensaje. Inténtalo otra vez.' }); }).apiChatEnviar(de, para, String(texto).slice(0,1000));
      }catch(e){ done({ say:'❌ No he podido enviar el mensaje.' }); }
    }
    var h0=B.handle;
    B.handle=function(raw, done){
      var t=fold(raw);
      if(ESPERA && Date.now()-ESPERA.at>10*60000) ESPERA=null;
      if(ESPERA){
        if(/^(cancelar|cancela|nada|olvidalo|dejalo|no)$/.test(t)){ ESPERA=null; return done({ say: pick('chatX',['Vale, mensaje cancelado.','Cancelado, no envío nada.']) }); }
        if(String(raw||'').trim()) return enviar(String(raw).trim(), done);
      }
      if(/^(chat|chatear|abrir chat|mandar (un )?mensaje|enviar (un )?mensaje|escribir (un )?mensaje)$/.test(t)) return preguntarA(done);
      var mC=t.match(/^(?:chat|mensaje|manda(?:r|le)? (?:un )?mensaje|escribe(?:le)?)\s+(?:con |a |para )?(\w+)$/);
      if(mC){ var n=nombreDe(mC[1]); if(n && yo().length && yo().indexOf(n)<0) return pedirTexto(n, done); }
      return h0(raw, done);
    };
    var p0=B.pick;
    B.pick=function(v, done){
      v=String(v||'');
      if(v.indexOf('chat:para:')===0){ if(!yo().length) return preguntarA(done); return pedirTexto(v.slice(10), done); }
      if(v.indexOf('chat:ok:')===0 || v.indexOf('chat:resp:')===0){
        var pz=v.split(':'), id=pz[2], de=pz.slice(3).join(':'), resp=pz[1]==='resp';
        delete PEND[id];
        try{ google.script.run.withFailureHandler(function(){}).apiChatLeido([id]); }catch(e){}
        if(resp) return pedirTexto(de, done);
        return done({ say: fill(pick('chatAck',['👍 Hecho, {d} sabrá que has recibido su mensaje.','👍 Perfecto, le aviso a {d} de que lo has leído.','👍 Listo, {d} verá que su mensaje te ha llegado.']),{d:de}) });
      }
      return p0(v, done);
    };
    // ---- recibir: cada 15 s mira si hay mensajes para las personas con semilla en este ordenador ----
    var vistos={}, ocupado=false;
    function burbujaImg(id, mia){
      try{
        var box=document.getElementById('iaChatMsgs'); if(!box || !id) return;
        var w=document.createElement('div'); w.style.cssText='margin:6px 0;display:flex;justify-content:'+(mia?'flex-end':'flex-start');
        var img=document.createElement('img'); img.alt='Imagen'; img.title='Pulsa para verla en grande';
        img.src=String(id).indexOf('data:')===0 ? id : 'https://drive.google.com/thumbnail?id='+id+'&sz=w400';
        img.style.cssText='max-width:170px;max-height:170px;border-radius:12px;cursor:zoom-in;box-shadow:0 2px 10px rgba(0,0,0,.25);background:#eee;'+(mia?'border:2px solid #111;':'');
        img.onclick=function(){ var rid=img.getAttribute('data-id')||id; if(String(rid).indexOf('data:')===0) return; if(B._verImagen) B._verImagen(rid); };
        w.appendChild(img); box.appendChild(w); box.scrollTop=box.scrollHeight;
        return img;
      }catch(e){}
    }
    function enviarImagen(file){
      var para=ESPERA.para, de=yo()[0];
      if(!de) return;
      if(SALDO!=null && SALDO<COSTE) return sinSaldo(function(r){ if(r && r.say && window.__lucasSay) window.__lucasSay(r.say); });
      ESPERA=null;
      var rd=new FileReader();
      rd.onload=function(){
        var url=String(rd.result||''), b64=url.slice(url.indexOf(',')+1);
        var prev=burbujaImg(url, true); if(prev) prev.style.opacity='.55';
        try{
          google.script.run.withSuccessHandler(function(r){
            if(!r || !r.ok){ if(window.__lucasSay) window.__lucasSay('❌ No he podido enviar la imagen. Inténtalo otra vez.'); if(prev) prev.parentNode.remove(); return; }
            if(prev){ prev.style.opacity='1'; prev.setAttribute('data-id', r.id); }
            saldoConsumir();
            if(window.__lucasSay) window.__lucasSay(fill(pick('chatImgOK',['✅ Imagen enviada a {n}.','✅ Hecho, {n} ya tiene tu imagen.']),{n:para}));
          }).withFailureHandler(function(){ if(window.__lucasSay) window.__lucasSay('❌ No he podido enviar la imagen.'); if(prev) prev.parentNode.remove(); }).apiChatLucasImagen(de, para, b64, file.type||'image/png');
        }catch(e){}
      };
      rd.readAsDataURL(file);
    }
    (function(){
      var n=0, iv=setInterval(function(){
        var inp=document.getElementById('iaChatInput'); if(!inp && ++n<120) return; clearInterval(iv); if(!inp || inp.getAttribute('data-pegaimg')) return;
        inp.setAttribute('data-pegaimg','1');
        inp.addEventListener('paste', function(e){
          try{
            var it=(e.clipboardData && e.clipboardData.items) || [];
            for(var i=0;i<it.length;i++){
              if(it[i].kind==='file' && /^image\//.test(it[i].type)){
                var f=it[i].getAsFile(); if(!f) continue;
                e.preventDefault();
                if(ESPERA && Date.now()-ESPERA.at<10*60000) enviarImagen(f);
                else if(window.__lucasSay) window.__lucasSay(pick('chatImgNo',['Para enviar una imagen, escribe «chat», elige a quién y luego pega la imagen.','Primero escribe «chat» y dime a quién se la mando; después pega la imagen.']));
                return;
              }
            }
          }catch(err){}
        });
      }, 1000);
    })();
    function recibir(){
      var me=yo(); if(!me.length || ocupado) return;
      var app=document.getElementById('app'); if(app && app.classList.contains('hidden')) return;
      ocupado=true;
      try{
        google.script.run.withSuccessHandler(function(r){
          ocupado=false;
          var items=(r && r.items)||[], vivos={};
          items.forEach(function(m){ vivos[m.id]=1; });
          Object.keys(PEND).forEach(function(id){ if(!vivos[id]) delete PEND[id]; });   // aceptado (aquí o en otro ordenador)
          items.forEach(function(m){
            if(vistos[m.id]) return; vistos[m.id]=1;
            PEND[m.id]={ de:m.de, texto:m.texto, ult:Date.now(), n:0 };
            var intro=fill(pick('chatIn',['📩 Tienes un mensaje de {d}:','📩 {d} te ha escrito:','📩 Tengo un mensaje para ti de {d}:','📩 Mensaje nuevo de {d}:','📩 {d} te dice:','📩 Te escribe {d}:']),{d:m.de});
            var para = me.length>1 ? ' (para '+m.para+')' : '';
            var pide=fill(pick('chatPide',['Pulsa Aceptar para que {d} sepa que has recibido su mensaje.','Dale a Aceptar y {d} sabrá que lo has leído.','Pulsa Aceptar para avisar a {d} de que te ha llegado.']),{d:m.de});
            var esImg=/^\[\[IMG\]\]/.test(m.texto||''), imgId=esImg ? String(m.texto).slice(7).trim() : '';
            if(esImg){ intro=fill(pick('chatInImg',['📩 {d} te ha enviado una imagen:','📩 Tienes una imagen de {d}:','📩 {d} te manda una imagen:']),{d:m.de}); setTimeout(function(){ burbujaImg(imgId, false); }, 2600); }
            B.duckSay(intro.replace(/:$/, para+':')+(esImg ? '' : ' «'+m.texto+'»')+' '+pide, [{ t:'✅ Aceptar', v:'chat:ok:'+m.id+':'+m.de }, { t:'↩️ Responder a '+m.de, v:'chat:resp:'+m.id+':'+m.de }]);
          });
          // acuses de lectura de los mensajes que he enviado yo
          var ac=(r && r.acuses)||[], idsA=[];
          ac.forEach(function(a){
            if(vistos['A'+a.id]) return; vistos['A'+a.id]=1; idsA.push(a.id);
            var corto=String(a.texto||''); if(/^\[\[IMG\]\]/.test(corto)) corto='🖼️ imagen'; if(corto.length>60) corto=corto.slice(0,57)+'…';
            B.duckSay(fill(pick('chatRec',['✅ {p} ha recibido tu mensaje: «{t}».','✅ {p} ya ha leído tu mensaje: «{t}».','👀 {p} ha visto tu mensaje: «{t}».']),{p:a.para,t:corto}));
          });
          if(idsA.length){ try{ google.script.run.withFailureHandler(function(){}).apiChatAcuseVisto(idsA); }catch(e){} }
        }).withFailureHandler(function(){ ocupado=false; }).apiChatPendientes(me);
      }catch(e){ ocupado=false; }
    }
    // a los 5 minutos sin aceptar ni responder, Lucas lo recuerda (cada 5 minutos, hasta 3 veces)
    function recordar(){
      var ahora=Date.now();
      Object.keys(PEND).forEach(function(id){
        var p=PEND[id]; if(ahora-p.ult < 5*60000 || p.n>=3) return;
        p.ult=ahora; p.n++;
        var corto=String(p.texto||''); if(corto.length>70) corto=corto.slice(0,67)+'…';
        var msg=fill(pick('chatRecu',[
          '⏳ {d} seguramente esté esperando la confirmación de que has recibido su mensaje. Pulsa Aceptar y le diré que ya lo tienes.',
          '⏳ Oye, {d} te escribió hace un rato: «{t}». Dale a Aceptar para que sepa que te ha llegado.',
          '⏳ Tienes pendiente el mensaje de {d}. Pulsa Aceptar y le aviso de que lo has leído.',
          '⏳ {d} todavía no sabe si has visto su mensaje. Pulsa Aceptar o respóndele y se lo hago saber.',
          '⏳ Recordatorio: el mensaje de {d} sigue sin confirmar. Un toque en Aceptar y {d} se queda tranquilo.'
        ]),{d:p.de,t:corto});
        B.duckSay(msg, [{ t:'✅ Aceptar', v:'chat:ok:'+id+':'+p.de }, { t:'↩️ Responder a '+p.de, v:'chat:resp:'+id+':'+p.de }]);
      });
    }
    setTimeout(recibir, 6000); setInterval(recibir, 15000); setInterval(recordar, 30000);
  })();

  /* =====================================================================
     VOZ SIEMPRE ACTIVA (semilla «vozSiempre»): sin altavoz en la cabecera
     del asistente, así nadie puede silenciar a Lucas en este ordenador.
     ===================================================================== */
  (function(){
    function fijar(){
      if(!semilla('vozSiempre')) return false;
      var t=document.getElementById('iaVozToggle'); if(!t) return false;
      if(t.getAttribute('data-fija')) return true;
      var ic=document.getElementById('iaVozIcon');
      if(ic && /🔇/.test(ic.textContent)) t.click();        // si estaba silenciado, vuelve a activar la voz
      var c=t.cloneNode(true);                                 // sin el clic que silencia
      var ic2=c.querySelector('#iaVozIcon'); if(ic2) ic2.remove();
      c.setAttribute('data-fija','1'); c.style.cursor='default'; c.removeAttribute('title');
      t.parentNode.replaceChild(c, t);
      return true;
    }
    var n=0, iv=setInterval(function(){ if(fijar() || ++n>120) clearInterval(iv); }, 1000);
  })();

  /* =====================================================================
     AVISOS DE PAUSA (semilla «avisosPausa»): un contrato que lleva 90 días
     en ⏸️ (fecha guardada en ID 53 al ponerle ese estado) → toca baja o doble pausa.
     Recuerda cada hora mientras siga en ⏸️.
     ===================================================================== */
  (function(){
    var KEY='pfPausaUltAviso', ULT=[];
    function esPausaSimple(it){ return (String(it['44']||'').match(/⏸/g)||[]).length===1; }
    function vigila(force){
      try{
        if(!semilla('avisosPausa')) return;
        var app=document.getElementById('app'); if(!app || app.classList.contains('hidden')) return;
        var ult=0; try{ ult=parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){}
        if(!force && Date.now()-ult < 3600000) return;
        google.script.run.withSuccessHandler(function(res){
          if(!res || !res.ok || !res.items || !res.items.length) return;
          try{ localStorage.setItem(KEY, String(Date.now())); }catch(e){}
          ULT=res.items;
          var n=res.items.length, it0=res.items[0], q=titleCase(it0.nombre||''), c=it0.compania ? ' ('+compName(it0.compania)+')' : '';
          var msg = n===1
            ? fill(pick('p1a',['⏸️ El contrato de {q}{c} lleva ya 90 días en pausa. Toca darlo de baja o hacerle la doble pausa.','⏸️ Ojo: {q}{c} sigue en pausa desde hace 90 días. Decide si lo das de baja o le pones la doble pausa ⏸️⏸️.','⏸️ Recordatorio: el contrato de {q}{c} ya ha cumplido 90 días en pausa. Hay que darlo de baja o pasarlo a doble pausa.']),{q:q,c:c})
            : fill(pick('pNa',['⏸️ Tienes {n} contratos que llevan 90 días o más en pausa. El más antiguo es el de {q}{c}. Toca darlos de baja o hacerles la doble pausa.','⏸️ Ojo: {n} contratos siguen en pausa desde hace 90 días o más (el primero, {q}{c}). Dales de baja o ponles la doble pausa ⏸️⏸️.','⏸️ Recordatorio: {n} contratos en pausa ya han cumplido los 90 días. Hay que decidir: baja o doble pausa.']),{n:n,q:q,c:c});
          B.duckSay(msg, [{ t:'👀 Ver contratos', v:'p1:ver' }]);
          try{ B._cobrarAviso('pausa', res.items.map(function(x){ return x.row+'|'+(x.fecha||''); })); }catch(e){}
        }).withFailureHandler(function(){}).apiGetPausaVencidos(90);
      }catch(e){}
    }
    setInterval(vigila, 60000); setTimeout(vigila, 30000);
    var p0=B.pick;
    B.pick=function(v, done){
      if(String(v)==='p1:ver'){
        return ensureContratos(function(){
          var rows={}; ULT.forEach(function(x){ rows[x.row]=x; });
          var l=contratos().filter(function(it){ return rows[it.__row] && esPausaSimple(it); });
          if(!l.length) return done({ say: pick('p1v0',['Ya no queda ninguno en pausa con más de 90 días. ¡Bien hecho!','Parece que ya los has gestionado todos.']) });
          render(l, null, true);
          done({ say: fill(pick('p1v',['Aquí tienes {n} {c} que llevan 90 días o más en pausa.','Te enseño {n} {c} en pausa desde hace 90 días o más.']),{n:numU(l.length),c:plural(l.length,'contrato','contratos')}) });
        });
      }
      return p0(v, done);
    };
  })();

  /* =====================================================================
     INFORME DE PAUSAS: «listado de pausas», «sácame las pausas», «qué pausas
     tienes programadas»… → ⏸️ (aviso a los 90 días de ID 53) y ⏸️⏸️ (dpVence).
     ===================================================================== */
  (function(){
    function nP(it){ return (String(it['44']||'').match(/⏸/g)||[]).length; }
    function esInforme(t){
      if(/\b(para|pendientes? de|hay que|tengo que|toca) pausar\b/.test(t)) return false;           // eso es «contratos para pausar»
      if(/\b(listado|lista|informe|resumen|relacion|reporte|calendario|agenda)\b.*\b(pausas?|pausad[oa]s)\b/.test(t)) return true;
      if(/\b(pausas?|pausad[oa]s|dobles? pausas?)\b.*\b(programad\w*|pendientes? de aviso|avisos?|avisar(me)?|vas a avisar|me avisaras|vencen|caducan|fechas?)\b/.test(t)) return true;
      if(/\b(avisos?|alertas?) de (las |los )?(pausas?|dobles? pausas?|contratos en pausa)\b/.test(t)) return true;
      if(/\bcuando (me )?(avisas|vas a avisar|avisaras|toca)\b.*\bpausa/.test(t)) return true;
      return /^(?:(?:muestrame|ensename|sacame|dame|pasame|ver|quiero ver|dime|lista|listame)\s+)?(?:todas\s+)?(?:las |los )?(?:pausas|contratos (?:en pausa|pausados)|pausas y (?:las )?dobles? pausas|dobles? pausas y (?:las )?pausas)$/.test(t);
    }
    function caja(titulo, filas, nota){
      var w=document.createElement('div'); w.style.cssText='margin-top:8px;';
      var h=document.createElement('div'); h.textContent=titulo; h.style.cssText='font-weight:800;margin-bottom:5px;color:#17ff5f;letter-spacing:.3px;'; w.appendChild(h);
      if(!filas.length){ var v=document.createElement('div'); v.textContent='— Ninguno —'; v.style.cssText='opacity:.6;'; w.appendChild(v); }
      filas.forEach(function(f){ var r=document.createElement('div'); r.textContent=f.t; if(f.rojo) r.style.color='#ff8a8a'; else if(f.amar) r.style.color='#ffd166'; w.appendChild(r); });
      if(nota){ var n=document.createElement('div'); n.textContent=nota; n.style.cssText='margin-top:5px;opacity:.65;font-size:11.5px;'; w.appendChild(n); }
      return w;
    }
    function fila(v, it, hoy0){
      var dias=Math.round((v-hoy0)/86400000);
      var cuando = dias<0 ? 'ya tocaba hace '+(-dias)+' '+plural(-dias,'día','días') : (dias===0 ? 'avisa hoy' : 'avisa en '+dias+' '+plural(dias,'día','días'));
      return { t:(dias<=0?'⚠️ ':'⏳ ')+fmtD(new Date(v))+' · '+titleCase(String(it['21']||'').trim()||'—')+(it['20']?' · '+String(it['20']).trim().toUpperCase():'')+(it['2']?' ('+compName(it['2'])+')':'')+' · '+cuando, rojo:dias<=0, amar:dias>0&&dias<=7 };
    }

    // ---- ventana emergente con el listado y botón de PDF ----
    function cargarJsPDF(cb){
      if(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable) return cb(true);
      var urls=[['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'],
                ['https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js','https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js']];
      function carga(lst, i, ok){ if(i>=lst.length) return ok(false); var sc=document.createElement('script'); sc.src=lst[i]; sc.onload=function(){ ok(true); }; sc.onerror=function(){ carga(lst, i+1, ok); }; document.head.appendChild(sc); }
      var need0=!(window.jspdf && window.jspdf.jsPDF);
      (need0 ? function(k){ carga(urls[0],0,k); } : function(k){ k(true); })(function(a){ if(!a) return cb(false); carga(urls[1],0,function(b){ cb(!!b); }); });
    }
    function pdf(lista){
      cargarJsPDF(function(ok){
        if(!ok) return alert('No se ha podido preparar el PDF. Revisa la conexión e inténtalo otra vez.');
        try{
          var doc=new window.jspdf.jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
          var hoy=new Date();
          doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(10,120,60); doc.text('Informe de pausas y dobles pausas', 14, 16);
          doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(90); doc.text('Generado el '+fmtD(hoy)+' a las '+('0'+hoy.getHours()).slice(-2)+':'+('0'+hoy.getMinutes()).slice(-2)+' · '+lista.length+' contratos · aviso a los 90 días', 14, 22);
          doc.autoTable({ startY:27, head:[['#','Tipo','Cliente','Documento','Dirección','Compañía','Fecha de aviso','Estado']],
            body: lista.map(function(x,i){ return [i+1, x.tipo===2?'Doble pausa':'Pausa', x.cliente, x.doc||'—', x.dir||'—', x.comp||'—', fmtD(new Date(x.v)), x.falta]; }),
            styles:{ fontSize:8.5, cellPadding:2.2, valign:'middle' }, headStyles:{ fillColor:[12,90,50], textColor:255, fontStyle:'bold' },
            bodyStyles:{ fillColor:[230,241,255] }, alternateRowStyles:{ fillColor:[255,246,210] }, columnStyles:{ 0:{ cellWidth:8, halign:'center' }, 1:{ cellWidth:18 }, 3:{ cellWidth:22 }, 6:{ cellWidth:22, halign:'center' }, 7:{ cellWidth:26 } },
            didParseCell:function(d){ if(d.section==='body' && d.column.index===7 && lista[d.row.index] && lista[d.row.index].dias<=0){ d.cell.styles.textColor=[200,30,30]; d.cell.styles.fontStyle='bold'; } } });
          doc.save('informe-pausas-'+iso(hoy)+'.pdf');
        }catch(e){ alert('No se ha podido crear el PDF.'); }
      });
    }
    function esc1(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function modal(lista){
      try{
        if(!document.getElementById('lucasInfCss')){
          var st=document.createElement('style'); st.id='lucasInfCss';
          st.textContent=[
            '#lucasInfPausas table{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;margin:0!important;}',
            '#lucasInfPausas th,#lucasInfPausas td{white-space:normal!important;word-break:break-word!important;overflow-wrap:anywhere!important;color:#15242c!important;border:none!important;padding:11px 12px!important;font-size:13.5px!important;text-align:left!important;max-width:none!important;overflow:visible!important;text-overflow:clip!important;vertical-align:middle!important;height:auto!important;}',
            '#lucasInfPausas tbody tr:nth-child(odd) td{background:#e6f1ff!important;}',
            '#lucasInfPausas tbody tr:nth-child(even) td{background:#fff6d2!important;}',
            '#lucasInfPausas tbody tr:hover td{filter:brightness(.97);}',
            '#lucasInfPausas thead th{position:sticky!important;top:0!important;z-index:2!important;background:#10241a!important;color:#17ff5f!important;font-size:11.5px!important;letter-spacing:.7px!important;text-transform:uppercase!important;font-weight:900!important;}',
            '#lucasInfPausas .lp-num{opacity:.55;text-align:center;display:block}',
            '#lucasInfPausas .lp-cli{font-weight:800;color:#0e1d24}',
            '#lucasInfPausas .lp-comp{display:block;font-size:11.5px;color:#5b6d76;font-weight:600;margin-top:1px}',
            '#lucasInfPausas .lp-doc{font-family:ui-monospace,Consolas,monospace;font-weight:700;color:#1d3340;letter-spacing:.3px}',
            '#lucasInfPausas .lp-copy{margin-left:6px;border:1px solid #b9cbd6;background:#fff;border-radius:7px;padding:2px 6px;font-size:12px;line-height:1.2;cursor:pointer;vertical-align:middle;transition:transform .12s,background .2s}',
            '#lucasInfPausas .lp-copy:hover{transform:scale(1.12);background:#eaf7ff}',
            '#lucasInfPausas .lp-copy.ok{background:#d6f8e1;border-color:#3cc27a}',
            '#lucasInfPausas .lp-fecha{font-weight:900;color:#0e1d24;white-space:nowrap}',
            '#lucasInfPausas .lp-ok{color:#1b7a3d;font-weight:800}',
            '#lucasInfPausas .lp-pronto{color:#b25e00;font-weight:800}',
            '#lucasInfPausas .lp-venc{color:#c62828;font-weight:900}',
            '#lucasInfPausas .lp-tag{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11.5px;font-weight:800;white-space:nowrap}',
            '#lucasInfPausas .lp-p1{background:#d9f0ff;color:#0b5d86;border:1px solid #8fd0f5}',
            '#lucasInfPausas .lp-p2{background:#ffe0e0;color:#b71c1c;border:1px solid #f3a3a3}'
          ].join('\n');
          document.head.appendChild(st);
        }
        var old=document.getElementById('lucasInfPausas'); if(old) old.remove();
        var ov=document.createElement('div'); ov.id='lucasInfPausas';
        ov.style.cssText='position:fixed;inset:0;z-index:2147483100;display:flex;padding:10px;background:rgba(3,10,7,.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);opacity:0;transition:opacity .25s;';
        var c=document.createElement('div');
        c.style.cssText='flex:1;width:100%;height:100%;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;background:#f7fbff;border:1px solid #17ff5f;box-shadow:0 0 30px rgba(23,255,95,.35),0 20px 60px rgba(0,0,0,.5);transform:translateY(18px) scale(.98);transition:transform .3s cubic-bezier(.2,1.3,.4,1);font-family:inherit;';
        var venc=lista.filter(function(x){ return x.dias<=0; }).length;
        var head='<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:linear-gradient(90deg,#0f2a1c,#0b1410);border-bottom:2px solid #17ff5f;flex:0 0 auto">'
          +'<div style="font-size:26px">📋</div><div style="flex:1;min-width:0"><div style="font-weight:900;font-size:18px;letter-spacing:.4px;color:#17ff5f">INFORME DE PAUSAS</div>'
          +'<div style="font-size:12.5px;color:#9fdcb7">'+lista.length+' '+plural(lista.length,'contrato','contratos')+' con aviso programado a los 90 días'+(venc?' · <b style="color:#ff8a8a">'+venc+' ya '+(venc===1?'pasado':'pasados')+' de fecha</b>':'')+'</div></div>'
          +'<button type="button" id="lucasInfPdf" style="border:none;border-radius:12px;padding:10px 16px;font-weight:900;cursor:pointer;color:#05140c;background:linear-gradient(90deg,#17ff5f,#00d4ff);box-shadow:0 0 14px rgba(23,255,95,.45);white-space:nowrap">⬇️ Descargar PDF</button>'
          +'<button type="button" id="lucasInfX" title="Cerrar" style="border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;width:40px;height:40px;border-radius:10px;font-size:20px;line-height:1;cursor:pointer">✕</button></div>';
        var filas=lista.map(function(x,i){
          var cls = x.dias<=0 ? 'lp-venc' : (x.dias<=7 ? 'lp-pronto' : 'lp-ok');
          return '<tr><td><span class="lp-num">'+(i+1)+'</span></td>'
            +'<td><span class="lp-tag '+(x.tipo===2?'lp-p2':'lp-p1')+'">'+(x.tipo===2?'⏸️⏸️ Doble pausa':'⏸️ Pausa')+'</span></td>'
            +'<td><span class="lp-cli">'+esc1(x.cliente)+'</span>'+(x.comp?'<span class="lp-comp">'+esc1(x.comp)+'</span>':'')+'</td>'
            +'<td><span class="lp-doc">'+esc1(x.doc||'—')+'</span>'+(x.doc?'<button type="button" class="lp-copy" data-doc="'+esc1(x.doc)+'" title="Copiar documento">📋</button>':'')+'</td>'
            +'<td>'+esc1(x.dir||'—')+'</td>'
            +'<td><span class="lp-fecha">'+fmtD(new Date(x.v))+'</span></td>'
            +'<td><span class="'+cls+'">'+(x.dias<=0?'⚠️ ':'')+esc1(x.falta)+'</span></td></tr>';
        }).join('');
        var body='<div style="overflow-y:auto;overflow-x:hidden;flex:1 1 auto;min-height:0;-webkit-overflow-scrolling:touch">'
          +'<table><colgroup><col style="width:4%"><col style="width:12%"><col style="width:20%"><col style="width:13%"><col style="width:27%"><col style="width:11%"><col style="width:13%"></colgroup>'
          +'<thead><tr><th>#</th><th>Tipo</th><th>Cliente</th><th>Documento</th><th>Dirección</th><th>Fecha de aviso</th><th>Estado</th></tr></thead>'
          +'<tbody>'+(filas||'<tr><td colspan="7" style="text-align:center!important">No hay pausas ni dobles pausas con aviso programado.</td></tr>')+'</tbody></table></div>';
        c.innerHTML=head+body; ov.appendChild(c); document.body.appendChild(ov);
        requestAnimationFrame(function(){ ov.style.opacity='1'; c.style.transform='none'; });
        var cerrar=function(){ ov.style.opacity='0'; c.style.transform='translateY(18px) scale(.98)'; document.removeEventListener('keydown', esc); setTimeout(function(){ try{ ov.remove(); }catch(e){} }, 260); };
        var esc=function(e){ if(e.key==='Escape') cerrar(); };
        document.addEventListener('keydown', esc);
        c.querySelector('#lucasInfX').onclick=cerrar;
        // 📋 copiar documento
        c.addEventListener('click', function(e){
          var b=e.target.closest ? e.target.closest('.lp-copy') : null; if(!b) return;
          var txt=b.getAttribute('data-doc')||'';
          var hecho=function(){ b.classList.add('ok'); b.textContent='✅'; setTimeout(function(){ b.classList.remove('ok'); b.textContent='📋'; }, 1300); };
          var viejo=function(){ try{ var ta=document.createElement('textarea'); ta.value=txt; ta.style.cssText='position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); hecho(); }catch(err){} };
          try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(hecho, viejo); else viejo(); }catch(err){ viejo(); }
        });
        var bp=c.querySelector('#lucasInfPdf'); bp.onclick=function(){ bp.textContent='⏳ Preparando…'; pdf(lista); setTimeout(function(){ bp.textContent='⬇️ Descargar PDF'; }, 2500); };
      }catch(e){ console.warn('[Lucas] informe pausas', e); }
    }
    function informe(done){
      ensureContratos(function(){
        var hoy=new Date(), hoy0=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()).getTime();
        var p1=[], p1sin=0, p2=[], todos=[];
        contratos().forEach(function(it){
          var n=nP(it);
          if(n===1){ var f=tsOK(it['53']); if(f){ p1.push({ it:it, v:f+90*86400000 }); todos.push(it); } else p1sin++; }
          else if(n>=2){ if(instCeros(it) && !tsOK(it['52'])) return; var v=dpVence(it); if(v){ p2.push({ it:it, v:v }); todos.push(it); } }
        });
        p1.sort(function(a,b){ return a.v-b.v; }); p2.sort(function(a,b){ return a.v-b.v; });
        render(todos.slice().sort(function(a,b){ var va=(nP(a)===1?tsOK(a['53'])+90*86400000:dpVence(a)), vb=(nP(b)===1?tsOK(b['53'])+90*86400000:dpVence(b)); return va-vb; }), null, true);
        try{
          var box=document.getElementById('iaChatMsgs');
          if(box){
            var wrap=document.createElement('div');
            wrap.style.cssText='max-width:94%;margin:4px 0 10px;padding:10px 12px;border-radius:14px;background:#0f1512;border:1px solid #17ff5f;color:#d9ffe6;font-size:12.5px;line-height:1.5;box-shadow:0 0 10px rgba(23,255,95,.25);';
            var t=document.createElement('div'); t.textContent='📋 INFORME DE PAUSAS'; t.style.cssText='font-weight:900;font-size:13.5px;color:#17ff5f;'; wrap.appendChild(t);
            wrap.appendChild(caja('⏸️ PAUSAS · aviso a los 90 días ('+p1.length+')', p1.map(function(x){ return fila(x.v, x.it, hoy0); }), p1sin ? '* '+p1sin+' '+plural(p1sin,'contrato en pausa no tiene','contratos en pausa no tienen')+' fecha guardada (se pusieron en pausa antes de esta función) y no avisarán.' : ''));
            wrap.appendChild(caja('⏸️⏸️ DOBLES PAUSAS · aviso a los 90 días ('+p2.length+')', p2.map(function(x){ return fila(x.v, x.it, hoy0); }), p2.some(function(x){ return !tsOK(x.it['52']); }) ? '* los que no tienen fecha de doble pausa se calculan con la instalación + 270 días.' : ''));
            setTimeout(function(){ box.appendChild(wrap); box.scrollTop=box.scrollHeight; }, 400);
          }
        }catch(e){}
        var lista = p1.map(function(x){ x.tipo=1; return x; }).concat(p2.map(function(x){ x.tipo=2; return x; })).map(function(x){
          var dias=Math.round((x.v-hoy0)/86400000);
          return { tipo:x.tipo, v:x.v, dias:dias, cliente:titleCase(String(x.it['21']||'').trim()||'—'), doc:String(x.it['20']||'').trim().toUpperCase(), dir:String(x.it['23']||'').trim(), comp:x.it['2']?compName(x.it['2']):'',
                   falta: dias<0 ? 'Hace '+(-dias)+' '+plural(-dias,'día','días') : (dias===0 ? 'Hoy' : 'En '+dias+' '+plural(dias,'día','días')) };
        }).sort(function(a,b){ return a.v-b.v; });   // primero el aviso más cercano
        setTimeout(function(){ modal(lista); }, 700);
        var venc = p1.concat(p2).filter(function(x){ return x.v<=hoy0; }).length, prox=p1.concat(p2).filter(function(x){ return x.v>hoy0; }).sort(function(a,b){ return a.v-b.v; })[0];
        var txt = fill(pick('infP',['Aquí tienes el informe: {a} {ca} en pausa y {b} en doble pausa con aviso programado.','Te enseño las pausas programadas: {a} de pausa y {b} de doble pausa.','Informe de pausas listo: {a} en ⏸️ y {b} en ⏸️⏸️ con su fecha de aviso.']),{a:p1.length,b:p2.length,ca:plural(p1.length,'contrato','contratos')});
        if(venc) txt += ' '+fill(pick('infPv',['Ojo, {n} ya {v} de fecha.','{n} ya {t} que estar gestionados.']),{n:venc,v:venc===1?'está pasado':'están pasados',t:venc===1?'tendría':'tendrían'});
        if(prox) txt += ' '+fill(pick('infPp',['El próximo aviso es el {f}.','El siguiente aviso, el {f}.']),{f:fmtD(new Date(prox.v))});
        try{ saldoConsumir(); }catch(e){}
        done({ say: txt });
      });
    }
    var h0=B.handle;
    B.handle=function(raw, done){
      var t=fold(raw);
      if(esInforme(t)){ if(SALDO!=null && SALDO<COSTE) return sinSaldo(done); return informe(done); }
      return h0(raw, done);
    };
    B._informePausas = informe;
  })();

  /* =====================================================================
     CHAT EN VIVO: pegar imágenes (Ctrl+V) y verlas en miniatura; al pulsar,
     pantalla completa con ✕.
     ===================================================================== */
  (function(){
    function idDe(href){ var m=String(href||'').match(/[?&]id=([\w-]+)/) || String(href||'').match(/\/d\/([\w-]+)/); return m ? m[1] : null; }
    B._verImagen = function(id){ abrir(id); };
    function abrir(id){
      var old=document.getElementById('chatImgFull'); if(old) old.remove();
      var ov=document.createElement('div'); ov.id='chatImgFull';
      ov.style.cssText='position:fixed;inset:0;z-index:2147483300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .2s;cursor:zoom-out;';
      var img=document.createElement('img'); img.src='https://drive.google.com/thumbnail?id='+id+'&sz=w2400'; img.alt='';
      img.style.cssText='max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;box-shadow:0 10px 50px rgba(0,0,0,.6);cursor:default;';
      var x=document.createElement('button'); x.type='button'; x.textContent='✕'; x.title='Cerrar';
      x.style.cssText='position:absolute;top:14px;right:14px;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;font-size:22px;cursor:pointer;';
      var dl=document.createElement('a'); dl.textContent='⬇️ Descargar'; dl.href='https://drive.google.com/uc?export=download&id='+id; dl.target='_blank'; dl.rel='noopener';
      dl.style.cssText='position:absolute;top:18px;right:72px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:800;font-size:13px;text-decoration:none;';
      ov.appendChild(img); ov.appendChild(dl); ov.appendChild(x); document.body.appendChild(ov);
      requestAnimationFrame(function(){ ov.style.opacity='1'; });
      var cerrar=function(){ ov.style.opacity='0'; document.removeEventListener('keydown', esc); setTimeout(function(){ try{ ov.remove(); }catch(e){} }, 200); };
      var esc=function(e){ if(e.key==='Escape') cerrar(); };
      document.addEventListener('keydown', esc);
      x.onclick=cerrar; ov.addEventListener('click', function(e){ if(e.target===ov) cerrar(); });
    }
    function convertir(box){
      var as=box.querySelectorAll('a.chatFileMsg:not([data-mini])');
      for(var i=0;i<as.length;i++){
        var a=as[i]; a.setAttribute('data-mini','1');
        var ic=a.querySelector('.chatFileIcon'); if(!ic || ic.textContent.indexOf('🖼')<0) continue;
        var id=idDe(a.getAttribute('href')); if(!id) continue;
        var img=document.createElement('img'); img.src='https://drive.google.com/thumbnail?id='+id+'&sz=w400'; img.alt='Imagen'; img.title='Pulsa para verla en grande';
        img.style.cssText='display:block;max-width:170px;max-height:170px;border-radius:10px;cursor:zoom-in;box-shadow:0 2px 8px rgba(0,0,0,.18);margin:2px 0;background:#eee;';
        (function(id, a, img){ img.onclick=function(e){ e.preventDefault(); e.stopPropagation(); abrir(id); }; img.onerror=function(){ a.style.display=''; try{ img.remove(); }catch(x){} }; })(id, a, img);
        a.style.display='none'; a.parentNode.insertBefore(img, a);
      }
    }
    function montar(){
      var box=document.getElementById('chatMessages'), inp=document.getElementById('chatMsgInput');
      if(!box || !inp) return false;
      if(box.getAttribute('data-mini')) return true; box.setAttribute('data-mini','1');
      convertir(box);
      new MutationObserver(function(){ convertir(box); }).observe(box, { childList:true, subtree:true });
      inp.addEventListener('paste', function(e){
        try{
          var it=(e.clipboardData && e.clipboardData.items) || [];
          for(var i=0;i<it.length;i++){
            if(it[i].kind==='file' && /^image\//.test(it[i].type)){
              var f=it[i].getAsFile(); if(!f) continue;
              e.preventDefault();
              var ext=(f.type.split('/')[1]||'png').replace('jpeg','jpg');
              var nf; try{ nf=new File([f], 'captura-'+new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')+'.'+ext, { type:f.type }); }catch(x){ nf=f; }
              if(typeof window.chatSendFile==='function') window.chatSendFile(nf);
              return;
            }
          }
        }catch(err){}
      });
      return true;
    }
    var n=0, iv=setInterval(function(){ if(montar() || ++n>120) clearInterval(iv); }, 1000);
  })();

  /* =====================================================================
     BOTÓN «Fecha inst.» (entre 🛜❌ y OMITIR): 1ª pulsación → fechas de
     instalación en negro; 2ª → en verde (🆗 o 00-00-0000); LIMPIAR FILTROS → todas.
     ===================================================================== */
  B._finst = 0;
  function instVerde(it){ return String(it['45']||'').trim()==='🆗' || String(it['54']||'').trim()==='1' || /^0{1,2}[\/\-]0{1,2}[\/\-]0{2,4}$/.test(String(it['15']||'').trim()); }
  function pintarFinst(){
    var b=document.getElementById('btnFechaInst'); if(!b) return;
    var on=B._finst;
    b.classList.toggle('active', !!on);
    b.style.borderColor = on===1 ? '#111' : (on===2 ? '#16a34a' : (b.getAttribute('data-bc')||''));
    b.style.boxShadow = on ? (on===1 ? '0 0 0 2px rgba(0,0,0,.18)' : '0 0 0 2px rgba(22,163,74,.25)') : '';
    b.style.background = on===1 ? '#f1f1f1' : (on===2 ? '#e9f9ef' : (b.getAttribute('data-bg')||''));
    b.title = on===1 ? 'Mostrando fechas de instalación en negro (pulsa para ver las verdes)' : (on===2 ? 'Mostrando fechas de instalación en verde (pulsa para ver las negras)' : 'Filtrar por fecha de instalación: negro / verde');
  }
  (function(){
    function montar(){
      if(document.getElementById('btnFechaInst')) return true;
      var ref=document.getElementById('btnFibraNo'); if(!ref || !ref.parentNode) return false;
      var b=document.createElement(ref.tagName.toLowerCase()==='button' ? 'button' : 'button');
      b.type='button'; b.id='btnFechaInst'; b.className=ref.className.replace(/\bactive\b/g,'').trim();
      b.innerHTML='<b style="color:#111">Fecha</b>&nbsp;<b style="color:#16a34a">inst.</b>';
      b.style.whiteSpace='nowrap';
      try{ var cs=getComputedStyle(ref); ['borderTopWidth','borderTopStyle','borderTopColor','borderRadius','paddingTop','paddingBottom','height','minHeight','backgroundColor','boxShadow','fontSize','fontFamily','cursor','verticalAlign'].forEach(function(k){ b.style[k]=cs[k]; }); b.style.borderWidth=cs.borderTopWidth; b.style.borderStyle=cs.borderTopStyle||'solid'; b.style.borderColor=cs.borderTopColor; b.style.paddingLeft='12px'; b.style.paddingRight='12px'; if(!parseFloat(cs.borderTopWidth)){ b.style.border='1px solid #e5e7eb'; b.style.borderRadius='10px'; b.style.background='#fff'; } }catch(e){}
      b.setAttribute('data-bc', b.style.borderColor||''); b.setAttribute('data-bg', b.style.backgroundColor||'');
      b.addEventListener('click', function(){
        B._finst = B._finst===1 ? 2 : 1;
        pintarFinst();
        try{ PAGE=1; }catch(e){}
        try{ applyFilters(); }catch(e){}
        try{ pintarBtnIA(); }catch(e){}
      });
      ref.parentNode.insertBefore(b, ref.nextSibling);
      pintarFinst();
      return true;
    }
    var n=0, iv=setInterval(function(){ if(montar() || ++n>120) clearInterval(iv); }, 1000);
  })();
})();
