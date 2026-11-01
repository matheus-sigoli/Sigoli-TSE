# ADR 0006 — Interface: 3 colunas, painel por município, tema escuro/claro

- Status: Aceita
- Data: 31/10/2026

## Decisão
- **Desktop**: 3 colunas — filtros (esquerda: abrangência, turno, região/município), mapa (centro),
  painel de resultados (direita, abas por cargo: Presidente, Governador, Senador, Dep. Federal, Dep. Estadual).
- **Celular**: mapa em cima, painel como gaveta deslizante.
- **Clique no município**: o painel passa a mostrar o resultado completo daquele município
  (todos os candidatos, comparecimento, abstenção, brancos, nulos) sem trocar de página;
  o município entra na URL (`?mun=71072`) para ser compartilhável.
- **Busca** por nome de município (com e sem acento).
- **Mapa**: fundo `#666666` e bordas de municípios brancas em qualquer tema (ADR 0004).
- **Tema**: escuro por padrão, alternância para claro, e **modo daltônico** (paleta alternativa da ADR 0004).

## Alternativas consideradas
- Página própria por município (5.571 páginas): adiada; o `?mun=` já dá link compartilhável.
- Mapa em tela cheia com painel flutuante: pior para ler listas longas de deputados.
