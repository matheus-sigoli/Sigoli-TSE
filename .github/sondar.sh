U=https://cdn.tse.jus.br/estatistica/sead/odsele/arquivos_gerados/resultados_1998/20251230_163909/31bce047d05fb15aa09b90da4d51ec5b/votacao_candidato-municipio_presidente_t1_1998.csv.zip
curl -s -o m.zip "$U"; ls -la m.zip; f=$(unzip -Z1 m.zip | head -1); unzip -p m.zip "$f" | iconv -f latin1 -t utf8 | head -3; unzip -p m.zip "$f" | wc -l
unzip -p m.zip "$f" | iconv -f latin1 -t utf8 | awk -F';' 'NR>1{u[$1]++; v[$5]+=$(NF-1)} END{for(k in u) printf "%s:%d ", k, u[k]; print ""; for(k in v) print "cand",k,v[k]}' | head -20
