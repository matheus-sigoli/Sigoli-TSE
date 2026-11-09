B=https://cdn.tse.jus.br/estatistica/sead/odsele
for c in votacao_candidato_munzona/votacao_candidato_munzona_1994.zip votacao_partido_munzona/votacao_partido_munzona_1994.zip detalhe_votacao_munzona/detalhe_votacao_munzona_1994.zip consulta_cand/consulta_cand_1994.zip votacao_secao/votacao_secao_1994_BR.zip votacao_secao/votacao_secao_1994_SP.zip; do echo "$c $(curl -sI $B/$c | grep -iE '^(HTTP|content-length)' | tr -d '\r' | tr '\n' ' ')"; done
curl -s -o c.zip $B/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip; unzip -Z1 c.zip | tr '\n' ' '; echo
python3 - <<'PY'
import csv,io,zipfile,collections
z=zipfile.ZipFile('c.zip')
cnt=collections.Counter(); val=collections.Counter()
for n in z.namelist():
    if not n.lower().endswith('.csv'): continue
    r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r); c={k:i for i,k in enumerate(h)}
    for row in r:
        k=(row[c['CD_CARGO']],row[c['NR_TURNO']]); cnt[k]+=1
        v=max(int(row[c['QT_VOTOS_NOMINAIS']] or 0), int(row[c.get('QT_VOTOS_NOMINAIS_VALIDOS',c['QT_VOTOS_NOMINAIS'])] or 0))
        if row[c['CD_CARGO']]=='1': val[row[c['NM_URNA_CANDIDATO']]]+=v
print(sorted(cnt.items())); print(val.most_common(5)); print(h)
PY
