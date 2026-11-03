B=https://cdn.tse.jus.br/estatistica/sead/odsele
for c in detalhe_votacao_secao/detalhe_votacao_secao_2006.zip detalhe_votacao_secao/detalhe_votacao_secao_2006_AC.zip detalhe_votacao_secao/detalhe_votacao_secao_2010.zip; do echo "$c $(curl -sI $B/$c | grep -iE '^(HTTP|content-length)' | tr -d '\r' | tr '\n' ' ')"; done
curl -s -o d.zip $B/detalhe_votacao_secao/detalhe_votacao_secao_2006.zip && unzip -l d.zip | head -8 && f=$(unzip -Z1 d.zip | grep -i 'AC.csv' | head -1) && unzip -p d.zip "$f" | iconv -f latin1 -t utf8 | head -2
