# Diccionario bíblico — acceso desde otras webs

Base: `https://javierscervera-rgb.github.io/Herramientas/`

## 1. Con el script (lo más cómodo)

```html
<script src="https://javierscervera-rgb.github.io/Herramientas/diccionario-biblico/api.js"></script>
<script>
  DiccionarioBiblico.voz('Aarón').then(v => {
    if (!v) return console.log('No existe esa voz');
    console.log(v.titulo);     // "AARÓN"
    console.log(v.contenido);  // texto completo
  });
</script>
```

La búsqueda no distingue mayúsculas ni tildes ("aaron" también funciona).

`voz()` devuelve:

| Campo        | Contenido                                                           |
|--------------|---------------------------------------------------------------------|
| `titulo`     | Nombre de la voz, en mayúsculas                                     |
| `contenido`  | Texto completo                                                      |
| `letra`      | Letra del índice                                                    |
| `id`         | Identificador (p. ej. `reino-de-dios`)                              |
| `remite_a`   | Si la voz solo remite a otra ("Ver. HERODES"), la lista de destinos |
| `url`        | Enlace a la voz en el diccionario                                   |
| `acepciones` | Todas las voces con ese mismo nombre (p. ej. BABILONIA tiene 2)     |

Otros métodos:

- `DiccionarioBiblico.buscar('jeru', 10)` → voces cuyo término contiene ese texto.
- `DiccionarioBiblico.indice()` → lista completa `{ id, titulo, letra }`.

## 2. Con fetch directo (sin script)

- Índice: `diccionario-biblico/indice.json` → `[{ id, titulo, letra }]`
- Voces de una letra: `diccionario-biblico/letras/a.json` → `[{ id, titulo, letra, contenido, remite_a? }]`

Busca la voz en el índice, carga el archivo de su letra y localízala por `id`.
GitHub Pages permite estas peticiones desde cualquier dominio (CORS abierto).

## 3. Enlazar o incrustar una voz

- Abrir una voz: `diccionario-biblico.html?voz=AARÓN` (también vale `#AARÓN`).
- Solo la ficha, sin cabecera ni lista, para un `<iframe>`:

```html
<iframe src="https://javierscervera-rgb.github.io/Herramientas/diccionario-biblico.html?voz=Moisés&embed=1"
        style="width:100%;height:600px;border:0"></iframe>
```
