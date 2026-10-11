/**
 * CONTENIDO DE LAS GUÍAS DE AYUDA (botón "Ayuda" de la barra superior).
 *
 * Datos, no componentes: cada guía es un objeto tipado que el panel pinta. Así
 * el texto se escribe y se revisa como texto, se busca, y no hace falta tocar
 * Vue para corregir una frase.
 *
 * Formato en línea (sin HTML, para que nada se interprete): **negritas** y
 * `Tecla` (se pinta como tecla: `F2`, `Enter`).
 */
export type HelpBlock =
  | { type: 'p'; text: string }
  /** Pasos en orden (se numeran). Sólo cuando el orden importa. */
  | { type: 'steps'; items: string[] }
  /** Lista sin orden. */
  | { type: 'list'; items: string[] }
  /** Consejo destacado. `icon` es un nombre de Phosphor (ph:...). */
  | { type: 'tip'; icon?: string; text: string }
  /** Advertencia: algo que puede costar dinero, inventario o un problema legal. */
  | { type: 'warn'; text: string }
  /** Preguntas frecuentes / "si algo no funciona". */
  | { type: 'faq'; items: { q: string; a: string }[] }

export interface HelpSection {
  /** Único dentro de la guía; se usa para abrir la guía directo en esta sección. */
  id: string
  title: string
  icon: string
  blocks: HelpBlock[]
}

export interface HelpGuide {
  /** Único entre guías (kebab-case). */
  id: string
  title: string
  /** Una línea: para qué sirve esta pantalla. */
  summary: string
  icon: string
  sections: HelpSection[]
}
