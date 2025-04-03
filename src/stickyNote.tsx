import { useCallback, useState } from 'react';
import { NodeProps, Node, useReactFlow } from '@xyflow/react';
import { Copy, Trash2, PaintBucket } from 'lucide-react'

interface StickyNoteData extends Record<string, unknown> {
  label: string;
  content?: string;
  color?: string;
}

const StickyNoteNode = ({ id, data }: NodeProps<Node<StickyNoteData>>) => {
  const { setNodes, deleteElements, getNode } = useReactFlow();
  const [content, setContent] = useState<string>(data.content ?? '');
  const [color, setColor] = useState<string>(data.color ?? '#FFFF99');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  const colorOptions = [
    { name: 'Yellow', value: '#FFFF99' },
    { name: 'Pink', value: '#FFB6C1' },
    { name: 'Blue', value: '#ADD8E6' },
    { name: 'Green', value: '#90EE90' },
    { name: 'Orange', value: '#FFA500' },
  ];

  // Copy Sticky Note
  const handleCopy = useCallback(() => {
    const currentNode = getNode(id);
    if (!currentNode) return;

    const newNodeId = `sticky-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'stickyNote',
      data: { label: `${data.label} (Copy)`, content, color },
      position: { x: currentNode.position.x + 50, y: currentNode.position.y + 50 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [data.label, content, color, getNode, setNodes]);

  // Delete Sticky Note
  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  // Edit Content
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, content: e.target.value } } : node
      )
    );
  };

  // Change Color
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, color: newColor } } : node
      )
    );
    setShowColorPicker(false); // Close dropdown after selection
  };

  return (
    <div
      className="relative w-64 h-48 rounded-md shadow-md border border-gray-300"
      style={{ backgroundColor: color }}
    >

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-100 rounded-t-md">
        <span className="text-sm font-medium text-gray-800">{data.label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Copy Sticky Note"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-600 hover:text-red-600"
            title="Delete Sticky Note"
          >
            <Trash2 size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Pick Color"
            >
              <PaintBucket size={16} />
            </button>
            {showColorPicker && (
              <div className="absolute top-8 right-0 z-10 bg-white border border-gray-200 rounded shadow-md">
                {colorOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleColorChange(option.value)}
                  >
                    <div
                      className="w-4 h-4 mr-2 rounded-full"
                      style={{ backgroundColor: option.value }}
                    />
                    <span className="text-sm">{option.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-[calc(100%-2.5rem)] p-2 text-sm text-gray-800 bg-transparent border-none resize-none focus:outline-none"
        placeholder="Write your note here..."
      />
    </div>
  );
};

export default StickyNoteNode;
