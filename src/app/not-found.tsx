import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px' }}>Página não encontrada</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>Esse cargo ou estado não existe nas Eleições 2026.</p>
        <Link href="/2026/br/presidente" style={{ color: 'var(--text)' }}>Ver o resultado de Presidente no Brasil</Link>
      </div>
    </main>
  );
}
