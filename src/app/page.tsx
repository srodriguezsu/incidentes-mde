import { Tablero } from "@/components/Tablero";
import { getAgregados, getFuente } from "@/lib/datos";

export const revalidate = 600;

export default async function Home() {
  const [datos, fuente] = await Promise.all([getAgregados(), getFuente()]);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">¿Dónde y a qué hora chocamos en Medellín?</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {datos.porClase.Todas.total.toLocaleString("es-CO")} incidentes viales registrados por la Secretaría de
          Movilidad entre {datos.fuente.rango[0]} y {datos.fuente.rango[1]}.
        </p>
      </header>
      <Tablero datos={datos} />
      <footer className="mt-10 border-t border-zinc-200 pt-4 text-sm text-zinc-500 dark:border-zinc-800">
        Fuente:{" "}
        <a className="underline" href={datos.fuente.url} target="_blank" rel="noreferrer">
          {datos.fuente.nombre}
        </a>{" "}
        · MEData · {datos.fuente.licencia} · última modificación declarada: {fuente.modificado ?? "s. d."}
        {fuente.enVivo ? " (consultado en vivo)" : " (copia de respaldo)"} · Conteos de 1 a 4 suprimidos.
      </footer>
    </main>
  );
}
