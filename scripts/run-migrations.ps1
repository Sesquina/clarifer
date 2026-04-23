# Run all pending Supabase migrations against production
# Usage: .\scripts\run-migrations.ps1
# Requires: supabase CLI linked to project

$ErrorActionPreference = "Stop"

Write-Host "Running Clarifer migrations against production..."
Write-Host "Project: lrhwgswbsctfqtvdjntr"
Write-Host ""
Write-Host "Pending migrations:"
Get-ChildItem supabase/migrations/*.sql | Sort-Object Name | Select-Object Name

Write-Host ""
Write-Host "Press Enter to continue or Ctrl+C to cancel..."
Read-Host | Out-Null

npx supabase db push

Write-Host "Done."
