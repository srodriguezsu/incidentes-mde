"use client";

import { useMemo, useState } from "react";
import type { Agregados } from "@/lib/datos";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const fmt = (n: number | null) => (n == null ? "<5" : n.toLocaleString("es-CO"));

export function Tablero({ datos }: { datos: Agregados }) {
  const [clase, setClase] = useState("Todas");
  const r = datos.porClase[clase as keyof Agregados["porClase"]];

  const { maxCalor, picoTexto, porHora } = useMemo(() => {
    let max = 0, pd = 0, ph = 0;
    const porHora = Array(24).fill(0);
    r.calor.forEach((fila, d) =>
      fila.forEach((n, h) => {
        porHora[h] += n ?? 0;
        if ((n ?? 0) > max) { max = n ?? 0; pd = d; ph = h; }
      }),
    );
    return { maxCalor: max, picoTexto: `${DIAS[pd]} ${ph}:00`, porHora };
  }, [r]);

  const comunas = r.porComuna.filter((c) => c.comuna !== "Sin georreferenciar").slice(0, 12);
  const maxComuna = comunas[0]?.n ?? 1;
  const tarde = porHora.slice(17, 20).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {datos.clases.map((c) => (
          <button
            key={c}
            onClick={() => setClase(c)}
            className={`rounded-full border px-3 py-1 text-sm ${
              c === clase ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black" : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi titulo="Incidentes" valor={fmt(r.total)} />
        <Kpi titulo="Con muertos" valor={fmt(r.porGravedad["Con muertos" as keyof typeof r.porGravedad] ?? null)} />
        <Kpi titulo="Hora pico" valor={picoTexto} />
        <Kpi titulo="Entre 5 y 8 p. m." valor={`${((tarde / r.total) * 100).toFixed(1)} %`} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Hora × día de la semana</h2>
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] gap-[2px]" style={{ gridTemplateColumns: "3rem repeat(24, 1fr)" }}>
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center text-[10px] text-zinc-500">{h}</div>
            ))}
            {r.calor.map((fila, d) => (
              <Fila key={d} dia={DIAS[d]} fila={fila} max={maxCalor} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Comunas con más incidentes</h2>
        <ul className="space-y-1">
          {comunas.map((c) => (
            <li key={c.comuna} className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-2 text-sm sm:grid-cols-[14rem_1fr_6rem]">
              <span className="truncate">{c.comuna}</span>
              <span className="h-4 rounded bg-rose-500" style={{ width: `${((c.n ?? 0) / (maxComuna ?? 1)) * 100}%` }} />
              <span className="text-right tabular-nums">{fmt(c.n)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Fila({ dia, fila, max }: { dia: string; fila: (number | null)[]; max: number }) {
  return (
    <>
      <div className="text-xs text-zinc-500">{dia}</div>
      {fila.map((n, h) => (
        <div
          key={h}
          title={`${dia} ${h}:00 — ${fmt(n)}`}
          className="aspect-square rounded-sm bg-rose-600"
          style={{ opacity: n == null ? 0.05 : 0.08 + 0.92 * (n / max) }}
        />
      ))}
    </>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-xs uppercase text-zinc-500">{titulo}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{valor}</div>
    </div>
  );
}
