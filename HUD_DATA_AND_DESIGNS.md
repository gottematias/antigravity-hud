# Antigravity CLI Custom HUD Specification

Directorio base del proyecto: `C:\Users\matia\antigravity-hud`

---

## 1. Inventario de Telemetría (Payload Inyectado por Antigravity CLI)

El proceso principal de Antigravity CLI inyecta un payload JSON serializado a través de `stdin` cada vez que se produce un ciclo de actualización en la terminal.

### A. Modelo y Motor de Inferencia
- `model.display_name`: Nombre legible del modelo (p. ej. `Gemini 3.8 Flash (High)`).
- `model.id`: Identificador del modelo (p. ej. `gemini-3.8-flash`).
- `cycle_mode`: Modo de ciclo activo (`auto`, `plan`, `accept-edits`).
- `effort`: Nivel de esfuerzo / razonamiento (`low`, `medium`, `high`, `xhigh`, `max`).
- `plan_tier`: Nivel de suscripción / tier (`Free`, `Pro`, `Enterprise`).

### B. Ventana de Contexto y Tokens
- `context_window.current`: Cantidad total de tokens consumidos en el historial activo.
- `context_window.limit`: Límite máximo de la ventana de contexto (ej. `1,048,576`).
- `context_window.percentage`: Porcentaje de uso respecto al límite (`0.0` a `100.0`).
- `usage.input_tokens`: Tokens de entrada facturables.
- `usage.output_tokens`: Tokens de respuesta generados.
- `usage.cached_tokens`: Tokens leídos desde la caché del modelo.

### C. Estado del Agente y Orquestación
- `agent_state`: Estado operacional (`idle`, `thinking`, `streaming`, `waiting_confirmation`).
- `subagents`: Mapa de subagentes en ejecución en segundo plano y sus estados individuales.
- `artifact_count`: Número de artefactos (.md, reportes, planes) creados en la sesión.
- `denied_actions`: Contador o lista de permisos/acciones rechazadas por reglas de seguridad.

### D. Workspace y Control de Versiones (VCS)
- `cwd`: Ruta absoluta del directorio de trabajo actual.
- `project_dir`: Directorio raíz detectado del proyecto / repositorio.
- `vcs.branch`: Rama git actual (p. ej. `main`, `feature/checkout`).
- `sandbox`: Booleano o estado de sandboxing en la terminal integrada.

### E. Cuotas y Costos
- `cost.total_usd`: Estimación de costo acumulado de la sesión en dólares.
- `cost.subagent_usd`: Costo imputado a ejecuciones de subagentes delegados.
- `quota`: Buckets de cuota de la cuenta (porcentaje disponible y tiempo para reset `↻`).

### F. Terminal y Ergonomía
- `terminal_width`: Cantidad de columnas disponibles en la terminal (clave para truncado adaptativo).
- `vim.mode`: Modo de edición de línea si está activo (`NORMAL`, `INSERT`, `VISUAL`).

---

## 2. Propuestas de Presentación y Experiencia de Usuario

### Propuesta 1: Minimalista Quirúrgica (Línea Única Compacta)
Diseñada para maximizar el espacio vertical útil en terminal sin generar polución visual.
```text
◆ 3.8 Flash High [AUTO] │  main │ 󰍛 4.2% [██░░░░░░░░] │ ↻ 92%
```
- **Ventajas:** Extremadamente rápida de leer, se adapta de forma fluida a terminales de cualquier ancho (auto-colapsa detalles si `terminal_width < 80`).
- **Estilo:** Glifos sutiles, colores tenues (cian para modelo, magenta para git, verde/ámbar para contexto).

### Propuesta 2: Powerline Segmentada (Línea Única con Bloques de Color)
Diseñada con el estándar visual de herramientas como Tmux, Starship o Vim Airline.
```text
  Gemini 3.8 Flash  AUTO   main  󰍛 42k/1M (4.2%)  ↻ 92% 
```
- **Ventajas:** Fuerte contraste visual entre secciones mediante colores invertidos.
- **Requisito:** Requiere una terminal configurada con Nerd Fonts para renderizar las flechas `` y ``.

### Propuesta 3: Dashboard Ejecutivo (2 Líneas - Control de Operaciones)
Diseñada para sesiones complejas con subagentes y monitoreo exhaustivo de recursos.
```text
┌─ [Gemini 3.8 Flash (High)] [MODO: AUTO] ── 📁 hexa-pos-backend ──  main ── [Subagentes: 1]
└─ 󰍛 Contexto: 42k/1M (4.2%) [██░░░░░░░░] │ Costo: $0.02 │ Cuota: 92% (reset en 35m) │ ⚡ IDLE
```
- **Ventajas:** Separa claramente el contexto semántico (dónde estoy y qué modelo me asiste) de la telemetría de recursos (cuánto gasto y cuánto contexto me queda).
