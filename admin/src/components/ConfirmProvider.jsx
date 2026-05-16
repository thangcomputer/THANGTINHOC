import { createContext, useCallback, useContext, useState } from 'react';
import ConfirmModal from './ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = (result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        open={!!state}
        title={state?.title}
        message={state?.message}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        danger={state?.danger}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}