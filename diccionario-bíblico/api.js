/*!
 * Diccionario b\u00edblico \u2014 cliente para webs externas
 * https://javierscervera-rgb.github.io/Herramientas/diccionario-biblico.html
 *
 * Uso:
 *   <script src="https://javierscervera-rgb.github.io/Herramientas/diccionario-biblico/api.js"></script>
 *   <script>
 *     DiccionarioBiblico.voz('Aar\u00f3n').then(v => {
 *       if (v) console.log(v.titulo, v.contenido);
 *     });
 *   </script>
 *
 * M\u00e9todos (todos devuelven una Promise):
 *   voz(termino)        \u2192 { id, titulo, letra, contenido, remite_a, url, acepciones } o null
 *   buscar(texto, max)  \u2192 [{ id, titulo, letra }]   (coincidencias en el t\u00e9rmino)
 *   indice()            \u2192 [{ id, titulo, letra }]   (todas las voces)
 */
(function (root) {
  'use strict';
  var BASE = 'https://javierscervera-rgb.github.io/Herramientas/';
  var DATA = BASE + 'diccionario-biblico/';
  var PAGE = BASE + 'diccionario-biblico.html';

  var cacheIndice = null, cacheLetras = {};

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function slug(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Diccionario b\u00edblico: no se pudo cargar ' + url + ' (' + r.status + ')');
      return r.json();
    });
  }
  function indice() {
    if (!cacheIndice) cacheIndice = getJSON(DATA + 'indice.json');
    return cacheIndice;
  }
  function letra(l) {
    l = l.toLowerCase();
    if (!cacheLetras[l]) cacheLetras[l] = getJSON(DATA + 'letras/' + l + '.json');
    return cacheLetras[l];
  }

  // Devuelve la voz que mejor coincide con el t\u00e9rmino (exacta con tildes, despu\u00e9s sin tildes).
  // Si hay varias voces con el mismo nombre (p. ej. "Babilonia"), la primera va en el objeto
  // y todas aparecen en "acepciones".
  function voz(termino) {
    var t = String(termino || '').trim().toUpperCase();
    var nt = norm(termino);
    if (!nt) return Promise.resolve(null);
    return indice().then(function (idx) {
      var s = slug(termino);
      var candidatas = idx.filter(function (e) { return e.titulo === t; });
      if (!candidatas.length) candidatas = idx.filter(function (e) { return e.id === s; });
      if (!candidatas.length) candidatas = idx.filter(function (e) { return norm(e.titulo) === nt; });
      if (!candidatas.length) return null;
      var titulo = candidatas[0].titulo;
      var mismas = candidatas.filter(function (e) { return e.titulo === titulo; });
      return letra(mismas[0].letra).then(function (lista) {
        var ids = mismas.map(function (e) { return e.id; });
        var acepciones = lista.filter(function (e) { return ids.indexOf(e.id) !== -1; })
          .map(function (e) { return completar(e); });
        if (!acepciones.length) return null;
        var v = Object.assign({}, acepciones[0]);
        v.acepciones = acepciones;
        return v;
      });
    });
  }
  function completar(e) {
    return {
      id: e.id,
      titulo: e.titulo,
      letra: e.letra,
      contenido: e.contenido,
      remite_a: e.remite_a || [],
      url: PAGE + '?voz=' + encodeURIComponent(e.titulo)
    };
  }
  function buscar(texto, max) {
    var nq = norm(texto);
    max = max || 20;
    return indice().then(function (idx) {
      if (!nq) return [];
      var empieza = [], contiene = [];
      idx.forEach(function (e) {
        var n = norm(e.titulo);
        if (n.indexOf(nq) === 0) empieza.push(e);
        else if (n.indexOf(nq) !== -1) contiene.push(e);
      });
      return empieza.concat(contiene).slice(0, max);
    });
  }

  root.DiccionarioBiblico = { voz: voz, buscar: buscar, indice: indice, url: PAGE };
})(typeof window !== 'undefined' ? window : this);
