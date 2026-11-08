B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o c.zip $B/votacao_candidato_munzona/votacao_candidato_munzona_1998.zip
echo "== SP cargos"; unzip -p c.zip votacao_candidato_munzona_1998_SP.csv | iconv -f latin1 -t utf8 | awk -F';' 'NR>1{print $17,$18,$6}' | sort | uniq -c
curl -s -o d.zip $B/detalhe_votacao_secao/detalhe_votacao_secao_1998.zip; unzip -l d.zip | awk '{print $1,$4}' | head -35
f=$(unzip -Z1 d.zip | grep -i '_SP.csv' | head -1); unzip -p d.zip "$f" | iconv -f latin1 -t utf8 | head -2 | cut -c1-700
echo "== SP secoes por cargo/turno"; unzip -p d.zip "$f" | iconv -f latin1 -t utf8 | awk -F';' 'NR==1{for(i=1;i<=NF;i++){gsub(/"/,"",$i);c[$i]=i};next}{print $c["CD_CARGO"],$c["NR_TURNO"]}' | sort | uniq -c
echo "== municipios SP com secao"; unzip -p d.zip "$f" | iconv -f latin1 -t utf8 | awk -F';' 'NR==1{for(i=1;i<=NF;i++){gsub(/"/,"",$i);c[$i]=i};next}{print $c["CD_MUNICIPIO"]}' | sort -u | wc -l
curl -s -o v.zip $B/votacao_secao/votacao_secao_1998_BR.zip; unzip -l v.zip | tail -4
for u in AC SP MG; do echo "votacao_secao_1998_$u $(curl -sI $B/votacao_secao/votacao_secao_1998_$u.zip | head -1 | tr -d '\r')"; done
