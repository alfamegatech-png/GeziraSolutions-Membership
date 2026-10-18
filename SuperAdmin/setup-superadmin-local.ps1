param(
  [Parameter(Mandatory=$true)][string]$DatabaseUrl,
  [Parameter(Mandatory=$true)][string]$SecretKey,
  [switch]$OverwriteEnv
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "SuperAdmin-Backend-ES5"
$frontend = Join-Path $root "SuperAdmin-front-gezira"
$envPath = Join-Path $backend ".env"
$sqlPath = Join-Path $root "apply-superadmin-updates.sql"

if (-not (Test-Path $backend)) {
  throw "Backend folder not found: $backend"
}

if (-not (Test-Path $frontend)) {
  throw "Frontend folder not found: $frontend"
}

if ((Test-Path $envPath) -and -not $OverwriteEnv) {
  Write-Host ".env already exists. Use -OverwriteEnv to recreate it."
} else {
  @"
PORT=5000
MODE=development
SECRET_KEY=$SecretKey
DATABASE_URL=$DatabaseUrl

membership_card_fee_ACCOUNT=16
first_time_fee_ACCOUNT=15
maintenance_fee_ACCOUNT=17
renew_fee_ACCOUNT=18
fellowship_fund_ACCOUNT=18
delay_penalty_ACCOUNT=19
swimming_ACCOUNT=20
value_added_tax_ACCOUNT=21
value_added_tax_swim_ACCOUNT=22
total_amount_ACCOUNT=23
join_fee_ACCOUNT=24
installment_ACCOUNT=25
prev_years_fee_ACCOUNT=26
seperate_fees_ACCOUNT=27
new_ref_fees_ACCOUNT=28
"@ | Set-Content -Path $envPath -Encoding UTF8

  Write-Host "Created backend .env"
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($psql) {
  Write-Host "Applying database updates..."
  & psql $DatabaseUrl -f $sqlPath
} else {
  Write-Host "psql not found. Run this SQL manually:"
  Write-Host $sqlPath
}

Write-Host ""
Write-Host "Run backend:"
Write-Host "cd `"$backend`""
Write-Host "npm start"
Write-Host ""
Write-Host "Run frontend:"
Write-Host "cd `"$frontend`""
Write-Host "npm run dev"
Write-Host ""
Write-Host "Login:"
Write-Host "http://localhost:3000/login"
Write-Host "Email: Admin@gmail.com"
Write-Host "Use your existing account password. No default password is shipped."
