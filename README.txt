
# MenteXP — Versión Web

Este proyecto incluye:
- Fondo animado **siempre en movimiento** (CSS). Puedes cambiarlo por video: coloca `assets/fondo.mp4` y descomenta el bloque en `index.html`.
- Música suave de fondo: agrega `assets/musica.mp3` si deseas sonido.
- Pantalla de inicio con **logo**, **título**, **mensaje motivador**, **nombre del jugador**, **categoría** y **créditos**.
- Juego con **temporizador de 60s**, **puntaje**, **preguntas aleatorias sin repetición**.
- **Tabla de ganadores** accesible con botón, con **modo local** (sin internet) y **modo global** (usando Google Apps Script).

## Cómo activar ranking global (Google Sheets + Apps Script)

1) Crea una hoja de cálculo en Google Drive con columnas: `timestamp,name,score,category`.
2) Abre **Extensiones → Apps Script** y pega este código mínimo:

```javascript
const SHEET_NAME = 'Hoja 1'; // cambia si tu hoja tiene otro nombre
function doPost(e){
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);
  sh.appendRow([new Date(), data.name, data.score, data.category]);
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}
function doGet(e){
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1).map(r => ({ ts: new Date(r[0]).getTime(), name: String(r[1]), score: Number(r[2]), category: String(r[3]) }));
  rows.sort((a,b)=> b.score - a.score || a.ts - b.ts);
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}
```

3) Pulsa **Deploy → New deployment → Web app**.
   - **Who has access:** *Anyone* (cualquiera con el enlace).
4) Copia la URL del Web App y pégala en `script.js` en la constante `CLOUD_ENDPOINT`.

¡Listo! Ahora el ranking es **global** y en tiempo real.

## Agregar tus 615 preguntas
Actualmente te dejo un banco inicial (≈160 preguntas) para que puedas jugar de inmediato.
Para tus **615 preguntas**, edita `questions.json` y agrega más preguntas respetando este formato:

```json
{
  "matematica": [
    { "id": "m123", "text": "¿Cuánto es 12 + 13?", "options": ["22","25","21","24"], "answer": 1 }
  ],
  "comunicacion": [ ... ],
  "sociales": [ ... ],
  "ciencia": [ ... ],
  "civica": [ ... ],
  "arte": [ ... ]
}
```

- `id`: único por pregunta (puedes usar prefijos m/c/s/t/v/a).
- `text`: enunciado.
- `options`: arreglo de 4 opciones.
- `answer`: **índice (0-3)** de la opción correcta dentro de `options`.

El juego **no repite preguntas** en la misma ronda y selecciona nuevas en cada partida.

## Publicar online (GitHub Pages)
1) Sube toda la carpeta a un repositorio.
2) Activa GitHub Pages (branch `main`, carpeta `/`).
3) El juego quedará disponible con un **link para compartir**.

¡Éxitos en tu presentación!
