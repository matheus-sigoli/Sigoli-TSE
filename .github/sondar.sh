B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o d.zip $B/detalhe_votacao_munzona/detalhe_votacao_munzona_1994.zip
python3 - <<'PY'
import csv,io,zipfile,collections
z=zipfile.ZipFile('d.zip'); print(z.namelist())
S=collections.defaultdict(collections.Counter)
for n in z.namelist():
    if not n.lower().endswith('.csv'): continue
    r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r)
    shown=False
    for row in r:
        d=dict(zip(h,row)); k=(n[-6:-4],d['CD_CARGO'],d['NR_TURNO'])
        if not shown and d['CD_CARGO'] in('1','3'): print(n, d); shown=True
        for c in h[18:-2]:
            try: S[(d['CD_CARGO'],d['NR_TURNO'])][c]+=int(d[c])
            except: pass
for k,v in sorted(S.items()): print(k, dict(v))
PY
echo "== geobr metadata"
for u in https://www.ipea.gov.br/geobr/metadata/metadata_1.7.0_gpkg.csv https://www.ipea.gov.br/geobr/metadata/metadata_gpkg.csv; do curl -sL $u | grep -i amc | head -20; done
