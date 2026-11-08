B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o p.zip $B/votacao_partido_munzona/votacao_partido_munzona_1998.zip
unzip -p p.zip votacao_partido_munzona_1998_SP.csv | iconv -f latin1 -t utf8 > sp.csv
head -1 sp.csv
python3 - <<'PY'
import csv,collections
r=csv.reader(open('sp.csv',encoding='utf8'),delimiter=';'); h=next(r); c={n:i for i,n in enumerate(h)}
cnt=collections.Counter(); soma=collections.Counter(); ex=None
for row in r:
    cnt[(row[c['CD_CARGO']],row[c['NR_TURNO']],row[c['DT_ELEICAO']])]+=1
    if row[c['CD_CARGO']]=='1':
        soma[row[c['SG_PARTIDO']]]+=int(row[c['QT_VOTOS_NOMINAIS_VALIDOS']] or 0); ex=ex or row
print(cnt); print(soma.most_common(6)); print(ex)
PY
