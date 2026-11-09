curl -sL -o g.csv.gz https://github.com/fdhidalgo/geocode_br_polling_stations/releases/latest/download/geocoded_polling_stations.csv.gz -w '%{http_code} %{size_download} %{url_effective}\n'
zcat g.csv.gz | head -3
zcat g.csv.gz | awk -F, 'NR>1{a[$2]++} END{for(k in a) print k, a[k]}' | sort
curl -sL https://api.github.com/repos/fdhidalgo/geocode_br_polling_stations/releases/latest | grep -E '"(tag_name|name|browser_download_url|size)"' | head -20
