#!/bin/bash
# OCR das listagens do SERPRO (duas colunas): cada página vira {pág}-H.txt (cabeçalho e capital), -L.txt e -R.txt.
# Uso: scripts/extrair/ocr-paginas.sh arquivo.pdf pasta_saida primeira última
# (tesseract e pdftoppm; ~3 s por página)
pdf="$1"; out="$2"; mkdir -p "$out/png"
for n in $(seq $3 $4); do
  p=$(printf %03d $n); [ -s "$out/$p-R.txt" ] && continue
  pdftoppm -r 300 -gray -f $n -l $n -png "$pdf" "$out/png/x$p" >/dev/null 2>&1
  f=$(ls "$out"/png/x$p*.png | head -1)
  python3 -c "
from PIL import Image;im=Image.open('$f');w,h=im.size
im.crop((0,0,w,int(h*.305))).save('$out/png/$p-H.png');im.crop((0,int(h*.30),int(w*.535),h)).save('$out/png/$p-L.png');im.crop((int(w*.53),int(h*.30),w,h)).save('$out/png/$p-R.png')"
  for s in H L R; do tesseract "$out/png/$p-$s.png" "$out/$p-$s" --psm 6 -l eng >/dev/null 2>&1; done
  rm -f "$f" "$out"/png/$p-*.png
done
