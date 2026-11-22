import sys, json, re, pickle, unicodedata, numpy as np, os
sys.path.insert(0,'/tmp/claude-0/pleb')
from valores import bloco
from grid import vec
def norm_up(s): return unicodedata.normalize('NFKD',s.upper()).encode('ascii','ignore').decode()
def celulas_nome(f):
    b=bloco(f)
    if not b or not b['nome']: return None
    ab,cells,R=b['nome']
    if not R: return None
    c0=R[0][0]
    return cells[c0+31:]
CL=pickle.load(open('/tmp/claude-0/pleb/clfn.pkl','rb')) if os.path.exists('/tmp/claude-0/pleb/clfn.pkl') else None
def ler_nome(f):
    cs=celulas_nome(f)
    if cs is None: return None
    s=''
    for x,c in cs:
        if c.sum()<=6: s+=' '
        else: s+=CL.predict(vec(c)[None])[0] if CL is not None else '#'
    return s.strip()
if __name__=='__main__' and sys.argv[1]=='treinar':
    from sklearn.svm import SVC
    regs=json.load(open(sys.argv[2]))
    mun={m['ibge']:m['nome'] for m in json.load(open('/home/claude/SigoliTSE/public/data/2026/municipios.json'))}
    X=[];Y=[];n=0
    for r in regs:
        if r.get('casou')!=1.0: continue
        nome=norm_up(mun[r['ibge']]).replace('-',' ')
        cs=celulas_nome('/tmp/claude-0/pleb/'+sys.argv[3]+'/'+r['arq'])
        if cs is None: continue
        pat=''.join(' ' if c.sum()<=6 else '#' for x,c in cs).strip()
        alvo=re.sub(r'\S','#',nome)
        if pat!=alvo: continue
        n+=1
        st=next(i for i,(x,c) in enumerate(cs) if c.sum()>6)
        for (x,c),ch in zip(cs[st:],nome):
            if ch!=' ': X.append(vec(c)); Y.append(ch)
    print('nomes usados',n,'letras',len(X),sorted(set(Y)))
    pickle.dump(SVC(C=10,gamma='scale').fit(np.array(X),np.array(Y)),open('/tmp/claude-0/pleb/clfn.pkl','wb'))
