export function PageShell({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children: React.ReactNode;
  activePath?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        {eyebrow && (
          <p className="text-sm font-medium uppercase tracking-wider text-poll">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-muted leading-relaxed">
            {description}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
