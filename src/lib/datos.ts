import agregados from "@/data/agregados.json";

export type Agregados = typeof agregados;
export type Resumen = Agregados["porClase"]["Todas"];

export const DATASET_ID = "1-023-25-000094";
const MEDATA_API = "https://medata.app.medellin.gov.co/api/1/metastore/schemas/dataset/items";

export function getAgregados(): Agregados {
  return agregados;
}

export type Fuente = {
  titulo: string;
  modificado: string | null;
  periodicidad: string | null;
  licencia: string | null;
  enVivo: boolean;
};

/** Metadatos del conjunto consultados en vivo en MEData, con caché de 10 min y respaldo local. */
export async function getFuente(): Promise<Fuente> {
  try {
    const res = await fetch(MEDATA_API, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`MEData ${res.status}`);
    const catalogo: Array<Record<string, string>> = await res.json();
    const d = catalogo.find((x) => x.identifier === DATASET_ID);
    if (!d) throw new Error("Conjunto no encontrado en el catálogo");
    return {
      titulo: d.title,
      modificado: d.modified ?? null,
      periodicidad: d.accrualPeriodicity ?? null,
      licencia: d.license ?? null,
      enVivo: true,
    };
  } catch {
    return {
      titulo: "Incidentes viales",
      modificado: "01-02-2023",
      periodicidad: "R/P1Y",
      licencia: "https://creativecommons.org/licenses/by-sa/4.0/legalcode",
      enVivo: false,
    };
  }
}
