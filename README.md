# N3com Coach

Aplicación web (SPA + PWA) especializada en **dirección técnica y preparación deportiva para equipos de Newcom**, 100 % compatible con **GitHub Pages** y persistencia local en **`localStorage`** (sin backend ni base de datos SQL).

## Módulos incluidos

1. **Inicio (Dashboard):** resumen del equipo activo, próximos entrenamientos, últimos partidos, observaciones recientes y objetivos deportivos pendientes.
2. **Equipos y Plantel:** administración de múltiples equipos con aislamiento de datos y gestión de jugadores.
3. **Estrategias y Formaciones:** cancha táctica SVG interactiva (arrastrar y soltar jugadores, flechas de movimiento, zonas de interés), biblioteca de formaciones con duplicación/versionado y biblioteca de jugadas.
4. **Entrenamientos:** biblioteca de ejercicios con categorías configurables, planificación de sesiones, objetivos deportivos y registro real posterior (diferenciando lo planificado de lo efectivamente trabajado).
5. **Estadísticas y Rendimiento:** indicadores de Newcom trazables a partidos reales (sin inventar datos faltantes), evaluaciones del entrenador y gráfico de evolución histórica.
6. **Análisis de Partidos y Rivales:** registro de encuentros, fortalezas, debilidades, observaciones convertibles en objetivos de entrenamiento con un clic, y registro de rivales.
7. **Respaldo portátil:** exportación e importación completa de datos en formato `.json`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Verificación (TypeScript, Tests y Build)

```bash
npm run typecheck
npm test
npm run build
```

## Publicación en GitHub Pages

El repositorio incluye el workflow [deploy.yml](.github/workflows/deploy.yml) y usa `base: './'` en [vite.config.ts](vite.config.ts):

1. Subí los cambios a la rama `main`.
2. En GitHub, ingresá a **Settings → Pages**.
3. En **Build and deployment → Source**, seleccioná **GitHub Actions**.
4. Cada push a `main` ejecutará los tests, compilará `dist/` y publicará la aplicación automáticamente.

## Documentación del proyecto

- [Documento funcional](docs/documento-funcional.md)
- [Stack tecnológico y arquitectura (Etapa 0)](docs/stack-tecnologico.md)
