#!/usr/bin/env bash
# Descarga el conjunto crudo (62 MB) desde MEData. No se versiona en git.
set -euo pipefail
mkdir -p data/raw
curl -fL -o data/raw/incidentes_viales.csv \
  https://medata.app.medellin.gov.co/sites/default/files/distribution/1-023-25-000094/incidentes_viales.csv
