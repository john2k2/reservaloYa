/**
 * Serializa un schema JSON-LD de forma segura para inyectar dentro de una
 * etiqueta `<script type="application/ld+json">`.
 *
 * Escapa la secuencia `</` a `<\\/` para evitar que un string malicioso como
 * `</script>` cierre el bloque de script y ejecute código arbitrario (XSS).
 */
export function safeJsonLdStringify(schema: unknown): string {
  return JSON.stringify(schema).replace(/<\//g, "<\\/");
}
