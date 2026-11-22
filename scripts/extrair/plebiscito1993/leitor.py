import sys, glob, re, json, pickle, subprocess, os, numpy as np, cv2
sys.path.insert(0,'.')
from grid import vec
from valores import bloco
km=pickle.load(open('km2.pkl','rb'))
LAB='(597.)32641%0578%86?2?6134?0922)0?65.71(0?:%3'
assert len(LAB)==45, len(LAB)
import os
CLF=pickle.load(open('/tmp/claude-0/pleb/clf.pkl','rb')) if os.path.exists('/tmp/claude-0/pleb/clf.pkl') else None
GLIFOS=[]
def texto(cells):
    s=''
    for x,c in cells:
        if c.sum()<=6: s+=' '; continue
        v=vec(c)
        ch=CLF.predict(v[None])[0] if CLF is not None else LAB[km.predict(v[None])[0]]
        GLIFOS.append((v,ch)); s+=ch
    return s
def num(s):
    m=re.search(r'\d+',s); return int(m.group()) if m else None
def pcts(s):
    m=re.search(r'\(\s*([\d.]+)\s*%',s); 
    try: return float(m.group(1)) if m else None
    except: return None
def nome_ocr(f, linha):
    (a,b),cells,R=linha
    im=cv2.imread(f,0); crop=im[a-4:b+4,:]
    crop=cv2.resize(crop,None,fx=3,fy=3,interpolation=cv2.INTER_CUBIC); crop=cv2.GaussianBlur(crop,(5,5),1.5)
    tmp=f'/tmp/claude-0/pleb/_n{os.getpid()}.png'; cv2.imwrite(tmp,crop)
    t=subprocess.run(['tesseract',tmp,'-','--psm','7','-l','por'],capture_output=True,text=True).stdout.strip()
    m=re.search(r"[A-Z][A-Z' \-]+[A-Z]",t)
    return (m.group(0).strip() if m else t), t
def ler(f):
    b=bloco(f)
    if not b: return None
    L=[(texto(l1),texto(l2)) for l1,l2 in b['linhas']]
    r={'arq':f.split('/')[-1]}
    k=['mon','rep','br1','nu1']; k2=['parl','pres','br2','nu2']
    for i in range(4):
        r[k[i]]=num(L[i][0]); r[k[i]+'%']=pcts(L[i][0]); r[k2[i]]=num(L[i][1]); r[k2[i]+'%']=pcts(L[i][1])
    r['eleit']=num(L[4][0]); r['comp']=num(L[5][0].split('(')[0]); r['naoc']=num(L[6][0])
    r['nome'],r['nome_ocr']=nome_ocr(f,b['nome']) if b['nome'] else ('','')
    r['raw']=L
    return r
def dist1(a,b):
    a,b=str(a),str(b)
    if len(a)==len(b): return sum(x!=y for x,y in zip(a,b))<=1
    if abs(len(a)-len(b))==1:
        l,s_=(a,b) if len(a)>len(b) else (b,a)
        return any(l[:i]+l[i+1:]==s_ for i in range(len(l)))
    return False
def por_pct(r, C):
    fix={}
    for k in ['mon','rep','br1','nu1','parl','pres','br2','nu2']:
        p=r.get(k+'%'); v=r[k]
        if p is None or v is None or C<=0: continue
        if abs(v/C*100-p)<=0.0051: continue
        e=p*C/100
        cs=[x for x in range(int(e)-1,int(e)+3) if x>=0 and abs(x/C*100-p)<=0.0051 and dist1(v,x)]
        if len(cs)==1: fix[k]=cs[0]
    return fix
def reparar(r):
    F1=['mon','rep','br1','nu1']; F2=['parl','pres','br2','nu2']
    if any(r[k] is None for k in F1+F2+['eleit','comp','naoc']): return False
    # 1º: votos que não batem com o percentual impresso (sobre o comparecimento)
    for C in dict.fromkeys([r['comp'], r['eleit']-r['naoc']]):
        f=por_pct(r,C)
        if f:
            t=dict(r); t.update(f)
            if C!=r['comp']: t['comp']=C
            if ok(t): r.update(f); r['comp']=C; r['reparo']=f; return True
    cands=[r['comp']]+([r['eleit']-r['naoc']] if r['eleit']-r['naoc']!=r['comp'] else [])
    for C in cands:
        fix={}
        good=True
        for F in (F1,F2):
            s=sum(r[k] for k in F)
            if s==C: continue
            op=[k for k in F if C-(s-r[k])>=0 and dist1(r[k],C-(s-r[k]))]
            if len(op)==1: fix[op[0]]=C-(s-r[op[0]])
            else: good=False
        if not good: continue
        if r['eleit']-r['naoc']!=C:
            if dist1(r['eleit'],C+r['naoc']): fix['eleit']=C+r['naoc']
            elif dist1(r['naoc'],r['eleit']-C): fix['naoc']=r['eleit']-C
            else: continue
        if C!=r['comp']:
            if not dist1(r['comp'],C): continue
            fix['comp']=C
        if len(fix)<=3:
            r.update(fix); r['reparo']=fix; return True
    return False
def ok(r):
    try:
        c=r['comp']
        return r['mon']+r['rep']+r['br1']+r['nu1']==c and r['parl']+r['pres']+r['br2']+r['nu2']==c and r['eleit']-r['naoc']==c
    except TypeError: return False
if __name__=='__main__':
    n=g=0
    for f in sys.argv[1:]:
        r=ler(f)
        if not r: print(f,'sem bloco'); continue
        n+=1
        if not ok(r): reparar(r)
        g+=ok(r)
        if r.get('reparo'): print('reparo',f,r['reparo'])
        if not ok(r): print(f, r['nome'], [r[x] for x in ['mon','rep','br1','nu1','parl','pres','br2','nu2','eleit','comp','naoc']], r['raw'])
    print(g,'/',n)
