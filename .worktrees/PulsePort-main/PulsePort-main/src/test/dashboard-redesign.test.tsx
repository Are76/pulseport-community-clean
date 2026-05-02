import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('dashboard redesign', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders the executive home boards and keeps the downstream market pulse content', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /core action board/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /portfolio health board/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /strategy board/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what matters across the chain right now/i })).toBeInTheDocument();
  });
});
