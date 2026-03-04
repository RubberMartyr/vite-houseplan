#!/usr/bin/env bash
set -euo pipefail

if rg -n "\barch\." src/engine/render src/engine/geometry; then
  echo "Found forbidden arch.* reads in render/geometry paths."
  exit 1
fi

echo "No arch.* reads found in src/engine/render and src/engine/geometry."
