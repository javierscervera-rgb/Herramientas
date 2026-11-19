/* ============================================================
   Modo día / noche común a HerramientaSacerdotal y Certificados.
   La elección se guarda en una cookie de todo el dominio
   herramientasacerdotal.es (y en este navegador), así que vale
   igual en los dos portales. Por defecto: noche.
   Uso: <html> recibe data-tema="claro" | "oscuro";
        HSTema.cambiar() alterna; evento «hs-tema» al cambiar.
   ============================================================ */
(function () {
  var K = 'hs-tema';
  function leer() {
    var m = document.cookie.match(/(?:^|;\s*)hs-tema=(claro|oscuro)/);
    if (m) return m[1];
    try { var v = localStorage.getItem(K); if (v === 'claro' || v === 'oscuro') return v; } catch (e) {}
    return null;
  }
  function aplicar(t) {
    var r = document.documentElement;
    r.setAttribute('data-tema', t);
    r.style.colorScheme = t === 'claro' ? 'light' : 'dark';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'claro' ? '#F6F0E7' : '#171310');
  }
  function guardar(t) {
    var dom = /(^|\.)herramientasacerdotal\.es$/.test(location.hostname) ? '; domain=.herramientasacerdotal.es' : '';
    document.cookie = 'hs-tema=' + t + '; path=/; max-age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '') + dom;
    try { localStorage.setItem(K, t); } catch (e) {}
  }
  function avisar(t) { try { document.dispatchEvent(new CustomEvent('hs-tema', { detail: t })); } catch (e) {} }
  aplicar(leer() || 'oscuro');
  window.HSTema = {
    actual: function () { return document.documentElement.getAttribute('data-tema') || 'oscuro'; },
    poner: function (t) { aplicar(t); guardar(t); avisar(t); return t; },
    cambiar: function () { return this.poner(this.actual() === 'claro' ? 'oscuro' : 'claro'); }
  };
  // Si se cambió en el otro portal (u otra pestaña), se aplica al volver
  function revisar() { var t = leer(); if (t && t !== window.HSTema.actual()) { aplicar(t); avisar(t); } }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) revisar(); });
  window.addEventListener('pageshow', revisar);
  window.addEventListener('storage', function (e) { if (e.key === K) revisar(); });
})();
