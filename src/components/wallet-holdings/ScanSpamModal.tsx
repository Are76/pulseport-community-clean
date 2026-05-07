import React, { useEffect, useState, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ScanSpamModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScanning: boolean;
  scanResult: number | null;
  onConfirmRemove: (spamIds: string[]) => void;
}

export function ScanSpamModal({
  isOpen,
  onClose,
  isScanning,
  scanResult,
  onConfirmRemove,
}: ScanSpamModalProps) {
  const [progress, setProgress] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && isScanning) {
      setProgress(0);

      // Simulate scanning with progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isOpen, isScanning]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" role="dialog" aria-modal="true">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scan for Spam</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isScanning}
          >
            <X size={20} />
          </button>
        </div>

        {isScanning ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="inline-block mb-4">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full" />
                </div>
              </div>
              <p className="text-gray-600">Scanning coins for spam...</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="text-orange-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-orange-900">Scan Complete</p>
                <p className="text-sm text-orange-800 mt-1">
                  Found {scanResult || 0} potential spam coin
                  {scanResult !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {!scanResult || scanResult === 0
                ? 'No spam coins detected in your holdings.'
                : 'Would you like to remove these detected spam coins?'}
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={() => onConfirmRemove([])}
                disabled={!scanResult || scanResult === 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Remove Spam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
