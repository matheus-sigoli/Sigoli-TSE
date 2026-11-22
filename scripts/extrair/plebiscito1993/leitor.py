import sys, re, json, pickle, os, numpy as np
AQUI=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,AQUI)
from grid import limpa, linhas, celulas, vec
CLF=pickle.load(open(os.environ.get('CLF',os.path.join(AQUI,'clf.pkl')),'rb'))
def linhas_texto(f):
    ink=limpa(f); L=linhas(ink); C=celulas(ink,L)
    out=[]
    for (ab,cells) in C:
        idx=[i for i,(x,c) in enumerate(cells) if c.sum()>6]
        s=[' ']*len(cells)
        if idx:
            pr=CLF.predict(np.array([vec(cells[i][1]) for i in idx]))
            for i,ch in zip(idx,pr): s[i]=ch
        out.append((ab,cells,''.join(s).rstrip()))
    return out
ROT=r'L[L ]{2,}L[.:]*'
def campos(t):
    out=[]
    for m in re.finditer(r'(?<![\dL])([\dL]*\d[\dL]*)\s*(?:\(\s*([\d.L ]*?)\s*[%L]?\s*\)?)?(?=\s|$|L{3})', t):
        p=(m.group(2) or '').replace(' ','.') if m.group(2) and re.fullmatch(r'\d{1,3}[. ]\d\d',m.group(2).strip()) else None
        try: p=float(p) if p else None
        except ValueError: p=None
        v=m.group(1)
        out.append((int(v) if 'L' not in v else v,p))
    return out
def partes(t):
    """[(rótulo, texto dos valores até o próximo rótulo)]"""
    toks=re.split(r'\s{2,}',t.strip()); out=[]
    for tk in toks:
        if tk.count('L')>=4 and (not re.match(r'^\(?\d',tk) or tk.count('L')>=0.6*len(tk.replace(' ',''))): out.append([tk,''])
        elif out: out[-1][1]+=' '+tk
    return out
def valor(txt):
    c=campos(re.sub(r'^(?:\s*(?:[.:,]|L(?=\s))\s*)+','',txt)); return c[0] if c else (None,None)
CLN=pickle.load(open(os.path.join(AQUI,'clfn.pkl'),'rb'))
def nome_de(linha):
    ab,cells,t=linha
    m=re.search(r'(?:^|\s)\S{4} \S{2} \S{9}\s*[.:]+',t)
    if not m: return ''
    cs=cells[m.end():]
    idx=[i for i,(x,c) in enumerate(cs) if c.sum()>6]
    if not idx: return ''
    s=[' ']*(idx[-1]+1)
    pr=CLN.predict(np.array([vec(cs[i][1]) for i in idx]))
    for i,ch in zip(idx,pr): s[i]=ch
    return ''.join(s).strip()
