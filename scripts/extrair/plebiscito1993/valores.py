import numpy as np
from estr import estrutura
def bloco(f):
    info,d=estrutura(f)
    st=None
    for i in range(len(d)-3):
        if d[i+3]-d[i]==3: st=d[i]; break
    if st is None: return None
    out={'linhas':[]}
    for k in range(st,st+4):
        ab,cells,R=info[k]
        big=[r for r in R if r[1]-r[0]>=16]
        c0=big[0][0]
        out['linhas'].append(([cells[j] for j in range(c0+18,min(c0+39,len(cells)))],[cells[j] for j in range(c0+57,len(cells))]))
    for k in range(st+4,st+7):
        if k>=len(info): return None
        ab,cells,R=info[k]
        big=[r for r in R if r[1]-r[0]>=12]
        if not big: return None
        c0=big[0][0]
        out['linhas'].append(([cells[j] for j in range(c0+28,len(cells))],[]))
    out['nome']=info[st-4] if st>=4 else None
    return out
