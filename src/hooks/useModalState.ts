import { useReducer } from 'react';

/**
 * All available modal types in the application.
 */
export type ModalType =
  | 'addWallet'
  | 'removeWallet'
  | 'marketWatch'
  | 'priceCard'
  | 'investmentDetail'
  | 'stakeDetail'
  | 'lpDetail'
  | 'farmDetail'
  | 'confirmAction'
  | 'settings'
  | 'help'
  | 'about'
  | 'customCoins'
  | 'apiKey'
  | 'tokenCard';

interface ModalState {
  openModal: ModalType | null;
  previousModal: ModalType | null;
  // For modals that carry additional data
  selectedModalId: string | null;
  confirmActionMessage: string;
  confirmActionCallback: (() => void) | null;
  isLoadingModal: boolean;
  modalError: string | null;
  tokenCardModalLoading: boolean;
}

interface ModalAction {
  type: 'OPEN' | 'CLOSE' | 'REPLACE';
  modal?: ModalType;
  payload?: {
    selectedModalId?: string | null;
    confirmActionMessage?: string;
    confirmActionCallback?: (() => void) | null;
    isLoadingModal?: boolean;
    modalError?: string | null;
    tokenCardModalLoading?: boolean;
  };
}

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        previousModal: state.openModal,
        openModal: action.modal || null,
        ...action.payload,
      };
    case 'CLOSE':
      return {
        ...state,
        openModal: null,
        selectedModalId: null,
        confirmActionMessage: '',
        confirmActionCallback: null,
        isLoadingModal: false,
        modalError: null,
        tokenCardModalLoading: false,
      };
    case 'REPLACE':
      // Only update openModal if modal is specified
      if (action.modal) {
        return {
          ...state,
          previousModal: state.openModal,
          openModal: action.modal,
          ...action.payload,
        };
      }
      // If no modal specified, just update the payload without changing openModal
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

const initialState: ModalState = {
  openModal: null,
  previousModal: null,
  selectedModalId: null,
  confirmActionMessage: '',
  confirmActionCallback: null,
  isLoadingModal: false,
  modalError: null,
  tokenCardModalLoading: false,
};

/**
 * Hook for managing modal state with support for multiple concurrent modals.
 *
 * Provides centralized modal state management using useReducer pattern.
 * Handles opening, closing, and replacing modals with optional payload data.
 * Tracks loading states, error messages, and confirmation actions.
 *
 * @example
 * ```tsx
 * const { openModal, closeModal, isModalOpen, currentModal } = useModalState();
 *
 * const handleOpenSettings = () => openModal('settings');
 * const handleOpenConfirm = () => {
 *   openModal('confirmAction', {
 *     confirmActionMessage: 'Delete this item?',
 *     confirmActionCallback: handleDelete
 *   });
 * };
 * ```
 *
 * @returns Object with modal state and action functions
 * @returns {ModalType | null} returns.currentModal - Currently open modal
 * @returns {ModalType | null} returns.previousModal - Previously open modal
 * @returns {string | null} returns.selectedModalId - ID for modal data
 * @returns {string} returns.confirmActionMessage - Message for confirm modal
 * @returns {function} returns.openModalAction - Open a modal with payload
 * @returns {function} returns.closeModal - Close current modal
 * @returns {function} returns.replaceModal - Replace current with new modal
 * @returns {function} returns.isModalOpen - Check if specific modal is open
 */
export const useModalState = () => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModalAction = (modal: ModalType, payload?: ModalAction['payload']) =>
    dispatch({ type: 'OPEN', modal, payload });

  const closeModal = () => dispatch({ type: 'CLOSE' });

  const replaceModal = (modal: ModalType, payload?: ModalAction['payload']) =>
    dispatch({ type: 'REPLACE', modal, payload });

  const isModalOpen = (modal: ModalType) => state.openModal === modal;

  const setSelectedModalId = (id: string | null) =>
    dispatch({
      type: 'REPLACE',
      payload: { selectedModalId: id },
    });

  const setConfirmActionMessage = (message: string) =>
    dispatch({
      type: 'REPLACE',
      payload: { confirmActionMessage: message },
    });

  const setConfirmActionCallback = (callback: (() => void) | null) =>
    dispatch({
      type: 'REPLACE',
      payload: { confirmActionCallback: callback },
    });

  const setIsLoadingModal = (loading: boolean) =>
    dispatch({
      type: 'REPLACE',
      payload: { isLoadingModal: loading },
    });

  const setModalError = (error: string | null) =>
    dispatch({
      type: 'REPLACE',
      payload: { modalError: error },
    });

  const setTokenCardModalLoading = (loading: boolean) =>
    dispatch({
      type: 'REPLACE',
      payload: { tokenCardModalLoading: loading },
    });

  return {
    // State accessors
    currentModal: state.openModal,
    openModal: state.openModal,
    previousModal: state.previousModal,
    selectedModalId: state.selectedModalId,
    confirmActionMessage: state.confirmActionMessage,
    confirmActionCallback: state.confirmActionCallback,
    isLoadingModal: state.isLoadingModal,
    modalError: state.modalError,
    tokenCardModalLoading: state.tokenCardModalLoading,

    // Utility functions
    isModalOpen,

    // Actions
    openModalAction,
    closeModal,
    replaceModal,

    // Specific setters for additional state (for backward compatibility)
    setSelectedModalId,
    setConfirmActionMessage,
    setConfirmActionCallback,
    setIsLoadingModal,
    setModalError,
    setTokenCardModalLoading,
  };
};
