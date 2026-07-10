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
    // Backdrop
    <div 
      className="fixed inset-0 bg-black/50  flex items-center justify-center z-99"
      onClick={onClose} // Close on backdrop click
    >
      {/* Modal content */}
      <div 
        className={`bg-cream-bg rounded-lg shadow-xl  mx-4 max-h-dvh overflow-y-auto p-2 ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent close on content click
      >        
        {children}
      </div>
    </div>
  );
};



export default Modal;