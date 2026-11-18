#!/usr/bin/env python3
"""
Nomes e partidos dos candidatos a governador e senador (até 1990) conferidos na Wikipédia em português, nas páginas
"Eleições estaduais em/no/na <estado> em <ano>": data/historico/wiki.csv (;) ano;uf;cargo;de;nome;partido.
`de` é o nome que vem da fonte (ou a sigla, quando a fonte só traz o partido); `nome`/`partido` vazios = manter.
Aplica direto nos arquivos já gerados (public/data/{ano}/{cargo}/{turno}/{uf}.json), por isso roda depois de
scripts/tre.py e scripts/historico.py e antes de resumo-br.mjs e pintam.mjs. É idempotente (também acha o nome novo).
Uso: python3 scripts/wiki-partidos.py
"""
import csv, glob, json, os, unicodedata
def ch(s): return ''.join(c for c in unicodedata.normalize('NFKD', s.upper()) if c.isalnum())
W = {}
for r in csv.DictReader(open('data/historico/wiki.csv', encoding='utf8'), delimiter=';'):
    k = (int(r['ano']), r['uf'], r['cargo'])
    W.setdefault(k, []).append(r)
n = 0
for (ano, uf, cargo), rs in W.items():
    for f in glob.glob(f'public/data/{ano}/{cargo}/*/{uf}.json'):
        d = json.load(open(f, encoding='utf8')); mud = False
        for c in d['cands']:
            for r in rs:
                if ch(c['nome']) in (ch(r['de']), ch(r['nome'] or '#')):
                    novo = (r['nome'] or c['nome'], r['partido'] or c['partido'])
                    if (c['nome'], c['partido']) != novo: c['nome'], c['partido'] = novo; mud = True
                    break
        if mud:
            json.dump(d, open(f, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':')); n += 1
print(n, 'arquivos atualizados')
