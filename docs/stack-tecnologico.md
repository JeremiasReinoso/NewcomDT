# N3com Coach — Definición de Stack Tecnológico y Arquitectura (Etapa 0)

Este documento define las decisiones tecnológicas iniciales para la **Etapa 0 (Diseño)** de **N3com Coach**, alineadas con [documento-funcional.md](documento-funcional.md) y optimizadas para:

- Publicación directa y gratuita en **GitHub Pages** (sitio estático / SPA dinámico en cliente).
- Uso **offline y tipo escritorio** mediante **PWA**.
- Persistencia 100 % en **`localStorage`** (sin servidor ni base de datos SQL en el MVP).

---

## 1. Decisiones tecnológicas (Sección 10 del Documento Funcional)

| Punto a definir | Decisión para el MVP | Justificación |
|---|---|---|
| **1. Plataforma** | **Web SPA + PWA** (instalable en escritorio y móvil, con soporte offline) | Se ejecuta en navegador, se publica directo en GitHub Pages y puede instalarse como app de escritorio sin mantener infraestructura ni servidores. |
| **2. Frontend** | **React + TypeScript + Vite** | Ecosistema modular, tipado fuerte para el modelo de datos deportivo, build estático rápido y compatible con GitHub Pages (`vite build`). |
| **3. Backend** | **Sin backend en el MVP** (arquitectura *local-first* en cliente) | Toda la lógica de negocio vive en módulos TypeScript desacoplados de la UI, detrás de interfaces de repositorio. Permite conectar una API en etapas futuras sin reescribir la interfaz. |
| **4. Base de datos / Persistencia** | **`localStorage` (JSON versionado)** | Cumple el requerimiento de operar sin SQL. Cada módulo accede a los datos mediante un `StorageService` centralizado con validación e integridad referencial en cliente. |
| **5. Autenticación y privacidad** | **Sesión local en dispositivo** (sin servidor de cuentas en el MVP) | Al no existir backend, los datos residen únicamente en el navegador del entrenador. Se deja preparada la abstracción para incorporar autenticación real cuando exista servidor/API. |
| **6. Motor de cancha táctica** | **SVG interactivo en React + coordenadas normalizadas (`0..100`)** | Escala sin pérdida de calidad a cualquier pantalla, facilita arrastrar y soltar jugadores, flechas, trayectorias y zonas, y se serializa directamente a JSON en `localStorage`. |
| **7. Copias de seguridad** | **Exportación e importación manual en archivo `.json`** | Mitiga el riesgo de pérdida de datos si el usuario limpia la caché del navegador o cambia de equipo/dispositivo. |

---

## 2. Arquitectura lógica del proyecto

Para respetar la separación lógica propuesta en el documento funcional (interfaz, lógica de negocio, persistencia y motor táctico), el código se organizará de forma modular:

```text
src/
├── domain/          # Tipos, entidades y reglas de negocio puras (equipos, jugadas, sesiones, estadísticas, partidos)
├── storage/         # Adaptador de localStorage, versionado de esquema, integridad referencial y backup JSON
├── state/           # Contexto / store de aplicación conectado al StorageService
├── components/      # Componentes UI reutilizables (layout, sidebar, formularios, tablas)
├── tactical-board/  # Motor gráfico SVG de la cancha táctica interactiva (drag & drop, flechas, zonas)
└── modules/         # Pantallas por sección:
    ├── dashboard/   # Inicio
    ├── teams/       # Equipos y jugadores
    ├── strategies/  # Formaciones y biblioteca de jugadas
    ├── trainings/   # Biblioteca de ejercicios y sesiones
    ├── stats/       # Estadísticas individuales y colectivas
    └── matches/     # Análisis de partidos, rivales y conexión con objetivos
```

---

## 3. Consideraciones importantes sobre `localStorage`

1. **Límite de almacenamiento:** Los navegadores suelen limitar `localStorage` a ~5–10 MB por origen. Para el MVP (texto, coordenadas normalizadas, estadísticas y registros) es ampliamente suficiente, evitando guardar imágenes pesadas en base64.
2. **Integridad y versionado:** Se guardará una estructura raíz con `schemaVersion` para poder migrar datos si el modelo evoluciona entre etapas.
3. **Respaldo obligatorio:** La interfaz debe ofrecer desde el inicio un botón visible de **Exportar respaldo (.json)** e **Importar respaldo (.json)**.
4. **Alcance futuro (Secciones 6 y 7):** La colaboración multiusuario en tiempo real, permisos por rol en servidor y la sincronización automática con **N3com Torneos** requerirán incorporar un backend cuando se aborde esa etapa. El diseño mediante `StorageService` permite reemplazar `localStorage` por llamadas a API en el futuro.

---

## 4. Despliegue en GitHub Pages

- El proyecto se compilará a archivos estáticos (`HTML`, `CSS`, `JS`, `manifest.webmanifest`, `sw.js`).
- Se configurará `base` en Vite según el nombre del repositorio (`NewcomDT`) y enrutamiento compatible con hosting estático (HashRouter o fallback SPA) para evitar errores 404 al recargar rutas en GitHub Pages.
- Se puede automatizar la publicación mediante **GitHub Actions** en cada push a `main`.
