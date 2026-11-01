# Sigoli.TSE — Design

Ferramenta de consulta (modo *Operate*): a pessoa quer saber **quem ganhou onde** e conferir números.
Precisão e leitura rápida vêm antes de expressão. A identidade mora em um único lugar: a **tecla da urna**.

## Ideia central
O voto no Brasil é um número digitado numa urna. Cada candidato aparece com o seu número numa
**tecla** — um bloco quadrado de cantos levemente arredondados, com o número em dígitos condensados e
pesados, como no teclado da urna. É o único elemento "ousado"; o resto é silencioso.

As três teclas de função da urna viram cores semânticas (nunca decoração):
- **Confirma** (verde) → eleito.
- **Corrige** (laranja) → vai ao 2º turno.
- **Branco** → votos brancos (e o tom neutro dos gráficos de brancos/nulos).

## Cor
| Token | Escuro (padrão) | Claro | Uso |
|---|---|---|---|
| `--bg` | `#1D1F23` | `#E9EBEE` | fundo da página |
| `--surface` | `#26282D` | `#FFFFFF` | colunas laterais |
| `--surface-2` | `#30333A` | `#F2F3F5` | teclas, campos, hover |
| `--line` | `#3C3F46` | `#D3D7DD` | divisórias |
| `--text` | `#EEEFF1` | `#17191C` | texto |
| `--muted` | `#A3A8B0` | `#596069` | texto secundário |
| `--map` | `#666666` | `#666666` | fundo do mapa (definido pelo dono) |
| `--confirma` | `#2FA563` | `#1E8A4C` | eleito |
| `--corrige` | `#EE8B2F` | `#C96A12` | 2º turno |

Bordas de município: branco. Divisas estaduais: branco, mais grossas.
Cores de partido: `config/paleta-partidos.json` (ADR 0004). Elas só aparecem no mapa, nas barras e nas teclas.

## Tipografia
Uma família: **Archivo** (variável, eixo de largura 62–125, Omnibus-Type).
- Números de votos e teclas: largura 75, peso 700, algarismos tabulares.
- Títulos: largura 112, peso 650.
- Texto: largura 100, peso 400/500.
Escala: 12 · 13 · 15 · 18 · 24 · 34. Caixa de frase em tudo; nada de rótulos em caixa alta.

## Layout
```
Desktop (≥1100px)
┌──────────────┬──────────────────────────────┬──────────────────┐
│ Sigoli.TSE   │                              │ Presidente  Gov… │ ← abas de cargo
│ Abrangência  │            MAPA              │ 1º turno|2º      │
│ Região       │       (fundo #666666)        │ Brasil           │
│ Busca        │                              │ ▣22 Flávio  47%  │
│ Legenda      │                              │ ▣13 Lula    45%  │
└──────────────┴──────────────────────────────┴──────────────────┘
Celular: mapa ocupa a tela; painel vira gaveta que sobe (prévia com os 2 primeiros).
```
Alinhamento à esquerda; números alinhados à direita em colunas tabulares.

## Movimento
Um único momento orquestrado: ao trocar de cargo/turno, o mapa recolore com transição de 250 ms.
Animação de carregamento em Lottie (a tecla "Confirma" sendo pressionada), só enquanto os dados chegam.
`prefers-reduced-motion` desliga transições e mostra o carregamento estático.
