"""Junta duas UFs vizinhas num anel só (sem GEOS): os vértices de cada anel principal que ficam a menos de `tol` metros do
outro são a divisa comum; o contorno = o trecho de fora de um + o trecho de fora do outro. Os anéis menores (ilhas) ficam."""
import math

def _dist_seg(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1; L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / L))
    return math.hypot(x - x1 - t * dx, y - y1 - t * dy)

def _perto(r, outro, tol):
    # grade simples para não comparar com todos os segmentos
    cel = tol * 4; grade = {}
    for a, b in zip(outro, outro[1:]):
        for gx in range(int(min(a[0], b[0]) // cel) - 1, int(max(a[0], b[0]) // cel) + 2):
            for gy in range(int(min(a[1], b[1]) // cel) - 1, int(max(a[1], b[1]) // cel) + 2):
                grade.setdefault((gx, gy), []).append((a, b))
    return [any(_dist_seg(p, a, b) < tol for a, b in grade.get((int(p[0] // cel), int(p[1] // cel)), ())) for p in r]

def _fora(r, perto):
    """o maior trecho contíguo (cíclico) de vértices fora da divisa, na ordem do anel"""
    n = len(r) - 1  # anel fechado: último = primeiro
    if all(not x for x in perto[:n]): return None
    ini = next(i for i in range(n) if perto[i])
    melhor, atual = [], []
    for k in range(1, n + 1):
        i = (ini + k) % n
        if not perto[i]: atual.append(r[i])
        else:
            if len(atual) > len(melhor): melhor = atual
            atual = []
    return melhor

def area(r): return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(r, r[1:])) / 2

def juntar(aneis_a, aneis_b, tol=3000):
    a = max(aneis_a, key=lambda r: abs(area(r))); b = max(aneis_b, key=lambda r: abs(area(r)))
    fa = _fora(a, _perto(a, b, tol)); fb = _fora(b, _perto(b, a, tol))
    if fa is None or fb is None: return aneis_a + aneis_b
    # o trecho de b começa perto de onde o de a termina
    d = lambda p, q: math.hypot(p[0] - q[0], p[1] - q[1])
    if d(fa[-1], fb[-1]) < d(fa[-1], fb[0]): fb = fb[::-1]
    anel = fa + fb + [fa[0]]
    return [anel] + [r for r in aneis_a if r is not a] + [r for r in aneis_b if r is not b]
