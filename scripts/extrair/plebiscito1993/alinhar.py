# Nome mal lido (fonte da BA): as páginas seguem a ordem alfabética dentro de cada bloco do PDF, então o nome lido é
# alinhado (programação dinâmica, ordem crescente) à lista de municípios; página sem nome legível entre duas páginas
# casadas recebe o município do vão quando o número de páginas e de municípios do vão é o mesmo.
import json, re, difflib, casar3
norm = casar3.norm
def limpa(n):
    n = re.sub(r'^(?:[IL|T]{1,}\s+)+', '', (n or '').strip())
    return re.sub(r'\s{3,}[IL|T]{1,2}$', '', n)
red = lambda x: x.translate(str.maketrans('GDCUQ', 'OOOOO'))
red2 = lambda x: red(x).translate(str.maketrans('BRMNPF', 'OHHHPP'))
def sim(lido, k):
    n = norm(limpa(lido))
    if len(n) < 5: return 0
    return max(difflib.SequenceMatcher(None, k, n).ratio(), difflib.SequenceMatcher(None, red2(k), red2(n)).ratio())
def alinhar(uf, regs, blocos, lista, e93=None, e94=None):
    """regs ordenados por página; blocos = [(primeira, última página)]; lista = [(chave, ibge)] em ordem alfabética"""
    res = {}
    for a, b in blocos:
        P = [r for r in regs if a <= r['arq'] <= b]
        n, m = len(P), len(lista)
        def q(i, j):
            if e94 is None: return 1.0
            b = e94.get(lista[j][1]); return P[i]['eleit'] / b if b else None
        def sc(i, j):
            s = sim(P[i].get('nome'), lista[j][0]); x = q(i, j)
            if x is None or not 0.75 <= x <= 1.7: return 0
            return s + (0.3 if 0.9 <= x <= 1.06 else 0.1 if 0.8 <= x <= 1.25 else 0) if s >= 0.62 else 0
        S = [[sc(i, j) for j in range(m)] for i in range(n)]
        D = [[0.0] * (m + 1) for _ in range(n + 1)]
        for i in range(n - 1, -1, -1):
            for j in range(m - 1, -1, -1):
                s = S[i][j]
                D[i][j] = max(D[i + 1][j], D[i][j + 1], (s + D[i + 1][j + 1]) if s >= 0.62 else -1)
        i = j = 0; par = {}
        while i < n and j < m:
            s = S[i][j]
            if s >= 0.62 and D[i][j] == s + D[i + 1][j + 1]: par[i] = j; i += 1; j += 1
            elif D[i][j] == D[i + 1][j]: i += 1
            else: j += 1
        # vãos
        ks = sorted(par)
        for x, y in zip([-1] + ks, ks + [n]):
            pi = list(range(x + 1, y))
            if not pi: continue
            j0 = par[x] + 1 if x >= 0 else None; j1 = par[y] if y < n else None
            if j0 is None or j1 is None: continue
            if j1 - j0 == len(pi) and all(q(i2, j0 + k) and 0.8 <= q(i2, j0 + k) <= 1.6 for k, i2 in enumerate(pi)):
                for k, i2 in enumerate(pi): par[i2] = j0 + k
        for i, j in par.items(): res[P[i]['arq']] = (lista[j][1], round(S[i][j], 2), lista[j][0])
    return res
