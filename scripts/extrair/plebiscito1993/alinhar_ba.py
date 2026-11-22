import json,glob,unicodedata,re,casar3,alinhar
porp={}
for f in sorted(glob.glob('res_ba*.json')):
    for r in json.load(open(f)):
        if r['ok']: porp[r['arq']]=r
regs=sorted(porp.values(),key=lambda r:r['arq'])
M=json.load(open('public/data/2026/municipios.json'))
a94={k for k in json.load(open('public/data/1994/presidente/1/br.json'))['mun'] if k.startswith('29')}
asc=lambda s: unicodedata.normalize('NFKD',s.upper()).encode('ascii','ignore').decode()
mun=sorted([(asc(m['nome']).replace("'",' '),m['ibge']) for m in M if m['uf']=='ba' and m['ibge'] in a94])
ANT={'AGUA QUENTE':'2900504','GOVERNADOR LOMANTO JUNIOR':'2903300','ANSELMO DA FONSECA':'2905107'}
mun=sorted(mun+[(k,v) for k,v in ANT.items()])
lista=sorted((casar3.norm(n),ib) for n,ib in mun)
e94={k:v['t'][0] for k,v in json.load(open('public/data/1994/presidente/1/br.json'))['mun'].items()}
r1=alinhar.alinhar('ba',regs,[('p-000','p-004.png'),('p-005','p-018.png'),('p-396','p-999')],lista,e94=e94)
usados={v[0] for v in r1.values()}
r2=alinhar.alinhar('ba',regs,[('p-019','p-395.png')],[x for x in lista if x[1] not in usados],e94=e94)
res={**r1,**r2}
import collections
c=collections.Counter(v[0] for v in res.values())
print('páginas',len(regs),'casadas',len(res),'dup',[k for k,v in c.items() if v>1])
for r in regs:
    v=res.get(r['arq'])
    if not v or v[1]<0.75: print(r['arq'],repr(casar3.norm(r.get('nome') or '')),v)
json.dump(res,open('alinh_ba.json','w'))
# 2ª passada: página que sobrou fica com o único município do vão (alfabético, nos dois blocos) cujo eleitorado de 1994 bate
nm={ib:k for k,ib in lista}
pos={ib:i for i,(k,ib) in enumerate(lista)}
usados={v[0] for v in res.values()}
ordem=[r['arq'] for r in regs]
extra={}
for r in regs:
    a=r['arq']
    if a in res: continue
    i=ordem.index(a)
    ant=next((res[ordem[k]][0] for k in range(i-1,-1,-1) if ordem[k] in res),None)
    dep=next((res[ordem[k]][0] for k in range(i+1,len(ordem)) if ordem[k] in res),None)
    lo=pos.get(ant,-1); hi=pos.get(dep,len(lista))
    if hi<lo: lo,hi=-1,len(lista)  # troca de bloco: vale qualquer um
    cand=[(r['eleit']/e94[ib],ib) for k,ib in lista[lo+1:hi] if ib not in usados and ib in e94]
    boas=[c for c in cand if 0.88<=c[0]<=1.12]
    print(a,repr(casar3.norm(r.get('nome') or '')),r['eleit'],len(cand),[(round(x,2),nm[ib]) for x,ib in boas][:4])
    if len(boas)==1 and len(cand)<=6: extra[a]=(boas[0][1],0,nm[boas[0][1]])
res.update(extra)
print('2ª passada',len(extra),'total',len(res))
json.dump(res,open('alinh_ba.json','w'))
# 3ª passada: nome bem lido (≥0.85) com eleitorado que bate ganha o município, mesmo fora da ordem (blocos misturados);
# quem estava com ele com nome pior perde
import alinhar as _al
mud=True
while mud:
    mud=False
    dono={v[0]:a for a,v in res.items()}
    for r in regs:
        a=r['arq']
        best=None
        for k,ib in lista:
            if ib not in e94: continue
            q=r['eleit']/e94[ib]
            if not 0.85<=q<=1.15: continue
            s=_al.sim(r.get('nome'),k)
            if s>=0.85 and (best is None or s>best[0]): best=(s,ib,k)
        if not best: continue
        cur=res.get(a)
        if cur and cur[0]==best[1]: continue
        if cur and cur[1]>=best[0]: continue
        o=dono.get(best[1])
        if o and res[o][1]>=best[0]: continue
        if o: del res[o]
        res[a]=(best[1],round(best[0],2),best[2]); mud=True; break
print('final',len(res))
json.dump(res,open('alinh_ba.json','w'))
