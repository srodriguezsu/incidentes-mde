import { getFuente } from "@/lib/datos";

export const revalidate = 600;

export async function GET() {
  return Response.json(await getFuente());
}
