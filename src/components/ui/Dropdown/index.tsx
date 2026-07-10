import React, { useEffect, useRef, useState } from 'react';
import { 
  User, 
} from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { IoCaretDownOutline } from "react-icons/io5";

interface DropdownProps {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  label?:React.ReactNode | string;
  className?:string;
  btnClassName?:string;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  icon: Icon = <User />, 
  children, 
  defaultOpen = false ,
  label,
  className = "",
  btnClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <motion.div className={`relative ${isOpen?"shadow-xl":""} ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-4 p-3 bg-cream-bg
          transition-all duration-200 hover:shadow-sm ${btnClassName}
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select language"
      >
        <div className="flex items-center gap-2">
          <span className='text-black'>{Icon}</span>
        </div>
        {label}
        <IoCaretDownOutline
          size={22}
          className={`text-grayA4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>
      
      <AnimatePresence>
        {/* Dropdown Menu */}
        {isOpen && (
          <motion.div 
            exit={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 100 }}
            className={`
              ${isOpen?"shadow-xl ":""}
            absolute w-full top-full  end-0 
             z-50 bg-cream-bg min-w-[180px]
            flex flex-col gap-2
            `}
          >
            {children}            
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dropdown;