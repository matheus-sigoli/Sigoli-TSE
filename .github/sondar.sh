B=https://cdn.tse.jus.br/estatistica/sead/odsele
diag() { y=$1; uf=$2; cg=$3
curl -s -o c.zip $B/votacao_candidato_munzona/votacao_candidato_munzona_$y.zip
curl -s -o s.zip $B/votacao_secao/votacao_secao_${y}_$uf.zip
Y=$y U=$uf CG=$cg python3 - <<'PY'
import csv,io,zipfile,collections,os
y,uf,cg=os.environ['Y'],os.environ['U'],os.environ['CG']
def rows(zf,pat):
    z=zipfile.ZipFile(zf)
    for n in z.namelist():
        if pat in n and n.endswith('.csv'):
            r=csv.reader(io.TextIOWrapper(z.open(n),encoding='latin1'),delimiter=';'); h=next(r)
            for row in r: yield dict(zip(h,row))
M=collections.Counter(); info={}
for d in rows('c.zip','_'+uf+'.csv'):
    if d['CD_CARGO']!=cg or not d['DT_ELEICAO'].startswith('0'): pass
    if d['CD_CARGO']!=cg: continue
    n=d['NR_CANDIDATO']; v=max(int(d.get('QT_VOTOS_NOMINAIS') or 0),int(d.get('QT_VOTOS_NOMINAIS_VALIDOS') or 0))
    M[n]+=v; info[n]=(d.get('DS_SITUACAO_CANDIDATURA'),d.get('DS_SIT_TOT_TURNO'),d.get('NM_TIPO_DESTINACAO_VOTOS'),d.get('DS_DETALHE_SITUACAO_CAND'))
S=collections.Counter()
for d in rows('s.zip','.csv'):
    if d['CD_CARGO']==cg: S[d['NR_VOTAVEL']]+=int(d['QT_VOTOS'])
print(y,uf,cg,'mun cand total',sum(M.values()),'secao total (>2 dig, <95)',sum(v for k,v in S.items() if len(k)>2))
diffs=sorted(((S[k]-M.get(k,0)),k) for k in set(S)|set(M) if len(k)>2 and S[k]!=M.get(k,0))
for dlt,k in diffs[:8]+diffs[-8:]: print('  ',k,'secao',S[k],'mun',M.get(k,0),'dif',dlt,info.get(k))
print('  legenda secao',sum(v for k,v in S.items() if len(k)==2 and k not in('95','96','97')),'nulos',S['96']+S['97'],'brancos',S['95'])
PY
}
diag 2014 SE 7
diag 2006 SP 7
diag 2022 DF 6
