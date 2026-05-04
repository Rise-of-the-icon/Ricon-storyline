export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-ink px-6 text-paper">
      <div className="w-full max-w-3xl">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-cyan">
          RICON
        </p>
        <h1 className="mt-4 font-display text-5xl leading-tight text-paper sm:text-7xl">
          Storyline
        </h1>
        <p className="mt-6 max-w-xl font-body text-lg leading-8 text-paper/75">
          A dark-first Next.js 15 foundation with RICON brand tokens, motion,
          audio, and local font assets ready at the root.
        </p>
      </div>
    </main>
  );
}
