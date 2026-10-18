/* verMapa.js — ventana emergente con el mapa de Tierra Santa para la página de la Biblia.
 *
 *   verMapa("Sicar")            -> abre el mapa en ese lugar
 *   verMapa("Jn 4,4-42")        -> abre el mapa en el lugar del que habla ese pasaje
 *   <a href="#" data-mapa="Cafarnaum">Ver mapa</a>
 *   <a href="#" data-mapa="Mc 1,21">Ver mapa</a>
 *
 * Si existe el objeto Biblia, también queda como Biblia.verMapa("…").
 */
(function () {
  var MAPA = 'https://javierscervera-rgb.github.io/Herramientas/mapa-interactivo.html';

  var css = document.createElement('style');
  css.textContent =
    '.vm-fondo{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:12px}' +
    '.vm-caja{position:relative;width:min(960px,100%);height:min(680px,100%);background:#201D18;border:1px solid #37312B;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.6)}' +
    '.vm-caja iframe{width:100%;height:100%;border:0;display:block;background:#171310}' +
    '.vm-cerrar{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;border-radius:50%;border:1px solid #37312B;background:#292420;color:#F0E8DC;font-size:22px;line-height:1;cursor:pointer}' +
    '.vm-cerrar:hover{background:#D88972;color:#171310}';
  document.head.appendChild(css);

  function cerrar() {
    var f = document.querySelector('.vm-fondo');
    if (f) f.remove();
    document.removeEventListener('keydown', alTeclear);
  }
  function alTeclear(e) { if (e.key === 'Escape') cerrar(); }

  function verMapa(texto) {
    cerrar();
    texto = String(texto || '').trim();
    if (!texto) return;
    // Si contiene una cifra se trata como pasaje bíblico; si no, como nombre de lugar
    var param = /\d/.test(texto) ? 'pasaje' : 'lugar';
    var fondo = document.createElement('div');
    fondo.className = 'vm-fondo';
    fondo.innerHTML = '<div class="vm-caja"><button class="vm-cerrar" type="button" aria-label="Cerrar">×</button>' +
      '<iframe title="Mapa" src="' + MAPA + '?' + param + '=' + encodeURIComponent(texto) + '"></iframe></div>';
    fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrar(); });
    fondo.querySelector('.vm-cerrar').onclick = cerrar;
    document.body.appendChild(fondo);
    document.addEventListener('keydown', alTeclear);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-mapa]');
    if (a) { e.preventDefault(); verMapa(a.getAttribute('data-mapa')); }
  });

  window.verMapa = verMapa;
  if (window.Biblia) window.Biblia.verMapa = verMapa;
})();
