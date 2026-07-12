import React, { useEffect } from 'react';

// Modal component with TypeScript props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?:string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children , className }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99]"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl border border-border/50 bg-card/90 backdrop-blur-md shadow-2xl mx-4 max-h-dvh overflow-y-auto p-2 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};



export default Modal;