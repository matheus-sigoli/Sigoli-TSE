#!/usr/bin/env python3
"""
Listagem do SERPRO "Demonstrativo da votação do candidato" (VP-003/VP-001), Eleições 1990: para cada candidato, os
votos e o comparecimento por município (a capital por zona). Lê o OCR das páginas (tesseract, um .txt por página e
por pedaço: H = cabeçalho, L/R = colunas) e grava data/tre/{ano}/{uf}.csv.
Conferência: votos ÷ comparecimento = percentual impresso; o comparecimento do município é o mesmo para todos os
candidatos (vale o mais frequente); a soma de cada candidato tem de bater com a VOTAÇÃO TOTAL impressa.
Uso: python3 scripts/extrair/serpro-vp003.py --ocr <pasta com os .txt> --uf pa --ano 1990 --fonte "..."
"""
import argparse, collections, difflib, glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import chave, gravar
import json

a = argparse.ArgumentParser()
a.add_argument('--ocr'); a.add_argument('--uf'); a.add_argument('--ano', type=int); a.add_argument('--fonte'); a.add_argument('--capital')
a.add_argument('--saida'); a.add_argument('--eleitos', default=''); a.add_argument('--cargos')
a = a.parse_args()
CARGOS = {'GOVERNADOR': 'governador', 'SENADOR': 'senador', 'DEPUTADO FEDERAL': 'deputado-federal', 'DEPUTADO ESTADUAL': 'deputado-estadual'}
lista = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] == a.uf]
nomes = {chave(m['nome']): m['ibge'] for m in lista}

def dig(s):
    s = s.replace('O', '0').replace('o', '0').replace('§', '5').replace('$', '5').replace('B', '8').replace('S', '5').replace('I', '1').replace('l', '1').replace(' ', '')
    return s

def inteiro(s):
    s = dig(s).replace('.', '').replace(',', '')
    return int(s) if s.isdigit() else None

def municipio(nome):
    k = chave(re.sub(r'\b0\b|\b00\b|\bOO\b|\b0O\b|\bO0\b', 'DO', nome))
    if k in nomes: return nomes[k]
    # trocas comuns do OCR nessa fonte: V↔D, Y↔U, U↔J, 0↔O, W↔D
    for t in (k, k.replace('0', 'O'), k.replace('V', 'D').replace('Y', 'U').replace('W', 'D').replace('0', 'O')):
        if t in nomes: return nomes[t]
        m = difflib.get_close_matches(t, nomes, n=1, cutoff=0.8)
        if m: return nomes[m[0]]
    t = k.replace('V', 'D').replace('Y', 'U').replace('W', 'D').replace('0', 'O')
    m = difflib.get_close_matches(t, nomes, n=1, cutoff=0.72)
    return nomes[m[0]] if m and len(t) >= 5 else None

