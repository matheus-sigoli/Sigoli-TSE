#!/usr/bin/env python3
"""
Sigoli.TSE — resultados por município extraídos de PDFs e planilhas dos TREs (data/tre/{ano}/{uf}.csv) → site.

Formato de data/tre/{ano}/{uf}.csv (;), um voto por linha, gerado pelos extratores de scripts/extrair/:
  cargo;turno;ibge;numero;nome;partido;votos;eleito
  numero '#brancos', '#nulos', '#comparecimento', '#abstencao', '#eleitorado' = totais do município;
  eleito 'S' = eleito (ou '2' = foi ao 2º turno). data/tre/{ano}/{uf}.fonte.txt = de onde veio (aparece no site).
Cargos majoritários (governador, senador, presidente) e proporcionais (deputado-federal, deputado-estadual: o total
do partido é a soma dos seus candidatos, porque esses arquivos não trazem o voto de legenda).
Tem prioridade sobre o acervo de planilhas (scripts/historico.py): rodar depois dele.

Saída: public/data/{ano}/{cargo}/{turno}/{uf}.json. Depois: node scripts/resumo-br.mjs e node scripts/pintam.mjs.
Uso: python3 scripts/tre.py [--ano 1990] [--uf ms]
"""
import argparse, collections, csv, glob, json, os

VAGAS_GOV = {'governador': 1, 'presidente': 1}
PROP = {'deputado-federal', 'deputado-estadual'}
TOT = {'#eleitorado': 0, '#comparecimento': 1, '#abstencao': 2, '#brancos': 4, '#nulos': 5}

a = argparse.ArgumentParser(); a.add_argument('--ano', type=int); a.add_argument('--uf'); a = a.parse_args()
lista = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] != 'zz']
for arq in sorted(f for f in glob.glob('data/tre/[0-9]*/*.csv') if not f.endswith('.nomes.csv')):
    ano, uf = int(arq.split('/')[2]), os.path.basename(arq)[:-4]
    if (a.ano and ano != a.ano) or (a.uf and uf != a.uf): continue
    fonte = open(arq[:-4] + '.fonte.txt', encoding='utf8').read().strip() if os.path.exists(arq[:-4] + '.fonte.txt') else ''
    # data/tre/{ano}/{uf}.nomes.csv (;): cargo;numero;nome — conserta nomes mal lidos pelo OCR
    nomes_fix = {}
    if os.path.exists(arq[:-4] + '.nomes.csv'):
        for r in csv.DictReader(open(arq[:-4] + '.nomes.csv', encoding='utf8'), delimiter=';'): nomes_fix[(r['cargo'], r['numero'])] = r['nome']
    grupos = collections.defaultdict(list)
    for r in csv.DictReader(open(arq, encoding='utf8'), delimiter=';'):
        grupos[(r['cargo'], int(r['turno']))].append(r)
    for (cargo, turno), rs in sorted(grupos.items()):
        prop = cargo in PROP
        info, soma = {}, collections.Counter()
        for r in rs:
            if r['numero'].startswith('#'): continue
            r['nome'] = nomes_fix.get((cargo, r['numero']), r['nome'])
            info.setdefault(r['numero'], r); soma[r['numero']] += int(r['votos'])
            if r['eleito']: info[r['numero']] = r
        nums = [n for n, v in sorted(soma.items(), key=lambda x: -x[1]) if v > 0 or prop]
        idx = {n: i for i, n in enumerate(nums)}
        eleitos = [n for n in nums if info[n]['eleito'] == 'S']
        cands = [{'id': n, 'n': n, 'nome': info[n]['nome'], 'partido': info[n]['partido'] or n, 'eleito': n in eleitos,
                  'situacao': 'Eleito' if n in eleitos else ('2º turno' if info[n]['eleito'] == '2' else 'Não eleito')} for n in nums]
        partidos = []
        if prop:
            vistos = {}
            for c in cands: vistos.setdefault(c['partido'], c['n'][:2])
            partidos = [{'sg': sg, 'n': n} for sg, n in vistos.items()]
        ip = {p['sg']: i for i, p in enumerate(partidos)}
        mun = {}
        for r in rs:
            m = mun.setdefault(r['ibge'], {'t': [0] * 6, 'c': [0] * len(nums), **({'p': [0] * len(partidos)} if prop else {})})
            v = int(r['votos'])
            if r['numero'] in TOT: m['t'][TOT[r['numero']]] += v
            elif r['numero'] in idx:
                m['c'][idx[r['numero']]] += v
                if prop: m['p'][ip[cands[idx[r['numero']]]['partido']]] += v
        for m in mun.values():
            t = m['t']; t[3] = sum(m['c'])
            if not t[1] and (t[4] or t[5]): t[1] = t[3] + t[4] + t[5]
            if t[1] and t[2] and not t[0]: t[0] = t[1] + t[2]
            if t[0] and t[1] and not t[2]: t[2] = t[0] - t[1]
        tt = [sum(m['t'][k] for m in mun.values()) for k in range(6)]
        tc = [sum(m['c'][k] for m in mun.values()) for k in range(len(nums))]
        tp = [sum(m['p'][k] for m in mun.values()) for k in range(len(partidos))] if prop else []
        if prop:  # partidos do mais votado ao menos
            ordem = sorted(range(len(partidos)), key=lambda k: -tp[k])
            partidos = [partidos[k] for k in ordem]; tp = [tp[k] for k in ordem]
            for m in mun.values(): m['p'] = [m['p'][k] for k in ordem]
        vagas = len(eleitos) if prop else (2 if cargo == 'senador' and len(eleitos) == 2 else 1)
        saida = {'v': 1, 'cargo': cargo, 'turno': turno, 'abr': uf, 'tipo': 'prop' if prop else 'maj', 'vagas': vagas or 1,
                 'atualizado': '', 'fonte': fonte, 'cands': cands, 'partidos': partidos, 'total': {'t': tt, 'c': tc, 'p': tp}, 'mun': mun}
        base = f'public/data/{ano}'
        os.makedirs(f'{base}/{cargo}/{turno}', exist_ok=True)
        json.dump(saida, open(f'{base}/{cargo}/{turno}/{uf}.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        if not os.path.exists(f'{base}/municipios.json'):
            json.dump(lista, open(f'{base}/municipios.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        print(f'{ano} {cargo} {turno}º {uf.upper()}: {len(mun)} municípios, {len(cands)} candidatos, {len(eleitos)} eleitos · '
              + ' | '.join(f"{cands[i]['nome']} {tc[i]}" for i in range(min(3, len(cands)))))
