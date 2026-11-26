# ¿Dónde y a qué hora chocamos en Medellín?

MVP web del reto **"De los datos abiertos al MVP con IA"** (Cátedra Industria TI · UNAL Medellín).

- **URL pública:** https://incidentes-mde.vercel.app
- **Video (2 min):** _pendiente_
- **Equipo:** _Integrante 1 (Datos) · Integrante 2 (Producto) · Integrante 3 (Front) · Integrante 4 (Back) · Integrante 5 (Pitch y QA)_

## Pregunta

¿En qué comunas se concentran los incidentes viales de Medellín y a qué hora ocurren?

## Fuente, licencia y fecha de corte

| Conjunto | Publicador | Licencia | Fecha de corte |
|---|---|---|---|
| [Incidentes viales](https://medata.app.medellin.gov.co/dataset/1-023-25-000094) (`1-023-25-000094`) | Secretaría de Movilidad · MEData | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode) | Archivo descargado el 25-nov-2026 (servidor: 15-oct-2026). Cubre **2014–2020**. |

> Hallazgo sobre el dato: aunque la ficha declara periodicidad **anual** y el archivo se re-subió en 2026, los registros terminan en **2020**. La última modificación declarada es 01-02-2023.

## Hallazgos (salen de `src/data/agregados.json`)

- **270.759** incidentes entre 2014 y 2020; **1.483** con muertos.
- **La Candelaria** concentra el **19 %** (52.189), casi el doble que la segunda comuna (Laureles Estadio, 27.066).
- Hay dos picos de incidentes: **7 a. m.** y **5 p. m.** El más alto de la semana es el **martes a las 7 a. m.**
- Los **atropellos** llegan a su pico más tarde: **6 p. m.**

## Limpieza (`scripts/limpiar.py`)

1. Corrige escapes de codificación (`\xF1` → `ñ`) y `\r` en el año.
2. Unifica la clase de incidente (4 variantes de "Caída de ocupante").
3. Saca la hora y el día de la semana de `FECHA_ACCIDENTE` (hora local).
4. Comunas vacías o inválidas (`0`, `In`, `SN`, `Sin Inf`, `No Georef`, `AU…`) → "Sin georreferenciar".
5. **Privacidad (Ley 1581 de 2012):** descarta dirección, expediente, radicado y coordenadas; solo publica agregados y **suprime los conteos de 1 a 4** (se publican como `null`).

Se descartan 6 de 270.765 filas por una fecha que no se puede leer.

## Arquitectura

```
MEData CSV ──► scripts/limpiar.py ──► src/data/agregados.json (respaldo versionado)
                                           │
MEData API (catálogo DKAN) ──► src/lib/datos.ts (fetch en servidor, caché 10 min, respaldo si cae)
                                           │
                    /api/incidentes?clase=…   /api/fuente   página / (Next.js en Vercel)
```

- `GET /api/incidentes?clase=Atropello`: agregados por año, gravedad, comuna y hora × día.
- `GET /api/fuente`: metadatos del conjunto consultados en vivo en MEData (`enVivo: false` si se usó el respaldo).

## Cómo correrlo

```bash
npm install
bash scripts/descargar.sh       # opcional: baja el CSV crudo (62 MB) a data/raw/
python3 scripts/limpiar.py      # opcional: regenera src/data/agregados.json (solo librería estándar)
npm run dev                     # http://localhost:3000
```

### Desplegar en Vercel

```bash
gh repo create incidentes-mde --public --source=. --push
npx vercel --prod
```

No hace falta ninguna variable de entorno. Si más adelante agregan una llave, va en `.env.local` (ignorado por git) y en `npx vercel env add`.

## Cómo usamos la IA

- **Agente:** Claude Code, en terminal.
- Lo usamos para perfilar el CSV (tipos, valores raros, codificación) y proponer reglas de limpieza; el equipo las revisó y aprobó.
- Escribió el script de limpieza, el scaffold de Next.js, los route handlers con caché y respaldo, y este README.
- Ninguna cifra sale de la IA: todas salen de `limpiar.py` y se pueden verificar volviéndolo a correr.
