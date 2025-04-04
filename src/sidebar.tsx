import React from 'react';
import { Pencil } from 'lucide-react'; 
interface SidebarProps {
  onOpenDialog: () => void;
  // onDownloadImage: () => void;
  // onStickyNode: () => void;// Required prop to open the dialog
}


// export const Sidebar: React.FC<SidebarProps> = ({ onOpenDialog, onDownloadImage,onStickyNode }) => {
export const Sidebar: React.FC<SidebarProps> = ({ onOpenDialog }) => {

  return (
    <div className=" bg-blue-200  mb-2 p-1 rounded-full">
      <div className="flex flex-row items-center gap-10">
        <button
          onClick={onOpenDialog}
          className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
          title="Edit Site Structure"
        >
          <Pencil size={16} />
        </button>
        {/* <button
          onClick={onDownloadImage}
          className='p-2 text-white hover:bg-gray-700 transition-colors'
          title='Download sitemap as a image'
        >
          <Download size={16} />
        </button> */}

        {/* <button 
          onClick={onStickyNode}
          className='p-2 text-white hover:bg-gray-700 rounded-full transition-colors'
          title='Add Sticky note'
          >
            <StickyNote size={16}/>
          </button> */}
      </div>
    </div>
  );
};
