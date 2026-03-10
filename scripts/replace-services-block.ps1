$path = "src\app\(public)\[slug]\page.tsx"
$content = Get-Content -LiteralPath $path -Raw

$startMarker = "      {/* Services Section - With background */}"
$endMarker = "      {/* Testimonials Section */}"

$startIndex = $content.IndexOf($startMarker)
$endIndex = $content.IndexOf($endMarker)

if ($startIndex -lt 0 -or $endIndex -lt 0 -or $endIndex -le $startIndex) {
  throw "No se pudo encontrar el bloque de servicios."
}

$replacement = @'
      <ServicesSection
        slug={slug}
        accentColor={pageData.profile.accent}
        accentSoft={pageData.profile.accentSoft}
        surfaceTint={pageData.profile.surfaceTint}
        services={services}
        bookingHrefForService={(serviceId) =>
          buildBookingHref({
            slug,
            serviceId,
            source: tracking.utm_source,
            medium: tracking.utm_medium,
            campaign: tracking.utm_campaign,
          })
        }
      />

'@

$updated = $content.Substring(0, $startIndex) + $replacement + $content.Substring($endIndex)
Set-Content -LiteralPath $path -Value $updated -NoNewline
