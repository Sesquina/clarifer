#!/bin/bash
# Run all pending Supabase migrations against production
# Usage: bash scripts/run-migrations.sh
# Requires: supabase CLI linked to project (run supabase link first)
# WARNING: This runs against PRODUCTION. Verify migrations first.

set -euo pipefail

echo "Running Clarifer migrations against production..."
echo "Project: lrhwgswbsctfqtvdjntr"
echo ""
echo "Pending migrations:"
ls supabase/migrations/*.sql | sort

echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

npx supabase db push

echo "Done."
