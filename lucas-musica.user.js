// ==UserScript==
// @name         Lucas · Baja la música cuando habla
// @namespace    puntofibra
// @version      1.0
// @description  Cuando Lucas (panel Puntofibra) va a hablar, baja poco a poco YouTube y Spotify y después lo vuelve a subir.
// @author       FuturMovil
// @match        https://puntofibra.github.io/panel/*
// @match        https://puntofibra.github.io/panel
// @match        https://www.youtube.com/*
// @match        https://music.youtube.com/*
// @match        https://open.spotify.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        unsafeWindow
// @downloadURL  https://puntofibra.github.io/panel/lucas-musica.user.js
// @updateURL    https://puntofibra.github.io/panel/lucas-musica.user.js
// ==/UserScript==
(function () {
  'use strict';
  var KEY = 'pf_duck';

  // ---------- 1) EN EL PANEL: recoge el aviso de Lucas y lo pasa a las otras pestañas ----------
  if (location.hostname === 'puntofibra.github.io') {
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (d && (d.pfDuck === 'down' || d.pfDuck === 'up')) GM_setValue(KEY, { s: d.pfDuck, t: Date.now() });
    });
    return;
  }

  // ---------- 2) EN YOUTUBE / SPOTIFY: baja y sube el volumen poco a poco ----------
  var W = unsafeWindow, media = new Set();
  try {   // atrapa también los reproductores que no están en la página (Spotify)
    var P = W.HTMLMediaElement.prototype, op = P.play;
    P.play = function () { try { media.add(this); } catch (e) {} return op.apply(this, arguments); };
  } catch (e) {}
  function players() {
    try { document.querySelectorAll('video,audio').forEach(function (m) { media.add(m); }); } catch (e) {}
    return Array.from(media);
  }

  var FADE_MS = 1500, saved = new Map(), timer = null, ducked = false, safety = null;
  function fadeTo(getTarget, done) {
    clearInterval(timer);
    var list = players(), from = new Map();
    list.forEach(function (m) { from.set(m, m.volume); });
    var t0 = performance.now();
    timer = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / FADE_MS), e = k * k * (3 - 2 * k);   // curva suave
      list.forEach(function (m) {
        var a = from.get(m), b = getTarget(m);
        if (b == null) return;
        try { m.volume = Math.max(0, Math.min(1, a + (b - a) * e)); } catch (x) {}
      });
      if (k >= 1) { clearInterval(timer); if (done) done(); }
    }, 30);
  }
  function down() {
    clearTimeout(safety);
    if (!ducked) { saved = new Map(); players().forEach(function (m) { saved.set(m, m.volume); }); }
    ducked = true;
    fadeTo(function () { return 0; });
    safety = setTimeout(up, 60000);          // por seguridad: si no llega el aviso de subir, sube solo al minuto
  }
  function up() {
    clearTimeout(safety);
    if (!ducked) return;
    ducked = false;
    fadeTo(function (m) { return saved.has(m) ? saved.get(m) : null; });
  }
  GM_addValueChangeListener(KEY, function (name, oldV, v) {
    if (!v || Date.now() - v.t > 20000) return;      // avisos viejos, fuera
    if (v.s === 'down') down(); else if (v.s === 'up') up();
  });
})();
