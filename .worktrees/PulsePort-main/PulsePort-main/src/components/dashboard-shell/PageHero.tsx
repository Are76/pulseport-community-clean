import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions, children }: PageHeroProps) {
  return (
    <header className="app-shell__page-hero">
      <div className="app-shell__page-hero-copy">
        {eyebrow && <p className="app-shell__page-hero-eyebrow">{eyebrow}</p>}
        <h1 className="app-shell__page-hero-title">{title}</h1>
        {description && <p className="app-shell__page-hero-description">{description}</p>}
      </div>
      {actions && <div className="app-shell__page-hero-actions">{actions}</div>}
      {children}
    </header>
  );
}
