B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o d.zip $B/detalhe_votacao_munzona/detalhe_votacao_munzona_1994.zip
python3 - <<'PY'
import csv,io,zipfile,collections
z=zipfile.ZipFile('d.zip')
for n in z.namelist():
    if not n.lower().endswith('.csv'): continue
    r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r)
    print(n); print(h)
    for i,row in enumerate(r):
        if row[h.index('CD_CARGO')]=='1': print(dict(zip(h,row))); break
    break
PY
