// Funciones puras de formato y color (usables en servidor y cliente).
export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DIAS_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const fmt = (n: number | null | undefined, dec = 0) =>
  n == null ? "<5" : n.toLocaleString("es-CO", { maximumFractionDigits: dec, minimumFractionDigits: dec });
export const pct = (x: number | null | undefined, dec = 1) => (x == null ? "s. d." : `${fmt(x * 100, dec)} %`);
export const hora = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a. m." : "p. m."}`;
export const corto = (c: string) => c.replace("Corregimiento de ", "");

/** Escala secuencial "fuego": ámbar → rojo → magenta → violeta. t en [0,1]. */
const PARADAS = [[255, 214, 102], [255, 140, 66], [240, 52, 82], [196, 30, 120], [110, 40, 170]];
export function fuego(t: number) {
  const x = Math.max(0, Math.min(1, t)) * (PARADAS.length - 1);
  const i = Math.min(PARADAS.length - 2, Math.floor(x));
  const f = x - i;
  const [a, b] = [PARADAS[i], PARADAS[i + 1]];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
}

