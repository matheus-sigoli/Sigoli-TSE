import { Suspense } from 'react';
import Explorador from '@/components/Explorador';

export default function Inicio() {
  return (
    <Suspense>
      <Explorador abr="br" cargo="presidente" />
    </Suspense>
  );
}
