import React, { useState, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface PrimaryNavbarProps {
  title?: string;
  onDelete?: () => void;
  onSetupOpen?: () => void; 
}

export const PrimaryNavbar: React.FC<PrimaryNavbarProps> = ({
  title = "Primary Sitemap",
  onDelete,
  onSetupOpen, 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: any) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  React.useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);


  const handleNavbarClick = () => {
    if (onSetupOpen) {
      setIsMenuOpen(false);
      onSetupOpen(); 
    }
  };

  return (
    <div className="flex justify-center items-center w-full h-10 mt-24">
      <div
        className="w-[50%] !bg-cyan-600 px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={handleNavbarClick} // Add click handler
      >
        <span>{title}</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={onDelete ? toggleMenu : undefined}
            className={`p-1 ${onDelete ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            aria-label="Open menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {isMenuOpen && onDelete && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded z-10">
              <button
                className="w-full text-left px-2 py-1 text-red-600 hover:bg-gray-100"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
