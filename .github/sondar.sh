B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o ac.zip $B/votacao_secao/votacao_secao_2006_AC.zip
unzip -l ac.zip
f=$(unzip -Z1 ac.zip | grep -i csv | head -1)
unzip -p ac.zip "$f" | iconv -f latin1 -t utf8 | head -3
echo "---- linhas: $(unzip -p ac.zip "$f" | wc -l)"
echo "---- locais distintos (se a coluna existir):"
unzip -p ac.zip "$f" | iconv -f latin1 -t utf8 | awk -F';' 'NR==1{for(i=1;i<=NF;i++){gsub(/"/,"",$i); c[$i]=i}; next} {if (c["NR_LOCAL_VOTACAO"]) print $c["NR_ZONA"]"-"$c["NR_LOCAL_VOTACAO"]}' | sort -u | wc -l
