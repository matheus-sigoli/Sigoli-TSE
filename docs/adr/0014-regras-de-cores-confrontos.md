# ADR 0014 — Regras de cores a partir dos confrontos reais

- Status: Aceita (complementa a ADR 0004)
- Data: 02/11/2026
- Definida com o usuário em entrevista (uma decisão por vez), olhando os 118 mapas de 2026.

## Contexto
Com a regra da ADR 0004 (distância CIE76 < 22 entre todos os concorrentes do arquivo; sem cor extra, paleta neutra),
70 dos 118 mapas trocavam a cor de alguém que aparece no mapa. Casos que motivaram a revisão:
- Senado SP: Derrite (PP) × André do Prado (PL) — distância 21,9, ninguém com extra: **o PL ficava laranja**.
- PP trocava de cor por causa do PRTB (azul quase igual) mesmo quando o PRTB não vencia nenhuma área.
- Dois candidatos do mesmo partido (Senado MS PL × PL, AL MDB × MDB) e cores neutras sem ligação com o partido
  (PL verde, PP amarelo, PT laranja).

## Decisão
1. **Quem disputa cor**: só quem *pinta o mapa*, isto é, vence ao menos uma área em algum nível (município, zona,
   zona da cidade, bairro ou local de votação). `scripts/pintam.mjs` grava a lista em cada arquivo do estado
   (`pintam: { c, p }`); o workflow de dados roda o script depois de `zonas-locais.mjs`. As cores continuam fixas
   por estado em todos os níveis. Quem não pinta fica com a cor principal.
2. **Conflito**: distância **CIEDE2000 < 17,3** entre as cores-base (50%). Calibrada com os pares que o usuário
   marcou como indistinguíveis — MDB × PODE (4,0), PL × SOLIDARIEDADE (7,7), MDB × PRD (13,0), PV × PRD (12,5),
   REPUBLICANOS × AVANTE (14,6), PSB × NOVO (13,8), PT × PSB (14,8), PODE × PRD (16,6), UNIÃO × AVANTE (17,1) — e
   os que convivem. Como PP × PSDB (16,0) e PP × PL (17,4) convivem apesar do limite, ficam em
   `conflito.compativeis` da paleta (vale só com as duas cores principais).
3. **Partidos fixos — PL, PT e MISSÃO** (`conflito.fixos`, pedido do usuário em 02/11/2026): ficam sempre com a
   cor principal quando pintam o mapa. No conflito, troca o outro partido, mesmo sendo o mais votado (extra,
   reservas ou paleta neutra). Ex.: deputado federal PE, PT vermelho e PSB amarelo (reserva). Eles não têm reservas.
   A única exceção é o 2º candidato do mesmo partido no Senado (PL × PL, PT × PT), que ganha outro tom para o mapa
   continuar legível. O PP fica com o azul (#04368A, trocado em 11/2026 a pedido do usuário): PP × PL é par compatível.
4. **Quem troca**: quem tem alternativa, mesmo sendo o mais votado. Ordem: extra do menos votado, extra do mais
   votado, reservas do menos votado, reservas do mais votado. A extra (2ª cor oficial) vem antes das reservas:
   no governo do Pará, PODE vira roxo e o MDB segue verde.
5. **Mesmo partido duas vezes**: a cor extra; sem extra, outro tom bem diferente da mesma cor (mais claro se a
   cor é escura, mais escuro se é clara).
6. **Reservas**: até 2 cores por partido (`reservas` na paleta; uma clara e uma escura da mesma família),
   propostas por busca automática nos confrontos reais e aprovadas pelo usuário em 02/11/2026.
7. **Último recurso**: paleta neutra (Okabe-Ito).

## Consequências
- Paleta neutra usada 65 vezes (eram 137 antes da ADR; o aumento em relação às reservas sozinhas vem dos partidos
  fixos, que empurram o outro lado); conflitos sem solução em 9 mapas (eram 22), todos de deputado com 15 ou mais
  partidos pintando — não há cores distintas para todos.
- Reservas definidas pelo usuário em 02/11/2026: PP #5F747A, PSB #FECD00, MDB #FFC401, REPUBLICANOS #0066CC,
  REDE #7E6597 (as demais, propostas e aprovadas).
- Arquivos sem `pintam` (antigos) continuam funcionando: todos disputam cor.
- Testes em `scripts/test/cores.test.mjs` com os confrontos reais (SP, PA, PL × PL, PSB × PT com PT fixo, PRTB fora do mapa).
- Para mudar uma reserva ou um par compatível, basta editar `config/paleta-partidos.json`.
