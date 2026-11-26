# Reglas del proyecto para agentes de IA

- Stack: Next.js 15 (App Router) + TypeScript + Tailwind 4. No agregar dependencias sin justificarlo.
- Lee `BRIEF.md` antes de proponer funcionalidades. Muestra un plan y espera aprobación antes de cambios grandes.
- **No inventes cifras.** Todo número visible sale de `src/data/agregados.json` (generado por `scripts/limpiar.py`) o de una API pública consultada desde el servidor.
- APIs externas solo desde el servidor (`src/lib`, route handlers), con `revalidate: 600` y respaldo local si fallan.
- Privacidad: solo agregados; conteos de 1 a 4 se publican como `null`. Nunca publicar direcciones, radicados ni coordenadas individuales.
- Llaves en variables de entorno (`.env.local`), nunca en el repositorio.
- Debe verse bien en el celular (diseño mobile-first). Antes de hacer commit, correr `npm run build`.
- Cita la fuente con su licencia (CC BY-SA 4.0) en la interfaz y en el README.
