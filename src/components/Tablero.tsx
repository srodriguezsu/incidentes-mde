"use client";

import { useMemo, useState } from "react";
import type { Agregados, Resumen } from "@/lib/datos";
import { Barras, Calor, HoraLetalidad, Histograma, Lorenz, Serie } from "./Graficas";
import { Mapa } from "./Mapa";
import { Simulador } from "./Simulador";
import { Chips, Contador, DIAS_LARGO, Kpi, Revelar, Seccion, corto, fmt, fuego, hora, pct } from "./ui";

function analizar(r: Resumen) {
    let max = 0, pd = 0, ph = 0;
    r.calor.forEach((f, d) => f.forEach((n, h) => { if ((n ?? 0) > max) { max = n ?? 0; pd = d; ph = h; } }));
    const lh = r.letalidadPorHora;
    const val = lh.map((v, h) => ({ v, h })).filter((o) => o.v != null) as { v: number; h: number }[];
    const masLetal = val.length ? val.reduce((a, b) => (b.v > a.v ? b : a)) : null;
    const menosLetal = val.length ? val.reduce((a, b) => (b.v < a.v ? b : a)) : null;
    const serie = r.serieMensual;
    const feb20 = serie.find((s) => s.periodo === "2020-02")?.n;
    const abr20 = serie.find((s) => s.periodo === "2020-04")?.n;
    const covid = feb20 && abr20 ? abr20 / feb20 - 1 : null;
    const geo = r.porComuna.filter((c) => c.comuna !== "Sin georreferenciar");
    const letales = geo.filter((c) => c.letalidad != null).sort((a, b) => b.letalidad! - a.letalidad!);
    return { pico: { d: pd, h: ph, n: max }, masLetal, menosLetal, covid, geo, letales };
}

