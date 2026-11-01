# ADR 0004 — Cores por partido com intensidade pelo % do vencedor

- Status: Aceita — paleta recebida em 31/10/2026
- Data: 31/10/2026

## Decisão
- A paleta oficial está em **`config/paleta-partidos.json`** (fonte única, usada pelo app e pelo build),
  transcrita pixel a pixel da tabela enviada pelo dono do projeto.
- **10 faixas** de intensidade pelo % de votos válidos do vencedor no município:
  10%, 20%, …, 100%. A faixa usada é `floor(pct/10)*10` (mínimo 10).
  **50% = cor-base** do partido; abaixo clareia, acima escurece.
- Cada partido tem uma **cor principal** e alguns têm uma **cor extra**
  (PSD: laranja/verde-limão; Avante: turquesa/coral; Podemos: verde/roxo; PSOL: amarelo/roxo).
  A extra só é usada quando, **no mesmo mapa**, o adversário tem cor principal muito parecida
  (distância de cor ΔE < limite, calculada automaticamente) — nunca por escolha aleatória.
- Partidos fora da tabela usam a **cor original do partido**, com a mesma regra de 10 faixas
  gerada automaticamente (mistura com branco abaixo de 50%, com preto acima).
- Coluna neutra (cinza → preto) da tabela: usada para empate, sem votos e "outros".
- Cada partido mantém a mesma cor em todos os cargos. Federações usam a cor do partido líder.

## Partidos da tabela
PL (22), PT (13), Missão (14), PSD (55), Avante (70), Novo (30), União Brasil (44), PP (11),
Republicanos (10), PSDB (45), MDB (15), Podemos (20), PSB (40), PSOL (50).

## Contraste (decidido em 31/10/2026)
As faixas 80–100% são quase pretas (ex.: PL 100% = `#0A0A16`). Para não sumirem no tema escuro:
- **Fundo da área do mapa: `#666666`** (cinza médio), nos temas claro e escuro.
- **Bordas dos municípios em branco** (`#FFFFFF`), finas; divisas estaduais mais grossas.
- A tabela de cores fica intacta.
