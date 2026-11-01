import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Explorador from '@/components/Explorador';
import { CARGOS, UFS, abrangenciaValida, cargoPorSlug, nomeAbrangencia, type CargoSlug } from '@/lib/dominio';

type Params = { abr: string; cargo: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  const abrs = ['br', 'exterior', ...Object.keys(UFS)];
  return CARGOS.flatMap((c) => abrs.filter((a) => abrangenciaValida(a, c)).map((abr) => ({ abr, cargo: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { abr, cargo } = await params;
  const c = cargoPorSlug(cargo);
  if (!c) return {};
  const onde = nomeAbrangencia(abr);
  return {
    title: `${c.nome} — ${onde}`,
    description: `Resultado de ${c.nome} nas Eleições 2026 em ${onde}, município por município, com dados oficiais do TSE.`,
    alternates: { canonical: `/2026/${abr}/${cargo}` },
  };
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const { abr, cargo } = await params;
  const c = cargoPorSlug(cargo);
  if (!c || !abrangenciaValida(abr, c)) notFound();
  return (
    <Suspense>
      <Explorador abr={abr} cargo={cargo as CargoSlug} />
    </Suspense>
  );
}
