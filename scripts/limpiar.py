"""Limpieza reproducible de 'Incidentes viales' (MEData, CC BY-SA 4.0).

Uso:
    bash scripts/descargar.sh   # o descargar manualmente a data/raw/
    python3 scripts/limpiar.py

Entrada:  data/raw/incidentes_viales.csv
Salida:   src/data/agregados.json  (solo agregados, sin datos personales)

Reglas de limpieza (decididas por el equipo):
  1. Se corrigen escapes literales de codificación ("\\xF1" -> "ñ") y "\\r" en AÑO.
  2. Se unifican las clases ("Caida Ocupante", "Caída de Ocupante"... -> "Caída de ocupante").
  3. Hora y día de la semana salen de FECHA_ACCIDENTE (hora local de Medellín).
  4. Comunas vacías, "0", "Sin Inf", "No Georef" o en el formato AU... -> "Sin georreferenciar".
  5. Privacidad: se descartan DIRECCION, EXPEDIENTE, NRO_RADICADO y coordenadas;
     solo se publican conteos y todo conteo de 1 a 4 se suprime (se publica null).
"""
import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "incidentes_viales.csv"
OUT = ROOT / "src" / "data" / "agregados.json"
SUPRIMIR_MENOR_A = 5

CLASES = {
    "choque": "Choque",
    "atropello": "Atropello",
    "volcamiento": "Volcamiento",
    "incendio": "Incendio",
    "otro": "Otro",
}
COMUNAS_INVALIDAS = {"", "0", "in", "sn", "sin inf", "no georef"}


def arreglar(texto: str) -> str:
    texto = re.sub(r"\\x([0-9A-Fa-f]{2})", lambda m: chr(int(m.group(1), 16)), texto)
    return texto.replace("\\r", "").replace("\r", "").strip()


def clase(valor: str) -> str:
    v = arreglar(valor).lower()
    if "ca" in v and "ocupante" in v:
        return "Caída de ocupante"
    return CLASES.get(v, "Otro")


def comuna(valor: str) -> str:
    v = arreglar(valor)
    if v.lower() in COMUNAS_INVALIDAS or v.upper().startswith("AU"):
        return "Sin georreferenciar"
    return v


def suprimir(n: int):
    return n if n >= SUPRIMIR_MENOR_A else None


def main() -> None:
    filas = 0
    descartadas = 0
    # cubo: (clase, año, comuna, gravedad, dia, hora) -> conteo
    cubo: Counter = Counter()
    with RAW.open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            filas += 1
            try:
                fecha = datetime.strptime(r["FECHA_ACCIDENTE"].strip(), "%d/%m/%Y %H:%M:%S")
            except ValueError:
                descartadas += 1
                continue
            gravedad = arreglar(r["GRAVEDAD_ACCIDENTE"]) or "Sin dato"
            cubo[(clase(r["CLASE_ACCIDENTE"]), fecha.year, comuna(r["COMUNA"]),
                  gravedad, fecha.weekday(), fecha.hour)] += 1

    clases = ["Todas"] + sorted({k[0] for k in cubo})
    por_clase = {}
    for c in clases:
        sel = [(k, n) for k, n in cubo.items() if c == "Todas" or k[0] == c]
        total = sum(n for _, n in sel)
        anio, com, grav = Counter(), defaultdict(Counter), Counter()
        calor = [[0] * 24 for _ in range(7)]
        for (_, a, cm, g, d, h), n in sel:
            anio[a] += n
            com[cm][g] += n
            grav[g] += n
            calor[d][h] += n
        por_clase[c] = {
            "total": total,
            "porAnio": [{"anio": a, "n": suprimir(n)} for a, n in sorted(anio.items())],
            "porGravedad": {g: suprimir(n) for g, n in grav.most_common()},
            "porComuna": sorted(
                [{"comuna": cm, "n": suprimir(sum(gs.values())),
                  "conMuertos": suprimir(gs.get("Con muertos", 0)),
                  "conHeridos": suprimir(gs.get("Con heridos", 0))}
                 for cm, gs in com.items()],
                key=lambda x: -(x["n"] or 0)),
            # calor[dia 0=lunes][hora 0-23]
            "calor": [[suprimir(n) for n in fila] for fila in calor],
        }

    anios = sorted({k[1] for k in cubo})
    salida = {
        "fuente": {
            "nombre": "Incidentes viales — Secretaría de Movilidad de Medellín",
            "url": "https://medata.app.medellin.gov.co/dataset/1-023-25-000094",
            "licencia": "CC BY-SA 4.0",
            "fechaCorteArchivo": "2026-10-15",
            "rango": [anios[0], anios[-1]],
        },
        "generado": datetime.now().isoformat(timespec="seconds"),
        "filasLeidas": filas,
        "filasDescartadas": descartadas,
        "supresion": f"Conteos de 1 a {SUPRIMIR_MENOR_A - 1} se publican como null",
        "clases": clases,
        "porClase": por_clase,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{filas} filas, {descartadas} descartadas -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
