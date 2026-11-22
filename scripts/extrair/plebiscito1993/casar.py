# rodar da raiz do repositório
import sys, json, re, difflib, unicodedata, collections
def norm(s): return re.sub(r'[^A-Z]','',unicodedata.normalize('NFKD',s.upper()).encode('ascii','ignore').decode())
def casar(uf, regs, manual={}):
    mun=[m for m in json.load(open('public/data/2026/municipios.json')) if m['uf']==uf]
    nomes={norm(m['nome']):m['ibge'] for m in mun}
    # grafias da época / do relatório
    ALIAS={'BRODOSQUI':'BRODOWSKI','EMBU':'EMBUDASARTES','IPAUCU':'IPAUSSU','PARATI':'PARATY','GUARVJA':'GUARUJA','BOMJESUSDEGOIAS':'BOMJESUS','TEREZINHADEGOIAS':'TERESINADEGOIAS','MUNDONOVODEGOIAS':'MUNDONOVO','PICARRAS':'BALNEARIOPICARRAS','ALAGOINHA':'ALAGOINHADOPIAUI','ALAGGINHA':'ALAGOINHADOPIAUI','BARRADOSUL':'BALNEARIOBARRADOSUL','BARRADDSUL':'BALNEARIOBARRADOSUL'}
    for r in regs:
        if r['arq'] in manual: r['ibge']=manual[r['arq']]; r['casou']='manual'; continue
        nm=re.sub(r'^(?:[IL|T]{1,}\s+)+','',(r.get('nome') or '').strip())
        nm=re.sub(r'\s{3,}[IL|T]{1,2}$','',nm)
        n=norm(nm)
        n=ALIAS.get(n,n).replace('MOJI','MOGI')
        # O/G, D/O confusões comuns
        # a impressora confunde as letras redondas (O, G, D, C, U, Q) e as finas (I, L, T): compara também sem distinguir
        red=lambda x: x.translate(str.maketrans('GDCUQ','OOOOO'))
        rn=red(n)
        ex=[ib for k,ib in nomes.items() if red(k)==rn]
        if len(ex)==1 and n not in nomes: r['ibge']=ex[0]; r['casou']='redondas'; continue
        sc=[]
        for k,ib in nomes.items():
            s=max(difflib.SequenceMatcher(None,k,n).ratio(), difflib.SequenceMatcher(None,red(k),rn).ratio()-0.02)
            sc.append((s,k,ib))
        sc.sort(reverse=True)
        if sc and (sc[0][0]==1.0 or (sc[0][0]>=0.75 and sc[0][0]-sc[1][0]>=0.04)): r['ibge']=sc[0][2]; r['casou']=round(sc[0][0],3)
        else: r['ibge']=None; r['casou']=0; r['opcoes']=[(round(a,2),b) for a,b,c in sc[:3]]
    c=collections.Counter(r['ibge'] for r in regs if r.get('ibge'))
    dup={k for k,v in c.items() if v>1}
    return [r for r in regs if not r.get('ibge')], {k:[(r['arq'],r['nome'],r['casou']) for r in regs if r.get('ibge')==k] for k in dup}
if __name__=='__main__':
    uf=sys.argv[1]; regs=[]
    for f in sys.argv[2:]: regs+=json.load(open(f))
    regs=[r for r in regs if r['ok']]
    MAN={'sp':{'p-020.png':'3514957'},'pi':{'p-032.png':'2201960','p-132.png':'2209609'}}
    sem,dup=casar(uf,regs,{k:v for k,v in MAN.get(uf,{}).items()})
    print(uf,'páginas ok',len(regs),'casadas',sum(1 for r in regs if r.get('ibge')),'sem',len(sem),'dup',len(dup))
    for r in sem: print('  sem',r['arq'],repr(r['nome']),r.get('opcoes'))
    for k,v in dup.items(): print('  dup',k,v)

def salvar(uf, regs, ref=None):
    regs=[r for r in regs if r.get('ibge')]
    K=['mon','rep','br1','nu1','parl','pres','br2','nu2','eleit','comp']
    tot={k:sum(r[k] for r in regs) for k in K}
    print('soma',tot)
    if ref: print('ref ',ref, {k:tot[k]-ref[k] for k in ref})
    pre={m['uf']:m['ibge'][:2] for m in json.load(open('public/data/2026/municipios.json'))}[uf]
    a94={k for k in json.load(open('public/data/1994/presidente/1/br.json'))['mun'] if k.startswith(pre)}
    nomes={m['ibge']:m['nome'] for m in json.load(open('public/data/2026/municipios.json'))}
    print('municípios de 1994 sem resultado:',len(a94-{r['ibge'] for r in regs}), [(k,nomes.get(k)) for k in sorted(a94-{r['ibge'] for r in regs})][:30])
    out=[{'ibge':r['ibge'],'nome_lido':r['nome'],'pagina':r['arq'],**{k:r[k] for k in K+['naoc'] if k in r},**({'reparo':r['reparo']} if r.get('reparo') else {})} for r in sorted(regs,key=lambda r:r['ibge'])]
    import os; os.makedirs('data/tre/fontes/plebiscito-1993',exist_ok=True)
    json.dump(out,open(f'data/tre/fontes/plebiscito-1993/{uf}.json','w'),ensure_ascii=False,indent=0)
