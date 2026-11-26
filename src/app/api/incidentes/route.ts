import { getAgregados } from "@/lib/datos";

export const revalidate = 600;

export async function GET(req: Request) {
  const clase = new URL(req.url).searchParams.get("clase") ?? "Todas";
  const d = getAgregados();
  const datos = d.porClase[clase as keyof typeof d.porClase];
  if (!datos) {
    return Response.json({ error: `Clase no válida. Use: ${d.clases.join(", ")}` }, { status: 400 });
  }
  return Response.json(
    { fuente: d.fuente, clase, ...datos },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } },
  );
}
