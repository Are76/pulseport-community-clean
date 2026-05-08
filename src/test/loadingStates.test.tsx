import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';

describe('Loading State Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner?.classList.contains('w-8')).toBe(true);
    });

    it('renders with custom size', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.classList.contains('w-12')).toBe(true);
    });

    it('renders with label', () => {
      render(<LoadingSpinner label="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders without label when not provided', () => {
      render(<LoadingSpinner />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders with title only', () => {
      render(<EmptyState title="No data" />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('renders with title and description', () => {
      render(<EmptyState title="No data" description="Add items to get started" />);
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('Add items to get started')).toBeInTheDocument();
    });

    it('renders with action button', () => {
      const handleClick = vi.fn();
      render(
        <EmptyState
          title="No data"
          action={{ label: 'Add Item', onClick: handleClick }}
        />
      );
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
      button.click();
      expect(handleClick).toHaveBeenCalled();
    });

    it('renders with icon', () => {
      render(<EmptyState title="No data" icon="📭" />);
      expect(screen.getByText('📭')).toBeInTheDocument();
    });
  });

  describe('SkeletonLoader', () => {
    it('renders default list skeletons', () => {
      const { container } = render(<SkeletonLoader />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders custom count of skeletons', () => {
      const { container } = render(<SkeletonLoader count={5} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders card type skeletons', () => {
      const { container } = render(<SkeletonLoader type="card" count={2} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders table type skeletons', () => {
      const { container } = render(<SkeletonLoader type="table" count={3} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ErrorState', () => {
    it('renders error title and message', () => {
      render(<ErrorState title="Failed to load" message="An error occurred" />);
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('renders without retry button when onRetry not provided', () => {
      render(<ErrorState title="Failed" message="Error" />);
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('renders with retry button when onRetry provided', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState title="Failed" message="Error" onRetry={handleRetry} />
      );
      const button = screen.getByRole('button', { name: /Retry/i });
      expect(button).toBeInTheDocument();
      button.click();
      expect(handleRetry).toHaveBeenCalled();
    });

    it('displays error styling', () => {
      const { container } = render(
        <ErrorState title="Failed" message="Error" />
      );
      const errorDiv = container.querySelector('div');
      expect(errorDiv?.classList.contains('bg-[rgba(220,38,38,0.08)]')).toBe(true);
    });
  });
});
