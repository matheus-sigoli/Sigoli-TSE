'use client';
/**
 * Indicador de carregamento: a tecla "Confirma" da urna (Lottie em public/lottie/confirma.json).
 * O player (lottie-web, versão light) só é baixado quando algo está carregando.
 * Com movimento reduzido, mostra o quadro final parado.
 */
import { useEffect, useRef } from 'react';

export default function Carregando({ texto }: { texto: string }) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let destruir: (() => void) | undefined;
    let vivo = true;
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (!vivo || !alvo.current) return;
      const anim = lottie.loadAnimation({
        container: alvo.current,
        renderer: 'svg',
        loop: !reduzido,
        autoplay: !reduzido,
        path: '/lottie/confirma.json',
      });
      if (reduzido) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(44, true));
      destruir = () => anim.destroy();
    });
    return () => { vivo = false; destruir?.(); };
  }, []);

  return (
    <div className="carregando" role="status" aria-live="polite">
      <div ref={alvo} className="carregando-anim" aria-hidden />
      <span>{texto}</span>
    </div>
  );
}
