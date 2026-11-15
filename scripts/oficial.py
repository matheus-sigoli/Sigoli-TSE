#!/usr/bin/env python3
"""
Sigoli.TSE — resultado final oficial do estado quando os dados por município estão incompletos (ou têm o partido
errado). data/oficial/{ano}.csv (;):
  cargo;turno;uf;candidato;partido;votos;eleito;fonte
  votos vazio = só conserta nome, partido e situação (o voto continua a soma dos municípios; sem aviso de total oficial).
  candidato = nome (achado no arquivo pelo nome parecido ou, se não houver nome, pelo partido); '#eleitorado',
  '#comparecimento', '#abstencao', '#brancos', '#nulos' = totais do estado. eleito: S, 2 (foi ao 2º turno) ou vazio.
O total do arquivo (o que o site mostra para o estado inteiro e soma no Brasil) passa a ser o oficial; os municípios
continuam como estão (o mapa). Candidato que não está nos dados por município entra com zero nos municípios.
O arquivo ganha `oficial: { fonte, municipios }` e o painel avisa que o total é o oficial.
Rodar depois de historico.py e tre.py; depois resumo-br.mjs e pintam.mjs.
Uso: python3 scripts/oficial.py [--ano 1990]
"""
import argparse, collections, csv, difflib, glob, json, os, re, unicodedata

a = argparse.ArgumentParser(); a.add_argument('--ano', type=int); a = a.parse_args()
def chave(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'[^A-Z]', '', s)
TOT = {'#eleitorado': 0, '#comparecimento': 1, '#abstencao': 2, '#brancos': 4, '#nulos': 5}
for arq in sorted(glob.glob('data/oficial/*.csv')):
    ano = int(os.path.basename(arq)[:4])
    if a.ano and ano != a.ano: continue
    grupos = collections.defaultdict(list)
    for r in csv.DictReader(open(arq, encoding='utf8'), delimiter=';'):
        grupos[(r['cargo'], int(r['turno']), r['uf'].lower())].append(r)
    for (cargo, turno, uf), rs in grupos.items():
        p = f'public/data/{ano}/{cargo}/{turno}/{uf}.json'
        if not os.path.exists(p): print(f'  ⚠ {p} não existe'); continue
        d = json.load(open(p, encoding='utf8'))
        if d.get('tipo') != 'maj': continue
        cands = d['cands']; n0 = len(cands)
        so_conserto = all(r['votos'] == '' for r in rs)
        usados = set(); total_c = {}
        t = [None] * 6
        for r in rs:
            if r['candidato'] in TOT: t[TOT[r['candidato']]] = int(r['votos']); continue
            idx = None
            if r['candidato']:
                k = chave(r['candidato'])
                score = [(difflib.SequenceMatcher(None, k, chave(c['nome'])).ratio(), i) for i, c in enumerate(cands) if i not in usados]
                # nome parecido, ou um nome contido no outro (urna x completo)
                score = [(1.0 if (chave(cands[i]['nome']) in k or k in chave(cands[i]['nome'])) and len(chave(cands[i]['nome'])) > 5 else s, i) for s, i in score]
                if score and max(score)[0] >= 0.72: idx = max(score)[1]
            if idx is None and r['partido']:
                mesmos = [i for i, c in enumerate(cands) if i not in usados and chave(c['partido']) == chave(r['partido']) and chave(c['nome']) in (chave(c['partido']), '')]
                mesmos = mesmos or [i for i, c in enumerate(cands) if i not in usados and chave(c['partido']) == chave(r['partido'])]
                if len(mesmos) == 1: idx = mesmos[0]
            if idx is None:
                cands.append({'id': f'o{len(cands)}', 'n': '', 'nome': r['candidato'] or r['partido'], 'partido': r['partido'], 'eleito': False, 'situacao': 'Não eleito'})
                idx = len(cands) - 1
            usados.add(idx)
            c = cands[idx]
            if r['votos'] == '':  # só conserta nome/partido/situação: o voto fica o dos municípios
                total_c[idx] = sum(m['c'][idx] for m in d['mun'].values() if idx < len(m['c']))
            if r['candidato']: c['nome'] = r['candidato']
            if r['partido']: c['partido'] = r['partido']
            c['eleito'] = r['eleito'] == 'S'
            c['situacao'] = 'Eleito' if r['eleito'] == 'S' else '2º turno' if r['eleito'] == '2' else 'Não eleito'
            if r['votos'] != '': total_c[idx] = int(r['votos'])
        # candidatos novos: zero nos municípios
        for m in d['mun'].values(): m['c'] += [0] * (len(cands) - n0)
        tc = [total_c.get(i, sum(m['c'][i] for m in d['mun'].values()) if i not in usados else 0) for i in range(len(cands))]
        # quem não está na lista oficial sai do total (era ruído do dado por município)
        if not so_conserto: tc = [tc[i] if i in total_c else 0 for i in range(len(cands))]
        ordem = sorted(range(len(cands)), key=lambda i: -tc[i])
        d['cands'] = [cands[i] for i in ordem]
        for m in d['mun'].values(): m['c'] = [m['c'][i] for i in ordem]
        tc = [tc[i] for i in ordem]
        velho = d['total']['t']
        tt = [x if x is not None else (velho[i] if i < len(velho) else 0) for i, x in enumerate(t)]; tt[3] = sum(tc)
        if not tt[1] and (tt[4] or tt[5]): tt[1] = tt[3] + tt[4] + tt[5]
        if tt[0] and tt[1] and not tt[2]: tt[2] = tt[0] - tt[1]
        d['total'] = {'t': tt, 'c': tc, 'p': d['total'].get('p', [])}
        if not so_conserto: d['oficial'] = {'fonte': rs[0].get('fonte', ''), 'municipios': len(d['mun'])}
        d.pop('pintam', None)
        json.dump(d, open(p, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        print(f'{ano} {cargo} {turno}º {uf.upper()}: total oficial ({len(tc)} candidatos, {len(d["mun"])} municípios no mapa) · ' +
              ' | '.join(f"{d['cands'][i]['nome']} ({d['cands'][i]['partido']}) {tc[i]}" for i in range(min(3, len(tc)))))
