import numpy as np
from grid import *
def runs(cells):
    s=[c.sum()>6 for x,c in cells]
    R=[];i=0
    while i<len(s):
        if s[i]:
            j=i
            while j<len(s) and (s[j] or (j+1<len(s) and s[j+1] and not s[j-1]==False)): j+=1
            R.append((i,j)); i=j
        else: i+=1
    return R
def estrutura(f):
    ink=limpa(f); L=linhas(ink); C=celulas(ink,L)
    info=[]
    for (ab,cells) in C:
        s=[c.sum()>6 for x,c in cells]
        # runs allowing single gaps
        R=[];i=0;n=len(s)
        while i<n:
            if s[i]:
                j=i
                while j<n and (s[j] or (j+1<n and s[j+1])): j+=1
                R.append((i,j)); i=j
            else: i+=1
        info.append((ab,cells,R))
    dados=[k for k,(ab,cells,R) in enumerate(info) if sum(1 for a,b in R if b-a>=16)>=2]
    return info,dados
if __name__=='__main__':
    import sys
    for f in sys.argv[1:]:
        info,d=estrutura(f); print(f,d,[info[k][0][0] for k in d])