LINHA = re.compile(r"([A-Z][A-Z0-9 .'§$-]*?[A-Z])\s+[|:.,‘'~-]*\s*([\dOoS§$B.,]{1,9})\s+[|:.,~-]*\s*([\dOoS§$B.,]{1,9})\s+[|:.,~-]*\s*(\d{1,3}[,.]\s?\d\d)")
ZONA = re.compile(r'(?<![\d.])([0OoQ][0-9Oo][0-9Oo])\s+([\dOoS§$B.,]{1,9})\s+([\dOoS§$B.,]{1,9})\s+(\d{1,3}[,.]\d\d)')
pendentes = []
cands = {}  # numero → {cargo, partido, nome, total, mun: {ibge: [(v, comp, pct)]}}
desconhecidos = collections.Counter()
anterior = None
paginas = sorted({os.path.basename(f)[:3] for f in glob.glob(f'{a.ocr}/*-H.txt')})
for p in paginas:
    h = open(f'{a.ocr}/{p}-H.txt', errors='replace').read()
    m = re.search(r'CARGO\s+(.+?)\s+PART[I1]\w{1,4}\s*[-~=.]+\s*([A-Z0-9]+).*?NUMER[O0]\s*[-~=.<]+\s*([\dtlIO ]+)', h)
    if not m: continue
    cargo = next((v for k, v in CARGOS.items() if chave(k) in chave(m.group(1))), None)
    if not cargo:
        mm = difflib.get_close_matches(chave(m.group(1)), [chave(k) for k in CARGOS], n=1, cutoff=0.75)
        cargo = next((v for k, v in CARGOS.items() if mm and chave(k) == mm[0]), None)
    num = re.sub('[tlI]', '1', m.group(3).replace(' ', '').strip()).replace('O', '0')
    DIG = {'governador': 2, 'senador': 3, 'deputado-federal': 4, 'deputado-estadual': 5}
    n2 = re.search(r'NOME\s*[-~]+\s*(.+?)\s+V[O0]TAC[A4G][O0QG]\s+T[O0]TAL\s*[-~—]+\s*([\d.]+)', h)
    nome_pag = chave(n2.group(1)) if n2 else ''
    # segunda página do mesmo candidato com o número mal lido: vale o da página anterior (mesmo nome)
    if cargo and len(num) != DIG[cargo]:
        if anterior and anterior[0][0] == cargo and nome_pag and difflib.SequenceMatcher(None, nome_pag, anterior[1]).ratio() > 0.8: num = anterior[0][1]
        elif len(num) > DIG[cargo]: num = num[:DIG[cargo]]
        print(f'  · página {p}: número corrigido para {num}')
    anterior = ((cargo, num), nome_pag)
    c = cands.setdefault((cargo, num), {'cargo': cargo, 'partido': m.group(2).replace('0', 'O'), 'nome': n2.group(1).strip() if n2 else '', 'total': inteiro(n2.group(2)) if n2 else None, 'mun': collections.defaultdict(set), 'zonas': {}})
    if n2 and not c['nome']: c['nome'] = n2.group(1).strip()
    texto = h + '\n' + open(f'{a.ocr}/{p}-L.txt', errors='replace').read() + '\n' + open(f'{a.ocr}/{p}-R.txt', errors='replace').read()
    for l in texto.splitlines():
        if 'ZONA' not in l and 'CAPITAL' not in l:
            for z in ZONA.finditer(l):
                if not re.search(r'[A-Z]{3}', l[:z.start()]):
                    c['zonas'][re.sub('[OoQ]', '0', z.group(1))] = (inteiro(z.group(2)), inteiro(z.group(3)), float(z.group(4).replace(',', '.').replace(' ', '')))
        for x in LINHA.finditer(l):
            nome = x.group(1).strip()
            if re.search(r'NOME|MUNICIP|VOTOS|COMPAREC|CARGO|PARTIDO|TOTAL|CLASSIF', nome): continue
            ib = municipio(nome)
            if not ib: pendentes.append((c, nome, x)); continue
            c['mun'][ib].add((inteiro(x.group(2)), inteiro(x.group(3)), float(x.group(4).replace(',', '.').replace(' ', ''))))

# comparecimento do município: o mais frequente entre os candidatos (e entre os pedaços do OCR)
comp = collections.defaultdict(collections.Counter)
for c in cands.values():
    for ib, s in c['mun'].items():
        for v, cp, pc in s:
            if cp: comp[ib][cp] += 1
    for z, (v, cp, pc) in c['zonas'].items():
        if cp: comp['Z' + z][cp] += 1
COMP = {ib: cnt.most_common(1)[0][0] for ib, cnt in comp.items()}
# linha com o nome ilegível: o comparecimento (igual para todos os candidatos) identifica o município
por_comp = collections.defaultdict(set)
for ib, cp in COMP.items():
    if not ib.startswith('Z'): por_comp[cp].add(ib)
for c, nome, x in pendentes:
    cp = inteiro(x.group(3)); ibs = por_comp.get(cp, set())
    if len(ibs) == 1: c['mun'][next(iter(ibs))].add((inteiro(x.group(2)), cp, float(x.group(4).replace(',', '.').replace(' ', ''))))
    else: desconhecidos[nome] += 1

