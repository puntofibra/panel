/* ===== TUTORIAL PUNTOFIBRA · edicion 4 · 20-11-2026 · panel v533 =====
   Edicion 4: en Contratos, dos paginas nuevas del QR de bonificacion (enviarlo y lo que ve el cliente).
   Edicion 3: en Borradores, cambiar la prioridad arrastrando la fila por el asa.
   Edicion 2: menu lateral nuevo (placas con icono a color), capitulo 2 «Inicio: tus graficas» (los demas capitulos se corren uno).
   Libro con paginas 3D, indice clicable, maquetas PC y movil.
   Capitulos PC: 1 Conoce el panel · 2 Entrar · 3 Contratos · 4 Nuevo contrato y edicion · 5 Estados e iconos
   · 6 Borradores · 7 Caja/Retos/Deudas · 8 Tarjetas · 9 Notas · 10 Agenda · 11 Chat en vivo · 12 Lucas · 13 Trucos
   Capitulos MOVIL: 14 Lista · 15 Ficha · 16 Documentos · 17 Editar · 18 Menu, Lucas y orientacion
   NO incluye (a proposito): doble pausa, consola, fichajes, ajustes, Movistar prepago, Firmar documento. */
(function(){
'use strict';
if (window.PFTutorial) return;
var EDICION = 4, FECHA = '20-11-2026';
var PW = 720, PH = 880;
var D = document;
var CSS = (function(){/*
#pftut{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at 50% 30%,#17356b 0%,#0a1328 55%,#03060e 100%);overflow:hidden;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;opacity:0;transition:opacity .5s;-webkit-user-select:none;user-select:none;touch-action:pan-y}
#pftut.on{opacity:1}
#pftut *{box-sizing:border-box}
#pftut .tt-sky{position:absolute;inset:-210px;background-image:radial-gradient(2px 2px at 20px 30px,rgba(255,255,255,.85),transparent),radial-gradient(1.5px 1.5px at 90px 80px,rgba(150,200,255,.8),transparent),radial-gradient(2px 2px at 160px 20px,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 60px 140px,rgba(255,255,255,.9),transparent),radial-gradient(1.5px 1.5px at 130px 170px,rgba(255,220,160,.7),transparent);background-size:210px 210px;animation:ttDrift 90s linear infinite;opacity:.65}
@keyframes ttDrift{to{transform:translate(210px,210px)}}
#pftut .tt-aur{position:absolute;left:50%;top:-25%;width:90vmax;height:60vmax;margin-left:-45vmax;background:conic-gradient(from 200deg,rgba(37,99,235,0),rgba(37,99,235,.24),rgba(255,138,31,.13),rgba(37,99,235,0));filter:blur(70px);animation:ttSpin 40s linear infinite;pointer-events:none}
@keyframes ttSpin{to{transform:rotate(360deg)}}
#pftut .tt-stage{position:absolute;left:0;right:0;top:0;bottom:70px;display:flex;align-items:center;justify-content:center}
#pftut .tt-scale{transform-origin:50% 50%;flex:0 0 auto}
#pftut .tt-book{position:relative;perspective:3400px;transition:transform .95s cubic-bezier(.55,.05,.25,1)}
#pftut .tt-book::after{content:"";position:absolute;left:3%;right:3%;bottom:-26px;height:34px;background:radial-gradient(ellipse at center,rgba(0,0,0,.65),transparent 70%);filter:blur(8px);pointer-events:none}
#pftut .tt-leaf{position:absolute;top:0;width:720px;height:880px;transform-origin:0 50%;transform-style:preserve-3d;transition:transform var(--d,.95s) cubic-bezier(.45,.05,.2,1)}
#pftut .tt-book.sp .tt-leaf{left:720px}
#pftut .tt-book.sg .tt-leaf{left:0;transition:transform var(--d,.95s) cubic-bezier(.45,.05,.2,1),opacity .12s linear 0s}
#pftut .tt-leaf.fl{transform:rotateY(-180deg)}
#pftut .tt-book.sg .tt-leaf.fl{opacity:0;transition:transform var(--d,.95s) cubic-bezier(.45,.05,.2,1),opacity .25s linear .6s}
#pftut .tt-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
#pftut .tt-back{transform:rotateY(180deg)}
#pftut .tt-pg{background:linear-gradient(#fdfaf3,#f5efe1);color:#1b2433}
#pftut .tt-pg.R{border-radius:0 12px 12px 0}
#pftut .tt-pg.L{border-radius:12px 0 0 12px}
#pftut .tt-book.sg .tt-pg{border-radius:12px}
#pftut .tt-pg.R::before,#pftut .tt-pg.L::before{content:"";position:absolute;top:0;bottom:0;width:60px;z-index:6;pointer-events:none}
#pftut .tt-pg.R::before{left:0;background:linear-gradient(90deg,rgba(0,0,0,.30),rgba(0,0,0,.08) 45%,transparent)}
#pftut .tt-pg.L::before{right:0;background:linear-gradient(270deg,rgba(0,0,0,.30),rgba(0,0,0,.08) 45%,transparent)}
#pftut .tt-book.sg .tt-pg::before{display:none}
#pftut .tt-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,0) 70%);opacity:0;z-index:9}
#pftut .tt-leaf.go .tt-shade{animation:ttShade var(--d,.95s) ease-in-out}
@keyframes ttShade{0%{opacity:0}45%{opacity:1}100%{opacity:0}}
#pftut .tt-in{position:absolute;inset:0;padding:34px 38px 44px;display:flex;flex-direction:column}
#pftut .tt-pg.L .tt-in{padding-left:34px;padding-right:50px}
#pftut .tt-pg.R .tt-in{padding-left:50px;padding-right:34px}
#pftut .tt-book.sg .tt-pg .tt-in{padding-left:42px;padding-right:42px}
#pftut .tt-cap{font-size:11px;letter-spacing:.14em;font-weight:800;color:#2563eb;text-transform:uppercase;display:flex;gap:8px;align-items:center}
#pftut .tt-cap span{background:#2563eb;color:#fff;border-radius:6px;padding:2px 8px;letter-spacing:.06em}
#pftut .tt-cap.mv{color:#ea580c}#pftut .tt-cap.mv span{background:#ea580c}
#pftut .tt-in h2{margin:8px 0 6px;font-size:30px;line-height:1.1;font-weight:900;color:#0b1b4a}
#pftut .tt-lead{margin:0 0 12px;font-size:15.5px;line-height:1.45;color:#3a4558}
#pftut .tt-st{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:11px}
#pftut .tt-st li{display:flex;gap:10px;align-items:flex-start;font-size:14.6px;line-height:1.4;color:#27324a}
#pftut .tt-n{flex:0 0 24px;height:24px;border-radius:50%;background:#2563eb;color:#fff;font-size:12px;display:grid;place-items:center;font-style:normal;margin-top:-1px}
#pftut .tt-cap.mv~.tt-st .tt-n{background:#ea580c}
#pftut .tt-tip{margin-top:auto;display:flex;gap:10px;align-items:flex-start;background:#fff7d6;border:1px solid #f3dd8a;border-radius:10px;padding:9px 12px;font-size:12.6px;line-height:1.38;color:#5b4a00}
#pftut .tt-tip i{font-style:normal}
#pftut .tt-pn{position:absolute;bottom:14px;font-size:11px;font-weight:700;color:#8a93a6}
#pftut .tt-pg.L .tt-pn{left:36px}#pftut .tt-pg.R .tt-pn{right:36px}#pftut .tt-book.sg .tt-pn{left:0;right:0;text-align:center}
#pftut .tt-shot{border-radius:10px;border:1px solid #cfd6e4;box-shadow:0 12px 28px rgba(20,40,90,.24);overflow:hidden;background:#fff;position:relative;flex:0 0 auto}
#pftut .tt-bar0{height:24px;background:#e6ebf4;display:flex;align-items:center;gap:6px;padding:0 10px}
#pftut .tt-bar0 i{width:9px;height:9px;border-radius:50%;display:block}
#pftut .tt-url{margin-left:10px;background:#fff;border-radius:99px;font-size:9.5px;color:#64748b;padding:2px 12px;flex:1;max-width:260px}
#pftut .tt-scr{position:relative;overflow:hidden}
#pftut .tt-b{position:absolute;right:-8px;top:-9px;width:20px;height:20px;border-radius:50%;background:#2563eb;color:#fff;font:800 11px/20px "Segoe UI",system-ui,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.4);z-index:20;transform:scale(0);font-style:normal}
#pftut .tt-pg.vis .tt-b{animation:ttPop .5s cubic-bezier(.3,1.7,.5,1) forwards;animation-delay:calc(.55s + var(--i,1)*.26s)}
@keyframes ttPop{to{transform:scale(1)}}
#pftut .tt-hl{position:relative}
#pftut .tt-pg.vis .tt-hl::after{content:"";position:absolute;inset:-3px;border:2px solid #2563eb;border-radius:9px;opacity:0;pointer-events:none;animation:ttHl 2.8s ease-in-out infinite;animation-delay:calc(.8s + var(--i,1)*.26s);z-index:19}
@keyframes ttHl{0%{opacity:0;transform:scale(.96)}18%{opacity:1}60%{opacity:.8;transform:scale(1.03)}100%{opacity:0;transform:scale(1.09)}}
#pftut .tt-cur{position:absolute;left:0;top:0;z-index:30;opacity:0;pointer-events:none}
#pftut .tt-pg.vis .tt-cur{animation:ttCur 4.2s ease-in-out infinite 1.2s}
@keyframes ttCur{0%{opacity:0;transform:translate(var(--x0),var(--y0))}8%{opacity:1}50%{opacity:1;transform:translate(var(--x1),var(--y1))}56%{transform:translate(var(--x1),var(--y1)) scale(.82)}62%{transform:translate(var(--x1),var(--y1)) scale(1)}88%{opacity:1;transform:translate(var(--x1),var(--y1))}100%{opacity:0;transform:translate(var(--x1),var(--y1))}}
#pftut .tt-rip{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:3px solid #f97316;opacity:0;z-index:29;pointer-events:none}
#pftut .tt-pg.vis .tt-rip{animation:ttRip 4.2s ease-out infinite 1.2s}
@keyframes ttRip{0%,52%{opacity:0;transform:scale(.2)}56%{opacity:1;transform:scale(.5)}78%{opacity:0;transform:scale(1.9)}100%{opacity:0}}
#pftut .tt-type{display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:bottom;width:0}
#pftut .tt-pg.vis .tt-type{animation:ttType 2.2s steps(var(--c,12)) 1s forwards}
@keyframes ttType{to{width:calc(var(--c,12)*1ch)}}
#pftut .tt-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px}
#pftut .tt-card{background:#fff;border:1px solid #e3e8f2;border-radius:12px;padding:17px 15px;display:flex;gap:13px;align-items:flex-start;box-shadow:0 3px 10px rgba(20,40,90,.07);opacity:0;transform:translateY(14px)}
#pftut .tt-pg.vis .tt-card{animation:ttUp .55s ease forwards;animation-delay:calc(.35s + var(--k,0)*.09s)}
@keyframes ttUp{to{opacity:1;transform:none}}
#pftut .tt-card .ic{font-size:34px;line-height:1}
#pftut .tt-card b{display:block;font-size:14px;color:#0b1b4a;margin-bottom:2px}
#pftut .tt-card span{font-size:13.2px;line-height:1.4;color:#475569}
#pftut .tt-note{margin-top:12px;font-size:12px;color:#64748b;line-height:1.4;border-top:1px dashed #cbd5e1;padding-top:9px}
#pftut .tt-cv{position:absolute;inset:0;background:radial-gradient(circle at 30% 18%,#2459d6,#0b1b4a 55%,#050c24);color:#fff;border-radius:6px 16px 16px 6px;overflow:hidden;box-shadow:inset 0 0 0 12px rgba(255,255,255,.04),inset 0 0 0 14px rgba(255,200,90,.45)}
#pftut .tt-cv.bk{border-radius:16px 6px 6px 16px}
#pftut .tt-cv::after{content:"";position:absolute;top:-30%;left:-60%;width:40%;height:160%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.16),transparent);transform:rotate(12deg);animation:ttShine 5.5s ease-in-out infinite}
@keyframes ttShine{0%,55%{left:-60%}100%{left:130%}}
#pftut .tt-cvin{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}
#pftut .tt-cvlogo{width:360px;max-width:80%;min-height:90px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.95);border-radius:18px;padding:14px 18px;margin-bottom:34px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
#pftut .tt-cvlogo img{max-width:100%;max-height:90px}
#pftut .tt-cvlogo b{font-size:44px;font-style:italic;font-weight:900;color:#1d3a8a}#pftut .tt-cvlogo i{font-size:44px;font-weight:900;color:#f97316}
#pftut .tt-cv .k{letter-spacing:.5em;font-size:12px;color:#ffd166;font-weight:700;margin-bottom:10px}
#pftut .tt-cv h1{margin:0;font-size:78px;line-height:1;font-weight:900;letter-spacing:.06em;background:linear-gradient(180deg,#fff3c4,#ffb938 55%,#c8791a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 12px rgba(255,170,40,.4))}
#pftut .tt-cv .s{margin-top:18px;font-size:17px;color:#cfe0ff;max-width:420px;line-height:1.4}
#pftut .tt-cv .ln{width:120px;height:2px;margin:26px 0 16px;background:linear-gradient(90deg,transparent,#ffd166,transparent)}
#pftut .tt-cv .e{font-size:13px;color:#9fb6e8;letter-spacing:.12em}
#pftut .tt-cv .go{position:absolute;bottom:42px;font-size:14px;font-weight:700;color:#ffd166;animation:ttBlink 1.8s ease-in-out infinite}
@keyframes ttBlink{50%{opacity:.35;transform:translateX(6px)}}
#pftut .tt-how{display:flex;flex-direction:column;gap:16px;margin-top:14px}
#pftut .tt-how div{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #e3e8f2;border-radius:12px;padding:17px 15px;font-size:14.8px;color:#27324a;box-shadow:0 3px 10px rgba(20,40,90,.06)}
#pftut .tt-how em{font-style:normal;font-size:22px;width:36px;text-align:center}
#pftut .tt-ixg{margin:14px 0 4px;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:#94a3b8}
#pftut .tt-ix{display:flex;align-items:center;gap:9px;padding:6px 10px;margin:0 -10px;border-radius:9px;text-decoration:none;color:#1e293b;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s,transform .2s}
#pftut .tt-ix:hover{background:#e8efff;transform:translateX(4px)}
#pftut .tt-ix i{font-style:normal;width:22px;height:22px;border-radius:7px;background:#2563eb;color:#fff;font-size:11.5px;font-weight:800;display:grid;place-items:center}
#pftut .tt-ix.mv i{background:#ea580c}
#pftut .tt-ix u{flex:1;border-bottom:2px dotted #c3cbd9;height:1px;transform:translateY(5px)}
#pftut .tt-ix em{font-style:normal;font-weight:800;color:#2563eb;font-size:13px}
#pftut .tt-wa{display:inline-flex;align-items:center;gap:12px;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;font-size:20px;padding:16px 26px;border-radius:16px;box-shadow:0 10px 24px rgba(22,163,74,.4);margin-top:20px;animation:ttBlink 2.4s ease-in-out infinite}
#pftut .tt-lines{margin-top:16px;flex:1;background:repeating-linear-gradient(transparent 0,transparent 33px,#d9d2c0 34px)}
#pftut .tt-bar{position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;align-items:center;justify-content:center;gap:12px;z-index:50}
#pftut .tt-bt{height:42px;min-width:42px;padding:0 16px;border-radius:99px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;font:700 14px "Segoe UI",system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(8px);transition:background .2s,transform .15s}
#pftut .tt-bt:hover{background:rgba(255,255,255,.22);transform:translateY(-2px)}
#pftut .tt-bt:disabled{opacity:.3;cursor:default;transform:none}
#pftut .tt-lbl{color:#cfe0ff;font:600 13px "Segoe UI",system-ui,sans-serif;min-width:120px;text-align:center}
#pftut .tt-x{position:absolute;right:14px;top:12px;z-index:60;width:42px;height:42px;padding:0;font-size:18px}
#pftut .m-app{display:flex;height:100%;font-size:10px;color:#1e293b;background:#f3f6fb}
#pftut .m-sb{width:124px;flex:0 0 124px;background:#fff;border-right:1px solid #e3e8f0;padding:8px 7px 0;display:flex;flex-direction:column;gap:4px;position:relative}
#pftut .m-logo{border:1px solid #e3e8f0;border-radius:9px;padding:5px;margin-bottom:3px;min-height:36px;display:flex;align-items:center;justify-content:center}
#pftut .m-logo img{max-width:100%;max-height:32px}
#pftut .m-logo b{font-size:14px;font-weight:900;color:#1d3a8a;font-style:italic}#pftut .m-logo i{font-size:14px;font-weight:900;color:#f97316}
#pftut .m-nv{position:relative;border:1px solid #b9bcc1;border-radius:8px;padding:4px 6px 5px 4px;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:8.5px;background:linear-gradient(180deg,#fff,#f6f6f8);white-space:nowrap;gap:3px;box-shadow:inset 0 -2px 0 #a3a6aa}
#pftut .m-nv.on{border-color:#22c24f;background:linear-gradient(180deg,#f3f3f4,#e8e8ec);box-shadow:inset 0 -2px 0 #22c24f,0 0 6px rgba(22,190,90,.55)}
#pftut .m-nv{isolation:isolate}#pftut .m-nv > span:first-child{display:flex;align-items:center;gap:4px}
#pftut .m-nvi{display:inline-block;width:17px;height:14.5px;flex:0 0 17px;background-repeat:no-repeat;background-size:102.9px auto;background-position:-2.84px -10.05px;mix-blend-mode:multiply;filter:brightness(1.12)}
#pftut .m-nvi.xl{width:34px;height:29px;flex:0 0 34px;background-size:205.8px auto;background-position:-5.68px -20.1px}
#pftut .m-seg{display:inline-flex;border:1px solid #d5dbe6;border-radius:8px;background:#f1f3f7;padding:2px;gap:2px;font-weight:800;font-size:8px;position:relative}
#pftut .m-seg b{padding:3px 6px;border-radius:6px;font-weight:800;color:#64748b}#pftut .m-seg b.on{background:#fff;color:#0f172a;box-shadow:0 1px 2px rgba(0,0,0,.12)}
#pftut .m-kp{flex:1;background:#fff;border:1px solid #e3e8f0;border-radius:9px;padding:6px 7px;min-width:0}
#pftut .m-kp small{display:block;font-size:7px;font-weight:800;color:#64748b;letter-spacing:.3px;margin-bottom:3px}
#pftut .m-kp div{display:flex;gap:8px}#pftut .m-kp p{margin:0;flex:1;font-size:7px;color:#475569;line-height:1.25}#pftut .m-kp p b{display:block;font-size:14px;color:#0f172a;line-height:1.1}
#pftut .m-kp .up{color:#15803d;font-weight:800}#pftut .m-kp .dn{color:#c62828;font-weight:800}
#pftut .m-hb{display:grid;grid-template-columns:52px 1fr;gap:3px 5px;align-items:center;font-size:7.5px;font-weight:700}
#pftut .m-hb i{display:block;height:4px;border-radius:3px;margin:1px 0}
#pftut .m-pl{font-style:normal;text-decoration:none;font-size:7.5px;font-weight:700;border:1px solid #e3e8f0;border-radius:99px;padding:1px 5px;color:#64748b;margin-left:1px}
#pftut .m-pl.r{background:#fecaca;color:#7a1315;border-color:#fecaca}#pftut .m-pl.g{background:#bbf7d0;color:#14532d;border-color:#bbf7d0}#pftut .m-pl.y{background:#fde68a;color:#78350f;border-color:#fde68a}#pftut .m-pl.b{background:#bfdbfe;color:#1e3a8a;border-color:#bfdbfe}
#pftut .m-chat{margin:auto -7px 0;background:#075e54;color:#fff;font-weight:800;font-size:9px;padding:7px 9px;position:relative}
#pftut .m-main{flex:1;min-width:0;padding:9px;position:relative;overflow:hidden}
#pftut .m-card{background:#fff;border:1px solid #e3e8f0;border-radius:10px;padding:8px;margin-bottom:7px;position:relative}
#pftut .m-h{font-weight:900;font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:7px;flex-wrap:wrap}
#pftut .m-btn{display:inline-block;padding:4px 8px;border-radius:7px;border:1px solid #d5dbe6;background:#fff;font-weight:800;font-size:8.5px;position:relative;white-space:nowrap}
#pftut .m-btn.p{background:#2563eb;border-color:#2563eb;color:#fff}#pftut .m-btn.g{background:#16a34a;border-color:#16a34a;color:#fff}#pftut .m-btn.r{background:#fee2e2;border-color:#fecaca;color:#991b1b}
#pftut .m-t{width:100%;border-collapse:collapse;font-size:8.3px}
#pftut .m-t th{background:#eef2f8;text-align:left;padding:4px 5px;font-weight:800;color:#475569;border-bottom:1px solid #dbe3ef;white-space:nowrap}
#pftut .m-t td{padding:4px 5px;border-bottom:1px solid #eef2f8;white-space:nowrap}
#pftut .m-t tr.dead td{background:#ffe1e1}
#pftut .cp{display:inline-block;font-weight:800;border-radius:5px;padding:1px 6px;font-size:7.8px;position:relative}
#pftut .cp.sy{background:#ff8a1f;color:#111}#pftut .cp.mm{background:#f6d200;color:#111}#pftut .cp.pp{background:#e6004c;color:#fff}#pftut .cp.jz{background:#d71920;color:#fff}
#pftut .m-pg{margin-top:6px;font-size:8px;color:#64748b;display:flex;justify-content:space-between;position:relative}
#pftut .m-f{display:flex;flex-direction:column;gap:2px;min-width:0;position:relative}
#pftut .m-f small{font-size:6.8px;font-weight:800;color:#64748b;letter-spacing:.04em}
#pftut .m-i{border:1px solid #cbd5e1;border-radius:6px;padding:4px 6px;background:#fff;font-size:8.8px;min-height:21px;white-space:nowrap;overflow:hidden;position:relative}
#pftut .m-r{display:flex;gap:6px;margin-bottom:6px}
#pftut .m-ic{display:inline-flex;align-items:center;justify-content:center;width:21px;height:21px;border:1px solid #d5dbe6;border-radius:6px;background:#fff;font-size:11px;margin:0 2px 3px 0}
#pftut .m-ic.on{background:#dbeafe;border-color:#60a5fa}
#pftut .m-pop{position:absolute;background:#fff;border:1px solid #cbd5e1;border-radius:9px;box-shadow:0 10px 24px rgba(15,23,42,.28);padding:5px;display:flex;flex-direction:column;gap:2px;z-index:15;font-size:12px}
#pftut .m-pop span{padding:2px 12px;border-radius:5px}#pftut .m-pop span.on{background:#dbeafe}
#pftut .m-lu{position:absolute;left:0;right:0;bottom:0;height:24px;background:#05070c;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;z-index:12}
#pftut .m-ov{position:absolute;inset:0;background:rgba(15,23,42,.45);z-index:13}
#pftut .m-modal{position:absolute;z-index:14;background:#fff;border-radius:12px;box-shadow:0 18px 40px rgba(15,23,42,.45);padding:11px}
#pftut .m-bub{max-width:80%;padding:5px 8px;border-radius:9px;font-size:9px;line-height:1.3;margin-bottom:5px;position:relative}
#pftut .m-bub.me{background:#dcf8c6;margin-left:auto}#pftut .m-bub.ot{background:#fff}
#pftut .m-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:8px}
#pftut .m-cal b{text-align:center;color:#64748b;font-size:7.5px}
#pftut .m-cal div{min-height:42px;background:#fff;border:1px solid #e3e8f0;border-radius:6px;padding:2px 3px;position:relative}
#pftut .m-cal div.hoy{border-color:#2563eb;background:#eff6ff}
#pftut .m-cal em{display:block;font-style:normal;border-radius:4px;color:#fff;font-size:7px;font-weight:700;padding:1px 3px;margin-top:2px;white-space:nowrap;overflow:hidden}
#pftut .m-note{border-radius:9px;padding:7px;font-size:8.5px;line-height:1.3;border:1px solid rgba(0,0,0,.08);position:relative}
#pftut .m-cc{height:92px;border-radius:12px;padding:9px 11px;color:#fff;font-size:9px;display:flex;flex-direction:column;justify-content:space-between;position:relative}
#pftut .m-cc b{font-size:11px;letter-spacing:.12em}
#pftut .ph{zoom:1.08;position:relative;width:236px;height:476px;border:7px solid #0f172a;border-radius:34px;background:#f3f6fb;overflow:hidden;box-shadow:0 14px 30px rgba(15,23,42,.4);font-size:10px;color:#1e293b;flex:0 0 auto;margin:0 auto}
#pftut .ph::before{content:"";position:absolute;top:0;left:50%;width:70px;height:14px;margin-left:-35px;background:#0f172a;border-radius:0 0 10px 10px;z-index:20}
#pftut .pt{height:46px;background:#fff;border-bottom:1px solid #e3e8f0;display:flex;align-items:flex-end;justify-content:space-between;padding:0 11px 7px;font-weight:800;font-size:11px}
#pftut .pt .lg{font-weight:900;font-style:italic;color:#1d3a8a;font-size:13px}#pftut .pt .lg i{color:#f97316}
#pftut .pt .mn{width:26px;height:26px;border-radius:8px;border:1px solid #d5dbe6;display:grid;place-items:center;font-size:13px;position:relative;background:#fff}
#pftut .ptabs{display:flex;gap:5px;padding:8px 9px 0}
#pftut .ptabs b{flex:1;text-align:center;padding:6px 0;border-radius:9px;border:1px solid #dbe3ef;background:#fff;font-size:9.5px;position:relative}
#pftut .ptabs b.on{background:#2563eb;color:#fff;border-color:#2563eb}
#pftut .psr{margin:8px 9px 0;border:1px solid #cbd5e1;border-radius:9px;background:#fff;padding:7px 9px;font-size:10px;color:#475569;position:relative;min-height:28px}
#pftut .plu{margin:7px 9px 0;background:#0b1b4a;color:#fff;border-radius:9px;padding:6px 9px;font-size:9px;font-weight:700;display:flex;justify-content:space-between;position:relative}
#pftut .plu u{text-decoration:none;color:#ffd166}
#pftut .pc{margin:7px 9px 0;background:#fff;border:1px solid #e3e8f0;border-radius:11px;padding:7px 9px 7px 14px;display:flex;justify-content:space-between;align-items:center;gap:6px;position:relative;overflow:hidden}
#pftut .pc::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--c,#ff8a1f)}
#pftut .pc b{font-size:10.5px;display:block}#pftut .pc small{font-size:8.5px;color:#64748b;display:block;line-height:1.35}
#pftut .pc span{font-size:12px;white-space:nowrap}
#pftut .pbar{position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e3e8f0;padding:7px 9px 10px;z-index:5}
#pftut .pbar .row{display:flex;gap:5px;margin-bottom:6px}
#pftut .pbar .row b{flex:1;text-align:center;border:1px solid #d5dbe6;border-radius:9px;padding:6px 0;font-size:8.8px;background:#fff;position:relative}
#pftut .pbar .big{text-align:center;background:#2563eb;color:#fff;border-radius:10px;padding:8px 0;font-weight:800;font-size:10px;position:relative}
#pftut .pr{margin:0 9px;padding:7px 2px;border-bottom:1px solid #e8edf5;display:flex;justify-content:space-between;font-size:9.5px;position:relative}
#pftut .pr small{color:#64748b;font-size:8.5px}
#pftut .pdoc{margin:8px 9px 0;background:#fff;border:1px solid #e3e8f0;border-radius:11px;padding:8px;position:relative}
#pftut .pdoc .im{height:78px;border-radius:8px;background:linear-gradient(135deg,#dbe7f7,#c7d7ee);position:relative;overflow:hidden;margin:4px 0 6px}
#pftut .pdoc .im::before{content:"";position:absolute;left:10px;top:12px;width:30px;height:38px;border-radius:5px;background:#9db3d4}
#pftut .pdoc .im::after{content:"";position:absolute;left:52px;top:14px;right:12px;height:8px;border-radius:3px;background:#9db3d4;box-shadow:0 14px 0 #9db3d4,0 28px 0 #9db3d4}
#pftut .pdoc .bt{display:flex;gap:4px}
#pftut .pdoc .bt b{flex:1;text-align:center;border:1px solid #d5dbe6;border-radius:7px;padding:4px 0;font-size:8px;background:#fff;position:relative}
#pftut .pdoc h6{margin:0;font-size:9px;letter-spacing:.06em;color:#475569}
#pftut .pmenu{position:absolute;left:0;top:0;bottom:0;width:78%;background:#fff;z-index:8;box-shadow:8px 0 24px rgba(15,23,42,.35);padding:56px 10px 10px;display:flex;flex-direction:column;gap:7px;animation:ttDrawer 1.1s ease both}
#pftut .pmenu b{border:1px solid #e3e8f0;border-radius:10px;padding:9px;font-size:10px;position:relative;background:#fff}
@keyframes ttDrawer{from{transform:translateX(-100%)}to{transform:none}}
#pftut .pov{position:absolute;inset:0;background:rgba(15,23,42,.35);z-index:7}
#pftut .pin{margin:6px 9px 0;position:relative}
#pftut .pin small{font-size:7.5px;font-weight:800;color:#64748b}
#pftut .pin div{border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:6px 8px;font-size:9.5px}
#pftut .ptap{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(249,115,22,.35);border:2px solid #f97316;opacity:0;z-index:25;pointer-events:none}
#pftut .tt-pg.vis .ptap{animation:ttTap 3.2s ease-out infinite 1.4s}
@keyframes ttTap{0%,40%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(.8)}75%{opacity:0;transform:scale(1.6)}100%{opacity:0}}
#pftut .tt-gira{margin:0 auto;width:150px;height:150px;position:relative;display:grid;place-items:center;background:#0f172a;border-radius:18px;color:#fff;font-size:11px;text-align:center;padding:12px}
#pftut .tt-gira i{display:block;font-style:normal;font-size:46px;animation:ttRot 3s ease-in-out infinite}
@keyframes ttRot{0%,25%{transform:rotate(0)}50%,75%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
#pftut .tt-nar{position:absolute;top:28px;right:38px;z-index:30;height:32px;padding:0 14px;border-radius:99px;border:0;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font:700 12.5px "Segoe UI",system-ui,sans-serif;cursor:pointer;box-shadow:0 5px 14px rgba(37,99,235,.4);transition:transform .15s}
#pftut .tt-nar:hover{transform:translateY(-2px)}
#pftut .tt-pg.L .tt-nar{right:56px}
#pftut .tt-book.sg .tt-nar{right:42px}
#pftut .tt-nar.on{background:linear-gradient(135deg,#16a34a,#15803d);animation:ttNar 1.4s ease-in-out infinite}
@keyframes ttNar{50%{box-shadow:0 0 0 7px rgba(22,163,74,.28)}}
*/}).toString().replace(/^[\s\S]*?\/\*/, '').replace(/\*\/[\s\S]*$/, '');

CSS += '#pftut .bin>.tt-b{right:5px;top:5px}#pftut .tt-pg.tt-hard{background:none}#pftut .tt-pg.tt-hard::before{display:none}#pftut .m-prog{position:absolute;left:0;bottom:0;height:3px;background:#fff;width:0;border-radius:0 3px 3px 0}#pftut .tt-pg.vis .m-prog{animation:ttProg 3.4s ease-in-out infinite 2s}@keyframes ttProg{0%{width:0;opacity:1}72%{width:100%;opacity:1}100%{width:100%;opacity:0}}#pftut .m-blink{animation:ttGlow 1.4s ease-in-out infinite}@keyframes ttGlow{50%{box-shadow:0 0 0 4px rgba(22,163,74,.35)}}';
var LOGO = (function(){ try{ var i = D.getElementById('sideLogoImg'); return (i && i.src) || ''; }catch(e){ return ''; } })();
function logoHtml(){ return LOGO ? '<img src="' + LOGO + '" alt="">' : '<b>Punto</b><i>fibra</i>'; }
function bd(n){ return '<ttb class="tt-b">' + n + '</ttb>'; }
function H(n, cls, inner, tag, st){ tag = tag || 'div'; return '<' + tag + ' class="' + cls + ' tt-hl" style="--i:' + n + ';' + (st || '') + '">' + inner + bd(n) + '</' + tag + '>'; }
function shot(body, h){ h += 36; return '<div class="tt-shot" style="height:' + h + 'px"><div class="tt-bar0"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="tt-url">🔒 puntofibra.github.io/panel</span></div><div class="tt-scr" style="height:' + (h - 24) + 'px">' + body + '</div></div>'; }
function cur(x0, y0, x1, y1){ return '<div class="tt-cur" style="--x0:' + x0 + 'px;--y0:' + y0 + 'px;--x1:' + x1 + 'px;--y1:' + y1 + 'px"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div><div class="tt-rip" style="left:' + x1 + 'px;top:' + y1 + 'px"></div>'; }
function tap(x, y){ return '<div class="ptap" style="left:' + x + 'px;top:' + y + 'px"></div>'; }
var ICO = 'https://puntofibra.github.io/panel/';
var IC = { ini:'Botón de panel con gráfico ascendente.png', bor:'Botón de documento con lápiz glossy.png', con:'Barra de documento con insignia de verificación.png', tar:'Botón UI con icono de tarjetas de crédito.png', not:'Panel UI con nota amarilla y chincheta roja.png', age:'Barra de calendario brillante en gris y coral.png', tut:'Botón de libro abierto.png' };
function ic(f, xl){ return '<i class="m-nvi' + (xl ? ' xl' : '') + '" style="background-image:url(\'' + ICO + encodeURIComponent(f) + '\')"></i>'; }
function sb(act, b){
  b = b || {};
  var it = [['ini',IC.ini,'INICIO',''],['bor',IC.bor,'BORRADORES','<i class="m-pl r">0</i>'],['con',IC.con,'CONTRATOS','<i class="m-pl">128</i>'],['tar',IC.tar,'TARJETAS','<i class="m-pl">info</i>'],['not',IC.not,'NOTAS','<i class="m-pl r">5</i><i class="m-pl y">4</i><i class="m-pl g">3</i><i class="m-pl b">2</i>'],['age',IC.age,'AGENDA','<i class="m-pl">2</i>']];
  var c = '<div class="m-logo">' + logoHtml() + '</div>';
  it.forEach(function(x){
    var n = b[x[0]], inner = '<span>' + ic(x[1]) + x[2] + '</span><span>' + x[3] + '</span>', k = 'm-nv' + (x[0] === act ? ' on' : '');
    c += n ? H(n, k, inner) : '<div class="' + k + '">' + inner + '</div>';
  });
  c += '<div class="m-nv"><span>' + ic(IC.tut) + 'TUTORIAL</span></div>';
  c += b.chat ? H(b.chat, 'm-chat bin', '💬 Chat en vivo') : '<div class="m-chat">💬 Chat en vivo</div>';
  return b.sb ? H(b.sb, 'm-sb bin', c) : '<div class="m-sb">' + c + '</div>';
}
var ROWS = [['sy','SIMYO','Ana López Ruiz','600 123 456','2','1','12-11-2026','😓','📌'],['mm','MÁSMÓVIL','Carlos Ruiz Gil','611 222 333','1','0','10-11-2026','-','🆗'],['pp','PEPEPHONE','María Soler Pons','622 333 444','3','1','04-11-2026','⏸️','💰'],['sy','SIMYO','Pedro Gil Mora','633 444 555','1','0','29-10-2026','-','💀'],['jz','JAZZTEL','Lucía Ferrer Vidal','644 555 666','2','1','21-10-2026','🪙','-'],['sy','SIMYO','Raúl Torres Ríos','655 666 777','4','1','15-10-2026','❌','🪳']];
function tbl(o){
  o = o || {};
  var h = '<table class="m-t"><tr><th>Cía</th><th>Nombre</th><th>Teléfono</th><th>Líneas</th><th>Fibra</th>' + (o.sol ? H(o.sol, '', 'Solicitud ↓', 'th') : '<th>Solicitud ↓</th>') + '<th>Estado</th><th>Info</th><th></th></tr>';
  var n = o.n || 6;
  for (var i = 0; i < n; i++){
    var r = ROWS[i];
    h += '<tr' + (r[8] === '💀' ? ' class="dead"' : '') + '><td>' + (o.cia === i ? H(3, 'cp ' + r[0], r[1], 'span') : '<span class="cp ' + r[0] + '">' + r[1] + '</span>') + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + r[4] + '</td><td>' + r[5] + '</td><td>' + r[6] + '</td><td>' + (o.est === i ? H(o.estN || 4, '', r[7], 'span') : r[7]) + '</td><td>' + (o.inf === i ? H(3, '', r[8], 'span') : r[8]) + '</td><td>' + ((o.acts && o.acts[i]) || '👀 ✏️ 🗑️') + '</td></tr>';
  }
  return h + '</table>';
}
function fld(l, v, fx, extra){ return '<div class="m-f" style="flex:' + (fx || 1) + '"><small>' + l + '</small><div class="m-i"' + (extra ? ' style="' + extra + '"' : '') + '>' + (v || '&nbsp;') + '</div></div>'; }
function app(main, act, b, st){ return '<div class="m-app"' + (st ? ' style="' + st + '"' : '') + '>' + sb(act, b) + '<div class="m-main">' + main + '</div></div>'; }

function mOverview(){
  var m = H(2, 'm-card', '<div class="m-h">📒 CONTRATOS <span class="m-btn p">➕ NUEVO CONTRATO ▾</span> <span class="m-btn">🔄 Actualizar</span></div>' + tbl({ n: 6 }) + '<div class="m-pg"><span>Mostrando 1–6 de 128</span><span>◀ ANTERIOR  PÁGINA 1  SIGUIENTE ▶</span></div>');
  return shot(app(m, 'con', { sb: 1, chat: 3 }, 'height:calc(100% - 24px)') + H(4, 'm-lu bin', '🤖'), 372);
}
function mInicio(){
  var kp = function(t, a){ return '<div class="m-kp"><small>' + t + '</small><div><p><b>' + a[0] + '</b>Fibras<br><span class="' + a[1] + '">' + a[2] + '</span></p><p><b>' + a[3] + '</b>Líneas extra<br><span class="' + a[4] + '">' + a[5] + '</span></p></div></div>'; };
  var hb = function(rows){ return '<div class="m-hb">' + rows.map(function(r){ return '<span>' + r[0] + '</span><span><i style="width:' + r[1] + '%;background:#2a78d6"></i><i style="width:' + r[2] + '%;background:#eb6834"></i></span>'; }).join('') + '</div>'; };
  var m = '<div class="m-h" style="justify-content:space-between">📊 INICIO <span>' + H(1, 'm-seg', '<b class="on">Fibras</b><b>Líneas extra</b><b>Líneas cliente</b>', 'span') + ' ' + H(2, 'm-seg', '<b class="on">Mes</b><b>Semana</b><b>Hoy</b>', 'span') + '</span></div>' +
    H(3, '', kp('ESTE MES', ['41','dn','▼ −5','159','up','▲ +8']) + kp('ESTA SEMANA', ['17','up','▲ +13','63','up','▲ +58']) + kp('HOY', ['3','up','▲ +1','4','up','▲ +2']), 'div', 'display:flex;gap:6px;margin-bottom:7px') +
    H(4, '', '<div class="m-card" style="flex:1;margin:0"><div style="font-weight:900;font-size:9px;margin-bottom:5px">Fibras por compañía</div>' + hb([['SIMYO',78,88],['O2',6,6],['MÁSMÓVIL',4,1],['JAZZTEL',1,3]]) + '</div><div class="m-card" style="flex:1;margin:0"><div style="font-weight:900;font-size:9px;margin-bottom:5px">Fibras por código de tienda</div>' + hb([['TIENDA A',70,74],['TIENDA B',22,30],['OTROS',4,6]]) + '</div>', 'div', 'display:flex;gap:6px');
  return shot(app(m, 'ini', {}), 290);
}
function mInicio12(){
  var F = [73,44,83,89,61,64,74,86,68,88,89,41], Ln = [240,143,258,252,184,218,274,315,208,294,336,161], M = ['dic','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov'];
  var W = 520, Hh = 190, L = 22, T = 16, B = 16, top = 400, hueco = (W - L - 6) / 12, bw = 13, g = '';
  var Y = function(v){ return T + (1 - v / top) * (Hh - T - B); };
  for (var v = 0; v <= top; v += 100) g += '<line x1="' + L + '" x2="' + W + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e6e8ec"/><text x="' + (L - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end" font-size="7" fill="#64748b">' + v + '</text>';
  var bar = function(x, v, col, op, pv){ var o = ''; if (pv){ o += '<rect x="' + x + '" y="' + Y(v + pv) + '" width="' + bw + '" height="' + (Y(v) - Y(v + pv)) + '" rx="2" fill="#8a8f98" fill-opacity=".28" stroke="#8a8f98" stroke-opacity=".6" stroke-dasharray="3 2"/><text x="' + (x + bw / 2) + '" y="' + (Y(v + pv) - 3) + '" text-anchor="middle" font-size="7" font-weight="700" fill="#6b7078">' + (v + pv) + '</text>'; } return o + '<rect x="' + x + '" y="' + Y(v) + '" width="' + bw + '" height="' + (Hh - B - Y(v)) + '" rx="2" fill="' + col + '" fill-opacity="' + op + '"/><text x="' + (x + bw / 2) + '" y="' + (Y(v) - 3) + '" text-anchor="middle" font-size="7" font-weight="700" fill="#0b0b0b">' + v + '</text>'; };
  for (var i = 0; i < 12; i++){ var cx = L + hueco * (i + 0.5), act = i === 11; g += bar(cx - bw - 1, F[i], '#2a78d6', act ? .55 : 1, act ? 39 : 0) + bar(cx + 1, Ln[i], '#e34948', act ? .55 : 1, act ? 134 : 0) + '<text x="' + cx + '" y="' + (Hh - 4) + '" text-anchor="middle" font-size="7.5" font-weight="' + (act ? 800 : 400) + '" fill="#475569">' + M[i] + '</text>'; }
  var x11 = L + hueco * 11, pc = function(x){ return (x / W * 100).toFixed(2) + '%'; };
  var m = '<div class="m-card" style="margin:0"><div style="display:flex;gap:10px;align-items:center;font-size:8px;margin-bottom:4px"><b style="font-size:9.5px;font-weight:900">Fibras y líneas por mes · últimos 12 meses</b>' + H(1, '', '<span style="color:#2a78d6">■</span> Fibras &nbsp;<span style="color:#e34948">■</span> Líneas', 'span') + '<span style="color:#64748b">noviembre va hasta hoy</span><span style="color:#64748b"><span style="color:#b3b7bd">■</span> Previsión con los borradores</span></div>' +
    '<div style="position:relative"><svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;display:block">' + g + '</svg>' +
    H(2, '', '', 'div', 'position:absolute;left:' + pc(x11 + 2) + ';width:' + pc(hueco - 4) + ';top:' + (Y(161) / Hh * 100).toFixed(1) + '%;bottom:8%') +
    H(3, '', '', 'div', 'position:absolute;left:' + pc(x11 + 2) + ';width:' + pc(hueco - 4) + ';top:' + (Y(310) / Hh * 100).toFixed(1) + '%;height:' + ((Y(161) - Y(310)) / Hh * 100 - 3).toFixed(1) + '%') +
    H(4, '', '', 'div', 'position:absolute;left:' + pc(L + hueco * 7 + 2) + ';width:' + pc(hueco - 4) + ';top:' + (Y(330) / Hh * 100).toFixed(1) + '%;bottom:8%') + '</div></div>';
  return shot(app(m, 'ini', {}), 280);
}
function mLogin(){
  var c = '<div style="height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#e6efff,#f7faff)"><div style="width:230px;background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 14px 34px rgba(30,64,175,.2);text-align:center"><div class="m-logo" style="border:0;margin-bottom:8px">' + logoHtml() + '</div><div class="m-f" style="text-align:left;margin-bottom:12px"><small>CONTRASEÑA</small>' + H(1, 'm-i', '<span class="tt-type" style="--c:10">••••••••••</span>') + '</div><div class="m-btn g tt-hl" style="--i:2;display:block;padding:9px;font-size:10px;position:relative;overflow:visible">ENTRAR<i class="m-prog"></i>' + bd(2) + '<ttb class="tt-b" style="--i:3;right:auto;left:-8px">3</ttb></div></div></div>';
  return shot(c + cur(470, 40, 360, 238), 330);
}
function mNuevo(){
  var m = '<div class="m-card"><div class="m-h">➕ NUEVO CONTRATO ▾</div>' +
    '<div class="m-r">' + H(1, 'm-f', '<small>COMPAÑÍA</small><div class="m-i" style="background:#ff8a1f;color:#111;font-weight:800">SIMYO</div>', 'div', 'flex:1.3') + fld('PAGA EL SI', '☑ Marca si el cliente paga el recibo', 1.7) + '</div>' +
    '<div class="m-r">' + fld('DOCUMENTO', 'DNI ▾', .7) + H(2, 'm-f', '<small>NUM DOC</small><div class="m-i">12345678Z 🔍</div>', 'div', 'flex:1') + fld('NOMBRE', 'Ana López Ruiz', 1.6) + '</div>' +
    H(3, 'm-r', fld('TELÉFONO', '600 123 456', .75) + fld('DIRECCIÓN', 'C/ Mayor 12, 3º B · Valencia', 2.6) + fld('CUENTA', 'ES00 0000 0000 0000', 1.25)) +
    H(4, 'm-r', fld('FECHA DE NACIMIENTO', '14-03-1985') + fld('LÍNEAS CLIENTE', '2') + fld('LÍNEAS EXTRA', '0') + fld('FIBRA', '1')) +
    '<div class="m-r">' + fld('ACCESO', '') + fld('CICLO', '1') + fld('TIENDA', '') + fld('CÓDIGO EMPLEADO', '') + '</div>' +
    '<div class="m-r">' + fld('AVISOS', '', 1) + fld('NOTAS', '', 1.6) + '</div>' +
    '<div style="display:flex;gap:7px;margin-top:2px"><span class="m-btn">🧽 LIMPIAR</span>' + H(5, 'm-btn g', '💾 GUARDAR BORRADOR', 'span') + '</div></div>';
  return shot(app(m, 'con') + cur(520, 40, 215, 313), 392);
}
function mEditar(){
  var base = '<div class="m-card">' + tbl({ n: 5, acts: [H(1, '', '👀 <u style="text-decoration:none">✏️</u> 🗑️', 'span')] }) + '</div>';
  var modal = '<div class="m-ov"></div><div class="m-modal" style="left:96px;top:30px;width:340px"><div class="m-h">✏️ Editar contrato</div><div class="m-r">' + H(2, 'm-f', '<small>COMPAÑÍA</small><div class="m-i" style="background:#ff8a1f;color:#111;font-weight:800">SIMYO</div>', 'div', 'flex:1') + fld('NOMBRE', 'Ana López Ruiz', 1.6) + '</div><div class="m-r">' + fld('TELÉFONO', '600 123 456', .8) + fld('DIRECCIÓN', 'C/ Mayor 12, 3º B', 1.8) + '</div><div class="m-r">' + fld('LÍNEAS', '2') + fld('FIBRA', '1') + fld('CICLO', '1') + '</div><div style="display:flex;gap:7px;justify-content:flex-end;margin-top:8px"><span class="m-btn">Cancelar</span>' + H(3, 'm-btn g', '💾 Guardar', 'span') + '</div></div>';
  return shot(app(base + modal, 'con'), 360);
}
function mEstados(){
  var m = '<div class="m-card">' + tbl({ n: 5, est: 0, estN: 1, inf: 3 }) + '</div><div class="m-card" style="margin-top:96px"><div style="font-size:8px;font-weight:800;color:#64748b;margin-bottom:4px">ESTADO</div><span class="m-ic">😓</span><span class="m-ic">🪙</span><span class="m-ic">🤑</span><span class="m-ic">⏸️</span><span class="m-ic">❌</span><span class="m-ic">❓</span><div style="font-size:8px;font-weight:800;color:#64748b;margin:3px 0 4px">INFO</div><span class="m-ic">📌</span><span class="m-ic">💰</span><span class="m-ic">🆗</span><span class="m-ic">🪳</span><span class="m-ic">💀</span></div>' +
    H(2, 'm-pop', '<span>-</span><span>😓</span><span>🪙</span><span>🤑</span><span class="on">⏸️</span><span>❌</span><span>❓</span>', 'div', 'left:322px;top:68px');
  return shot(app(m, 'con') + cur(480, 20, 346, 82), 372);
}
function mFiltros(){
  var ic = ['📌','💰','🆗','💀','🪳','🪙','😓','⏸️','❌','❓'].map(function(x){ return '<span class="m-ic' + (x === '😓' || x === '⏸️' ? ' on' : '') + '">' + x + '</span>'; }).join('');
  var m = '<div class="m-card">' + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">' + H(1, 'm-i', '🔍 <span class="tt-type" style="--c:9">Ana López</span>', 'div', 'flex:1;min-height:24px') + '</div>' + H(2, '', ic, 'div', 'margin-bottom:2px') + '<div style="margin-bottom:6px"><span class="m-btn">♾️1</span> <span class="m-btn">♾️20</span> <span class="m-btn">VIP</span> <span class="m-btn">🛜✅</span> <span class="m-btn">🛜❌</span></div>' + H(3, '', '<span class="cp sy">SIMYO</span> <span class="cp mm">MÁSMÓVIL</span> <span class="cp pp">PEPEPHONE</span> <span class="cp jz">JAZZTEL</span>', 'div', 'margin-bottom:6px') + '<div style="display:flex;gap:8px;align-items:flex-end">' + H(4, 'm-r', fld('DESDE', '01-10-2026') + fld('HASTA', '19-11-2026'), 'div', 'flex:1;margin:0') + H(5, 'm-btn g m-blink', '🧹 LIMPIAR FILTROS', 'span') + '</div></div>' + '<div class="m-card">' + tbl({ n: 2 }) + '</div>';
  return shot(app(m, 'con'), 372);
}
function mQr(){
  var fila = 'display:flex;align-items:center;gap:7px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:9px;padding:6px 8px;margin-bottom:5px';
  var txt = function(t, d){ return '<b style="display:block;font-size:9px">' + t + '</b><small style="display:block;font-size:7px;color:#64748b">' + d + '</small>'; };
  var m = '<div class="m-card" style="max-width:290px;margin:8px auto 0;box-shadow:0 10px 30px rgba(15,23,42,.18)">' +
    '<b style="font-size:11px">¿Qué quieres hacer?</b><div style="font-size:7.5px;color:#64748b;margin:1px 0 7px">Contrato de simyo</div>' +
    '<div style="' + fila + '"><span style="font-size:14px">📝</span><span style="flex:1">' + txt('Crear borrador', 'Copia este contrato como un borrador nuevo') + '</span></div>' +
    '<div style="' + fila + '"><span style="font-size:14px">📲</span>' + H(1, '', txt('Enviar QR de bonificación', 'El cliente verá cuántos días bonificados le quedan'), 'span', 'flex:1;display:block') +
    H(2, '', 'Enviado 2 veces', 'span', 'font-size:7px;font-weight:800;padding:3px 7px;border-radius:99px;background:#dcfce7;color:#166534;border:1px solid #86efac;white-space:nowrap') + '</div>' +
    '<div style="border-top:1px dashed #e2e8f0;margin:8px 0 7px"></div>' +
    '<b style="font-size:9.5px">¿A qué número se lo envío?</b><div style="height:5px"></div>' +
    H(3, '', '<span style="font-size:13px">📞</span><span style="flex:1">' + txt('Al teléfono del contrato', '600 123 456') + '</span>', 'div', fila) +
    '<div style="' + fila + ';margin-bottom:0"><span style="font-size:13px">✏️</span><span style="flex:1">' + txt('A un número nuevo', 'Escribir otro teléfono') + '</span></div></div>';
  return shot(app(m, 'con', { bor: 1 }), 300);
}
function mBorradores(){
  var acts = [H(2, '', '✏️', 'span') + '&nbsp;&nbsp;&nbsp;&nbsp;' + H(3, '', '✅', 'span') + '&nbsp;&nbsp;&nbsp;&nbsp;' + H(4, '', '🗑️', 'span'), '✏️ ✅ 🗑️', '✏️ ✅ 🗑️'];
  var m = '<div class="m-card"><div class="m-h">🗒️ BORRADORES <span class="m-btn">🔄 Actualizar</span> ' + H(1, 'm-btn p', '➕ Nuevo', 'span') + '</div>' + tbl({ n: 3, acts: acts }) + '<div class="m-pg"><span>Mostrando 1–3 de 3</span><span>◀  PÁGINA 1  ▶</span></div></div>';
  return shot(app(m, 'bor', { bor: 5 }), 300);
}
function mTarjetas(){
  var m = '<div class="m-card"><div class="m-h">💳 DATOS DE TARJETAS <span class="m-btn">🔒</span> ' + H(1, 'm-btn p', '➕ Nueva tarjeta', 'span') + ' ' + H(2, 'm-btn p', '➕ Nueva cuenta', 'span') + ' ' + H(4, 'm-btn', '🔑 Cambiar PIN', 'span') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + H(3, 'm-cc', '<b>TARJETA EMPRESA</b><span>•••• •••• •••• 0000</span><span>Titular · 12/28</span>', 'div', 'background:linear-gradient(135deg,#1d4ed8,#0b1b4a)') + '<div class="m-cc" style="background:linear-gradient(135deg,#16a34a,#14532d)"><b>TARJETA GASTOS</b><span>•••• •••• •••• 0000</span><span>Titular · 03/27</span></div><div class="m-cc" style="background:linear-gradient(135deg,#64748b,#1e293b)"><b>CUENTA PRINCIPAL</b><span>ES00 •••• •••• •••• 0000</span><span>Titular</span></div><div class="m-cc" style="background:linear-gradient(135deg,#ea580c,#7c2d12)"><b>TARJETA VIAJES</b><span>•••• •••• •••• 0000</span><span>Titular · 09/29</span></div></div></div>';
  return shot(app(m, 'tar'), 330);
}
function mNotas(){
  var nt = function(bg, t){ return '<div class="m-note" style="background:' + bg + '">' + t + '</div>'; };
  var m = '<div class="m-card"><div class="m-h">📖 NOTAS ' + H(1, 'm-btn p', '➕ Nueva nota', 'span') + ' ' + H(4, 'm-btn', '🏷️ Editar etiqueta', 'span') + '</div>' + H(2, '', '<span class="cp" style="background:#fecaca;color:#7a1315">URGENTE</span> <span class="cp" style="background:#fde68a;color:#78350f">NOTAS</span> <span class="cp" style="background:#bbf7d0;color:#14532d">INFORMACION</span> <span class="cp" style="background:#bfdbfe;color:#1e3a8a">COMISIONES</span>', 'div', 'margin-bottom:8px') + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' + nt('#fee2e2', '<b>Llamar a Ana</b><br>Antes del viernes: confirmar la instalación.') + nt('#fef3c7', '<b>Pedir fotos del DNI</b><br>Falta la cara B de Pedro.') + nt('#dcfce7', '<b>Horario</b><br>Tienda abierta de 10 a 14 y de 17 a 20.') + nt('#dbeafe', '<b>Comisión de noviembre</b><br>Revisar altas del mes.') + nt('#fee2e2', '<b>Cambiar titular</b><br>Preguntar a Lucía.') + nt('#fef3c7', '<b>Ideas</b><br>Ofrecer fibra a los clientes sin ella.') + '</div></div>';
  return shot(app(m, 'not', { not: 3 }), 340);
}
function mAgenda(){
  var days = [];
  var nums = [26,27,28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  var ev = { 3: ['#2563eb','Reunión'], 12: ['#ea580c','Cita cliente'], 19: ['#16a34a','Llamar a Ana'], 24: ['#7c3aed','Revisión'] };
  var cal = '<div class="m-cal">' + ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(function(d){ return '<b>' + d + '</b>'; }).join('');
  nums.forEach(function(d, i){ var o = (i < 5) ? '<span style="color:#cbd5e1">' + d + '</span>' : d; var e = (i >= 5 && ev[d]) ? '<em style="background:' + ev[d][0] + '">' + ev[d][1] + '</em>' : ''; cal += '<div' + (i >= 5 && d === 19 ? ' class="hoy"' : '') + '>' + o + e + '</div>'; });
  cal += '</div>';
  var m = '<div class="m-card"><div class="m-h">🗓️ AGENDA ' + H(2, '', '<span class="m-btn p">Mes</span><span class="m-btn">Día</span>', 'span') + ' ' + H(1, '', '<span class="m-btn">‹ Anterior</span> <span class="m-btn">Hoy</span> <span class="m-btn">Siguiente ›</span>', 'span') + ' ' + H(3, 'm-btn p', '➕ Nuevo evento', 'span') + '</div>' + cal + '</div>';
  var modal = '<div class="m-modal" style="right:14px;top:78px;width:190px;border:1px solid #cbd5e1"><div class="m-h">➕ Nuevo evento</div>' + fld('TÍTULO', 'Llamar a Lucía') + '<div style="height:5px"></div>' + fld('HORA (OPCIONAL)', '10:30') + '<div style="height:5px"></div>' + H(4, '', '<small style="font-size:6.8px;font-weight:800;color:#64748b">COLOR</small><div style="margin-top:2px"><i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#2563eb;margin-right:4px"></i><i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#ea580c;margin-right:4px"></i><i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#16a34a;margin-right:4px;outline:2px solid #0b1b4a"></i><i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#7c3aed"></i></div>', 'div') + '<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px"><span class="m-btn">Cerrar</span><span class="m-btn g">💾 Guardar</span></div></div>';
  return shot(app(m + modal, 'age', { age: 5 }), 392);
}
function mChat(){
  var side = '<div class="m-sb" style="width:228px;flex:0 0 228px"><div class="m-logo">' + logoHtml() + '</div><div class="m-nv"><span>📒 CONTRATOS</span><span><i class="m-pl g">128</i></span></div><div class="m-nv"><span>📖 NOTAS</span><span><i class="m-pl r">5</i></span></div>' +
    '<div style="margin:6px -7px 0;flex:1;display:flex;flex-direction:column;background:#ece5dd;border-top:1px solid #e3e8f0">' + H(1, '', '<div style="background:#075e54;color:#fff;font-weight:800;font-size:9.5px;padding:7px 9px">💬 Chat en vivo</div>') + '<div style="padding:7px;flex:1">' + H(2, 'm-i', 'Tu nombre: <b style="font-weight:800">Laura</b>', 'div', 'margin-bottom:6px;font-size:8.5px') + '<div class="m-bub ot"><b style="font-size:8px;color:#0f766e">Pablo</b><br>¿Alguien tiene el contrato de Ana?</div><div class="m-bub me">Sí, lo tengo yo. Ahora lo subo.</div><div class="m-bub ot"><b style="font-size:8px;color:#0f766e">Pablo</b><br>Perfecto, gracias 🙌</div></div><div style="display:flex;gap:4px;padding:6px;background:#f0f0f0"><div class="m-i" style="flex:1;font-size:8.5px"><span class="tt-type" style="--c:14">Voy a llamarla</span></div>' + H(3, 'm-btn g', '➤', 'span') + '</div></div></div>';
  var main = '<div class="m-main"><div class="m-card" style="opacity:.55"><div class="m-h">📒 CONTRATOS</div>' + tbl({ n: 5 }) + '</div></div>';
  return shot('<div class="m-app">' + side + main + '</div>', 372);
}
function mLucas(){
  var m = '<div class="m-card"><div class="m-h">📒 CONTRATOS <span class="cp" style="background:#0b1b4a;color:#fff">🤖 filtro: enero</span></div>' + tbl({ n: 3 }) + '</div>';
  var panel = '<div style="position:absolute;right:12px;bottom:30px;width:262px;height:262px;background:#fff;border-radius:14px;box-shadow:0 14px 34px rgba(15,23,42,.45);overflow:hidden;z-index:11;display:flex;flex-direction:column"><div style="background:#05070c;color:#fff;padding:8px 10px;font-weight:800;font-size:9.5px;display:flex;align-items:center;gap:8px"><span style="flex:1">🤖 Asistente Lucas IA</span>' + H(4, '', '🔊', 'span') + H(3, '', 'Saldo: 5,00 €', 'span', 'font-size:8.5px;color:#ffd166') + '<span>✕</span></div><div style="flex:1;padding:9px;background:#f4f7fb"><div class="m-bub me" style="margin-bottom:6px"><span class="tt-type" style="--c:28">sácame los contratos de enero</span></div><div class="m-bub ot">Hecho: ya tienes en pantalla los contratos de enero. 😉</div></div><div style="padding:6px;background:#fff;border-top:1px solid #e3e8f0">' + H(2, 'm-i', 'Escribe a Lucas…', 'div', 'font-size:8.5px;color:#94a3b8') + '</div></div>';
  var strip = '<div class="m-lu"><span style="position:absolute;left:40%;font-size:8px;background:#1f2937;color:#cbd5e1;border-radius:99px;padding:2px 8px">Zzz' + bd(5).replace('class="tt-b"', 'class="tt-b" style="--i:5;right:-8px;top:-8px"') + '</span>' + H(1, '', '🤖', 'span', 'font-size:16px;margin-left:24px') + '</div>';
  return shot(app(m, 'con', null, 'height:calc(100% - 24px)') + panel + strip + cur(470, 60, 330, 226), 372);
}
function cards(arr){ return '<div class="tt-cards">' + arr.map(function(c, i){ return '<div class="tt-card" style="--k:' + i + '"><div class="ic">' + c[0] + '</div><div><b>' + c[1] + '</b><span>' + c[2] + '</span></div></div>'; }).join('') + '</div>'; }
/* ---- moviles ---- */
function ph(inner){ return '<div class="ph">' + inner + '</div>'; }
function pcard(r, i, ex){ return '<div class="pc" style="--c:' + ({sy:'#ff8a1f',mm:'#f6d200',pp:'#e6004c',jz:'#d71920'}[r[0]]) + '"><div><b>' + r[2] + '</b><small>🪪 12345678Z · 📶 ' + r[3] + '</small><small>📅 ' + r[6] + '</small></div><span>' + r[7] + ' ' + r[8] + '</span>' + (ex || '') + '</div>'; }
function phLista(){
  var c = '<div class="pt"><div class="mn">☰</div><div class="lg">Punto<i>fibra</i></div><span style="width:26px"></span></div>' + H(1, 'ptabs', '<b>📝 Borradores</b><b class="on">📄 Contratos</b>') + H(2, 'psr', '🔍 <span class="tt-type" style="--c:9">Ana López</span>') + H(4, 'plu', '🤖 Filtro de Lucas · 12 <u>✕ Quitar</u>') + H(3, 'pc', '<div><b>Ana López Ruiz</b><small>🪪 12345678Z · 📶 600 123 456</small><small>📅 12-11-2026</small></div><span>😓 📌</span>', 'div', '--c:#ff8a1f;margin-top:7px') + pcard(ROWS[1]) + pcard(ROWS[2]) + pcard(ROWS[4]) + tap(120, 168);
  return ph(c);
}
function phFicha(){
  var c = '<div class="pt"><div class="mn">‹</div><span>Ficha</span><span style="width:26px"></span></div>' + H(1, '', '<div style="padding:10px 12px 4px"><span class="cp sy" style="font-size:8.5px">SIMYO</span><div style="font-size:15px;font-weight:900;color:#0b1b4a;margin-top:3px">Ana López Ruiz</div></div>', 'div') + H(2, '', '<div class="pr"><small>🪪 Documento</small><span>12345678Z</span></div><div class="pr"><small>📶 Teléfono</small><span>600 123 456</span></div><div class="pr"><small>📅 Solicitud</small><span>12-11-2026</span></div><div class="pr"><small>Líneas</small><span>2</span></div><div class="pr"><small>Fibra</small><span>1</span></div><div class="pr"><small>Dirección</small><span>C/ Mayor 12</span></div>', 'div', 'margin-top:6px') + '<div class="pbar">' + H(3, 'row', '<b>📞 Llamar</b><b>Copiar doc.</b><b>Copiar cuenta</b>') + H(5, 'big', '✏️ Editar datos') + '</div>' + tap(118, 398);
  return ph(c);
}
function phDoc(){
  var c = '<div class="pt"><div class="mn">‹</div><span>Ficha</span><span style="width:26px"></span></div>' + H(1, 'pdoc', '<h6>🪪 DOCUMENTO</h6><small style="font-size:8px;color:#64748b">CARA A · ✅</small><div class="im"></div><div class="bt">' + H(2, '', '⬆️ Cambiar', 'b') + H(3, '', '👁 Ver', 'b') + H(4, '', '⬇️ Descargar', 'b') + '</div>', 'div', 'margin-top:8px') + '<div class="pdoc"><small style="font-size:8px;color:#64748b">CARA B · Sin documento</small><div class="im" style="background:#eef2f8;display:grid;place-items:center;color:#94a3b8;font-size:9px">Sin documento</div><div class="bt"><b>⬆️ Subir</b></div></div>';
  return ph(c);
}
function phEdit(){
  var c = '<div class="pt"><div class="mn">‹</div><span>Editar datos</span><span style="width:26px"></span></div>' + H(1, '', '<div class="pin"><small>NOMBRE</small><div>Ana López Ruiz</div></div><div class="pin"><small>TELÉFONO</small><div>600 123 456</div></div><div class="pin"><small>DIRECCIÓN</small><div>C/ Mayor 12, 3º B</div></div><div class="pin"><small>LÍNEAS</small><div>2</div></div>', 'div', 'margin-top:6px') + '<div style="margin:8px 9px 0">' + H(2, 'm-btn', '➕ Más datos', 'span', 'display:block;text-align:center;padding:7px') + '</div><div class="pbar"><div class="row" style="margin:0">' + H(3, '', '<b style="display:inline-block;width:46%;margin-right:4%;padding:7px 0;border:1px solid #d5dbe6;border-radius:9px;text-align:center">Cancelar</b><b style="display:inline-block;width:46%;padding:7px 0;border-radius:9px;text-align:center;background:#2563eb;color:#fff">💾 Guardar</b>', 'div', 'width:100%') + '</div></div>';
  return ph(c);
}
function phMenu(){
  var c = '<div class="pt"><div class="mn">☰</div><div class="lg">Punto<i>fibra</i></div><span style="width:26px"></span></div><div class="ptabs"><b>📝 Borradores</b><b class="on">📄 Contratos</b></div>' + pcard(ROWS[0]) + pcard(ROWS[1]) + pcard(ROWS[2]) + '<div class="pov"></div><div class="pmenu">' + H(2, '', '🖥️ Cambiar a formato normal', 'div', 'border:1px solid #e3e8f0;border-radius:10px;padding:9px;font-size:10px;font-weight:700') + H(3, '', '⟳ Actualizar datos', 'div', 'border:1px solid #e3e8f0;border-radius:10px;padding:9px;font-size:10px;font-weight:700') + H(4, '', '⏻ Cerrar sesión', 'div', 'border:1px solid #e3e8f0;border-radius:10px;padding:9px;font-size:10px;font-weight:700') + '</div>' + H(1, 'mn', '☰', 'div', 'position:absolute;left:11px;top:14px;z-index:9;width:26px;height:26px;border-radius:8px;border:1px solid #d5dbe6;display:grid;place-items:center;background:#fff');
  return ph(c);
}
function phones(a, b){ return '<div style="display:flex;gap:18px;justify-content:center;align-items:center;margin:2px 0">' + a + (b || '') + '</div>'; }
function gira(){ return '<div class="tt-gira"><div><i>📱</i><b style="font-size:12px;display:block;margin-top:8px">Gira el móvil</b><span style="opacity:.7">Ponlo en vertical</span></div></div>'; }
/* ---- paginas ---- */
var P = [], CH = [];
function pg(n, name, title, lead, body, steps, tip, mv){
  var h = '<div class="tt-in"><div class="tt-cap' + (mv ? ' mv' : '') + '"><span>' + n + '</span>' + name + '</div><h2>' + title + '</h2>' + (lead ? '<p class="tt-lead">' + lead + '</p>' : '') + (body || '');
  if (steps && steps.length) h += '<ol class="tt-st">' + steps.map(function(s, i){ return '<li><i class="tt-n">' + (i + 1) + '</i><span>' + s + '</span></li>'; }).join('') + '</ol>';
  if (tip) h += '<div class="tt-tip"><i>💡</i><span>' + tip + '</span></div>';
  return h + '</div><div class="tt-pn">@@</div>';
}
function chapter(g, ico, name, fn){ var n = CH.length + 1; CH.push({ g: g, ico: ico, t: name, p: P.length, n: n }); fn(n, 'CAPÍTULO ' + n + ' · ' + name.toUpperCase()).forEach(function(h){ P.push(h); }); }
function coverHtml(){ return '<div class="tt-cv"><div class="tt-cvin"><div class="tt-cvlogo">' + logoHtml() + '</div><div class="k">GUÍA OFICIAL</div><h1>TUTORIAL</h1><div class="s">Aprende a sacarle todo el partido a tu panel, paso a paso</div><div class="ln"></div><div class="e">EDICIÓN ' + EDICION + ' · ' + FECHA + '</div><div class="go">Pulsa para abrir ▶</div></div></div>'; }
function backHtml(){ return '<div class="tt-cv bk"><div class="tt-cvin"><div class="tt-cvlogo">' + logoHtml() + '</div><h1 style="font-size:54px">¡A POR ELLO!</h1><div class="s">Gracias por usar Puntofibra</div><div class="ln"></div><div class="e">EDICIÓN ' + EDICION + ' · ' + FECHA + '</div></div></div>'; }
function howtoHtml(){
  return '<div class="tt-in"><div class="tt-cap"><span>📖</span>CÓMO USAR ESTE LIBRO</div><h2>Bienvenido al tutorial</h2><p class="tt-lead">Aquí aprenderás, paso a paso, todo lo que puedes hacer en el panel: desde la ficha de un cliente hasta el chat y el asistente Lucas. Los últimos capítulos explican la versión para el móvil.</p><div class="tt-how"><div><em>▶</em><span>Pasa de página con los botones de abajo, las <b>flechas del teclado</b> o pulsando el borde de la página.</span></div><div><em>👆</em><span>En el móvil, <b>desliza el dedo</b> hacia los lados para pasar páginas.</span></div><div><em>📑</em><span>En el <b>índice</b> pulsa un capítulo y el libro salta directo a él.</span></div><div><em>🔢</em><span>Los números en círculo de las capturas coinciden con los pasos explicados debajo.</span></div><div><em>✖</em><span>Cierra el tutorial con la <b>X</b> de arriba o con la tecla <b>Esc</b>.</span></div></div><div class="tt-tip"><i>💡</i><span>Puedes volver a abrir este tutorial siempre que quieras desde el botón <b>📖 TUTORIAL</b> del menú.</span></div></div><div class="tt-pn">@@</div>';
}
function indexHtml(){
  var h = '<div class="tt-in"><div class="tt-cap"><span>📑</span>ÍNDICE</div><h2>Contenido</h2><p class="tt-lead" style="margin-bottom:2px">Pulsa un capítulo para saltar directamente a su página.</p>';
  [['pc','EN EL ORDENADOR'],['mv','EN EL MÓVIL'],['fin','AL FINAL']].forEach(function(g){
    var it = CH.filter(function(c){ return c.g === g[0]; }); if (!it.length) return;
    h += '<div class="tt-ixg">' + g[1] + '</div>';
    it.forEach(function(c){ h += '<a class="tt-ix' + (g[0] === 'mv' ? ' mv' : '') + '" data-go="' + c.p + '"><i>' + (g[0] === 'fin' ? '?' : c.n) + '</i><span>' + c.ico + ' ' + c.t + '</span><u></u><em>' + c.p + '</em></a>'; });
  });
  return h + '</div><div class="tt-pn">@@</div>';
}
function addAll(){
  P = []; CH = [];
  P.push(coverHtml()); P.push(howtoHtml()); P.push('IDX');
  chapter('pc', '🧭', 'Conoce el panel', function(n, c){ return [
    pg(n, c, 'Tu panel de un vistazo', 'Todo lo que necesitas para llevar tus clientes y contratos está en una sola web, organizada en cuatro zonas.', shot2(mOverview()), ['<b>Menú lateral.</b> Desde aquí saltas a cada sección. Los círculos de colores avisan de lo pendiente.', '<b>Zona de trabajo.</b> Aquí aparece la sección que elijas: tablas, formularios, calendario…', '<b>Chat en vivo.</b> La barra verde de abajo abre una conversación con tu equipo.', '<b>Asistente Lucas.</b> La franja negra inferior. Pulsa al robot y te ayuda a filtrar y a recordar cosas.'], 'Si ya conoces lo básico, salta directamente a un capítulo desde el índice 📑.'),
    pg(n, c, 'El menú lateral', 'Cada botón te lleva a una sección. Estas son las que tienes a tu disposición:', cards([[ic(IC.ini,1),'INICIO','Tus gráficas de fibras y líneas. Es lo primero que ves al entrar.'],[ic(IC.bor,1),'BORRADORES','Contratos a medias. El número rojo te dice cuántos tienes.'],[ic(IC.con,1),'CONTRATOS','La lista de todos tus contratos, con buscador y filtros.'],[ic(IC.tar,1),'TARJETAS','Tus tarjetas y cuentas bancarias, protegidas con PIN.'],[ic(IC.not,1),'NOTAS','Notas con etiquetas de color. Cada color tiene su contador.'],[ic(IC.age,1),'AGENDA','Calendario de eventos. El número indica los de hoy.'],['💬','CHAT EN VIVO','La barra verde de abajo: habla con tu equipo.'],['🤖','ASISTENTE LUCAS','El robot de la franja negra: tu ayudante.'],[ic(IC.tut,1),'TUTORIAL','Este libro, siempre a mano.']]) , null, 'El botón de la sección abierta se marca en verde. Los números del menú se actualizan solos: rojo, amarillo, verde y azul en NOTAS (uno por etiqueta).')
  ]; });
  chapter('pc', '📊', 'Inicio: tus gráficas', function(n, c){ return [
    pg(n, c, 'El Inicio de un vistazo', 'Al entrar, el panel abre siempre en INICIO: un resumen de las fibras y líneas que llevas, comparado con el mes anterior.', shot2(mInicio()), ['<b>Qué quieres contar.</b> Elige entre Fibras, Líneas extra o Líneas de cliente. Las gráficas de abajo cambian al momento.', '<b>Qué periodo.</b> Mes, Semana u Hoy. Siempre se compara con los mismos días del mes anterior.', '<b>Las tres tarjetas.</b> Lo que llevas este mes, esta semana y hoy. La flecha verde indica que vas por encima del mes anterior; la roja, por debajo.', '<b>Por compañía y por tienda.</b> La barra azul es lo de ahora y la naranja lo del mes anterior. «OTROS» reúne los contratos sin código de tienda.'], 'Mientras el panel termina de cargar verás una barra de progreso y el menú en gris unos segundos: las gráficas ya se pueden consultar.'),
    pg(n, c, 'Los últimos 12 meses', 'La gráfica grande te enseña, mes a mes, cuántas fibras y cuántas líneas se han hecho en el último año.', shot2(mInicio12()), ['<b>Dos barras por mes.</b> La azul son las fibras y la roja las líneas (las de cliente y las extra, juntas).', '<b>El mes en curso</b> sale en un tono más claro, porque todavía no ha terminado: cuenta hasta hoy.', '<b>La previsión en gris.</b> Encima del mes en curso se suma lo que hay en Borradores. El número sobre el color es lo que llevas de verdad; el de arriba, a lo que llegarías si se tramitan todos.', '<b>Pasa el ratón</b> por cualquier mes para ver el detalle: fibras, líneas de cliente y líneas extra.'], 'La previsión solo aparece en esta gráfica y solo en el mes en curso: los borradores no cuentan en ningún otro número.')
  ]; });
  chapter('pc', '🔐', 'Entrar en el panel', function(n, c){ return [
    pg(n, c, 'Entrar en el panel', 'Sin usuarios ni complicaciones: solo necesitas tu contraseña.', shot2(mLogin()), ['Escribe tu <b>contraseña</b>. Si usas Google Authenticator, escribe en su lugar el <b>código de 6 cifras</b> que muestra la app.', 'Pulsa <b>ENTRAR</b> (o la tecla Enter).', 'Con una <b>llave NFC</b>: mantén pulsado ENTRAR 3 segundos; la barra se llena y entonces pasas la llave.', 'La sesión se cierra sola cada día a las <b>00:00</b> y al día siguiente vuelves a entrar. También puedes cerrarla tú cuando quieras con el botón <b>SALIR</b>, abajo del menú lateral.'], null)
  ]; });
  chapter('pc', '📒', 'Contratos', function(n, c){ return [
    pg(n, c, 'La tabla de contratos', 'Aquí están todos tus contratos. Cada fila es un cliente y la compañía se reconoce por su color.', shot2(mContratos()), ['<b>➕ NUEVO CONTRATO</b> abre el formulario para dar de alta uno nuevo.', 'Pulsa la cabecera <b>Solicitud</b> para ordenar por fecha; la flecha indica el sentido.', 'La celda de <b>compañía</b> lleva el color de su operadora: se ve de un vistazo.', 'El <b>estado</b> se cambia pulsando su icono.', 'Abajo, la <b>paginación</b>: muestra hasta 500 contratos por página.'], '<span data-voz="Al final de cada fila tienes tres botones: ver la ficha, editar y eliminar.">Al final de cada fila tienes tres botones: 👀 ver la ficha · ✏️ editar · 🗑️ eliminar.</span>'),
    pg(n, c, 'Buscar y filtrar', 'Encuentra cualquier contrato en segundos combinando el buscador y los filtros.', shot2(mFiltros()), ['<b>Buscador:</b> escribe un nombre, documento o teléfono y la tabla se filtra mientras tecleas.', '<b>Iconos:</b> pulsa uno o varios para ver solo los contratos con esa marca.', '<b>Compañías:</b> elige qué operadoras quieres ver.', '<b>Fechas:</b> indica DESDE y HASTA para ver solo un periodo.', '<b>LIMPIAR FILTROS</b> parpadea en verde cuando hay filtros activos: púlsalo y vuelves a verlo todo.', '<b>OMITIR</b> invierte el filtro: te enseña justo lo contrario de lo que has filtrado.'], '<span data-voz="Los botones de ciclo uno y de ciclo veinte filtran por ciclo, y el botón vip te muestra tus clientes vip.">♾️1 y ♾️20 filtran por ciclo 1 o ciclo 20, y VIP te muestra tus clientes VIP.</span>'),
    pg(n, c, 'QR de bonificación', 'Envía a tu cliente un enlace con su código QR para que consulte los días de fibra bonificados que le quedan.', shot2(mQr()), ['Pulsa con el <b>botón derecho</b> sobre la compañía de un contrato y elige <b>Enviar QR de bonificación</b>.', 'A su derecha verás cuántas veces lo has enviado ya: <b>Sin enviar</b>, <b>Enviado 1 vez</b>, <b>Enviado 2 veces</b>…', 'Elige si lo mandas <b>al teléfono del contrato</b> o a <b>un número nuevo</b>.', 'Se abre <b>WhatsApp Web</b> con el mensaje y el enlace ya escritos: solo tienes que pulsar enviar.', 'Desde la misma ventana también puedes <b>copiar el enlace</b>, <b>copiar el QR</b> o ver la página del cliente.'], 'El mismo menú del botón derecho te deja <b>crear un borrador</b> copiando ese contrato.'),
    pg(n, c, 'Lo que ve tu cliente', 'Con el enlace o el QR, tu cliente consulta cuando quiera cómo va su bonificación. La página se actualiza sola cada día.', cards([['⏳','Sin fecha de instalación','Le avisa de que verá sus días entre 1 y 48 horas después de la instalación.'],['🟢','Dentro de los 90 días','Un contador con los días bonificados que le quedan: baja uno cada día.'],['🔴','Pasados los 90 días','Los días de retraso y el importe no bonificable acumulado: 1 € por día.'],['🔒','Enlace obsoleto','Cuando el contrato se pausa, se da de baja o queda en duda, el enlace deja de mostrar datos.']]), ['Los 90 días cuentan desde la <b>fecha de instalación</b> del contrato: en cuanto la pongas, el enlace empieza a descontar.', 'La página recuerda al cliente que estar atentos al <b>cambio de titular</b> es responsabilidad de las dos partes.', 'Cada contrato tiene <b>su propio enlace</b>: si el cliente tiene otra fibra, envíale el de ese contrato.'], 'No hace falta reenviar nada: el mismo enlace sirve siempre y se actualiza solo.')
  ]; });
  chapter('pc', '➕', 'Nuevo contrato y edición', function(n, c){ return [
    pg(n, c, 'Dar de alta un contrato', 'Pulsa ➕ NUEVO CONTRATO y rellena la ficha. Los datos se guardan primero como borrador.', shot2(mNuevo()), ['Elige la <b>compañía</b> y marca <b>PAGA EL SI</b> si el cliente paga el recibo.', 'Selecciona el tipo de <b>documento</b> (DNI, NIE o pasaporte) y escribe su número.', 'Rellena el <b>teléfono, la dirección y la cuenta</b>, además del nombre.', 'Indica la fecha de nacimiento y las <b>líneas, líneas extra y fibra</b> con los desplegables.', 'Pulsa <b>💾 GUARDAR BORRADOR</b>. Con <b>🧽 LIMPIAR</b> vacías todos los campos para empezar de cero.'], 'Los campos Avisos y Notas son libres: úsalos para recordar cualquier detalle del cliente.'),
    pg(n, c, 'Editar un contrato', 'Cuando necesites cambiar algo, abre la ficha del contrato desde la tabla.', shot2(mEditar()), ['<span data-voz="El botón de editar, al final de la fila, abre la edición. El botón de ver solo enseña la ficha.">El botón <b>✏️</b> del final de la fila abre la edición (👀 solo enseña la ficha).</span>', 'El campo de <b>compañía</b> toma el color de su operadora.', 'Cambia lo que necesites y pulsa <b>💾 Guardar</b>; con <b>Cancelar</b> sales sin tocar nada.'], 'Si cambias el documento, la fecha de nacimiento se toma de otros contratos de ese documento; si hay fechas distintas, el panel te pregunta cuál es la correcta.')
  ]; });
  chapter('pc', '🏷️', 'Estados e iconos', function(n, c){ return [
    pg(n, c, 'Estados e iconos', 'Cada contrato lleva dos marcas: el <b>Estado</b> y la <b>Info</b>. Sirven para saber de un vistazo cómo va cada cliente.', shot2(mEstados()), ['Pulsa el icono de la fila y elige uno de la lista.', '<span data-voz="El icono de pausa marca una línea en pausa, y la equis roja marca una baja."><b>⏸️</b> marca una línea en pausa y <b>❌</b> una baja.</span>', '<span data-voz="La marca de la calavera significa que el cliente tiene scoring en esa compañía, es decir, que no lo aceptan como cliente. Pinta la fila entera de rojo claro.">La marca <b>💀</b> significa que el cliente tiene <b>scoring</b> en esa compañía (no lo aceptan como cliente) y pinta la fila entera de rojo claro.</span>', '<span data-voz="La marca del bicho significa que el cliente tiene deudas en esa compañía. Si las paga, puede que lo vuelvan a aceptar como cliente.">La marca <b>🪳</b> significa que el cliente tiene <b>deudas</b> en esa compañía; si las paga, puede que lo acepten de nuevo como cliente.</span>', 'Después puedes filtrar la tabla por cualquier icono (capítulo anterior).'], 'Usad las marcas con un criterio común en todo el equipo, para que todos lean la tabla igual.')
  ]; });
  chapter('pc', '🗒️', 'Borradores', function(n, c){ return [
    pg(n, c, 'Borradores', 'Un borrador es un contrato a medias: guardado, pero todavía sin tramitar.', shot2(mBorradores()), ['<b>➕ Nuevo</b> abre el formulario de alta.', '<span data-voz="El botón de editar te deja completar los datos que falten."><b>✏️</b> te deja completar los datos que falten.</span>', 'Cuando está listo, <b>✅ Tramitar</b> lo convierte en contrato: pasa a la lista de Contratos con la fecha de solicitud de hoy.', '<span data-voz="El botón de eliminar borra el borrador."><b>🗑️</b> elimina el borrador.</span>', '<span data-voz="Para cambiar la prioridad, arrastra una fila por el asa de puntitos de su izquierda y suéltala donde quieras: así decides qué borradores se tramitan primero."><b>Cambiar la prioridad:</b> arrastra una fila por el asa <b>⠿</b> de su izquierda y suéltala donde quieras. Así decides qué borradores se tramitan primero.</span>', 'El círculo rojo del menú cuenta cuántos tienes pendientes.'], '<b>🔄 Actualizar</b> trae los borradores más recientes, por si tu equipo ha añadido alguno.')
  ]; });
  chapter('pc', '💳', 'Tarjetas', function(n, c){ return [
    pg(n, c, 'Datos de tarjetas y cuentas', 'Guarda tus tarjetas y cuentas bancarias en un único sitio, protegidas con PIN.', shot2(mTarjetas()), ['<b>➕ Nueva tarjeta</b>: nombre, banco, número, fecha de caducidad y CVV.', '<b>➕ Nueva cuenta</b>: nombre, titular e IBAN.', 'Elige el <b>color</b> de cada tarjeta para reconocerla rápido.', '<b>🔑 Cambiar PIN</b>: te pide el PIN actual y después el nuevo, dos veces.'], 'Mantén el PIN en secreto: es lo que protege los datos de tus tarjetas. Cada tarjeta tiene también su botón 🗑️ Eliminar.')
  ]; });
  chapter('pc', '📖', 'Notas', function(n, c){ return [
    pg(n, c, 'Notas con etiquetas', 'Un tablón para lo que no quieres olvidar, ordenado por colores.', shot2(mNotas()), ['<b>➕ Nueva nota</b> crea una nota y le asignas una etiqueta.', 'Las etiquetas son <b>URGENTE</b>, <b>NOTAS</b>, <b>INFORMACION</b> y <b>COMISIONES</b>, cada una con su color.', 'Los círculos del menú cuentan cuántas notas tiene cada etiqueta.', '<b>🏷️ Editar etiqueta</b> te deja cambiarle el nombre.'], null)
  ]; });
  chapter('pc', '🗓️', 'Agenda', function(n, c){ return [
    pg(n, c, 'La agenda', 'Un calendario para tus citas y recordatorios.', shot2(mAgenda()), ['Cambia de mes con <b>‹ Anterior</b> y <b>Siguiente ›</b>, y vuelve al día actual con <b>Hoy</b>.', 'Alterna entre la vista <b>Mes</b> y la vista <b>Día</b>.', '<b>➕ Nuevo evento</b> abre el formulario.', 'Ponle <b>título</b>, hora (opcional), <b>color</b> y descripción, y pulsa <b>💾 Guardar</b>.', 'El número del botón AGENDA te dice cuántos eventos tienes hoy.'], '<span data-voz="Pulsa un evento para editarlo: puedes cambiarle la fecha o borrarlo con el botón eliminar.">Pulsa un evento para editarlo: puedes cambiarle la fecha con 📅 o borrarlo con 🗑️ Eliminar.</span>')
  ]; });
  chapter('pc', '💬', 'Chat en vivo', function(n, c){ return [
    pg(n, c, 'Chat en vivo', 'Habla con tu equipo sin salir del panel.', shot2(mChat()), ['Pulsa la barra verde <b>Chat en vivo</b> y se abre en grande; vuelve a pulsarla para cerrarlo.', 'Escribe tu <b>nombre</b> para que los demás sepan quién eres.', 'Escribe tu mensaje y pulsa <b>enviar</b>: les llega al momento.', 'También puedes enviar <b>imágenes</b> que tengas copiadas en memoria: por ejemplo, haz una captura de pantalla, pégala en el chat y envíala.'], 'Las imágenes se pueden enviar tanto por el Chat en vivo como por el chat de Lucas.')
  ]; });
  chapter('pc', '🤖', 'Asistente Lucas', function(n, c){ return [
    pg(n, c, 'Lucas, tu asistente', 'Lucas entiende frases normales: no tienes que aprender comandos.', shot2(mLucas()), ['Pulsa a <b>Lucas</b> en la franja negra de abajo para abrir su chat; pulsa su cara para cerrarlo.', 'Escribe en la <b>caja de texto</b> lo que necesitas: «sácame los contratos de enero» filtra la tabla al instante. También puedes <b>pasarle imágenes</b> (por ejemplo, una captura de pantalla que hayas copiado: pégala y envíala) y pedirle <b>gráficas</b> y estadísticas (púlsalas para verlas en grande).', 'Arriba ves tu <b>saldo</b>. Algunas peticiones gastan crédito y otras no; las que lo gastan cuestan <b>menos de 2 céntimos</b> cada una.', 'El <b>altavoz</b> activa o silencia su voz.', '<span data-voz="El botón de dormir, que aparece con el chat cerrado, lo duerme.">El botón <b>Zzz</b> (con el chat cerrado) lo duerme.</span>'], 'Lo que Lucas puede hacer depende de lo que tenga activado tu panel.')
  ]; });
  chapter('pc', '⚡', 'Trucos y atajos', function(n, c){ return [
    pg(n, c, 'Trucos y atajos', 'Pequeños detalles que te ahorran tiempo.', cards([['🔄','Actualizar','Trae los datos más recientes sin recargar toda la página.'],['🚪','SALIR','Cierra tu sesión. Si no lo haces, se cierra sola a las 00:00.'],['🏷️','Versión','Justo encima de Actualizar y SALIR, en pequeño, ves la versión publicada con su fecha y hora.'],['🖼️','Logo','Triple clic sobre el logo para cambiarlo por el tuyo (PNG con fondo transparente, 1000 × 400).'],['🔎','Filtros rápidos','Combina buscador, iconos, compañías y fechas para llegar a un contrato en segundos.'],['📱','Móvil','La web también funciona en el móvil: los últimos capítulos te lo explican.'],['📖','Tutorial','Vuelve cuando quieras desde el botón TUTORIAL del menú.']]), null, null)
  ]; });
  chapter('mv', '📱', 'Formato móvil: la lista', function(n, c){ return [
    pg(n, c, 'La lista en el móvil', 'En el móvil la web se adapta sola: pantalla en vertical, pensada para consultar y llamar.', phones(phLista()), ['Cambia entre <b>📝 Borradores</b> y <b>📄 Contratos</b> con las pestañas.', 'El <b>buscador</b> filtra por nombre, documento o teléfono.', 'Cada <b>tarjeta</b> resume un cliente. Púlsala para abrir su ficha.', 'Si le pides un filtro a Lucas, arriba aparece <b>🤖 Filtro de Lucas</b> con un botón ✕ Quitar.'], 'La barra de color a la izquierda de cada tarjeta es la de su compañía.', true)
  ]; });
  chapter('mv', '🪪', 'La ficha del cliente', function(n, c){ return [
    pg(n, c, 'La ficha del cliente', 'Todos los datos de un cliente, a un toque de distancia.', phones(phFicha()), ['Arriba ves el <b>nombre</b> y la compañía.', 'Debajo, los datos: documento, teléfono, fecha de solicitud, líneas, fibra…', 'La barra inferior tiene <b>Llamar</b>, <b>Copiar doc.</b> y <b>Copiar cuenta</b>.', 'Mantén pulsado 2 segundos uno de esos botones y la lista se filtra por ese dato.', '<b>✏️ Editar datos</b> abre la edición.'], null, true)
  ]; });
  chapter('mv', '📄', 'Documentos (DNI)', function(n, c){ return [
    pg(n, c, 'El documento del cliente', 'Guarda las fotos del DNI en la propia ficha.', phones(phDoc()), ['En la ficha, la sección <b>🪪 Documento</b> guarda las dos caras.', '<b>⬆️ Subir</b> (o <b>⬆️ Cambiar</b> si ya existe) sube la foto de esa cara.', '<b>👁 Ver</b> la abre en grande.', '<b>⬇️ Descargar</b> la guarda en tu móvil.', 'Si el archivo es un PDF, la ficha lo indica como PDF.'], null, true)
  ]; });
  chapter('mv', '✏️', 'Editar desde el móvil', function(n, c){ return [
    pg(n, c, 'Editar desde el móvil', 'Corrige un dato sin sacar el ordenador.', phones(phEdit()), ['Cambia los <b>campos</b> que necesites tocándolos.', '<b>➕ Más datos</b> muestra el resto de la ficha.', '<b>Cancelar</b> sale sin guardar y <b>💾 Guardar</b> aplica los cambios.', 'Algunos campos solo se ven en el formato de ordenador.'], null, true)
  ]; });
  chapter('mv', '☰', 'Menú, Lucas y orientación', function(n, c){ return [
    pg(n, c, 'Menú y orientación', 'Lo que hace falta saber para moverte por la web móvil.', phones(phMenu(), gira()), ['<span data-voz="El botón de las tres rayas abre el menú.">El botón <b>☰</b> abre el menú.</span>', '<b>🖥️ Cambiar a formato normal</b> muestra la web completa del ordenador.', '<b>⟳ Actualizar datos</b> trae lo último.', '<b>⏻ Cerrar sesión</b> sale del panel.', 'La web móvil solo funciona en <b>vertical</b>: si giras el móvil verás el aviso «Gira el móvil».'], 'Lucas también se asoma abajo en el móvil: lo que le pidas filtra la lista.', true)
  ]; });
  chapter('fin', '💚', '¿Necesitas ayuda?', function(n, c){ return [
    '<div class="tt-in"><div class="tt-cap"><span>' + n + '</span>AYUDA</div><h2>¿Necesitas ayuda?</h2><p class="tt-lead">Si algo no te queda claro o quieres proponer una mejora, escríbenos. Estaremos encantados de ayudarte.</p><div style="text-align:center;margin-top:30px"><div style="font-size:70px">💬</div><a class="tt-wa" href="https://wa.me/34633200100" target="_blank" rel="noopener">WhatsApp · 633 200 100</a></div><div class="tt-tip"><i>💡</i><span>Cuando haya novedades en el panel, este tutorial se actualizará: fíjate en la edición de la portada.</span></div></div><div class="tt-pn">@@</div>'
  ]; });
  if ((P.length + 1) % 2) P.push('<div class="tt-in"><div class="tt-cap"><span>✍️</span>TUS APUNTES</div><h2>Notas</h2><div class="tt-lines"></div></div><div class="tt-pn">@@</div>');
  P.push(backHtml());
  P[2] = indexHtml();
}
function shot2(h){ return h; }
function mContratos(){
  var m = '<div class="m-card"><div class="m-h">📒 CONTRATOS ' + H(1, 'm-btn p', '➕ NUEVO CONTRATO ▾', 'span') + ' <span class="m-btn">🔄 Actualizar</span></div>' + tbl({ n: 6, sol: 2, cia: 0, est: 2, estN: 4 }) + H(5, 'm-pg', '<span>Mostrando 1–6 de 128 · 500 por página</span><span>◀ ANTERIOR  PÁGINA 1  SIGUIENTE ▶</span>') + '</div>';
  return shot(app(m, 'con') + cur(500, 30, 292, 40), 330);
}

var root = null, stage, wrap, book, lbl, leaves = [], pageEls = {}, S = 0, L = 0, mode = 'sp', sound = true, busy = false, pending = null, timers = [], AC = null, keyH = null, resH = null, rt = null, prevOv = '', px = 0;
function later(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; }
function NP(){ return P.length; }
function calcMode(){ return (innerWidth >= 980 && innerWidth / innerHeight >= 1.1) ? 'sp' : 'sg'; }
function maxS(){ return mode === 'sp' ? L : L - 1; }
function snd(soft){
  if (!sound) return;
  try{
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    var t = AC.currentTime, len = Math.floor(AC.sampleRate * 0.5), b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0), y = 0, y2 = 0;
    for (var i = 0; i < len; i++){
      var w = Math.random() * 2 - 1;
      y = y * 0.9 + w * 0.1; y2 = y2 * 0.9 + y * 0.1;
      d[i] = y2 * Math.sin(Math.PI * Math.pow(i / len, 0.6)) * 9;
    }
    var s = AC.createBufferSource(); s.buffer = b;
    var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1500, t); lp.frequency.exponentialRampToValueAtTime(520, t + 0.45); lp.Q.value = 0.3;
    var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 140;
    var g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(soft ? 0.05 : 0.09, t + 0.07); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    s.connect(lp); lp.connect(hp); hp.connect(g); g.connect(AC.destination); s.start(t);
  }catch(e){}
}

var NAR = { btn: null, tok: 0, tried: 0 };
var DIC = [[/Google Authenticator/g, 'Google Autentiqueitor'], [/PAGA EL SI/g, 'paga el ese i'], [/\bNFC\b/g, 'ene efe ce'], [/\bPIN\b/g, 'pin'], [/\bDNI\b/g, 'de ene i'], [/\bNIE\b/g, 'ene i e'], [/\bIBAN\b/g, 'ibán'], [/\bCVV\b/g, 'ce uve uve'], [/\bPDF\b/g, 'pe de efe'], [/\bPNG\b/g, 'pe ene ge'], [/\bVIP\b/g, 'vip'], [/WhatsApp/g, 'guasap'], [/\bZzz\b/g, 'dormir'], [/\bcls\b/gi, 'ce ele ese'], [/\bEsc\b/g, 'escape'], [/\b00:00\b/g, 'doce de la noche'], [/633 200 100/g, 'seis, tres, tres, dos, cero, cero, uno, cero, cero'], [/1000 × 400/g, 'mil por cuatrocientos píxeles'], [/€/g, ' euros'], [/\bX\b/g, 'equis']];
function narText(page){
  var inn = page.querySelector('.tt-in'); if (!inn) return '';
  var c = inn.cloneNode(true);
  [].forEach.call(c.querySelectorAll('.tt-shot,.ph,.tt-gira,ttb,.tt-nar,.tt-pn,.tt-lines,.tt-how em,.tt-card .ic,.tt-tip i,.tt-wa i'), function(x){ x.remove(); });
  [].forEach.call(c.querySelectorAll('.tt-cap span'), function(x){ x.remove(); });
  [].forEach.call(c.querySelectorAll('.tt-cap'), function(x){ x.textContent = x.textContent.toLowerCase(); });
  [].forEach.call(c.querySelectorAll('.tt-n'), function(x){ x.textContent = 'Paso ' + x.textContent + '. '; });
  [].forEach.call(c.querySelectorAll('.tt-tip'), function(x){ x.insertBefore(D.createTextNode('Consejo: '), x.firstChild); });
  [].forEach.call(c.querySelectorAll('.tt-ix'), function(x){ var i = x.querySelector('i'), sp = x.querySelector('span'), em = x.querySelector('em'); var n = i ? i.textContent : ''; x.textContent = (n && n !== '?' ? 'Capítulo ' + n + ': ' : '') + (sp ? sp.textContent : '') + ', página ' + (em ? em.textContent : '') + '. '; });
  [].forEach.call(c.querySelectorAll('[data-voz]'), function(x){ x.textContent = x.getAttribute('data-voz'); });
  [].forEach.call(c.querySelectorAll('.tt-card b'), function(x){ x.appendChild(D.createTextNode(': ')); });
  ['h2', 'p', 'li', '.tt-card', '.tt-how div', '.tt-tip', '.tt-note', '.tt-cap', '.tt-ixg', '.tt-wa'].forEach(function(sel){ [].forEach.call(c.querySelectorAll(sel), function(x){ x.appendChild(D.createTextNode('. ')); }); });
  var t = c.textContent.replace(/\s+/g, ' ');
  DIC.forEach(function(d){ t = t.replace(d[0], d[1]); });
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2460}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2039}\u{203A}\u{27F0}-\u{27FF}]/gu, ' ');
  t = t.replace(/[A-ZÁÉÍÓÚÑ]{2,}/g, function(m){ return m.toLowerCase(); });
  t = t.replace(/·/g, ',').replace(/\s+([.,:;])/g, '$1').replace(/([.:;,])(\s*[.:;,])+/g, '$1').replace(/\s+/g, ' ').trim();
  return t;
}
function narChunks(t){
  var m = t.match(/[^.!?]+[.!?]*/g) || [t], out = [], cur = '';
  m.forEach(function(x){ x = x.trim(); if (!x) return; if ((cur + ' ' + x).length < 170) cur = (cur ? cur + ' ' : '') + x; else { if (cur) out.push(cur); cur = x; } });
  if (cur) out.push(cur);
  return out;
}
function narVoice(){
  var vs = (window.speechSynthesis.getVoices() || []).filter(function(v){ return /^es/i.test(v.lang); });
  var MALE = /jorge|pablo|diego|carlos|enrique|raul|raúl|alvaro|álvaro|juan|miguel|andres|andrés|antonio|jaime|ricardo|tomas|tomás|pedro|manuel|male|hombre/i;
  var FEM = /helena|laura|elvira|sabina|paulina|monica|mónica|lucia|lucía|paloma|esperanza|marisol|camila|sofia|sofía|maria|maría|female|mujer|dalia|ximena|elena|alba/i;
  var m = vs.filter(function(v){ return MALE.test(v.name) && !FEM.test(v.name); });
  m.sort(function(a, b){ return (/natural|online/i.test(b.name) ? 1 : 0) - (/natural|online/i.test(a.name) ? 1 : 0) || (/es-ES/i.test(b.lang) ? 1 : 0) - (/es-ES/i.test(a.lang) ? 1 : 0); });
  if (m.length) return { voice: m[0], pitch: 0.9 };
  var f = vs.filter(function(v){ return !FEM.test(v.name); });
  f.sort(function(a, b){ return (/es-ES/i.test(b.lang) ? 1 : 0) - (/es-ES/i.test(a.lang) ? 1 : 0); });
  return { voice: f[0] || vs[0] || null, pitch: 0.55 };
}
function narStop(){
  NAR.tok++;
  try{ if (window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
  if (NAR.btn){ NAR.btn.classList.remove('on'); NAR.btn.textContent = '🔊 Escuchar'; NAR.btn = null; }
}
function narPlay(btn){
  if (!window.speechSynthesis){ btn.textContent = 'Sin voz en este navegador'; return; }
  var same = (NAR.btn === btn); narStop(); if (same) return;
  if (!(window.speechSynthesis.getVoices() || []).length && NAR.tried < 1){ NAR.tried++; try{ window.speechSynthesis.getVoices(); }catch(e){} later(function(){ narPlay(btn); }, 500); return; }
  NAR.tried = 0;
  var txt = narText(btn.closest('.tt-pg')); if (!txt) return;
  var parts = narChunks(txt), tok = ++NAR.tok, v = narVoice(), i = 0;
  NAR.btn = btn; btn.classList.add('on'); btn.textContent = '⏹ Detener';
  var nx = function(){
    if (tok !== NAR.tok) return;
    if (i >= parts.length){ narStop(); return; }
    var u = new SpeechSynthesisUtterance(parts[i++]); u.lang = 'es-ES'; if (v.voice) u.voice = v.voice; u.pitch = v.pitch; u.rate = 0.97; u.volume = 1;
    u.onend = nx; u.onerror = function(){ if (tok === NAR.tok) narStop(); };
    window.speechSynthesis.speak(u);
  };
  setTimeout(nx, 80);
}
function mkPage(i, cls){
  var d = D.createElement('div'), hard = (i === 0 || i === NP() - 1);
  d.className = 'tt-face tt-pg ' + cls + (hard ? ' tt-hard' : '');
  d.innerHTML = P[i].replace('@@', i) + '<div class="tt-shade"></div>';
  if (!hard && P[i].indexOf('tt-in') >= 0 && P[i].indexOf('tt-lines') < 0){ var nb = D.createElement('button'); nb.className = 'tt-nar'; nb.type = 'button'; nb.setAttribute('data-nar', '1'); nb.textContent = '🔊 Escuchar'; d.appendChild(nb); }
  pageEls[i] = d; return d;
}
function mkLeaf(){ var d = D.createElement('div'); d.className = 'tt-leaf'; return d; }
function zFix(j){ leaves[j].style.zIndex = leaves[j].classList.contains('fl') ? j : (L - j); }
function curPage(){ if (mode === 'sp') return S === 0 ? 0 : (S >= L ? NP() - 1 : 2 * S); return S; }
function pageToS(p){ return mode === 'sp' ? Math.ceil(p / 2) : p; }
function fit(){
  var bw = mode === 'sp' ? 2 * PW : PW, sc = Math.min(innerWidth * 0.97 / bw, (innerHeight - 90) / PH, 1.3);
  wrap.style.width = bw + 'px'; wrap.style.height = PH + 'px'; book.style.width = bw + 'px'; book.style.height = PH + 'px';
  wrap.style.transform = 'scale(' + sc + ')';
}
function shift(){ var x = 0; if (mode === 'sp'){ if (S === 0) x = -PW / 2; else if (S >= L) x = PW / 2; } book.style.transform = 'translateX(' + x + 'px)'; }
function visOff(){ for (var k in pageEls) pageEls[k].classList.remove('vis'); }
function markVis(){
  visOff(); var v = [];
  if (mode === 'sp'){ if (S > 0) v.push(2 * S - 1); if (S < L) v.push(2 * S); } else v.push(S);
  v.forEach(function(i){ if (pageEls[i]) pageEls[i].classList.add('vis'); });
}
function label(){
  var n = NP(), t;
  if (mode === 'sp') t = S === 0 ? 'Portada' : (S >= L ? 'Contraportada' : 'Páginas ' + (2 * S - 1) + ' – ' + (2 * S) + '  ·  ' + (n - 2));
  else t = S === 0 ? 'Portada' : (S >= n - 1 ? 'Contraportada' : 'Página ' + S + ' de ' + (n - 2));
  lbl.textContent = t;
  root.querySelector('[data-a=prev]').disabled = (S <= 0);
  root.querySelector('[data-a=next]').disabled = (S >= maxS());
}
function render(){
  var n = NP(), j, lf;
  mode = calcMode();
  book.className = 'tt-book ' + mode; book.innerHTML = ''; leaves = []; pageEls = {};
  if (mode === 'sp'){
    L = n / 2;
    for (j = 0; j < L; j++){ lf = mkLeaf(); lf.appendChild(mkPage(2 * j, 'R')); lf.appendChild(mkPage(2 * j + 1, 'L tt-back')); book.appendChild(lf); leaves.push(lf); }
  } else {
    L = n;
    for (j = 0; j < n; j++){ lf = mkLeaf(); lf.appendChild(mkPage(j, 'R')); var bk = D.createElement('div'); bk.className = 'tt-face tt-back tt-pg R'; lf.appendChild(bk); book.appendChild(lf); leaves.push(lf); }
  }
  if (S > maxS()) S = maxS();
  leaves.forEach(function(l2, k){ if (k < S) l2.classList.add('fl'); zFix(k); });
  fit(); book.style.transition = 'none'; shift(); void book.offsetWidth; book.style.transition = '';
  markVis(); label();
}
function flip(j, fw, dur, quiet){
  var lf = leaves[j]; lf.style.zIndex = 1000 + j; lf.classList.remove('go'); void lf.offsetWidth; lf.classList.add('go'); lf.classList.toggle('fl', fw); if (!quiet) snd(dur < 0.9);
  later(function(){ lf.classList.remove('go'); zFix(j); }, dur * 1000 + 20);
}
function go(t){
  t = Math.max(0, Math.min(maxS(), t));
  if (busy){ pending = t; return; }
  if (t === S) return;
  busy = true;
  narStop(); var dir = t > S ? 1 : -1, n = Math.abs(t - S), stag = n > 1 ? 85 : 0, dur = n > 1 ? 0.62 : 0.95, seq = [], k;
  book.style.setProperty('--d', dur + 's');
  if (dir > 0){ for (k = S; k < t; k++) seq.push(k); } else { for (k = S - 1; k >= t; k--) seq.push(k); }
  visOff();
  seq.forEach(function(j, idx){ later(function(){ flip(j, dir > 0, dur, n > 1 && idx % 2 === 1); }, idx * stag); });
  S = t; shift(); label();
  later(function(){ busy = false; markVis(); if (pending !== null){ var p = pending; pending = null; go(p); } }, (n - 1) * stag + dur * 1000 + 90);
}
function goPage(p){ go(pageToS(p)); }
function next(){ go((pending !== null ? pending : S) + 1); }
function prev(){ go((pending !== null ? pending : S) - 1); }
function close(){
  if (!root) return;
  narStop(); var r = root; root = null;
  r.classList.remove('on');
  document.removeEventListener('keydown', keyH, true); window.removeEventListener('resize', resH);
  timers.forEach(clearTimeout); timers = [];
  D.documentElement.style.overflow = prevOv;
  setTimeout(function(){ try{ r.remove(); }catch(e){} }, 520);
  try{ window.PFTutorial.abierto = false; }catch(e){}
}
function open(pagina){
  if (root) return;
  if (!D.getElementById('pftutCss')){ var st = D.createElement('style'); st.id = 'pftutCss'; st.textContent = CSS; D.head.appendChild(st); }
  addAll(); S = 0; busy = false; pending = null;
  root = D.createElement('div'); root.id = 'pftut';
  root.innerHTML = '<div class="tt-sky"></div><div class="tt-aur"></div><div class="tt-stage"><div class="tt-scale"><div class="tt-book"></div></div></div><div class="tt-bar"><button class="tt-bt" data-a="prev">◀</button><button class="tt-bt" data-a="idx">📑 Índice</button><div class="tt-lbl"></div><button class="tt-bt" data-a="next">▶</button></div><button class="tt-bt tt-x" data-a="x">✕</button>';
  stage = root.querySelector('.tt-stage'); wrap = root.querySelector('.tt-scale'); book = root.querySelector('.tt-book'); lbl = root.querySelector('.tt-lbl');
  prevOv = D.documentElement.style.overflow; D.documentElement.style.overflow = 'hidden';
  D.body.appendChild(root);
  render();
  root.addEventListener('click', function(e){
    var a = e.target.closest('[data-go]');
    if (a){ e.preventDefault(); goPage(+a.getAttribute('data-go')); return; }
    var nbn = e.target.closest('[data-nar]'); if (nbn){ narPlay(nbn); return; }
    var b = e.target.closest('[data-a]'); if (!b) return;
    var k = b.getAttribute('data-a');
    if (k === 'prev') prev(); else if (k === 'next') next(); else if (k === 'idx') goPage(2); else if (k === 'x') close();
    else if (k === 'snd'){ sound = !sound; b.textContent = sound ? '🔊' : '🔇'; }
  });
  stage.addEventListener('pointerdown', function(e){ px = e.clientX; });
  stage.addEventListener('pointerup', function(e){
    if (e.target.closest('a,button,[data-go]')) return;
    var dx = e.clientX - px;
    if (Math.abs(dx) > 50){ if (dx < 0) next(); else prev(); return; }
    if (Math.abs(dx) > 12) return;
    var rc = book.getBoundingClientRect(), fx = (e.clientX - rc.left) / rc.width;
    if (mode === 'sp'){
      if (S === 0){ if (fx > 0.55) next(); }
      else if (S >= L){ if (fx < 0.45) prev(); }
      else if (fx < 0.14) prev(); else if (fx > 0.86) next();
    } else { if (fx < 0.18) prev(); else if (fx > 0.82) next(); }
  });
  keyH = function(e){
    var k = e.key, h = true;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') next();
    else if (k === 'ArrowLeft' || k === 'PageUp') prev();
    else if (k === 'Home') go(0); else if (k === 'End') go(maxS());
    else if (k === 'Escape') close();
    else if (k === 'i' || k === 'I') goPage(2);
    else h = false;
    if (h){ e.preventDefault(); e.stopPropagation(); }
  };
  document.addEventListener('keydown', keyH, true);
  resH = function(){ clearTimeout(rt); rt = setTimeout(function(){ if (!root) return; var p = curPage(), m = calcMode(); if (m !== mode){ mode = m; S = pageToS(p); render(); } else fit(); }, 150); };
  window.addEventListener('resize', resH);
  requestAnimationFrame(function(){ root.classList.add('on'); });
  if (pagina) later(function(){ goPage(pagina); }, 700);
  window.PFTutorial.abierto = true;
}
window.PFTutorial = { abrir: open, cerrar: close, edicion: EDICION, fecha: FECHA, abierto: false, paginas: function(){ return P.length; } };
})();
