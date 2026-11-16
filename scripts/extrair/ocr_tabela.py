"""Ajuda para tabelas datilografadas lidas por OCR (tesseract): separa os números de uma linha ("1 268 1 391 577",
milhar com espaço ou ponto) e escolhe a divisão em que o total bate com a soma das partes."""
import re, itertools, difflib, json, unicodedata

def grupos(texto):
    """dígitos da linha em grupos (separados por espaço/ponto); letras O/o/l/I no meio de números viram 0/1"""
    t = re.sub(r'(?<=\d)[Oo](?=\d|\b)', '0', texto)
    t = re.sub(r'(?<=\d)[lI](?=\d)', '1', t)
    return re.findall(r'\d+', t)

def divisoes(gs, k):
    """todas as formas de juntar os grupos em k números (cada número = 1-3 dígitos + grupos de 3)"""
    n = len(gs)
    def rec(i, faltam):
        if faltam == 0:
            if i == n: yield []
            return
        for j in range(i + 1, n + 1):
            parte = gs[i:j]
            if len(parte[0]) > 3 and len(parte) > 1: break
            if any(len(p) != 3 for p in parte[1:]): break
            if len(parte) == 1 and len(parte[0]) > 3 and not parte[0].isdigit(): break
            for resto in rec(j, faltam - 1): yield [int(''.join(parte))] + resto
    yield from rec(0, k)

def resolver(gs, k, conferir):
    """primeira divisão em k números que passa em conferir(nums)"""
    for d in divisoes(gs, k):
        if conferir(d): return d
    return None

def chave(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'[^A-Z]', '', s)

def achador_nomes(nomes):
    idx = {chave(n): n for n in nomes}
    def achar(texto, corte=0.75):
        k = chave(texto)
        if not k: return None
        if k in idx: return idx[k]
        m = difflib.get_close_matches(k, idx, n=1, cutoff=corte)
        return idx[m[0]] if m else None
    return achar
