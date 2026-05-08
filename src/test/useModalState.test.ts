import { renderHook, act } from '@testing-library/react';
import { useModalState, ModalType } from '../hooks/useModalState';
import { vi } from 'vitest';

describe('useModalState', () => {
  it('should initialize with no modal open', () => {
    const { result } = renderHook(() => useModalState());

    expect(result.current.openModal).toBeNull();
    expect(result.current.previousModal).toBeNull();
    expect(result.current.isLoadingModal).toBe(false);
    expect(result.current.modalError).toBeNull();
    expect(result.current.selectedModalId).toBeNull();
  });

  it('should open a modal and track previous modal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('addWallet');
    });

    expect(result.current.openModal).toBe('addWallet');
    expect(result.current.previousModal).toBeNull();
    expect(result.current.isModalOpen('addWallet')).toBe(true);
    expect(result.current.isModalOpen('removeWallet')).toBe(false);
  });

  it('should track previous modal when opening a new one', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('addWallet');
    });

    act(() => {
      result.current.openModalAction('removeWallet');
    });

    expect(result.current.openModal).toBe('removeWallet');
    expect(result.current.previousModal).toBe('addWallet');
  });

  it('should close modal and reset related state', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('confirmAction', {
        confirmActionMessage: 'Are you sure?',
        isLoadingModal: true,
      });
    });

    expect(result.current.openModal).toBe('confirmAction');
    expect(result.current.isLoadingModal).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.openModal).toBeNull();
    expect(result.current.isLoadingModal).toBe(false);
    expect(result.current.confirmActionMessage).toBe('');
    expect(result.current.modalError).toBeNull();
  });

  it('should replace modal without closing first', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('addWallet');
    });

    act(() => {
      result.current.replaceModal('settings');
    });

    expect(result.current.openModal).toBe('settings');
    expect(result.current.previousModal).toBe('addWallet');
  });

  it('should correctly identify open modals with isModalOpen selector', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('marketWatch');
    });

    const testModals: ModalType[] = [
      'addWallet',
      'removeWallet',
      'marketWatch',
      'priceCard',
      'settings',
    ];

    testModals.forEach((modal) => {
      const expected = modal === 'marketWatch';
      expect(result.current.isModalOpen(modal)).toBe(expected);
    });
  });

  it('should support payload data when opening modals', () => {
    const { result } = renderHook(() => useModalState());
    const mockCallback = vi.fn();

    act(() => {
      result.current.openModalAction('confirmAction', {
        confirmActionMessage: 'Delete this item?',
        confirmActionCallback: mockCallback,
        isLoadingModal: true,
        modalError: null,
      });
    });

    expect(result.current.openModal).toBe('confirmAction');
    expect(result.current.confirmActionMessage).toBe('Delete this item?');
    expect(result.current.confirmActionCallback).toBe(mockCallback);
    expect(result.current.isLoadingModal).toBe(true);
  });

  it('should update confirmActionMessage independently', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('confirmAction');
    });

    act(() => {
      result.current.setConfirmActionMessage('Are you sure?');
    });

    expect(result.current.confirmActionMessage).toBe('Are you sure?');
    expect(result.current.openModal).toBe('confirmAction');
  });

  it('should update isLoadingModal independently', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('confirmAction');
    });

    act(() => {
      result.current.setIsLoadingModal(true);
    });

    expect(result.current.isLoadingModal).toBe(true);
    expect(result.current.openModal).toBe('confirmAction');

    act(() => {
      result.current.setIsLoadingModal(false);
    });

    expect(result.current.isLoadingModal).toBe(false);
  });

  it('should update modalError independently', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('settings');
    });

    act(() => {
      result.current.setModalError('Failed to save settings');
    });

    expect(result.current.modalError).toBe('Failed to save settings');
    expect(result.current.openModal).toBe('settings');

    act(() => {
      result.current.setModalError(null);
    });

    expect(result.current.modalError).toBeNull();
  });

  it('should update selectedModalId independently', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('priceCard');
    });

    act(() => {
      result.current.setSelectedModalId('card-123');
    });

    expect(result.current.selectedModalId).toBe('card-123');
    expect(result.current.openModal).toBe('priceCard');
  });

  it('should update tokenCardModalLoading independently', () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openModalAction('tokenCard');
    });

    act(() => {
      result.current.setTokenCardModalLoading(true);
    });

    expect(result.current.tokenCardModalLoading).toBe(true);
    expect(result.current.openModal).toBe('tokenCard');
  });

  it('should handle multiple sequential modal opens and closes', () => {
    const { result } = renderHook(() => useModalState());

    const sequence: ModalType[] = ['addWallet', 'removeWallet', 'settings', 'help'];

    sequence.forEach((modal, index) => {
      act(() => {
        result.current.openModalAction(modal);
      });
      expect(result.current.openModal).toBe(modal);
      expect(result.current.isModalOpen(modal)).toBe(true);
    });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.openModal).toBeNull();
    sequence.forEach((modal) => {
      expect(result.current.isModalOpen(modal)).toBe(false);
    });
  });
});
