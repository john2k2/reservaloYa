"use client";

import { useEffect, useRef, useState, useTransition } from "react";

/** Delay estándar de debounce para inputs de búsqueda atados a un query param. */
export const SEARCH_DEBOUNCE_MS = 280;

/**
 * Debounce de un input de búsqueda atado a un query param de la URL.
 *
 * Mantiene un estado local editable (`query`) sincronizado con el valor
 * externo `value` (típicamente derivado de `searchParams`). Cuando el
 * usuario deja de tipear por `debounceMs`, llama a `onCommit` con el valor
 * recortado dentro de una transición de React.
 *
 * Devuelve también `startTransition` para que el caller pueda envolver
 * navegaciones relacionadas (ej. otros filtros que no pasan por este hook)
 * en la misma transición y compartir un único `isPending`.
 */
export function useDebouncedSearchParam(
  value: string,
  onCommit: (value: string) => void,
  debounceMs: number = SEARCH_DEBOUNCE_MS
) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(value);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  });

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === value) return;

    const timer = window.setTimeout(() => {
      startTransition(() => {
        onCommitRef.current(trimmed);
      });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [query, value, debounceMs, startTransition]);

  return { query, setQuery, isPending, startTransition };
}