def ler1(f):
    T=linhas_texto(f)
    S=[t for ab,c,t in T]
    P=[partes(s) for s in S]
    num0=lambda x: bool(re.match(r'(?:\s*(?:[.:,]|L(?=\s))\s*)*\s*L?\d',x))
    dado=[len(p)>=2 and num0(p[0][1]) and num0(p[1][1]) for p in P]
    st=None; i=0
    while i<len(S):
        if dado[i]:
            j=i
            while j<len(S) and dado[j]: j+=1
            if j-i>=4: st=j-4; break
            i=j
        else: i+=1
    if st is None:
        # 3 linhas boas e uma ilegível (risco de caneta por cima): a ilegível vira coringa, resolvida pela soma
        i=0
        while i<len(S)-3 and st is None:
            if all(dado[i:i+3]):
                if i>0 and len(P[i-1])>=2: st=i-1
                elif i+3<len(S) and len(P[i+3])>=2 and not dado[i+3]: st=i
            i+=1
    if st is None: return None
    r={'arq':os.path.basename(f),'raw':S[st:st+7]}
    k=['mon','rep','br1','nu1']; k2=['parl','pres','br2','nu2']
    for i in range(4):
        p=P[st+i]
        if len(p)<2 or not dado[st+i]:
            r[k[i]]=r[k2[i]]=None; r[k[i]+'%']=r[k2[i]+'%']=None; continue
        r[k[i]],r[k[i]+'%']=valor(p[0][1]); r[k2[i]],r[k2[i]+'%']=valor(p[1][1])
    # eleitorado, comparecimento e não compareceram: as 3 linhas logo depois do bloco (valor ilegível vira coringa)
    vals=[]
    for p in P[st+4:st+7]:
        v=valor(p[0][1])[0] if p else None
        if v is None and p and re.search(r'L{3,}\s*$',p[0][1].strip()): v='LLLL'
        vals.append(v)
    r['eleit'],r['comp'],r['naoc']=(vals+[None]*3)[:3]
    r['nome_linha']=None
    for j in range(st-1,-1,-1):
        if re.search(r'(?:^|\s)\S{4} \S{2} \S{9}(?:[.:]{3,}|\s+[.:]\s*\S)',S[j]): r['nome_linha']=j; break
    r['nome']=nome_de(T[r['nome_linha']]) if r['nome_linha'] is not None else ''
    return r
import grid as _g
def ler(f):
    melhor=None
    for fz in (None,1.0,0.94,1.06,0.88,1.12):
        _g.FORCA=fz
        try: r=ler1(f)
        except Exception: r=None
        _g.FORCA=None
        if r is None: continue
        r['escala']=fz
        if ok(r): return r
        if melhor is None: melhor=r
        t=dict(r)
        if reparar(t) and ok(t): return t
    return melhor
def dist1(a,b):
    a,b=str(a),str(b)
    if len(a)==len(b): return sum(x!=y for x,y in zip(a,b))<=1
    if abs(len(a)-len(b))==1:
        l,s_=(a,b) if len(a)>len(b) else (b,a)
        return any(l[:i]+l[i+1:]==s_ for i in range(len(l)))
    return False
K1=['mon','rep','br1','nu1']; K2=['parl','pres','br2','nu2']
def ok(r):
    try:
        c=r['comp']
        return sum(r[k] for k in K1)==c and sum(r[k] for k in K2)==c and r['eleit']-r['naoc']==c
    except (TypeError,KeyError): return False
def base_pct(r):
    # % sobre o comparecimento (SP…) ou sobre os válidos (RJ)
    return r['comp']
def por_pct(r,C,base):
    fix={}
    for k in K1+K2:
        p=r.get(k+'%'); v=r.get(k)
        B=base(k,C)
        if p is None or v is None or not B: continue
        if abs(v/B*100-p)<=0.0051: continue
        e=p*B/100
        cs=[x for x in range(int(e)-1,int(e)+3) if x>=0 and abs(x/B*100-p)<=0.0051 and dist1(v,x)]
        if len(cs)==1: fix[k]=cs[0]
    return fix
