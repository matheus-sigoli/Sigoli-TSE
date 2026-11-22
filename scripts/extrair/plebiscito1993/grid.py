import numpy as np, cv2, sys
def endireita(ink):
    small=cv2.resize(ink*255,None,fx=0.5,fy=0.5,interpolation=cv2.INTER_AREA)
    h,w=small.shape; best=(0,0)
    for ang in np.arange(-2.0,2.01,0.1):
        M=cv2.getRotationMatrix2D((w/2,h/2),ang,1)
        r=cv2.warpAffine(small,M,(w,h))
        sc=np.var(r.sum(1))
        if sc>best[0]: best=(sc,ang)
    ang=best[1]
    if abs(ang)<0.05: return ink
    H,W=ink.shape; M=cv2.getRotationMatrix2D((W/2,H/2),ang,1)
    return (cv2.warpAffine(ink*255,M,(W,H),flags=cv2.INTER_NEAREST)>127).astype(np.uint8)
def altura(b):
    d=cv2.dilate(b,np.ones((3,3),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(d,8)
    h=st[1:,3]; w=st[1:,2]
    hs=h[(h>=8)&(h<=60)&(w>=4)&(w<=h*1.3)]
    return float(np.median(hs)) if len(hs)>=20 else None
def entrelinha(ink):
    r=ink.sum(1).astype(float); r-=r.mean()
    ac=np.correlate(r,r,'full')[len(r)-1:]
    H=len(r); lo=max(8,H//400); hi=H//20
    k=lo+int(np.argmax(ac[lo:hi]))
    # refina com o 4º múltiplo
    j0=max(lo,4*k-8); j=j0+int(np.argmax(ac[j0:4*k+9]))
    return j/4
FORCA=None
def limpa(path):
    im=cv2.imread(path,cv2.IMREAD_GRAYSCALE)
    b=(im<128).astype(np.uint8)
    if max(b.shape)>2600:
        f=2600/max(b.shape); b=(cv2.resize(b.astype(np.float32),None,fx=f,fy=f,interpolation=cv2.INTER_AREA)>0.3).astype(np.uint8)
    p=altura(b)
    if FORCA is not None:
        if FORCA!=1.0: b=(cv2.resize(b.astype(np.float32),None,fx=FORCA,fy=FORCA,interpolation=cv2.INTER_AREA if FORCA<1 else cv2.INTER_LINEAR)>0.35).astype(np.uint8)
    elif p and abs(p-17)>=1:
        f=17/p; b=(cv2.resize(b.astype(np.float32),None,fx=f,fy=f,interpolation=cv2.INTER_AREA)>0.35).astype(np.uint8)
    # tarjas pretas da digitalização (borda da página): colunas e linhas quase todas pretas
    cm=b.mean(0); b[:,cm>0.6]=0
    k=np.where(cm>0.6)[0]
    if len(k):
        # alarga a faixa (a borda da tarja é ruidosa)
        for x in k: b[:,max(0,x-6):x+7]=0
    rm=b.mean(1); b[rm>0.6,:]=0
    ink=endireita(b)
    d=cv2.dilate(ink,np.ones((3,3),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(d,8)
    big=[i for i in range(1,n) if st[i][2]>80 or st[i][3]>28]
    if big: ink[np.isin(lab,big)]=0
    return ink
def linhas(ink):
    r=ink.sum(1).astype(float)
    r=np.convolve(r,np.ones(3)/3,'same')
    on=r>2
    L=[];y=0;H=len(r)
    while y<H:
        if on[y]:
            y0=y
            while y<H and on[y]: y+=1
            h=y-y0
            if h>=9:
                k=max(1,round(h/24))
                for j in range(k): L.append((y0+j*h//k, y0+(j+1)*h//k))
        else: y+=1
    return L
def pitch_x0(band):
    c=band.sum(0).astype(float)
    best=None
    for p in np.arange(13.0,17.0,0.05):
        # phase: fold columns
        idx=(np.arange(len(c))%p)
        h=np.histogram(idx,bins=int(round(p*4)),range=(0,p),weights=c)[0]
        sc=h.max()-h.min()
        if best is None or sc>best[0]: best=(sc,p,h)
    return best[1]
if __name__=='__main__':
    ink=limpa(sys.argv[1]); L=linhas(ink)
    print(len(L)); 
    allb=np.vstack([ink[a:b] for a,b in L if b-a>12][:30])
    print('pitch',pitch_x0(allb))

P=15
def celulas(ink, L):
    out=[]
    for (a,b) in L:
        band=ink[a:b]
        if band.sum()<20: continue
        c=band.sum(0).astype(float)
        fold=np.array([c[k::P].sum() for k in range(P)])
        ph=int(np.argmin(np.convolve(np.r_[fold,fold],np.ones(2),'same')[:P]))
        cells=[];x=ph
        while x+P<=band.shape[1]:
            cells.append((x,band[:,x:x+P])); x+=P
        out.append(((a,b),cells))
    return out
def vec(cell, H=22):
    # pad/crop vertically to H around content of the band (band height ~18-24)
    h=cell.shape[0]
    if h>=H: c=cell[(h-H)//2:(h-H)//2+H]
    else:
        pad=H-h; c=np.pad(cell,((pad//2,pad-pad//2),(0,0)))
    c=cv2.GaussianBlur(c.astype(np.float32),(3,3),0.8)
    return c.flatten()
