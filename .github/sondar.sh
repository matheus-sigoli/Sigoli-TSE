B=https://cdn.tse.jus.br/estatistica/sead/odsele
python3 - <<'PY'
import csv,collections,io,zipfile,urllib.request,os
def baixar(u,d):
    if not os.path.exists(d): urllib.request.urlretrieve(u,d)
B='https://cdn.tse.jus.br/estatistica/sead/odsele'
for uf in ['AC','RR','DF']:
    baixar(f'{B}/votacao_secao/votacao_secao_1998_{uf}.zip',f'{uf}.zip')
    z=zipfile.ZipFile(f'{uf}.zip'); n=[x for x in z.namelist() if x.lower().endswith('.csv')][0]
    r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r); c={k:i for i,k in enumerate(h)}
    cnt=collections.Counter(); pres=collections.Counter(); secs=set(); secp=set()
    for row in r:
        cnt[(row[c['CD_CARGO']],row[c['NR_TURNO']])]+=1
        secs.add((row[c['CD_MUNICIPIO']],row[c['NR_ZONA']],row[c['NR_SECAO']]))
        if row[c['CD_CARGO']]=='1': pres[row[c['NR_VOTAVEL']]]+=int(row[c['QT_VOTOS']]); secp.add((row[c['CD_MUNICIPIO']],row[c['NR_ZONA']],row[c['NR_SECAO']]))
    print(uf,dict(cnt),'secoes',len(secs),'secoes pres',len(secp),pres.most_common(5))
baixar(f'{B}/detalhe_votacao_munzona/detalhe_votacao_munzona_1998.zip','d.zip')
z=zipfile.ZipFile('d.zip')
for n in z.namelist():
    if not n.lower().endswith(('_br.csv','_ac.csv')): continue
    r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r); c={k:i for i,k in enumerate(h)}
    cnt=collections.Counter(); val=0
    for row in r:
        cnt[(row[c['CD_CARGO']],row[c['NR_TURNO']],row[c['SG_UF']])]+=1
        if row[c['CD_CARGO']]=='1': val+=int(row[c['QT_TOTAL_VOTOS_VALIDOS']] or 0)
    print(n,len(cnt),list(cnt.items())[:6],'validos pres',val)
PY
