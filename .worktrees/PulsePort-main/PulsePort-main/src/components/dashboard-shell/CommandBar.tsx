import type { PropsWithChildren } from 'react';

type CommandBarProps = PropsWithChildren<{
  label?: string;
  className?: string;
}>;

export function CommandBar({ children, label = 'Command bar', className }: CommandBarProps) {
  return (
    <section
      aria-label={label}
      className={className ? `app-shell__command-bar ${className}` : 'app-shell__command-bar'}
    >
      {children}
    </section>
  );
}