export function Tablero({ datos }: { datos: Agregados }) {
  const [clase, setClase] = useState("Todas");
  const [comuna, setComuna] = useState<string | null>(null);
  const [orden, setOrden] = useState<"Incidentes" | "Letalidad">("Incidentes");
  const r = datos.porClase[clase];
  const todas = datos.porClase.Todas;

  const x = useMemo(() => analizar(r), [r]);
  const xt = useMemo(() => analizar(todas), [todas]);

  const comunasOrden = useMemo(() => {
    const l = [...x.geo];
    if (orden === "Letalidad") l.sort((a, b) => (b.letalidad ?? -1) - (a.letalidad ?? -1));
    return l.slice(0, 15);
  }, [x.geo, orden]);

  const det = comuna ? r.porComuna.find((c) => c.comuna === comuna) : null;
  const rank = det ? x.geo.findIndex((c) => c.comuna === comuna) + 1 : 0;
  const semanas = todas.diario.dias / 7;
  const ratioNocheT = xt.masLetal && xt.menosLetal ? xt.masLetal.v / xt.menosLetal.v : null;

  return (
    <div className="space-y-6">
      {/* Hallazgos */}
      <section id="hallazgos" className="grid scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Hallazgo n="01" icono="◩" titulo={`${pct(todas.concentracion.top10PctCeldas, 0)} de los incidentes`} texto={`ocurre en solo el 10 % de las celdas de ~250 m con registros. Índice de Gini: ${fmt(todas.concentracion.giniCeldas, 2)}.`} />
        <Hallazgo n="02" icono="☾" titulo={ratioNocheT ? `${fmt(ratioNocheT, 1)}× más letal` : "Noche letal"} texto={xt.masLetal && xt.menosLetal ? `un incidente a las ${hora(xt.masLetal.h)} (${fmt(xt.masLetal.v, 1)}‰ con muertos) que a las ${hora(xt.menosLetal.h)} (${fmt(xt.menosLetal.v, 1)}‰).` : ""} />
        <Hallazgo n="03" icono="▲" titulo={xt.letales[0] ? `${corto(xt.letales[0].comuna)}: ${fmt(xt.letales[0].letalidad, 1)}‰` : "—"} texto={`de incidentes con muertos, ${fmt((xt.letales[0]?.letalidad ?? 0) / (todas.letalidad ?? 1), 1)} veces el promedio de la ciudad (${fmt(todas.letalidad, 1)}‰). Pocos incidentes, pero mucho más graves.`} />
        <Hallazgo n="04" icono="↘" titulo={xt.covid != null ? `${pct(xt.covid, 0)} en abril de 2020` : "Pandemia"} texto="frente a febrero de 2020: la cuarentena se ve en el dato. Después, el registro termina en agosto de 2020." />
      </section>

      <div className="sticky top-2 z-30 mx-auto flex w-fit max-w-full items-center gap-3 overflow-x-auto rounded-full border border-line bg-card-solid/80 px-2 py-1.5 shadow-xl shadow-black/10 backdrop-blur-xl">
        <span className="hidden pl-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:inline">Filtrar</span>
        <Chips opciones={datos.clases} valor={clase} onChange={(c) => { setClase(c); }} />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi titulo="Incidentes" valor={fmt(r.total)} nota={`${pct(r.total / todas.total)} del total`}><Contador key={clase} valor={r.total} /></Kpi>
        <Kpi titulo="Por día (media ± DE)" valor={`${fmt(r.diario.media, 1)}`} nota={`± ${fmt(r.diario.sd, 1)} · mediana ${fmt(r.diario.mediana)}`} />
        <Kpi titulo="Con muertos" valor={fmt(r.porGravedad["Con muertos"] ?? null)} nota={`${fmt(r.letalidad, 2)} por cada 1.000`} tono="text-accent-2" />
        <Kpi titulo="Con heridos" valor={pct((r.porGravedad["Con heridos"] ?? 0) / r.total, 0)} nota={`${fmt(r.porGravedad["Con heridos"] ?? null)} incidentes`} />
        <Kpi titulo="Franja pico" valor={`${DIAS_LARGO[x.pico.d].slice(0, 3)} ${hora(x.pico.h)}`} nota={`${fmt(x.pico.n)} incidentes`} tono="text-accent" />
        <Kpi titulo="Fin de semana" valor={pct(r.diario.mediaFinDeSemana / r.diario.mediaEntreSemana - 1, 0)} nota={`${fmt(r.diario.mediaFinDeSemana, 1)} vs ${fmt(r.diario.mediaEntreSemana, 1)} por día`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Seccion capitulo="Capítulo 1 · Dónde" icono="mapa" titulo="Mapa de la ciudad" subtitulo="Construido solo con las coordenadas del conjunto, agregadas en celdas. Cambia a «Por hora» y dale reproducir.">
          <Mapa celdas={r.celdas} comunas={r.porComuna} celda={datos.celdaGrados} seleccion={comuna} onSeleccion={setComuna} />
        </Seccion>

        <Seccion capitulo="Zoom" icono="pin" titulo={det ? det.comuna : "Detalle por comuna"} subtitulo={det ? `Puesto ${rank} de ${x.geo.length} por número de incidentes` : "Toca una comuna en el mapa o en la tabla."}>
          {det ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Kpi titulo="Incidentes" valor={fmt(det.n)} nota={`${pct((det.n ?? 0) / r.total)} de la ciudad`} />
                <Kpi titulo="Letalidad" valor={det.letalidad != null ? `${fmt(det.letalidad, 1)}‰` : "s. d."} nota={det.letalidad != null && r.letalidad ? `${fmt(det.letalidad / r.letalidad, 2)}× la ciudad` : "muestra insuficiente"} tono="text-accent-2" />
                <Kpi titulo="Con muertos" valor={fmt(det.conMuertos)} />
                <Kpi titulo="Con heridos" valor={fmt(det.conHeridos)} />
              </div>
              <div>
                <div className="mb-1 text-xs text-muted">Incidentes por hora del día</div>
                <div className="flex h-24 items-end gap-[2px]">
                  {det.porHora.map((v, h) => {
                    const m = Math.max(1, ...det.porHora.map((y) => y ?? 0));
                    return <div key={h} title={`${hora(h)}: ${fmt(v)}`} className="flex-1 rounded-t-md transition-all duration-700" style={{ height: `${Math.max(2, ((v ?? 0) / m) * 100)}%`, background: fuego(0.1 + 0.9 * ((v ?? 0) / m)) }} />;
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted"><span>0h</span><span>12h</span><span>23h</span></div>
              </div>
              <button onClick={() => setComuna(null)} className="text-sm text-muted underline">Quitar selección</button>
            </div>
          ) : (
            <Barras items={x.geo.slice(0, 16).map((c) => ({ k: corto(c.comuna), v: c.n }))} />
          )}
        </Seccion>
      </div>

      <Seccion capitulo="Capítulo 2 · Cuándo" icono="reloj" titulo="¿Cuándo ocurren? Hora × día de la semana" subtitulo="Intensidad = número de incidentes en cada franja durante todo el periodo.">
        <Calor calor={r.calor} />
      </Seccion>

      <div className="grid gap-6 lg:grid-cols-2">
        <Seccion capitulo="Capítulo 3 · Qué tan grave" icono="rayo" titulo="De día hay más incidentes; de noche, más graves" subtitulo="Barras: conteo por hora. Línea: incidentes con muertos por cada 1.000 (‰).">
          <HoraLetalidad porHora={r.porHora} letalidad={r.letalidadPorHora} />
        </Seccion>
        <Seccion capitulo="En el tiempo" icono="curva" titulo="Evolución mensual" subtitulo={`${datos.fuente.primerDia} a ${datos.fuente.ultimoDia}. Pasa el cursor para ver cada mes.`}>
          <Serie serie={r.serieMensual} />
          <div className="mt-3 grid grid-cols-6 gap-1 text-center text-[10px] sm:grid-cols-12">
            {r.porMes.map((m) => {
              const max = Math.max(...r.porMes.map((y) => y.n ?? 0));
              return (
                <div key={m.mes} title={fmt(m.n)}>
                  <div className="mx-auto h-9 w-full rounded-lg" style={{ background: fuego(Math.pow((m.n ?? 0) / max, 3)) }} />
                  <div className="mt-0.5 text-muted">{m.mes}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted">Estacionalidad: suma de cada mes en todos los años (2014 empieza en julio; 2020 termina en agosto).</p>
        </Seccion>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Seccion capitulo="Capítulo 4 · Estadística" icono="campana" titulo="¿Qué tan normal es un día?" subtitulo="Distribución de incidentes por día, con media, mediana, rango intercuartílico (barra gris) y percentiles 5–95.">
          <Histograma hist={r.histogramaDiario} d={r.diario} />
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
            {[
              ["Días", fmt(r.diario.dias)], ["Media", fmt(r.diario.media, 1)], ["DE", fmt(r.diario.sd, 1)],
              ["CV", fmt(r.diario.cv, 2)], ["Mín.", fmt(r.diario.min)], ["Máx.", fmt(r.diario.max)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-card-solid/50 p-2"><dt className="text-muted">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">Día récord: <b className="text-foreground">{r.diario.diaMax.fecha}</b> con {fmt(r.diario.diaMax.n)} incidentes.</p>
        </Seccion>
        <Seccion capitulo="Desigualdad" icono="capas" titulo="Concentración espacial" subtitulo="Curva de Lorenz: si todas las celdas tuvieran los mismos incidentes, la curva sería la diagonal.">
          <Lorenz celdas={r.celdas} gini={r.concentracion.giniCeldas} />
          <p className="mt-2 text-sm">
            El <b>10 %</b> de las celdas concentra el <b className="text-accent">{pct(r.concentracion.top10PctCeldas, 0)}</b>; las 3 comunas con más incidentes suman el{" "}
            <b>{pct(r.concentracion.top3Comunas, 0)}</b>.
          </p>
        </Seccion>
      </div>

      <Seccion id="simulador" capitulo="Capítulo 5 · Tu trayecto" icono="brujula" className="scroll-mt-24" titulo="Simulador: ¿qué tan cargada está mi franja?" subtitulo="Elige comuna, día y hora y compárala con la franja promedio de esa comuna (todas las clases).">
        {todas.comunaDiaHora && <Simulador matriz={todas.comunaDiaHora} semanas={semanas} />}
      </Seccion>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Seccion capitulo="Ranking" icono="lista" titulo="Ranking de comunas" subtitulo="Letalidad = incidentes con muertos por cada 1.000 incidentes (solo comunas con al menos 100 incidentes y 5 con muertos).">
          <div className="mb-3"><Chips opciones={["Incidentes", "Letalidad"] as ("Incidentes" | "Letalidad")[]} valor={orden} onChange={setOrden} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr><th className="py-1">Comuna</th><th className="text-right">Incid.</th><th className="text-right">% ciudad</th><th className="text-right">Muertos</th><th className="text-right">Letal. ‰</th></tr>
              </thead>
              <tbody>
                {comunasOrden.map((c) => (
                  <tr key={c.comuna} onClick={() => setComuna(c.comuna)} className={`cursor-pointer border-t border-line hover:bg-line/40 ${c.comuna === comuna ? "bg-line/60" : ""}`}>
                    <td className="py-1.5">{corto(c.comuna)}</td>
                    <td className="text-right tabular-nums">{fmt(c.n)}</td>
                    <td className="text-right tabular-nums">{pct((c.n ?? 0) / r.total)}</td>
                    <td className="text-right tabular-nums">{fmt(c.conMuertos)}</td>
                    <td className="text-right tabular-nums">
                      <span className={(c.letalidad ?? 0) > (r.letalidad ?? 0) * 1.5 ? "font-semibold text-accent-2" : ""}>{c.letalidad != null ? fmt(c.letalidad, 1) : "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>
        <Seccion capitulo="Infraestructura" icono="via" titulo="¿En qué tipo de vía?" subtitulo="Diseño del lugar del incidente.">
          <Barras items={r.porDiseno.map((d) => ({ k: d.diseno, v: d.n }))} color="bg-accent-3" />
          <div className="mt-5">
            <div className="mb-2 text-sm font-medium">Por año</div>
            <Barras items={r.porAnio.map((a) => ({ k: `${a.anio}${a.anio === datos.fuente.rango[0] ? " (desde jul.)" : a.anio === datos.fuente.rango[1] ? " (hasta ago.)" : ""}`, v: a.n }))} />
          </div>
        </Seccion>
      </div>
    </div>
  );
}

function Hallazgo({ n, titulo, texto, icono }: { n: string; titulo: string; texto: string; icono: string }) {
  return (
    <Revelar retraso={Number(n) * 90}>
      <div className="tarjeta group h-full overflow-hidden p-5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10">
        <div className="pointer-events-none absolute -right-6 -top-10 font-display text-[7rem] font-extrabold leading-none text-foreground/[0.04] transition group-hover:text-accent/10">{n}</div>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-amber via-accent to-accent-2 text-sm text-white">{icono}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Hallazgo {n}</span>
        </div>
        <div className="mt-3 font-display text-2xl font-extrabold leading-tight texto-fuego">{titulo}</div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{texto}</p>
      </div>
    </Revelar>
  );
}
