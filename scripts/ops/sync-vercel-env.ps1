param(
  [string]$PocketBaseUrl,
  [string]$AppUrl = "https://reservaya-kappa.vercel.app"
)

$envMap = @{}

Get-Content .env.local | ForEach-Object {
  if ($_ -match '^[A-Z0-9_]+=') {
    $index = $_.IndexOf('=')
    $key = $_.Substring(0, $index)
    $value = $_.Substring($index + 1)
    $envMap[$key] = $value
  }
}

$resolvedPocketBaseUrl = if ($PocketBaseUrl) { $PocketBaseUrl } elseif ($envMap["NEXT_PUBLIC_POCKETBASE_URL"]) { $envMap["NEXT_PUBLIC_POCKETBASE_URL"] } else { throw "Debes indicar -PocketBaseUrl o definir NEXT_PUBLIC_POCKETBASE_URL en .env.local" }

$values = [ordered]@{
  NEXT_PUBLIC_POCKETBASE_URL = $resolvedPocketBaseUrl
  POCKETBASE_ADMIN_EMAIL = $envMap["POCKETBASE_ADMIN_EMAIL"]
  POCKETBASE_ADMIN_PASSWORD = $envMap["POCKETBASE_ADMIN_PASSWORD"]
  POCKETBASE_PUBLIC_AUTH_EMAIL = $envMap["POCKETBASE_PUBLIC_AUTH_EMAIL"]
  POCKETBASE_PUBLIC_AUTH_PASSWORD = $envMap["POCKETBASE_PUBLIC_AUTH_PASSWORD"]
  POCKETBASE_DEMO_OWNER_EMAIL = $envMap["POCKETBASE_DEMO_OWNER_EMAIL"]
  POCKETBASE_DEMO_OWNER_PASSWORD = $envMap["POCKETBASE_DEMO_OWNER_PASSWORD"]
  POCKETBASE_DEMO_OWNER_BUSINESS_SLUG = $envMap["POCKETBASE_DEMO_OWNER_BUSINESS_SLUG"]
  RESERVAYA_ENABLE_DEMO_MODE = $envMap["RESERVAYA_ENABLE_DEMO_MODE"]
  BOOKING_LINK_SECRET = $envMap["BOOKING_LINK_SECRET"]
  BOOKING_JOBS_SECRET = $envMap["BOOKING_JOBS_SECRET"]
  CRON_SECRET = $envMap["BOOKING_JOBS_SECRET"]
  NEXT_PUBLIC_APP_URL = $AppUrl
}

foreach ($entry in $values.GetEnumerator()) {
  npx vercel env rm $entry.Key production -y | Out-Null

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "cmd.exe"
  $psi.Arguments = "/c npx vercel env add $($entry.Key) production"
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi
  $process.Start() | Out-Null
  $process.StandardInput.Write($entry.Value)
  $process.StandardInput.Close()

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($process.ExitCode -ne 0) {
    throw "Error cargando $($entry.Key): $stderr $stdout"
  }

  Write-Output "set $($entry.Key)"
}

npx vercel env pull .env.prod.check --environment=production | Out-Null
Get-Content .env.prod.check
