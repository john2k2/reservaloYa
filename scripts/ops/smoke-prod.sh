#!/usr/bin/env bash
# Health check rápido de las URLs críticas de ReservaYa en producción.
# Uso: bash scripts/ops/smoke-prod.sh [BASE_URL]
# Ej:  bash scripts/ops/smoke-prod.sh https://reservaya.ar

set -e

BASE="${1:-https://reservaya.ar}"

check() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local code
  code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then
    printf "  ✓ %-24s %s\n" "$label" "$code"
  else
    printf "  ✗ %-24s esperado %s, got %s  →  %s\n" "$label" "$expected" "$code" "$url"
    EXIT_CODE=1
  fi
}

EXIT_CODE=0

echo ""
echo "=== Smoke test: $BASE ==="
echo ""

echo "Páginas públicas:"
check "Home"           "$BASE/"
check "Demo barbería"  "$BASE/demo-barberia"
check "Reservar"       "$BASE/demo-barberia/reservar"
check "Login"          "$BASE/login"

echo ""
echo "API pública:"
check "Booking slots"  "$BASE/api/public/booking-slots?slug=demo-barberia&date=$(date -d '+1 day' '+%Y-%m-%d' 2>/dev/null || date -v+1d '+%Y-%m-%d')&serviceId=placeholder" "200"

echo ""
echo "SEO:"
check "Sitemap"        "$BASE/sitemap.xml"
check "Robots"         "$BASE/robots.txt"

echo ""
echo "Admin (redirect a login si no autenticado):"
check "Admin panel"    "$BASE/admin" "308"

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "✅ Todo OK"
else
  echo "❌ Hay fallos — revisar arriba"
fi

exit $EXIT_CODE
