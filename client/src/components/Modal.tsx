import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, footer, onClose }: ModalProps) {
  return (
    <div className="custom-modal-backdrop" role="presentation">
      <div className="custom-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="custom-modal-header">
          <h2 id="modal-title" className="custom-modal-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="custom-modal-body">{children}</div>
        <div className="custom-modal-footer">{footer}</div>
      </div>
    </div>
  );
}
