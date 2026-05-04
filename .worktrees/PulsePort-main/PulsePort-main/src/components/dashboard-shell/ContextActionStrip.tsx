import type { PropsWithChildren, ReactNode } from 'react';

type ContextActionStripProps = PropsWithChildren<{
  title?: ReactNode;
  label?: string;
}>;

export function ContextActionStrip({
  children,
  title,
  label = 'Context actions',
}: ContextActionStripProps) {
  return (
    <section aria-label={label} className="app-shell__context-action-strip">
      {title && <h2 className="app-shell__context-action-strip-title">{title}</h2>}
      <div className="app-shell__context-action-strip-body">{children}</div>
    </section>
  );
}