def coringa(r):
    # valor com dígito ilegível ("7L9"): sai da soma, se for o único da conta
    C=r.get('comp') if isinstance(r.get('comp'),int) else None
    if isinstance(r.get('eleit'),int) and isinstance(r.get('naoc'),int):
        if C is None: C=r['eleit']-r['naoc']; r['comp']=C
    if C is None: return
    def pct_ok(F,C):
        # os outros números da conta têm de bater com o % impresso (sobre o comparecimento ou sobre os válidos)
        val=lambda a,b: (r[a]+r[b]) if isinstance(r.get(a),int) and isinstance(r.get(b),int) else None
        for k in F:
            p=r.get(k+'%'); v=r.get(k)
            if not isinstance(v,int) or not isinstance(p,float): continue
            bases=[C, val(*(K1[:2] if k in K1 else K2[:2]))]
            if not any(B and abs(v/B*100-p)<=0.0051 for B in bases): return False
        return True
    for F in (K1,K2):
        ruins=[k for k in F if not isinstance(r.get(k),int)]
        if len(ruins)==1 and pct_ok([k for k in F if k not in ruins],C):
            k=ruins[0]; v=C-sum(r[x] for x in F if x!=k)
            pat=r.get(k)
            if v>=0 and (pat is None or re.fullmatch(str(pat).replace('L','\\d'),str(v))): r[k]=v; r.setdefault('reparo',{})[k]=v
        elif len(ruins)>=2 and all(isinstance(r.get(k),str) for k in ruins) and sum(str(r[k]).count('L') for k in ruins)<=3 \
                and pct_ok([k for k in F if k not in ruins],C):
            # vários dígitos ilegíveis na mesma conta: só vale se houver uma única combinação que fecha a soma
            import itertools
            resto=C-sum(r[x] for x in F if x not in ruins)
            pats=[str(r[k]) for k in ruins]
            nL=[p.count('L') for p in pats]
            sols=[]
            for ds in itertools.product('0123456789',repeat=sum(nL)):
                it=iter(ds); vs=[]
                for p in pats: vs.append(int(''.join(next(it) if ch=='L' else ch for ch in p)))
                if sum(vs)==resto: sols.append(vs)
                if len(sols)>1: break
            if len(sols)==1:
                for k,v in zip(ruins,sols[0]): r[k]=v; r.setdefault('reparo',{})[k]=v
    for k in ('eleit','naoc'):
        if not isinstance(r.get(k),int) and isinstance(r.get('comp'),int):
            o='naoc' if k=='eleit' else 'eleit'
            if isinstance(r.get(o),int): r[k]=C+r[o] if k=='eleit' else r[o]-C; r.setdefault('reparo',{})[k]=r[k]
def reparar(r):
    coringa(r)
    if ok(r): return True
    if any(not isinstance(r.get(k),int) for k in K1+K2+['eleit','comp','naoc']): return False
    for C in dict.fromkeys([r['comp'], r['eleit']-r['naoc']]):
        for base in (lambda k,C: C, lambda k,C: (r['mon']+r['rep']) if k in ('mon','rep') else (r['parl']+r['pres']) if k in ('parl','pres') else None):
            f=por_pct(r,C,base)
            t=dict(r); t.update(f); t['comp']=C
            if ok(t):
                r.update(f); r['comp']=C; r['reparo']=f; return True
            # depois do %: um dígito por soma
            fix=dict(f); t2=dict(t); good=True
            for F in (K1,K2):
                s=sum(t2[k] for k in F)
                if s==C: continue
                op=[k for k in F if C-(s-t2[k])>=0 and dist1(t2[k],C-(s-t2[k]))]
                if len(op)==1: fix[op[0]]=C-(s-t2[op[0]]); t2[op[0]]=fix[op[0]]
                else: good=False
            if good and t2['eleit']-t2['naoc']!=C:
                if dist1(t2['eleit'],C+t2['naoc']): fix['eleit']=C+t2['naoc']; t2['eleit']=fix['eleit']
                elif dist1(t2['naoc'],t2['eleit']-C): fix['naoc']=t2['eleit']-C; t2['naoc']=fix['naoc']
            if good and ok(t2) and (C==r['comp'] or dist1(r['comp'],C)) and len(fix)<=4:
                r.update(fix); r['comp']=C; r['reparo']=fix; return True
    return False
if __name__=='__main__':
    out=[];n=g=rep=0
    for f in sys.argv[2:]:
        r=ler(f)
        if not r: continue
        n+=1
        if ok(r): g+=1
        elif reparar(r): rep+=1
        r['ok']=ok(r); r.pop('_T',None)
        out.append(r)
    json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False)
    print(sys.argv[1],'páginas',n,'ok',g,'reparadas',rep,'falhas',n-g-rep)
