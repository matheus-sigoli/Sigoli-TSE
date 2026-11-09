curl -sL https://www.ipea.gov.br/geobr/metadata/metadata_1.7.0_gpkg.csv | grep -i "amc" | grep -E "/199|/1980" 
U=https://www.ipea.gov.br/geobr/data_gpkg/amc/1991/AMC_1991_2000_simplified.gpkg
curl -sL -o a.gpkg $U; ls -la a.gpkg
python3 - <<'PY'
import sqlite3
c=sqlite3.connect('a.gpkg')
t=[r[0] for r in c.execute("select table_name from gpkg_contents")]; print(t)
cols=[r[1] for r in c.execute(f"pragma table_info('{t[0]}')")]; print(cols)
nongeo=[x for x in cols if x not in('geom','geometry')]
for r in c.execute(f"select {','.join(nongeo)} from '{t[0]}'"):
    print('AMC|'+'|'.join(map(str,r)))
PY
