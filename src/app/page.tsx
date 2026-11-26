import { Portada } from "@/components/Portada";
import { Tablero } from "@/components/Tablero";
import { fmt } from "@/lib/formato";
import { getAgregados, getFuente } from "@/lib/datos";

export const revalidate = 600;

export default async function Home() {
  const [datos, fuente] = await Promise.all([getAgregados(), getFuente()]);
  const t = datos.porClase.Todas;
  return (
    <main className="mx-auto max-w-6xl px-4 py-4 sm:py-8">
      <Portada
        total={t.total}
        mediaDia={t.diario.media}
        muertos={t.porGravedad["Con muertos"] ?? 0}
        primerDia={datos.fuente.primerDia}
        ultimoDia={datos.fuente.ultimoDia}
        celdas={t.celdas}
      />

      {fuente.modificado && (
        <div className="tarjeta my-6 flex gap-3 p-4 text-sm">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-2/15 text-accent-2">!</span>
          <div>
          <b>Sobre el dato:</b> la ficha en MEData declara actualización <b>anual</b>, pero su última modificación es{" "}
          <b>{fuente.modificado}</b> y los registros terminan en <b>{datos.fuente.ultimoDia}</b>. Más de 6 años sin datos nuevos.
          </div>
        </div>
      )}

      <Tablero datos={datos} />

      <section className="tarjeta mt-10 grid gap-6 p-6 text-sm text-muted md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-display text-lg font-extrabold text-foreground">Metodología</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{fmt(datos.filasLeidas)} filas leídas; {datos.filasDescartadas} descartadas por una fecha que no se pudo leer.</li>
            <li>Se unificaron los tipos de incidente y se corrigieron errores de codificación. Hora y día salen de la fecha local.</li>
            <li>Letalidad = incidentes con al menos un muerto por cada 1.000 incidentes (‰).</li>
            <li>Privacidad: solo agregados. Conteos de 1 a 4 suprimidos; sin direcciones, radicados ni puntos individuales.</li>
            <li>Son incidentes reportados, no tasas por vehículo o población: más tráfico implica más incidentes.</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-display text-lg font-extrabold text-foreground">Fuente y licencia</h2>
          <p>
            <a className="underline" href={datos.fuente.url} target="_blank" rel="noreferrer">{datos.fuente.nombre}</a>, MEData, Alcaldía de Medellín.
            Licencia {datos.fuente.licencia}. Archivo con fecha de servidor {datos.fuente.fechaCorteArchivo}.
            Metadatos {fuente.enVivo ? "consultados en vivo en MEData (caché de 10 min)" : "de la copia de respaldo (MEData no respondió)"}.
          </p>
          <p className="mt-2">
            API abierta: <a className="underline" href="/api/incidentes?clase=Atropello">/api/incidentes?clase=…</a> ·{" "}
            <a className="underline" href="/api/fuente">/api/fuente</a> · Código en{" "}
            <a className="underline" href="https://github.com/srodriguezsu/incidentes-mde">GitHub</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
