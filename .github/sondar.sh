B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o c.zip $B/votacao_candidato_munzona/votacao_candidato_munzona_1998.zip; unzip -l c.zip | tail -6
for f in $(unzip -Z1 c.zip | grep -iE '_(BR|SP)\.csv'); do echo "== $f"; unzip -p c.zip "$f" | iconv -f latin1 -t utf8 | head -1 | cut -c1-600; unzip -p c.zip "$f" | iconv -f latin1 -t utf8 | grep -i "PRESIDENTE" | head -2 | cut -c1-600; done
curl -s -o k.zip $B/consulta_cand/consulta_cand_1998.zip; unzip -l k.zip | tail -4; unzip -p k.zip $(unzip -Z1 k.zip | grep -i '_BR.csv' | head -1) | iconv -f latin1 -t utf8 | head -3 | cut -c1-500
curl -s -o d.zip $B/detalhe_votacao_munzona/detalhe_votacao_munzona_1998.zip; unzip -Z1 d.zip | head -40 | tr '\n' ' '
for c in votacao_secao/votacao_secao_1998_AC.zip votacao_secao/votacao_secao_1998_BR.zip detalhe_votacao_secao/detalhe_votacao_secao_1998.zip; do echo "$c $(curl -sI $B/$c | grep -iE '^(HTTP|content-length)' | tr -d '\r' | tr '\n' ' ')"; done
