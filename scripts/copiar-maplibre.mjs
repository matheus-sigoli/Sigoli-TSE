#!/usr/bin/env node
// MapLibre 6 roda o worker como módulo separado. Copia os arquivos para public/maplibre/
// (servidos pela mesma origem, compatível com a CSP `worker-src 'self'`). Roda antes de dev/build.
import { copyFileSync, mkdirSync } from 'node:fs';
const origem = 'node_modules/maplibre-gl/dist';
mkdirSync('public/maplibre', { recursive: true });
for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) copyFileSync(`${origem}/${f}`, `public/maplibre/${f}`);
