/**
 * Transición circular al cambiar tema (View Transitions API).
 * Expande desde el botón; si no hay soporte o reduced-motion, aplica el cambio al instante.
 */
export function startCircularThemeTransition(
  event: Pick<MouseEvent, "clientX" | "clientY" | "currentTarget">,
  update: () => void
) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canTransition =
    !reducedMotion &&
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof document.startViewTransition === "function";

  if (!canTransition) {
    update();
    return;
  }

  const target = event.currentTarget;
  let x = event.clientX;
  let y = event.clientY;

  if (target instanceof Element) {
    const rect = target.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(() => {
    update();
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {
      // Si la transición se cancela, el tema ya quedó aplicado.
    });
}
