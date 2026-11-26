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
  5. Privacidad: se descartan DIRECCION, EXPEDIENTE y NRO_RADICADO. Las coordenadas solo se
     usan para agregar en celdas de ~250 m y centroides por comuna; todo conteo de 1 a 4 se
     suprime (null) y las celdas con menos de 5 incidentes no se publican.
  6. Coordenadas fuera del Valle de Aburrá (BBOX) se descartan para el mapa.
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


def stats(valores):
    v = sorted(valores)
    n = len(v)
    media = sum(v) / n
    sd = (sum((x - media) ** 2 for x in v) / (n - 1)) ** 0.5
    q = lambda p: v[min(n - 1, int(round(p * (n - 1))))]
    return {"dias": n, "media": round(media, 1), "mediana": q(0.5), "sd": round(sd, 1),
            "p5": q(0.05), "p25": q(0.25), "p75": q(0.75), "p95": q(0.95),
            "min": v[0], "max": v[-1], "cv": round(sd / media, 3) if media else None}


def gini(valores):
    v = sorted(valores)
    n, total = len(v), sum(v)
    if not n or not total:
        return None
    acum = sum((i + 1) * x for i, x in enumerate(v))
    return round((2 * acum) / (n * total) - (n + 1) / n, 3)


def histograma(valores, bins=24):
    lo, hi = min(valores), max(valores)
    ancho = max(1, -(-(hi - lo + 1) // bins))
    cuentas = Counter((x - lo) // ancho for x in valores)
    return [{"desde": lo + b * ancho, "hasta": lo + (b + 1) * ancho - 1, "dias": cuentas.get(b, 0)}
            for b in range((hi - lo) // ancho + 1)]


CELDA = 0.00225  # ~250 m
BBOX = (6.15, 6.40, -75.72, -75.45)  # lat min, lat max, lon min, lon max
MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


def coords(loc: str):
    try:
        lon, lat = json.loads(loc)
    except (ValueError, TypeError):
        return None
    if BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lon <= BBOX[3]:
        return lat, lon
    return None


def main() -> None:
    filas = descartadas = 0
    registros = []  # (clase, fecha, comuna, gravedad, diseño, celda|None, (lat,lon)|None)
    with RAW.open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            filas += 1
            try:
                fecha = datetime.strptime(r["FECHA_ACCIDENTE"].strip(), "%d/%m/%Y %H:%M:%S")
            except ValueError:
                descartadas += 1
                continue
            pt = coords(r["LOCATION"])
            celda = (int(pt[0] // CELDA), int(pt[1] // CELDA)) if pt else None
            registros.append((clase(r["CLASE_ACCIDENTE"]), fecha, comuna(r["COMUNA"]),
                              arreglar(r["GRAVEDAD_ACCIDENTE"]) or "Sin dato",
                              arreglar(r["DISEÑO"]) or "Sin dato", celda, pt))

    fechas = sorted({x[1].date() for x in registros})
    primer, ultimo = fechas[0], fechas[-1]
    todos_dias = [primer.fromordinal(o) for o in range(primer.toordinal(), ultimo.toordinal() + 1)]

    clases = ["Todas"] + sorted({x[0] for x in registros})
    por_clase = {}
    for c in clases:
        sel = [x for x in registros if c == "Todas" or x[0] == c]
        total = len(sel)
        anio, grav, mes, diseno, serie = Counter(), Counter(), Counter(), Counter(), Counter()
        hora_tot, hora_muertos, dia = Counter(), Counter(), Counter()
        com, com_hora, com_pts = defaultdict(Counter), defaultdict(Counter), defaultdict(lambda: [0.0, 0.0, 0])
        celdas = Counter()
        calor = [[0] * 24 for _ in range(7)]
        com_dia_hora = defaultdict(Counter)
        for cl, f, cm, g, ds, ce, pt in sel:
            anio[f.year] += 1
            grav[g] += 1
            mes[f.month] += 1
            diseno[ds] += 1
            serie[(f.year, f.month)] += 1
            hora_tot[f.hour] += 1
            if g == "Con muertos":
                hora_muertos[f.hour] += 1
            dia[f.date()] += 1
            com[cm][g] += 1
            com_hora[cm][f.hour] += 1
            com_dia_hora[cm][(f.weekday(), f.hour)] += 1
            calor[f.weekday()][f.hour] += 1
            if ce:
                celdas[ce] += 1
            if pt and cm != "Sin georreferenciar":
                acc = com_pts[cm]
                acc[0] += pt[0]; acc[1] += pt[1]; acc[2] += 1

        diarios = [dia.get(d, 0) for d in todos_dias]
        maxdia = max(dia.items(), key=lambda kv: kv[1])
        sem = [dia.get(d, 0) for d in todos_dias if d.weekday() < 5]
        fds = [dia.get(d, 0) for d in todos_dias if d.weekday() >= 5]
        valores_celdas = sorted(celdas.values(), reverse=True)
        top10 = valores_celdas[: max(1, len(valores_celdas) // 10)]
        muertos_tot = grav.get("Con muertos", 0)

        comunas = []
        for cm, gs in com.items():
            n = sum(gs.values())
            m = gs.get("Con muertos", 0)
            p = com_pts.get(cm)
            comunas.append({
                "comuna": cm, "n": suprimir(n), "conMuertos": suprimir(m),
                "conHeridos": suprimir(gs.get("Con heridos", 0)),
                "letalidad": round(1000 * m / n, 2) if n >= 100 and m >= SUPRIMIR_MENOR_A else None,
                "centro": [round(p[0] / p[2], 4), round(p[1] / p[2], 4)] if p and p[2] >= 50 else None,
                "porHora": [suprimir(com_hora[cm].get(h, 0)) for h in range(24)],
            })
        comunas.sort(key=lambda x: -(x["n"] or 0))

        datos = {
            "total": total,
            "porAnio": [{"anio": a, "n": suprimir(n)} for a, n in sorted(anio.items())],
            "porGravedad": {g: suprimir(n) for g, n in grav.most_common()},
            "porMes": [{"mes": MESES[m - 1], "n": suprimir(mes.get(m, 0))} for m in range(1, 13)],
            "porDiseno": [{"diseno": d, "n": suprimir(n)} for d, n in diseno.most_common(8)],
            "serieMensual": [{"periodo": f"{a}-{m:02d}", "n": suprimir(serie.get((a, m), 0))}
                             for a in range(primer.year, ultimo.year + 1) for m in range(1, 13)
                             if (a, m) >= (primer.year, primer.month) and (a, m) <= (ultimo.year, ultimo.month)],
            "porHora": [suprimir(hora_tot.get(h, 0)) for h in range(24)],
            "letalidadPorHora": [round(1000 * hora_muertos.get(h, 0) / hora_tot[h], 2)
                                 if hora_tot.get(h, 0) >= 100 and hora_muertos.get(h, 0) >= SUPRIMIR_MENOR_A else None
                                 for h in range(24)],
            "letalidad": round(1000 * muertos_tot / total, 2) if total else None,
            "diario": {**stats(diarios), "diaMax": {"fecha": maxdia[0].isoformat(), "n": maxdia[1]},
                       "mediaEntreSemana": round(sum(sem) / len(sem), 1),
                       "mediaFinDeSemana": round(sum(fds) / len(fds), 1),
                       "diasSinIncidentes": sum(1 for x in diarios if x == 0)},
            "histogramaDiario": histograma(diarios),
            "concentracion": {
                "celdas": len(celdas),
                "giniCeldas": gini(list(celdas.values())),
                "top10PctCeldas": round(sum(top10) / sum(valores_celdas), 3) if valores_celdas else None,
                "top3Comunas": round(sum((x["n"] or 0) for x in [y for y in comunas if y["comuna"] != "Sin georreferenciar"][:3]) / total, 3),
            },
            "porComuna": comunas,
            "calor": [[suprimir(n) for n in fila] for fila in calor],
            # Celdas de ~250 m: [lat_centro, lon_centro, n]; las celdas con 1–4 se omiten.
            "celdas": [[round((la + 0.5) * CELDA, 5), round((lo + 0.5) * CELDA, 5), n]
                       for (la, lo), n in celdas.items() if n >= SUPRIMIR_MENOR_A],
        }
        if c == "Todas":
            datos["comunaDiaHora"] = {
                cm: [[suprimir(com_dia_hora[cm].get((d, h), 0)) for h in range(24)] for d in range(7)]
                for cm in com if cm != "Sin georreferenciar" and sum(com[cm].values()) >= 500
            }
        por_clase[c] = datos

    salida = {
        "fuente": {
            "nombre": "Incidentes viales — Secretaría de Movilidad de Medellín",
            "url": "https://medata.app.medellin.gov.co/dataset/1-023-25-000094",
            "licencia": "CC BY-SA 4.0",
            "fechaCorteArchivo": "2026-10-15",
            "rango": [primer.year, ultimo.year],
            "primerDia": primer.isoformat(),
            "ultimoDia": ultimo.isoformat(),
        },
        "generado": datetime.now().isoformat(timespec="seconds"),
        "filasLeidas": filas,
        "filasDescartadas": descartadas,
        "supresion": f"Conteos de 1 a {SUPRIMIR_MENOR_A - 1} se publican como null",
        "celdaGrados": CELDA,
        "clases": clases,
        "porClase": por_clase,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{filas} filas, {descartadas} descartadas -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
