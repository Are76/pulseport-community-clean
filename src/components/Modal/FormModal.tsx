import React, { ReactNode, FormEvent } from 'react';
import { Modal } from './Modal';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

/**
 * Generic form modal using compound component pattern
 * Handles form submission and layout
 */
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={onSubmit}>
        <Modal.Header title={title} subtitle={subtitle} />
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer align="right">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : submitText}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
