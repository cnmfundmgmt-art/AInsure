#!/bin/bash
# CFP Malaysia — Local SQLite setup
set -e

echo "=== CFP Malaysia Local Setup ==="

mkdir -p data
echo "✓ data/ directory ready"

if [ ! -f data/cfp_local.db ]; then
    sqlite3 data/cfp_local.db ""
    echo "✓ data/cfp_local.db created"
else
    echo "✓ data/cfp_local.db already exists"
fi

echo ""
echo "Pushing schema..."
npm run db:push

echo ""
echo "=== Setup complete ==="
echo "Database: data/cfp_local.db"
echo "Start dev: npm run dev"
