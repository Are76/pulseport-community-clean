import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, useModal } from '../Modal';

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Test Content</div>
      </Modal>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} closeOnBackdrop={true}>
        <div>Content</div>
      </Modal>
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on backdrop click when closeOnBackdrop is false', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} closeOnBackdrop={false}>
        <div>Content</div>
      </Modal>
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key when closeOnEscape is true', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={true}>
        <div>Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on Escape when closeOnEscape is false', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={false}>
        <div>Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prevents body scroll when open', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders Header with title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <Modal.Header title="Test Title" />
      </Modal>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders Header with subtitle', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <Modal.Header title="Test" subtitle="Subtitle" />
      </Modal>
    );
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('Header close button calls modal onClose', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <Modal.Header title="Test" />
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Body with children', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <Modal.Body>Body content</Modal.Body>
      </Modal>
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders Footer with children', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <Modal.Footer>
          <button>Cancel</button>
          <button>Submit</button>
        </Modal.Footer>
      </Modal>
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('renders Footer with alignment', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <Modal.Footer align="left">Content</Modal.Footer>
      </Modal>
    );

    const footer = container.querySelector('.justify-start');
    expect(footer).toBeInTheDocument();
  });

  it('throws error when useModal is used outside Modal', () => {
    const TestComponent = () => {
      useModal();
      return null;
    };

    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useModal must be used inside Modal component');

    spy.mockRestore();
  });

  it('works with compound component pattern', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <Modal.Header title="Test Modal" subtitle="Test subtitle" />
        <Modal.Body>
          <form>
            <input placeholder="Name" />
          </form>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={onClose}>Cancel</button>
          <button>Submit</button>
        </Modal.Footer>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});
