/* Catena Aurea · Santo Tomás de Aquino — Evangelio según San Mateo
   Librería de consulta y embebido. Uso desde cualquier página:
     <script type="module" src="https://javierscervera-rgb.github.io/Herramientas/catena/catena.js"></script>
     <catena-fragment ref="5.3-12#2"></catena-fragment>
   o bien:  import { Catena } from '.../catena.js';  await Catena.render(el, '5.3-12');
   Referencias (spec):  "5" capítulo · "5.3-12" sección · "5.3-12#2" comentario 2 · "5.3-12#2-4" comentarios 2 a 4
                        "5.v4" sección que contiene el v. 4 · "5.3-12@Agustín" solo comentarios de ese autor
                        "1.pref" prefacio · "5.3-12#v" solo el texto evangélico */
const BASE = new URL('./', import.meta.url).href;
const cache = {};
const J = (u) => (cache[u] ??= fetch(BASE + u).then(r => { if (!r.ok) throw new Error(u); return r.json(); }));
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const Catena = {
  base: BASE,
  index: () => J('data/index.json'),
  chapter: (n) => J(`data/mt/${String(n).padStart(2, '0')}.json`),
  parse(spec) {
    const m = String(spec).trim().match(/^(\d+)(?:\.([^#@]+))?(?:#([\dv-]+))?(?:@(.+))?$/);
    if (!m) throw new Error('Referencia no válida: ' + spec);
    return { cap: +m[1], sec: m[2], c: m[3], author: m[4] };
  },
  /* Devuelve datos puros: { cap, sections:[{id,ref,label,verse,notes,comments:[{id,n,author,text}]}] } */
  async get(spec) {
    const p = typeof spec === 'string' ? this.parse(spec) : spec;
    const d = await this.chapter(p.cap);
    let secs = d.sections;
    if (p.sec) {
      const v = /^v(\d+)$/.exec(p.sec);
      secs = secs.filter(s => {
        if (!v) return s.ref.split('~')[0] === p.sec || s.ref === p.sec;
        const [a, b = a] = s.ref.split('~')[0].split('-').map(Number);
        return +v[1] >= a && +v[1] <= b;
      });
    }
    secs = secs.map(s => {
      let cs = s.comments.map((c, i) => ({ ...c, n: i + 1, id: `${p.cap}.${s.ref}#${i + 1}` }));
      if (p.author) cs = cs.filter(c => norm(c.author).includes(norm(p.author)));
      if (p.c === 'v') cs = [];
      else if (p.c) { const [a, b = a] = p.c.split('-').map(Number); cs = cs.filter(c => c.n >= a && c.n <= b); }
      return { ...s, id: `${p.cap}.${s.ref}`, comments: cs };
    });
    return { cap: p.cap, spec: p, sections: secs };
  },
  /* Texto plano de un fragmento */
  async text(spec) {
    const d = await this.get(spec);
    return d.sections.map(s => [s.verse, ...s.comments.map(c => `${c.author}\n${c.text.replace(/\[\^\d+\]/g, '')}`)].filter(Boolean).join('\n\n')).join('\n\n');
  },
  /* Búsqueda simple por texto (carga los 28 capítulos) */
  async search(q, max = 50) {
    const out = [], nq = norm(q);
    for (let n = 1; n <= 28 && out.length < max; n++) {
      const d = await this.chapter(n);
      d.sections.forEach(s => s.comments.forEach((c, i) => { if (norm(c.text).includes(nq)) out.push({ id: `${n}.${s.ref}#${i + 1}`, author: c.author, text: c.text }); }));
    }
    return out;
  },
  /* Pinta un fragmento dentro de `el`. opts: {verse, notes, ids, title} */
  async render(el, spec, opts = {}) {
    css();
    const o = { verse: true, notes: true, ids: true, title: false, ...opts };
    el.classList.add('cat-frag');
    let d;
    try { d = await this.get(spec); } catch (e) { el.textContent = 'No se pudo cargar el fragmento: ' + spec; return; }
    el.replaceChildren();
    if (o.title) el.append(h('div', 'cat-h', `Mateo ${d.cap}`));
    for (const s of d.sections) {
      const sec = h('section', 'cat-sec'); sec.id = 's-' + s.id.replace(/[^\w-]/g, '_');
      if (o.verse && s.verse) { const v = h('blockquote', 'cat-verse'); v.append(h('span', 'cat-lab', s.label), rich(s.verse)); sec.append(v); }
      s.comments.forEach(c => {
        const box = h('article', 'cat-c'), top = h('div', 'cat-top');
        top.append(h('span', 'cat-au', c.author));
        if (o.ids) { const b = h('button', 'cat-id', c.id); b.title = 'Copiar código para embeber'; b.onclick = () => { navigator.clipboard?.writeText(`<catena-fragment ref="${c.id}"></catena-fragment>`); b.textContent = 'copiado'; setTimeout(() => b.textContent = c.id, 1200); }; top.append(b); }
        box.append(top); c.text.split('\n\n').forEach(t => { const p = h('p'); p.append(rich(t)); box.append(p); }); sec.append(box);
      });
      if (o.notes && s.notes.length && (s.comments.length || o.verse)) { const n = h('ol', 'cat-notes'); s.notes.forEach(t => n.append(h('li', '', t))); sec.append(n); }
      el.append(sec);
    }
    el.dispatchEvent(new CustomEvent('catena:rendered', { bubbles: true, detail: d }));
    return d;
  }
};
function h(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
function rich(t) { const f = document.createDocumentFragment(); t.split(/\[\^(\d+)\]/).forEach((x, i) => f.append(i % 2 ? h('sup', '', x) : document.createTextNode(x))); return f; }
function css() {
  if (document.getElementById('catena-css')) return;
  const s = h('style'); s.id = 'catena-css';
  s.textContent = `.cat-frag{--cb:var(--bg,#171310);--cc:var(--card,#201D18);--ca:var(--accent,#CD8B75);--cs:var(--salmon,#D88972);--ct:var(--text,#F0E8DC);--cm:var(--muted,#AA9D8F);--cl:var(--border,#37312B);color:var(--ct);font:calc(var(--fs,19px))/1.65 Georgia,'Times New Roman',serif;text-align:left}
.cat-frag *{box-sizing:border-box}.cat-sec{margin:0 0 1.6em}.cat-h{color:var(--cs);font-weight:700;font-size:1.5em;margin-bottom:.6em}
.cat-verse{margin:0 0 1em;padding:.8em 1em;background:var(--cc);border:1px solid var(--cl);border-left:3px solid var(--ca);border-radius:12px;font-style:italic}
.cat-lab{display:block;font:600 .62em/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ca);font-style:normal;margin-bottom:.5em}
.cat-c{margin:0 0 1.1em}.cat-c p{margin:.35em 0}.cat-top{display:flex;justify-content:space-between;gap:.6em;align-items:baseline}
.cat-au{font:600 .68em/1.3 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--cs)}
.cat-id{font:.6em system-ui,sans-serif;color:var(--cm);background:none;border:1px solid var(--cl);border-radius:6px;padding:.1em .5em;cursor:pointer;flex:none}
.cat-frag sup{font:.62em system-ui,sans-serif;color:var(--ca);margin-left:.1em}
.cat-notes{margin:.8em 0 0;padding:.6em 0 0 1.4em;border-top:1px solid var(--cl);color:var(--cm);font:.78em/1.5 system-ui,sans-serif}`;
  document.head.append(s);
}
class CatenaFragment extends HTMLElement {
  connectedCallback() {
    const on = (a) => this.getAttribute(a) !== 'false';
    Catena.render(this, this.getAttribute('ref'), { verse: on('verse'), notes: on('notes'), ids: this.hasAttribute('ids'), title: this.hasAttribute('title') });
  }
}
if (!customElements.get('catena-fragment')) customElements.define('catena-fragment', CatenaFragment);
if (typeof window !== 'undefined') window.Catena = Catena;
