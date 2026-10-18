#!/bin/sh
set -eu

root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
output="$root/node-red/public/source/node-lab-source-v1.0.0.zip"

git -C "$root" diff --quiet
git -C "$root" diff --cached --quiet
git -C "$root" archive \
  --format=zip \
  --prefix=node-lab-1.0.0/ \
  --output="$output" \
  HEAD
sha256sum "$output"

