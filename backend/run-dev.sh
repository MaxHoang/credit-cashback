#!/usr/bin/env bash
# Dev-only PocketBase runner. Downloads the binary on first run.
set -euo pipefail
cd "$(dirname "$0")"
VER="0.28.4"
if [ ! -x ./pocketbase ]; then
  echo "downloading pocketbase v$VER…"
  curl -sSLo pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${VER}/pocketbase_${VER}_linux_amd64.zip"
  python3 -m zipfile -e pb.zip . && chmod +x pocketbase && rm -f pb.zip
fi
exec ./pocketbase serve --http=0.0.0.0:8090 --dir=./pb_data --migrationsDir=./pb_migrations
