param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$serviceId = "srv-daokoi2d0e5s738me0pg"
$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

# Render PUT /env-vars expects an array of {key, value} objects
$envVars = @(
    [pscustomobject]@{ key = "DATABASE_URL"; value = "postgresql://neondb_owner:npg_a2zRCPbZKTx6@ep-divine-credit-a589ua8g-pooler.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require" }
    [pscustomobject]@{ key = "DJANGO_SETTINGS_MODULE"; value = "config.settings.production" }
    [pscustomobject]@{ key = "DJANGO_DEBUG"; value = "False" }
    [pscustomobject]@{ key = "SECURE_SSL_REDIRECT"; value = "False" }
    [pscustomobject]@{ key = "DJANGO_ALLOWED_HOSTS"; value = ".onrender.com" }
)

$body = $envVars | ConvertTo-Json -Depth 5

Write-Host "Payload: $body"
Write-Host "Setting environment variables on Render service $serviceId ..."

$response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars" `
    -Method PUT `
    -Headers $headers `
    -Body $body

Write-Host "Done! Env vars set successfully."
Write-Host ""
Write-Host "Triggering redeploy..."
$deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" `
    -Method POST `
    -Headers $headers `
    -Body "{}" `
    -ContentType "application/json"

Write-Host "Deploy triggered! ID: $($deploy.id) - Status: $($deploy.status)"
Write-Host "Backend URL: https://healthnova-ai-backend.onrender.com"
