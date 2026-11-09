B=https://cdn.tse.jus.br/estatistica/sead/odsele
for y in 2002 2014 1994; do
curl -s -o p.zip $B/votacao_partido_munzona/votacao_partido_munzona_$y.zip
curl -s -o d.zip $B/detalhe_votacao_munzona/detalhe_votacao_munzona_$y.zip
Y=$y python3 - <<'PY'
import csv,io,zipfile,collections,os
for f in ['p.zip','d.zip']:
    z=zipfile.ZipFile(f); n=[x for x in z.namelist() if x.endswith('_MG.csv')][0]
    r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r)
    S=collections.Counter()
    for row in r:
        d=dict(zip(h,row))
        if d['CD_CARGO']!='6': continue
        for c in h:
            if c.startswith('QT_'):
                try: S[c]+=int(d[c])
                except: pass
    print(os.environ['Y'],f,dict(S))
PY
done
