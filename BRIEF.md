# BRIEF — Incidentes viales MDE

1. **Problema:** Medellín registra decenas de miles de incidentes viales al año, pero no es fácil ver dónde y cuándo se concentran.
2. **Usuario y decisión:** un ciudadano que se mueve en moto, a pie o en carro (decide a qué hora y por dónde moverse), y un funcionario de movilidad (decide dónde y cuándo poner control o campañas).
3. **Funcionalidades (máximo 3):**
   - Vista principal: un mapa de calor de hora × día de la semana, con un filtro por tipo de incidente.
   - Detalle: un ranking de comunas con heridos y muertos (v1.1: mapa coroplético con las comunas de GeoMedellín).
   - Lo que sorprende: la hora pico de cada tipo de incidente (los atropellos llegan a su pico a las 6 p. m.).
4. **Pantallas y datos:** una sola página que lee `src/data/agregados.json`, vía la página o `/api/incidentes`. El pie lee `/api/fuente` (MEData en vivo).
5. **Hallazgo:** La Candelaria concentra el 19 % de los incidentes; el pico es el martes a las 7 a. m. Además, el conjunto declara periodicidad anual, pero no tiene datos después de 2020.
6. **Versión 2:** mapa por barrio, cruce con lluvia (SIATA), datos de víctimas por edad y condición (conjunto `1-023-25-000360`) y comparación con datos de la Policía en datos.gov.co.
