import { Tablero } from "@/components/Tablero";
import { fmt } from "@/components/ui";
import { getAgregados, getFuente } from "@/lib/datos";

export const revalidate = 600;

export default async function Home() {
  const [datos, fuente] = await Promise.all([getAgregados(), getFuente()]);
  const t = datos.porClase.Todas;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="aparecer mb-8">
        <div className="font-mono text-xs uppercase tracking-widest text-accent">Datos abiertos · Medellín</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">¿Dónde y a qué hora chocamos en Medellín?</h1>
        <p className="mt-3 max-w-3xl text-base text-muted sm:text-lg">
          <b className="text-foreground">{fmt(t.total)}</b> incidentes viales registrados por la Secretaría de Movilidad entre{" "}
          {datos.fuente.primerDia} y {datos.fuente.ultimoDia}: en promedio <b className="text-foreground">{fmt(t.diario.media)} por día</b>, uno cada{" "}
          <b className="text-foreground">{fmt((24 * 60) / t.diario.media, 0)} minutos</b>.
        </p>
      </header>

      {fuente.modificado && (
        <div className="mb-6 rounded-xl border border-accent-2/40 bg-accent-2/10 p-3 text-sm">
          <b>Sobre el dato:</b> la ficha en MEData declara actualización <b>anual</b>, pero su última modificación es{" "}
          <b>{fuente.modificado}</b> y los registros terminan en <b>{datos.fuente.ultimoDia}</b>. Más de 6 años sin datos nuevos.
        </div>
      )}

      <Tablero datos={datos} />

      <section className="mt-10 grid gap-6 text-sm text-muted md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-base font-semibold text-foreground">Metodología</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{fmt(datos.filasLeidas)} filas leídas; {datos.filasDescartadas} descartadas por una fecha que no se pudo leer.</li>
            <li>Se unificaron los tipos de incidente y se corrigieron errores de codificación. Hora y día salen de la fecha local.</li>
            <li>Letalidad = incidentes con al menos un muerto por cada 1.000 incidentes (‰).</li>
            <li>Privacidad: solo agregados. Conteos de 1 a 4 suprimidos; sin direcciones, radicados ni puntos individuales.</li>
            <li>Son incidentes reportados, no tasas por vehículo o población: más tráfico implica más incidentes.</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-base font-semibold text-foreground">Fuente y licencia</h2>
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
