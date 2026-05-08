import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Modal context provides access to modal state and handlers
 * Allows Header/Body/Footer subcomponents to close the modal without prop drilling
 */
interface ModalContextType {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

/**
 * Hook to access modal context and close handler.
 *
 * Provides access to the modal's close callback and open state.
 * Must be used within Modal component tree.
 *
 * @example
 * ```tsx
 * const { onClose } = useModal();
 * return <button onClick={onClose}>Close</button>;
 * ```
 *
 * @returns Object with modal state and handlers
 * @returns {boolean} returns.isOpen - Whether modal is open
 * @returns {function} returns.onClose - Function to close the modal
 * @throws Error if called outside Modal component tree
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used inside Modal component');
  }
  return context;
};

/**
 * Props for the Modal component.
 */
export interface ModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean;

  /** Callback invoked when modal should close (Escape key, backdrop click, etc.) */
  onClose: () => void;

  /** Modal content - use Modal.Header, Modal.Body, Modal.Footer for structure */
  children: ReactNode;

  /** Size variant: 'sm' (20rem), 'md' (24rem), 'lg' (32rem) (default: 'md') */
  size?: 'sm' | 'md' | 'lg';

  /** Close modal when Escape key is pressed (default: true) */
  closeOnEscape?: boolean;

  /** Close modal when backdrop is clicked (default: true) */
  closeOnBackdrop?: boolean;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[32rem]',
};

/**
 * Modal base component for displaying dialog boxes.
 *
 * Provides a compound component pattern with subcomponents (Header, Body, Footer).
 * Handles backdrop, focus management, and keyboard interactions (Escape to close).
 * Prevents body scroll when open and restores focus when closed.
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose}>
 *   <Modal.Header title="Delete Item" />
 *   <Modal.Body>Are you sure you want to delete this?</Modal.Body>
 *   <Modal.Footer>
 *     <button onClick={handleClose}>Cancel</button>
 *     <button onClick={handleDelete}>Delete</button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 *
 * @param props - The modal props
 * @param props.isOpen - Whether the modal is visible
 * @param props.onClose - Callback when modal should close
 * @param props.children - Modal content (use Modal.Header, Body, Footer)
 * @param props.size - Modal width size (default: 'md')
 * @param props.closeOnEscape - Close when Escape is pressed (default: true)
 * @param props.closeOnBackdrop - Close when backdrop is clicked (default: true)
 * @returns The modal component
 */
function ModalComponent({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdrop = true,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Handle escape key and focus management
  React.useEffect(() => {
    if (!isOpen) return;

    // Save currently focused element before modal opens
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal dialog on open
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEscape, onClose]);

  // Restore focus and prevent body scroll
  React.useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      // Restore focus to previous element when modal closes
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl max-h-[90vh] overflow-hidden ${sizeClasses[size]}`}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

// Attach subcomponents to Modal
export const Modal = Object.assign(ModalComponent, {
  Header: null as any, // Will be assigned below
  Body: null as any,
  Footer: null as any,
});

// -- Subcomponents --

/**
 * Props for Modal.Header component.
 */
interface ModalHeaderProps {
  /** Main title text */
  title: string;

  /** Optional subtitle or secondary text */
  subtitle?: string;

  /** Optional custom close handler (overrides context close) */
  onClose?: () => void;
}

/**
 * Modal header component with title and close button.
 *
 * Displays a header with title, optional subtitle, and a close button.
 * Close button uses context handler or custom onClose prop if provided.
 *
 * @param props - The header props
 * @param props.title - Header title text
 * @param props.subtitle - Optional subtitle below title
 * @param props.onClose - Optional custom close handler
 * @returns The modal header component
 */
export function ModalHeader({ title, subtitle, onClose: customOnClose }: ModalHeaderProps) {
  const { onClose: contextClose } = useModal();
  const handleClose = customOnClose || contextClose;

  return (
    <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h2 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <button
        onClick={handleClose}
        aria-label="Close modal"
        className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}

/**
 * Props for Modal.Body component.
 */
interface ModalBodyProps {
  /** Body content */
  children: ReactNode;
}

/**
 * Modal body component for main content.
 *
 * Scrollable container for the main modal content.
 * Automatically handles overflow and max height relative to modal size.
 *
 * @param props - The body props
 * @param props.children - Modal content
 * @returns The modal body component
 */
export function ModalBody({ children }: ModalBodyProps) {
  return (
    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
      {children}
    </div>
  );
}

/**
 * Props for Modal.Footer component.
 */
interface ModalFooterProps {
  /** Footer content (typically buttons) */
  children: ReactNode;

  /** Button alignment: 'left', 'center', or 'right' (default: 'right') */
  align?: 'left' | 'center' | 'right';
}

/**
 * Modal footer component for buttons and actions.
 *
 * Fixed-height container for action buttons with configurable alignment.
 * Typically contains confirm/cancel buttons.
 *
 * @param props - The footer props
 * @param props.children - Footer content (buttons, etc.)
 * @param props.align - Button alignment (default: 'right')
 * @returns The modal footer component
 */
export function ModalFooter({ children, align = 'right' }: ModalFooterProps) {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align];

  return (
    <div className={`flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 ${alignClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}>
      {children}
    </div>
  );
}

// Assign subcomponents
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
