# ¿Dónde y a qué hora chocamos en Medellín?

MVP web del reto **"De los datos abiertos al MVP con IA"** (Cátedra Industria TI · UNAL Medellín).

- **URL pública:** https://incidentes-mde.vercel.app
- **Video (2 min):** _pendiente_ (guion en [`GUION_VIDEO.md`](GUION_VIDEO.md))
- **Equipo:** _Integrante 1 (Datos) · Integrante 2 (Producto) · Integrante 3 (Front) · Integrante 4 (Back) · Integrante 5 (Pitch y QA)_

## Pregunta

¿En qué comunas se concentran los incidentes viales de Medellín y a qué hora ocurren?

## Fuente, licencia y fecha de corte

| Conjunto | Publicador | Licencia | Fecha de corte |
|---|---|---|---|
| [Incidentes viales](https://medata.app.medellin.gov.co/dataset/1-023-25-000094) (`1-023-25-000094`) | Secretaría de Movilidad · MEData | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode) | Archivo descargado el 25-nov-2026 (servidor: 15-oct-2026). Cubre **2014–2020**. |

> Hallazgo sobre el dato: aunque la ficha declara periodicidad **anual** y el archivo se re-subió en 2026, los registros terminan en **2020**. La última modificación declarada es 01-02-2023.

## Hallazgos (salen de `src/data/agregados.json`)

1. **Concentración:** el **10 %** de las celdas de ~250 m concentra el **50 %** de los incidentes (Gini 0,66). Las 3 comunas con más incidentes suman el **39 %**; La Candelaria sola, el 19 %.
2. **La noche mata más:** a las 11 p. m. y a las 12 a. m., **17,5 de cada 1.000** incidentes tienen muertos, frente a **3,6‰** a las 12 p. m. Es **4,8 veces** más letal.
3. **Periferia letal:** en el corregimiento de **Santa Elena** la letalidad es **29,4‰**, 5,4 veces la de la ciudad (5,5‰). San Antonio de Prado (13,1‰) y Altavista (12,2‰) le siguen.
4. **Ritmo:** **120 incidentes por día** (DE 33,4; mediana 127), uno cada 12 minutos. Los picos son a las 7 a. m. y a las 5 p. m., y el más alto de la semana es el martes a las 7 a. m. El fin de semana tiene 21 % menos incidentes por día.
5. **Pandemia:** en abril de 2020 hubo **−78 %** frente a febrero (898 frente a 4.069).
6. **Sobre el dato:** la ficha declara actualización anual, pero los registros van del 04-07-2014 al 31-08-2020; no hay datos nuevos en más de 6 años.

## Qué tiene la app

- **Mapa de la ciudad** construido solo con las coordenadas del conjunto, agregadas en celdas de ~250 m. Tiene un modo **«Por hora»** con animación del día completo por comuna.
- **Detalle por comuna** (toca el mapa o la tabla): conteo, participación, letalidad frente a la ciudad y perfil horario.
- **Mapa de calor hora × día** interactivo: compara cada franja con el promedio de la semana.
- **Conteo frente a letalidad por hora:** de día hay más incidentes, de noche son más graves.
- **Serie mensual** (con la caída por la pandemia) y **estacionalidad** por mes.
- **Distribución diaria:** histograma con media, mediana, rango intercuartílico (RIC), p5–p95, desviación estándar, coeficiente de variación (CV) y día récord.
- **Curva de Lorenz** y **Gini** de la concentración espacial.
- **Simulador «¿qué tan cargada está mi franja?»:** eliges comuna, día y hora, y te dice cuántas veces el promedio de esa comuna es esa franja y cuáles son las horas más tranquilas.
- **Ranking** por incidentes o por letalidad, distribución por **tipo de vía** y por **año**.
- Filtro global por **tipo de incidente**: todo se recalcula.

## Limpieza (`scripts/limpiar.py`)

1. Corrige escapes de codificación (`\xF1` → `ñ`) y `\r` en el año.
2. Unifica la clase de incidente (4 variantes de "Caída de ocupante").
3. Saca la hora y el día de la semana de `FECHA_ACCIDENTE` (hora local).
4. Comunas vacías o inválidas (`0`, `In`, `SN`, `Sin Inf`, `No Georef`, `AU…`) → "Sin georreferenciar".
5. **Privacidad (Ley 1581 de 2012):** descarta dirección, expediente y radicado. Las coordenadas solo se usan para agregar en celdas de ~250 m y centroides por comuna. **Se suprimen los conteos de 1 a 4** (se publican como `null`) y las celdas con menos de 5 incidentes no se publican.
6. Las coordenadas fuera del Valle de Aburrá se descartan para el mapa.

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
- Propuso las estadísticas descriptivas (Gini, letalidad, distribución diaria) y las visualizaciones en SVG sin librerías externas.
- Escribió el script de limpieza, el scaffold de Next.js, los route handlers con caché y respaldo, y este README.
- Ninguna cifra sale de la IA: todas salen de `limpiar.py` y se pueden verificar volviéndolo a correr.