def variantes(v):
    """o número lido e os que saem tirando um dígito a mais (o OCR às vezes junta um traço ou um ponto como dígito)"""
    if v is None: return []
    t = str(v); out = [v]
    for i in range(len(t)):
        u = t[:i] + t[i + 1:]
        if u: out.append(int(u))
    return out

def votos(s, cp):
    """o voto que bate com o percentual impresso; se nenhum bate, o calculado pelo percentual (aproximado)"""
    if not cp: return None, False
    pcts = [pc for v, c2, pc in s if pc is not None and 0 <= pc <= 100]
    pcts += [pc / 10 for v, c2, pc in s if pc is not None and 100 < pc < 1000]
    lidos = [v for v, c2, pc in s if v is not None]
    for v in lidos:
        if v <= cp and any(abs(round(100 * v / cp, 2) - pc) < 0.006 for pc in pcts): return v, True
    for v in lidos:
        for w in variantes(v)[1:]:
            if w <= cp and any(abs(round(100 * w / cp, 2) - pc) < 0.006 for pc in pcts): return w, True
    if pcts:
        pc = collections.Counter(pcts).most_common(1)[0][0]
        w = round(pc * cp / 100)
        for v in lidos:
            if abs(v - w) <= cp / 10000 + 1: return v, True
        return w, False
    return (lidos[0] if lidos and lidos[0] <= cp else None), False

