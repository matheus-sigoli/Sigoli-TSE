python3 - <<'PY'
import json,urllib.request
def get(u):
    try:
        return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=60))
    except Exception as e: print('ERR',u,e); return None
r=get('https://dadosabertos.tse.jus.br/api/3/action/package_search?q=1998&rows=50')
if r:
    for p in r['result']['results']:
        print('PKG',p['name'],'|',p['title'])
        for res in p.get('resources',[]):
            print('   ',res.get('name'),'|',res.get('url'))
PY
echo ---- SIG
curl -sL -A 'Mozilla/5.0' -o sig.html -w '%{http_code} %{url_effective}\n' 'https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-resultados/pain%C3%A9is-de-resultados'
grep -oiE '(href|src)="[^"]+"' sig.html | head -30; grep -oiE 'apex[^"]{0,80}' sig.html | sort -u | head -20
echo ---- SEADE
curl -sL -A 'Mozilla/5.0' -o seade.html -w '%{http_code}\n' 'https://produtos.seade.gov.br/produtos/moveleitoral/index.php?car=4'
grep -oiE '(href|action|src)="[^"]+"' seade.html | head -30
grep -oiE '<option[^>]*>[^<]{0,40}' seade.html | head -40
