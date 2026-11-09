U=https://cdn.tse.jus.br/estatistica/sead/odsele/arquivos_gerados/resultados_1998/20251230_163909/eb9d6a9a93180483a62bfcdabf46cc56/votacao_candidato-zona_presidente_t1_1998_-1.csv.zip
curl -s -o z.zip "$U"; ls -la z.zip; unzip -l z.zip
f=$(unzip -Z1 z.zip | head -1); unzip -p z.zip "$f" | head -3; echo; unzip -p z.zip "$f" | wc -l
curl -sI "https://cdn.tse.jus.br/estatistica/sead/odsele/arquivos_gerados/resultados_1998/20251230_163909/" | head -3
