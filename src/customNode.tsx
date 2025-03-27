import { useCallback, useState, useEffect, useRef, memo } from 'react';
import { Handle, Position, useReactFlow, Node, Edge } from '@xyflow/react';
import { NodeProps } from '@xyflow/react';
import { useSitemapFunctions } from './sitemapFlow';
// --- Interfaces ---
interface Section {
  id: number | string;
  title: string;
  description: string;
}

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  sections: Section[];
  onHeaderClick?: (nodeId: string, label: string) => void;
  level: number;

}

type CustomNodeType = Node<CustomNodeData, 'custom'>;

// --- Component ---
function CustomNodeComponent({ id, data, selected }: NodeProps<CustomNodeType>) {
  // --- Hooks ---
  const { setNodes, setEdges, getEdges, deleteElements } = useReactFlow();
  const { getNextPageNumber, triggerLayout, setPageCount } = useSitemapFunctions();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editLabel, setEditLabel] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentEdges = useCallback(() => getEdges(), [getEdges]);
  const findParentEdge = useCallback((): Edge | undefined => getCurrentEdges().find((edge) => edge.target === id), [getCurrentEdges, id]);
  const isRootNode = useCallback((): boolean => !findParentEdge(), [findParentEdge]);
  const hasChildren = getCurrentEdges().some(edge => edge.source === id);

  const canAddChild = !hasChildren;
  const addChildNode = useCallback((): void => {
    const newNodeId = `node-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
    const pageNo = getNextPageNumber();

    const newNode: CustomNodeType = {
      id: newNodeId, type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        label: `Page ${pageNo}`,
        sections: [],
        onHeaderClick: data.onHeaderClick,
        level: (data.level ?? 0) + 1,
      },
    };
    const newEdge: Edge = { id: `edge-${id}-${newNodeId}`, source: id, target: newNodeId, type: 'smoothstep' };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    triggerLayout();

  }, [id, data.onHeaderClick, data.level, setNodes, setEdges, getNextPageNumber, triggerLayout]);



  const addSiblingNode = useCallback(
    (positionType: 'before' | 'after' | 'end') => {
      const parentEdge = findParentEdge();
      if (!parentEdge) { console.warn("Cannot add sibling: Node is root or orphaned.", { id }); return; }
      const parentId = parentEdge.source;

      const newNodeId = `node-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
      const pageNo = getNextPageNumber();
      const newNode: CustomNodeType = {
        id: newNodeId, type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          label: `Page ${pageNo}`,
          sections: [],
          onHeaderClick: data.onHeaderClick,
          level: data.level,
        },
      };
      const newEdge: Edge = { id: `edge-${parentId}-${newNodeId}`, source: parentId, target: newNodeId, type: 'smoothstep' };

      const allCurrentEdges = getCurrentEdges();
      const nonSiblingEdges = allCurrentEdges.filter(edge => edge.source !== parentId);
      const siblingEdges = allCurrentEdges.filter(edge => edge.source === parentId);
      let newSiblingEdges: Edge[];
      if (positionType === 'end') {
        newSiblingEdges = [...siblingEdges, newEdge];
      } else {
        const currentEdgeIndexInSiblings = siblingEdges.findIndex(edge => edge.target === id);
        if (currentEdgeIndexInSiblings === -1) {
          console.warn("addSiblingNode: Current sibling edge not found, adding to end.");
          newSiblingEdges = [...siblingEdges, newEdge];
        } else {
          newSiblingEdges = [...siblingEdges];
          if (positionType === 'before') { newSiblingEdges.splice(currentEdgeIndexInSiblings, 0, newEdge); }
          else { newSiblingEdges.splice(currentEdgeIndexInSiblings + 1, 0, newEdge); }
        }
      }
      const finalEdges = [...nonSiblingEdges, ...newSiblingEdges];

      setNodes((nds) => [...nds, newNode]);
      setEdges(finalEdges);
      triggerLayout();

    },
    [id, data.onHeaderClick, data.level, setNodes, setEdges, getCurrentEdges, findParentEdge, getNextPageNumber, triggerLayout] // Add context functions to deps
  );


  const findAllDescendantIds = useCallback((nodeId: string, allEdges: Edge[]): string[] => {
    const directChildren = allEdges.filter(edge => edge.source === nodeId).map(edge => edge.target);
    return [...directChildren, ...directChildren.flatMap(childId => findAllDescendantIds(childId, allEdges))];
  }, []);

  const deleteNodeAndDescendants = useCallback((): void => {
    const allCurrentEdges = getCurrentEdges();
    const descendantIds = findAllDescendantIds(id, allCurrentEdges);
    const edgeIdsToDelete = allCurrentEdges
      .filter(edge => descendantIds.includes(edge.source) || descendantIds.includes(edge.target))
      .map(edge => edge.id);

    if (id === "root") {
      deleteElements({
        nodes: descendantIds.map(nid => ({ id: nid })),
        edges: edgeIdsToDelete.map(eid => ({ id: eid }))
      });
      setPageCount(0);
    } else {
      const allNodeIdsToDelete = [id, ...descendantIds];
      const allEdgeIdsToDelete = allCurrentEdges
        .filter(edge => allNodeIdsToDelete.includes(edge.source) || allNodeIdsToDelete.includes(edge.target))
        .map(edge => edge.id);
      deleteElements({
        nodes: allNodeIdsToDelete.map(nid => ({ id: nid })),
        edges: allEdgeIdsToDelete.map(eid => ({ id: eid }))
      });
    }

    setShowMenu(false);
    triggerLayout();
  }, [id, getCurrentEdges, deleteElements, triggerLayout, findAllDescendantIds, setPageCount]); // Add setPageCount to dependencies
  const handleHeaderClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setEditLabel(data.label); setIsEditing(true); /* data.onHeaderClick?.(id, data.label); */ }, [data.label]);

  const handleSaveLabel = useCallback(() => {
    const trimmedLabel = editLabel.trim();
    if (trimmedLabel && trimmedLabel !== data.label) {
      setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, label: trimmedLabel } } : node)));
    }
    setIsEditing(false);
  }, [editLabel, data.label, id, setNodes]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { handleSaveLabel(); e.preventDefault(); }
    else if (e.key === 'Escape') { setEditLabel(data.label); setIsEditing(false); e.preventDefault(); }
  }, [handleSaveLabel, data.label]
  );

  useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);

  return (
    <div className={`relative rounded-md border bg-white shadow-md w-64 ${selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-neutral-200'} node-wrapper group`}>
      {/* Incoming Handle */}
      <Handle type="target" position={Position.Top} id={`${id}-target`} className="!h-3 !w-3 !rounded-full !bg-cyan-600 !-top-[7px] !border-2 !border-white !opacity-50 group-hover:!opacity-100" isConnectable={false} />

      {/* Header */}
      <div className="relative">
        {isEditing ? (
          <div className="flex items-center justify-between rounded-t-md border-b border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={handleInputKeyDown}
              className="w-full border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-between rounded-t-md border-b border-neutral-200 bg-neutral-50 px-3 py-2 cursor-pointer"
            onClick={handleHeaderClick}
          >
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">📄</span>
              <span className="text-sm font-medium text-neutral-800">{data.label}</span>
            </div>
            <button
              className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              ⋯
            </button>
            {showMenu && (
              <div className="absolute top-10 right-2 z-10 rounded-md border border-neutral-200 bg-white shadow-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNodeAndDescendants();
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Delete Node
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-3 space-y-2 text-xs text-neutral-500">
        <div>Level: {data.level ?? 0}</div>
        {data.sections?.length > 0 && (
          <div className="mt-1 space-y-1 border-t pt-2">
            <span className="font-medium text-xs text-neutral-600 block mb-1">Sections:</span>
            {data.sections.slice(0, 3).map((section) => (
              <div key={section.id} className="text-xs text-neutral-700 truncate border-b pb-1">{section.title || '(Untitled)'}</div>
            ))}
            {data.sections.length > 3 && <div className="text-xs text-neutral-400 italic">...and {data.sections.length - 3} more</div>}
          </div>
        )}
        {/* <div className="mt-2 flex"><button onClick={generateContent} className="...">✨ Generate</button></div> */}
      </div>

      {/* Action Buttons */}

      {!isRootNode() && (<button onClick={() => addSiblingNode('before')} className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add page before">+</button>)}
      {!isRootNode() && (<button onClick={() => addSiblingNode('after')} className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add page after">+</button>)}
      {/* {!isRootNode() && (<button onClick={() => addSiblingNode('end')} className="absolute -right-3 top-1/2 translate-y-[calc(50%+4px)] flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add page at end of level">+<span className="text-xs -ml-0.5">E</span></button>)} */}
      {canAddChild && (< button onClick={() => addChildNode()} className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add child page">+</button>)}

      {/* Outgoing Handle */}
      <Handle type="source" position={Position.Bottom} id={`${id}-source`} className="!h-3 !w-3 !rounded-full !bg-cyan-600 !-bottom-[7px] !border-2 !border-white !opacity-50 group-hover:!opacity-100" isConnectable={false} />
    </div>
  );
}

// Memoization (Keep as before)
export default memo(CustomNodeComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.label === nextProps.data.label &&
    prevProps.data.level === nextProps.data.level &&
    JSON.stringify(prevProps.data.sections) === JSON.stringify(nextProps.data.sections);
});
