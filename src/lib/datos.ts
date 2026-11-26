import agregados from "@/data/agregados.json";

type N = number | null;
export type Comuna = {
  comuna: string;
  n: N;
  conMuertos: N;
  conHeridos: N;
  letalidad: N;
  centro: [number, number] | null;
  porHora: N[];
};
export type Resumen = {
  total: number;
  porAnio: { anio: number; n: N }[];
  porGravedad: Record<string, N>;
  porMes: { mes: string; n: N }[];
  porDiseno: { diseno: string; n: N }[];
  serieMensual: { periodo: string; n: N }[];
  porHora: N[];
  letalidadPorHora: N[];
  letalidad: N;
  diario: {
    dias: number; media: number; mediana: number; sd: number; p5: number; p25: number; p75: number;
    p95: number; min: number; max: number; cv: number | null; diaMax: { fecha: string; n: number };
    mediaEntreSemana: number; mediaFinDeSemana: number; diasSinIncidentes: number;
  };
  histogramaDiario: { desde: number; hasta: number; dias: number }[];
  concentracion: { celdas: number; giniCeldas: N; top10PctCeldas: N; top3Comunas: N };
  porComuna: Comuna[];
  calor: N[][];
  celdas: [number, number, number][];
  comunaDiaHora?: Record<string, N[][]>;
};
export type Agregados = {
  fuente: { nombre: string; url: string; licencia: string; fechaCorteArchivo: string; rango: [number, number]; primerDia: string; ultimoDia: string };
  generado: string;
  filasLeidas: number;
  filasDescartadas: number;
  supresion: string;
  celdaGrados: number;
  clases: string[];
  porClase: Record<string, Resumen>;
};

export const DATASET_ID = "1-023-25-000094";
const MEDATA_API = "https://medata.app.medellin.gov.co/api/1/metastore/schemas/dataset/items";

export function getAgregados(): Agregados {
  return agregados as unknown as Agregados;
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
