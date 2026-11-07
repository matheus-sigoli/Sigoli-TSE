B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o c.zip $B/votacao_candidato_munzona/votacao_candidato_munzona_2014.zip
unzip -l c.zip | head -5
f=$(unzip -Z1 c.zip | grep -i '_GO.csv' | head -1)
unzip -p c.zip "$f" | iconv -f latin1 -t utf8 | head -1
unzip -p c.zip "$f" | iconv -f latin1 -t utf8 | grep -i "GOMIDE" | grep -i "ANÁPOLIS" | head -3
echo ---- det
curl -s -o d.zip $B/detalhe_votacao_munzona/detalhe_votacao_munzona_2014.zip
g=$(unzip -Z1 d.zip | grep -i '_GO.csv' | head -1)
unzip -p d.zip "$g" | iconv -f latin1 -t utf8 | head -1
unzip -p d.zip "$g" | iconv -f latin1 -t utf8 | grep -i "ANÁPOLIS" | grep -i "Governador" | head -2