capital = a.capital
pref = collections.defaultdict(collections.Counter)
for (cg, num), c in cands.items(): pref[num[:2]][c['partido']] += 1
for (cg, num), c in cands.items(): c['partido'] = pref[num[:2]].most_common(1)[0][0]
import itertools
_cz = collections.Counter(z for c in cands.values() for z in c['zonas'])
ZONAS = sorted(z for z, n in _cz.items() if n >= max(3, len(cands) // 4))  # zona lida em poucos candidatos = erro do OCR
for c in cands.values(): c['zonas'] = {z: v for z, v in c['zonas'].items() if z in ZONAS}
linhas, eleitos, rel = [], set(), []
for (cg, num), c in cands.items():
    if not c['cargo']: continue
    # cada unidade (município ou zona da capital): valor escolhido e, se não bateu com o percentual, as alternativas
    unid = {}
    for ib, s in c['mun'].items():
        v, ok = votos(s, COMP.get(ib))
        if v is None: continue
        alt = set()
        if not ok:
            cp = COMP.get(ib)
            for x, c2, pc in s:
                alt.update(w for w in variantes(x) if w <= cp)
                for pc2 in (pc, pc / 10 if pc and pc > 100 else None):
                    if pc2 is not None and pc2 <= 100:
                        w = round(pc2 * cp / 100); alt.update(range(max(0, w - int(cp / 10000) - 1), w + int(cp / 10000) + 2))
        unid[ib] = (v, ok, alt)
    for z, (v, cp, pc) in c['zonas'].items():
        cpz = COMP.get('Z' + z, cp)
        v2, ok = votos({(v, cp, pc)}, cpz)
        alt = set()
        if not ok and cpz:
            alt.update(w for w in variantes(v) if w <= cpz)
            if pc is not None and pc <= 100:
                w = round(pc * cpz / 100); alt.update(range(max(0, w - int(cpz / 10000) - 1), w + int(cpz / 10000) + 2))
        unid['Z' + z] = (v2 or 0, ok, alt)
    soma = sum(v for v, ok, alt in unid.values())
    # unidades que faltam (governador e senador têm voto em todo lugar): zonas da capital e municípios
    falta = (['Z' + z for z in ZONAS if 'Z' + z not in unid] + [ib for ib in COMP if not ib.startswith('Z') and ib not in unid]) if c['cargo'] in ('governador', 'senador') else []
    ajuste = ''
    if os.environ.get('FALTA') == num: print('falta', falta, 'zonas', ZONAS, 'soma', soma, c['total'])
    if c['total'] and soma != c['total']:
        dif = c['total'] - soma
        duv = [k for k, (v, ok, alt) in unid.items() if not ok and alt]
        if len(falta) == 1 and 0 < dif <= COMP.get(falta[0], 10**9):
            unid[falta[0]] = (dif, False, set()); ajuste = f'{falta[0]} = diferença'
        elif duv and len(duv) <= 4:
            # escolhe, entre as alternativas das unidades duvidosas, a combinação que fecha com o total impresso
            base = soma - sum(unid[k][0] for k in duv)
            opcoes = [sorted(unid[k][2] | {unid[k][0]}) for k in duv]
            achou = [comb for comb in itertools.product(*opcoes) if base + sum(comb) == c['total']] if all(len(o) < 60 for o in opcoes) else []
            if achou:
                # prefere a que mais se aproxima do valor lido
                melhor = min(achou, key=lambda comb: sum(abs(x - unid[k][0]) for x, k in zip(comb, duv)))
                for x, k in zip(melhor, duv): unid[k] = (x, True, set())
                ajuste = f'{len(duv)} unidades acertadas pelo total'
    soma = sum(v for v, ok, alt in unid.values())
    vz = sum(v for k, (v, ok, alt) in unid.items() if k.startswith('Z'))
    for k, (v, ok, alt) in unid.items():
        if not k.startswith('Z'): linhas.append((c['cargo'], 1, k, num, c['nome'], c['partido'], v))
    if vz or any(k.startswith('Z') for k in unid): linhas.append((c['cargo'], 1, capital, num, c['nome'], c['partido'], vz))
    rel.append((c['cargo'], num, c['nome'], soma, c['total'], sum(1 for v, ok, alt in unid.values() if not ok), len(unid), ajuste))
for cargo in set(c['cargo'] for c in cands.values() if c['cargo']):
    ibs = {ib for ib in COMP if not ib.startswith('Z')}
    for ib in ibs: linhas.append((cargo, 1, ib, '#comparecimento', '', '', COMP[ib]))
    zc = sum(v for k, v in COMP.items() if k.startswith('Z'))
    if zc: linhas.append((cargo, 1, capital, '#comparecimento', '', '', zc))
eleitos = {}
for e in a.eleitos.split(','):
    if e.count(':') == 2: cg, n, f = e.split(':'); eleitos[(cg, n)] = f
a.cargos = set((a.cargos or ','.join(CARGOS.values())).split(','))
linhas = [l for l in linhas if l[0] in a.cargos]
ruins = [r for r in rel if r[4] and r[3] != r[4]]
for r in sorted(rel):
    if r[4] and r[3] != r[4]: print(f'  ⚠ {r[0]} {r[1]} {r[2]}: soma {r[3]} ≠ total impresso {r[4]} ({r[5]} aproximados, {r[6]} unidades) {r[7]}')
print(f'{len(rel)} candidatos, {len(ruins)} com soma diferente do total; municípios com comparecimento: {sum(1 for k in COMP if not k.startswith("Z"))}')
if desconhecidos: print('nomes não reconhecidos:', desconhecidos.most_common(15))
if a.saida: gravar(a.saida, linhas, eleitos, a.fonte)
if os.environ.get('DEPURAR'):
    c = next(v for (cg, n), v in cands.items() if n == os.environ['DEPURAR'])
    print('zonas', c['zonas'])
    nm = {m['ibge']: m['nome'] for m in lista}
    for ib, s in sorted(c['mun'].items(), key=lambda x: nm[x[0]]): print(nm[ib], s, COMP.get(ib))
if os.environ.get('LISTAR'):
    ref = set(json.load(open(os.environ['LISTAR']))['mun'])
    nm = {m['ibge']: m['nome'] for m in lista}
    print('no arquivo de referência e não aqui:', [nm.get(i, i) for i in ref - set(COMP) - {capital}])
    print('aqui e não na referência:', [nm.get(i, i) for i in set(COMP) - ref if not i.startswith('Z')])
