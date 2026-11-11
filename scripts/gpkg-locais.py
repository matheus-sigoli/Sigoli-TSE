#!/usr/bin/env python3
"""
Sigoli.TSE — áreas dos locais de votação (GeoPackage por município, pasta "locais novo") → JSON compacto por cidade.

Cada .gpkg tem a camada `locais_unificado`: um polígono por endereço de votação (ID_SITIO), com os locais que
votam ali em LOCAIS ("zona-local;zona-local"), CD_MUN (IBGE) e CD_MUN_TSE. Este passo só lê a geometria (GPKG/WKB),
arredonda as coordenadas a 1e-5° (~1 m) e grava {uf}/{ibge}.json para o scripts/areas-gpkg.mjs montar a topologia.

Uso: python3 scripts/gpkg-locais.py PASTA_GPKG PASTA_SAIDA [arquivos...]
"""
import json, os, sqlite3, struct, sys

def wkb(b, o=0):
    """WKB (2D, little ou big endian) → lista de polígonos [[anel [[x, y]...]]...]."""
    e = '<' if b[o] == 1 else '>'
    t = struct.unpack_from(e + 'I', b, o + 1)[0] % 1000
    o += 5
    if t == 3:
        n = struct.unpack_from(e + 'I', b, o)[0]; o += 4
        aneis = []
        for _ in range(n):
            k = struct.unpack_from(e + 'I', b, o)[0]; o += 4
            xy = struct.unpack_from(e + 'd' * (2 * k), b, o); o += 16 * k
            aneis.append([[round(xy[i], 5), round(xy[i + 1], 5)] for i in range(0, 2 * k, 2)])
        return [aneis], o
    if t == 6:
        n = struct.unpack_from(e + 'I', b, o)[0]; o += 4
        polys = []
        for _ in range(n):
            p, o = wkb(b, o); polys += p
        return polys, o
    raise ValueError(f'geometria WKB tipo {t} não tratada')

def gpkg_geom(g):
    if g[:2] != b'GP': raise ValueError('não é geometria GPKG')
    flags = g[3]
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(flags >> 1) & 7]
    return wkb(g, 8 + env)[0]

def limpar(aneis):
    """tira pontos repetidos seguidos; descarta anéis degenerados"""
    out = []
    for r in aneis:
        s = [r[0]]
        for p in r[1:]:
            if p != s[-1]: s.append(p)
        if len(s) >= 4: out.append(s)
    return out

def converter(arq, saida):
    c = sqlite3.connect(arq)
    tab = c.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
    linhas = c.execute(f"select geom, LOCAIS, CD_MUN, CD_MUN_TSE, UF, NOME_LOCAL from '{tab}'").fetchall()
    f, ibge, tse, uf = [], None, None, None
    for g, locais, cd, cdtse, u, nome in linhas:
        if not g or not locais: continue
        ibge, tse, uf = cd, cdtse, u.lower()
        polys = [p for p in (limpar(a) for a in gpkg_geom(g)) if p]
        if not polys: continue
        ids = [x.strip() for x in str(locais).split(';') if x.strip()]
        f.append({'l': ids, 'p': polys})
    c.close()
    if not f: return None
    os.makedirs(os.path.join(saida, uf), exist_ok=True)
    with open(os.path.join(saida, uf, f'{ibge}.json'), 'w') as o:
        json.dump({'ibge': ibge, 'tse': tse, 'f': f}, o, separators=(',', ':'))
    return uf, ibge, len(f)

if __name__ == '__main__':
    pasta, saida = sys.argv[1], sys.argv[2]
    nomes = sys.argv[3:] or sorted(n for n in os.listdir(pasta) if n.endswith('.gpkg'))
    for n in nomes:
        r = converter(os.path.join(pasta, n), saida)
        print(n, r if r else 'vazio')
