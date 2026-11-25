import struct, math
def dbf(path):
    b=open(path,'rb').read()
    n,hl,rl=struct.unpack('<xxxxIHH',b[:12])
    campos=[];o=32
    while b[o]!=0x0D:
        nome=b[o:o+11].split(b'\0')[0].decode('latin1'); tam=b[o+16]; campos.append((nome,tam)); o+=32
    regs=[];o=hl
    for i in range(n):
        r=b[o:o+rl]; p=1; d={}
        for nome,tam in campos: d[nome]=r[p:p+tam].decode('latin1').strip(); p+=tam
        regs.append(d); o+=rl
    return regs
def shp(path):
    b=open(path,'rb').read(); o=100; out=[]
    while o<len(b):
        num,cl=struct.unpack('>ii',b[o:o+8]); o+=8; c=b[o:o+cl*2]; o+=cl*2
        t=struct.unpack('<i',c[:4])[0]
        if t==0: out.append([]); continue
        np_,npt=struct.unpack('<ii',c[36:44]); parts=list(struct.unpack('<%di'%np_,c[44:44+4*np_]))
        pts=struct.unpack('<%dd'%(2*npt),c[44+4*np_:44+4*np_+16*npt])
        pts=[(pts[2*i],pts[2*i+1]) for i in range(npt)]
        rings=[pts[parts[k]:(parts[k+1] if k+1<np_ else npt)] for k in range(np_)]
        out.append(rings)
    return out
A=6378137.0; F=1/298.257222101; E2=F*(2-F); L0=math.radians(-54)
c1=1-E2/4-3*E2**2/64-5*E2**3/256; c2=3*E2/8+3*E2**2/32+45*E2**3/1024; c3=15*E2**2/256+45*E2**3/1024; c4=35*E2**3/3072
def inv(x,y):
    if abs(y)<1e-9: return (math.degrees(x/A+L0),0.0)
    Aa=y/A; B=x*x/A/A+Aa*Aa; f=Aa
    for _ in range(30):
        s2=math.sin(2*f); C=math.sqrt(1-E2*math.sin(f)**2)*math.tan(f)
        M=A*(c1*f-c2*s2+c3*math.sin(4*f)-c4*math.sin(6*f)); Mp=c1-2*c2*math.cos(2*f)+4*c3*math.cos(4*f)-6*c4*math.cos(6*f); Ma=M/A
        d=(Aa*(C*Ma+1)-Ma-0.5*(Ma*Ma+B)*C)/(E2*s2*(Ma*Ma+B-2*Aa*Ma)/(4*C)+(Aa-Ma)*(C*Mp-2/s2)-Mp)
        f-=d
        if abs(d)<1e-12: break
    C=math.sqrt(1-E2*math.sin(f)**2)*math.tan(f)
    l=L0+math.asin(max(-1,min(1,x*C/A)))/math.sin(f)
    return (math.degrees(l),math.degrees(f))
