import re,glob,json,difflib
NOMES={'MOREIRA':'PMDB','DARCY':'PDT','GABEIRA':'PT','STEINBRUCH':'PASART','STE INBRUCH':'PASART','TIMOTHEO':'PDS','PALMEIRA VIEIRA':'PSB'}
PARTS=['PMDB','PDT','PT','PDS','PASART','PSB','PND','PFL','PTB','OUTROS']
def num(t, solto=False):
    if not re.fullmatch(r'[\d.,:sSoOlIB]+',t) or (not solto and not re.search(r'\d',t)): return None
    t=t.translate(str.maketrans('sSoOlIB','5500118')).replace(':','.').replace(',','.')
    t=re.sub(r'[^\d.]','',t)
    if not t or not re.fullmatch(r'\d{1,3}(\.\d{3})*',t): return None
    return int(t.replace('.',''))
def norm(t):
    u=t.upper().replace('0','O')
    if u.startswith('PM'): return 'PMDB'
    if u.startswith('PAS'): return 'PASART'
    if u in ('PT','PI'): return 'PT'
    if re.fullmatch(r'P[DO]O?T',u) or u in('POT','PDOT','PODT'): return 'PDT'
    if re.fullmatch(r'P[DO]S',u): return 'PDS'
    if u.startswith('PS') or u.startswith('PPS'): return 'PSB'
    if u.startswith('PN'): return 'PND'
    if u in ('PFL','PEL'): return 'PFL'
    if u=='PTB': return 'PTB'
    return u
res={};falhas=[]
for f in sorted(glob.glob('q-*.txt.txt')):
    tx=open(f).read()
    m=re.search(r'MUNIC[IÍ]PIO\s*-\s*([A-ZÇÃÕÉÍÓÚÂÊ\' ]+?)\s*(\.|\d|ABST|$)',tx,re.M)
    if not m: continue
    mun=m.group(1).strip()
    zona=re.search(r'MUNIC[IÍ]PIO\s*-\s*RIO DE JANEIRO\s*[.\dS]+\)?\s*ZONA',tx,re.I)
    if zona: continue
    vt=re.search(r'VOTANTES\s*-\s*([\d.:,sSoO]+)',tx); vot=num(vt.group(1)) if vt else None
    hd=re.search(r'^CARGO (.*)$',tx,re.M); gv=re.search(r'^GOVERN\.? (.*)$',tx,re.M)
    if not (hd and gv): falhas.append((f,mun,'sem linhas'));continue
    toks=hd.group(1).split()[:-2]
    g=gv.group(1)
    br=re.search(r'([\d.sSoO:]+)\s*\(\s*[\d,.]+%\)\s*([\d.sSoO:]+)\s*\(',g)
    pre=g[:br.start()] if br else g
    bruto=[num(t,True) for t in pre.split()]
    while bruto and bruto[-1] is None: bruto.pop()
    while bruto and bruto[0] is None: bruto.pop(0)
    vals=[v for v in bruto if v is not None]
    if bruto.count(None)==1 and vot and br:
        b0,n0=num(br.group(1)),num(br.group(2))
        if b0 is not None and n0 is not None:
            falta=vot-b0-n0-sum(vals)
            if 0<=falta<5000: vals=[falta if v is None else v for v in bruto]
    brancos=num(br.group(1)) if br else None; nulos=num(br.group(2)) if br else None
    # named lines
    nomes={}
    for l in tx.split('SENADO FEDERAL')[0].splitlines():
        for k,p in NOMES.items():
            if k in l.upper():
                ns=[num(t) for t in l.split()]; ns=[x for x in ns if x is not None]
                if ns: nomes[p]=ns[0]
    # map header tokens
    mp=[norm(t) for t in toks]
    d={}
    for i,v in enumerate(vals):
        p=mp[i] if i<len(mp) else f'X{i}'
        if p in d: p=f'{p}{i}'
        d[p]=v
    ok=vot and brancos is not None and nulos is not None and sum(vals)+brancos+nulos==vot
    if not ok and vot:
        todos=[num(t,True) for t in re.sub(r'\([^)]*\)',' ',g).split()]; todos=[x for x in todos if x is not None]
        for k in range(len(todos)-2,3,-1):
            if sum(todos[:k])+todos[k]+todos[k+1]==vot:
                vals=todos[:k]; brancos,nulos=todos[k],todos[k+1]; ok=True
                d={}
                for i,v in enumerate(vals):
                    p=mp[i] if i<len(mp) else f'X{i}'
                    if p in d: p=f'{p}{i}'
                    d[p]=v
                break
    ((res.__setitem__(mun,{'votantes':vot,'brancos':brancos,'nulos':nulos,'c':d}) if (mun not in res or res[mun]['votantes']<vot) else None) if ok else falhas.append((f,mun,vals,brancos,nulos,vot,toks,nomes)))
print(len(res),'ok'); 
for x in falhas: print(x)
json.dump(res,open('rj86.json','w'),ensure_ascii=False,indent=0)

# 2ª tentativa: um dígito trocado (confusões típicas do OCR) que faça a soma bater; aceita se a solução for única
CONF={'3':'8','8':'360','5':'68','6':'58','0':'89','1':'7','7':'1','9':'0'}
def variantes(n):
    s=str(n)
    for i,c in enumerate(s):
        for r in CONF.get(c,''):
            yield int(s[:i]+r+s[i+1:])
consertados=[]
for x in falhas:
    if len(x)<8: continue
    f,mun,vals,b,n,vot,toks,nomes=x
    if None in (b,n,vot) or not vals: continue
    cand=[]
    base=vals+[b,n]
    for i in range(len(base)):
        for v in variantes(base[i]):
            nb=base[:]; nb[i]=v
            if sum(nb)==vot: cand.append(nb)
    for v in variantes(vot):
        if sum(base)==v: cand.append(base+[('vot',v)])
    # prefer fixes that agree with named values
    boa=[c for c in cand if all(any(abs(y-z)==0 for z in [w for w in c if isinstance(w,int)]) for y in nomes.values())] or cand
    if len(boa)==1:
        c=boa[0]; vv=[w for w in c if isinstance(w,int)]
        if isinstance(c[-1],tuple): vot=c[-1][1]
        pv,b2,n2=vv[:-2],vv[-2],vv[-1]
        d={}
        mp=[norm(t) for t in toks]
        for i,v in enumerate(pv):
            p=mp[i] if i<len(mp) else f'X{i}'
            d[p]=v
        res[mun]={'votantes':vot,'brancos':b2,'nulos':n2,'c':d,'consertado':True}; consertados.append(mun)
print('consertados',len(consertados),consertados)
print('faltam',[x[1] for x in falhas if x[1] not in res])
json.dump(res,open('rj86.json','w'),ensure_ascii=False,indent=0)
