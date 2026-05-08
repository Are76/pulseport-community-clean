import React from 'react';
import { AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: AlertType;
  title: string;
  message: string;
  actionText?: string;
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

/**
 * Alert modal for displaying informational messages
 * Uses compound component pattern
 */
export function AlertModal({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  actionText = 'OK',
}: AlertModalProps) {
  const Icon = iconMap[type];
  const iconColor = colorMap[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Header title={title} />
      <Modal.Body>
        <div className="flex gap-4">
          <Icon className={`${iconColor} flex-shrink-0 w-6 h-6`} />
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        </div>
      </Modal.Body>
      <Modal.Footer align="right">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          {actionText}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
