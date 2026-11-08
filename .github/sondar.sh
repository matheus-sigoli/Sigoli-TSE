B=https://cdn.tse.jus.br/estatistica/sead/odsele
curl -s -o p.zip $B/votacao_partido_munzona/votacao_partido_munzona_1998.zip; unzip -l p.zip | tail -3
echo "== partido: cargo 1 por UF (linhas), soma nominais por partido"
for f in $(unzip -Z1 p.zip | grep -i csv); do unzip -p p.zip "$f" | iconv -f latin1 -t utf8 ; done | awk -F';' 'NR==1{for(i=1;i<=NF;i++){gsub(/"/,"",$i);c[$i]=i}} {gsub(/"/,"",$0)} $c["CD_CARGO"]==1 {n[$c["SG_PARTIDO"]]+=$c["QT_VOTOS_NOMINAIS"]; r++} END{print "linhas",r; for(k in n) print k, n[k]}' | sort -k2 -n -r | head -15
head -1 <(unzip -p p.zip $(unzip -Z1 p.zip | grep -i '_SP.csv') | iconv -f latin1 -t utf8) | cut -c1-800
curl -s -o v.zip $B/votacao_secao/votacao_secao_1998_BR.zip
echo "== secao BR"; unzip -p v.zip votacao_secao_1998_BR.txt | iconv -f latin1 -t utf8 | head -2
unzip -p v.zip votacao_secao_1998_BR.txt | iconv -f latin1 -t utf8 | awk -F';' '{gsub(/"/,"",$0); v[$14]+=$15; s[$8"-"$10"-"$11]=1} END{for(k in v) print "votavel",k,v[k]; n=0; for(k in s)n++; print "secoes",n}' | sort -k3 -n -r | head -8
curl -s -o s.zip $B/votacao_secao/votacao_secao_1998_SP.zip; unzip -l s.zip | tail -3; unzip -p s.zip $(unzip -Z1 s.zip | grep -iv pdf | head -1) | iconv -f latin1 -t utf8 | head -2
unzip -p s.zip $(unzip -Z1 s.zip | grep -iv pdf | head -1) | iconv -f latin1 -t utf8 | awk -F';' '{gsub(/"/,"",$0); c[$12" "$4]++; s[$8"-"$10"-"$11]=1} END{for(k in c) print "cargo/turno",k,c[k]; n=0; for(k in s)n++; print "secoes SP",n}'
curl -sL -o d.zip $B/detalhe_votacao_secao/detalhe_votacao_secao_1998.zip; ls -la d.zip; file d.zip; unzip -l d.zip | tail -3
