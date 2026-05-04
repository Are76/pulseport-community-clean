import type { PropsWithChildren, ReactNode } from 'react';

type SectionFrameProps = PropsWithChildren<{
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}>;

export function SectionFrame({ children, title, description, actions }: SectionFrameProps) {
  return (
    <section className="app-shell__section-frame">
      {(title || description || actions) && (
        <header className="app-shell__section-frame-header">
          <div>
            {title && <h2 className="app-shell__section-frame-title">{title}</h2>}
            {description && <p className="app-shell__section-frame-description">{description}</p>}
          </div>
          {actions && <div className="app-shell__section-frame-actions">{actions}</div>}
        </header>
      )}
      <div className="app-shell__section-frame-body">{children}</div>
    </section>
  );
}
