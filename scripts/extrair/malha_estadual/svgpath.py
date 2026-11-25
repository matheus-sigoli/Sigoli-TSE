import re, math
def tokens(d):
    for m in re.finditer(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', d): yield m.group(0)
def parse(d, passo=4):
    """anéis (listas de pontos) de um 'd' de SVG; curvas amostradas"""
    t=list(tokens(d)); i=0; cmd=None; x=y=0; sx=sy=0; aneis=[]; cur=[]; lc=None
    def num():
        nonlocal i; v=float(t[i]); i+=1; return v
    while i<len(t):
        if re.match(r'[A-Za-z]',t[i]): cmd=t[i]; i+=1
        rel=cmd.islower(); C=cmd.upper()
        if C=='Z':
            if cur: aneis.append(cur); cur=[]
            x,y=sx,sy; lc=None; continue
        if C=='M':
            nx,ny=num(),num()
            if rel: nx+=x; ny+=y
            if cur: aneis.append(cur)
            x,y=nx,ny; sx,sy=x,y; cur=[(x,y)]; cmd='l' if rel else 'L'; lc=None; continue
        if C=='L':
            nx,ny=num(),num()
            if rel: nx+=x; ny+=y
            x,y=nx,ny; cur.append((x,y)); lc=None; continue
        if C=='H':
            nx=num(); x=nx+x if rel else nx; cur.append((x,y)); lc=None; continue
        if C=='V':
            ny=num(); y=ny+y if rel else ny; cur.append((x,y)); lc=None; continue
        if C in 'CS':
            if C=='C': x1,y1=num(),num()
            x2,y2,nx,ny=num(),num(),num(),num()
            if rel:
                if C=='C': x1+=x; y1+=y
                x2+=x; y2+=y; nx+=x; ny+=y
            if C=='S': x1,y1=(2*x-lc[0],2*y-lc[1]) if lc else (x,y)
            for k in range(1,passo+1):
                s=k/passo; a=(1-s)**3; b=3*(1-s)**2*s; c=3*(1-s)*s*s; e=s**3
                cur.append((a*x+b*x1+c*x2+e*nx, a*y+b*y1+c*y2+e*ny))
            lc=(x2,y2); x,y=nx,ny; continue
        if C in 'QT':
            if C=='Q': x1,y1=num(),num()
            nx,ny=num(),num()
            if rel:
                if C=='Q': x1+=x; y1+=y
                nx+=x; ny+=y
            if C=='T': x1,y1=(2*x-lc[0],2*y-lc[1]) if lc else (x,y)
            for k in range(1,passo+1):
                s=k/passo; cur.append(((1-s)**2*x+2*(1-s)*s*x1+s*s*nx,(1-s)**2*y+2*(1-s)*s*y1+s*s*ny))
            lc=(x1,y1); x,y=nx,ny; continue
        if C=='A':
            num();num();num();num();num(); nx,ny=num(),num()
            if rel: nx+=x; ny+=y
            x,y=nx,ny; cur.append((x,y)); lc=None; continue
        raise ValueError(cmd)
    if cur: aneis.append(cur)
    return aneis
