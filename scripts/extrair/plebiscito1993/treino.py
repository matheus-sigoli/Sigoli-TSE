# auto-treino: páginas que fecharam as contas sem reparo dão os dígitos certos de cada célula dos números
# uso: python3 treino3.py saida.pkl uf res1.json res2.json ...
import sys, re, json, pickle, glob, collections, numpy as np
exec(open('scripts/extrair/plebiscito1993/leitor2.py').read().split("if __name__")[0])
import grid as _g
from sklearn.svm import SVC
out, uf = sys.argv[1], sys.argv[2]
K = ['mon', 'rep', 'br1', 'nu1', 'parl', 'pres', 'br2', 'nu2']
regs = {}
for f in sys.argv[3:]:
    for r in json.load(open(f)):
        if r['ok'] and not r.get('reparo'): regs[r['arq']] = r
X, Y = [], []
usadas = 0
for arq, r in sorted(regs.items()):
    alvo = {k: r[k] for k in K + ['eleit', 'comp', 'naoc']}
    for fz in (None, 1.0, 0.94, 1.06, 0.88, 1.12):
        _g.FORCA = fz
        try:
            T = linhas_texto(f'img/{uf}/{arq}')
        except Exception:
            continue
        S = [t for ab, c, t in T]
        # acha as linhas do bloco: a linha cujos números lidos (com coringas) casam com os valores certos
        achou = 0; xs = []; ys = []
        for (ab, cells, t) in T:
            for m in re.finditer(r'(?<![\dL(.])([\dL]*\d[\dL]*)(?![\dL.%])', t):
                tok = m.group(1)
                cand = [v for v in alvo.values() if len(str(v)) == len(tok) and all(a == 'L' or a == b or True for a, b in zip(tok, str(v)))]
                # aceita se no máximo 1 dígito difere de um dos valores certos
                cand = [v for v in alvo.values() if len(str(v)) == len(tok) and sum(a != b for a, b in zip(tok, str(v))) <= 1]
                if len(set(cand)) != 1: continue
                v = str(cand[0])
                for i, ch in enumerate(v):
                    x, c = cells[m.start() + i]
                    if c.sum() > 6: xs.append(vec(c)); ys.append(ch)
                achou += 1
        if achou >= 9:
            # letras e pontuação das mesmas linhas, pelo modelo atual (para o modelo novo não esquecer)
            for (ab, cells, t) in T:
                for i, ch in enumerate(t):
                    if ch in 'L.:()%' and cells[i][1].sum() > 6 and np.random.rand() < 0.15:
                        xs.append(vec(cells[i][1])); ys.append(ch)
            X += xs; Y += ys; usadas += 1
            break
    _g.FORCA = None
print('páginas usadas', usadas, collections.Counter(Y))
pickle.dump((np.array(X), np.array(Y)), open(out + '.dados', 'wb'))
