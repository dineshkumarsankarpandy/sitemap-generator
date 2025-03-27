import React from 'react';
import { Pencil, Download, StickyNote } from 'lucide-react'; 
interface SidebarProps {
  onOpenDialog: () => void;
  onDownloadImage: () => void;
  onStickyNode: () => void;// Required prop to open the dialog
}


export const Sidebar: React.FC<SidebarProps> = ({ onOpenDialog, onDownloadImage,onStickyNode }) => {
  return (
    <div className="fixed left-0 top-0 h-screen w-16 !bg-cyan-600 z-20">
      <div className="flex flex-col items-center py-4 gap-10">
        <button
          onClick={onOpenDialog}
          className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
          title="Edit Site Structure"
        >
          <Pencil size={24} />
        </button>
        <button
          onClick={onDownloadImage}
          className='p-2 text-white hover:bg-gray-700 rounded-full transition-colors'
          title='Download sitemap as a image'
        >
          <Download size={34} />
        </button>

        <button 
          onClick={onStickyNode}
          className='p-2 text-white hover:bg-gray-700 rounded-full transition-colors'
          title='Add Sticky note'
          >
            <StickyNote size={34}/>
          </button>
      </div>
    </div>
  );
};
