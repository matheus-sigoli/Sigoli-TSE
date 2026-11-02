import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Explorador from '@/components/Explorador';
import { ELEICOES } from '@/lib/anos';
import { CARGOS, UFS, abrangenciaValida, cargoPorSlug, nomeAbrangencia, type CargoSlug } from '@/lib/dominio';

type Params = { ano: string; abr: string; cargo: string };

export const dynamicParams = false;

/** Anos no ar (src/lib/anos.ts, ADR 0015) × cargos × abrangências. */
const ANOS = ELEICOES.filter((e) => e.disponivel).map((e) => String(e.ano));

export function generateStaticParams(): Params[] {
  const abrs = ['br', 'exterior', ...Object.keys(UFS)];
  return ANOS.flatMap((ano) => CARGOS.flatMap((c) => abrs.filter((a) => abrangenciaValida(a, c)).map((abr) => ({ ano, abr, cargo: c.slug }))));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { ano, abr, cargo } = await params;
  const c = cargoPorSlug(cargo);
  if (!c) return {};
  const onde = nomeAbrangencia(abr);
  return {
    title: `${c.nome} — ${onde} (${ano})`,
    description: `Resultado de ${c.nome} nas Eleições ${ano} em ${onde}, município por município, com dados oficiais do TSE.`,
    alternates: { canonical: `/${ano}/${abr}/${cargo}` },
  };
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const { ano, abr, cargo } = await params;
  const c = cargoPorSlug(cargo);
  if (!ANOS.includes(ano) || !c || !abrangenciaValida(abr, c)) notFound();
  return (
    <Suspense>
      <Explorador key={ano} ano={Number(ano)} abr={abr} cargo={cargo as CargoSlug} />
    </Suspense>
  );
}
