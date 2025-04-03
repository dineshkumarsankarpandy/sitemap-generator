import { useCallback, useState, useEffect, useRef, memo, useMemo } from 'react';
import { Handle, Position, useReactFlow, Node, Edge, NodeProps, useStore } from '@xyflow/react';
import { useSitemapFunctions } from './sitemapFlow';
// import type  AppNode  from './sitemapFlow';
type AppNode = Node<any>;
interface Section {
  id: number | string;
  title: string;
  description: string;
}

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  sections: Section[];
  level: number;
}

type CustomNodeType = Node<CustomNodeData, 'custom'>;

// --- Component ---
function CustomNodeComponent({ id, data, selected }: NodeProps<CustomNodeType>) {
  // --- Hooks ---
  const { setNodes, setEdges, getEdges, deleteElements, getNodes } = useReactFlow<AppNode, Edge>();
  const { getNextPageNumber,setPageCount } = useSitemapFunctions();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editLabel, setEditLabel] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingSectionId, setEditingSectionId] = useState<string | number | null>(null); // Use number | string for ID
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState<string>('');
  const [editSectionDescription, setEditSectionDescription] = useState<string>('');
  const sectionInputRef = useRef<HTMLInputElement>(null);


  const getCurrentEdges = useCallback(() => getEdges(), [getEdges]);
  const findParentEdge = useCallback((): Edge | undefined => getCurrentEdges().find((edge) => edge.target === id), [getCurrentEdges, id]);
  const isRootNode = useCallback((): boolean => {
      if (id === 'root') return true;
      return !findParentEdge();
  }, [id, findParentEdge]);

  const [hasChildren, setHasChildren] = useState(false);
  const edges = useStore((store) => store.edges);

  useEffect(() => {
    const found = edges.some((edge) => edge.source === id);
    setHasChildren(found);
  }, [edges, id]);



  useEffect(() => {
    console.log(`Node ${id} has children?`, hasChildren);
  }, [hasChildren]);

  // --- Node Actions ---
  const addChildNode = useCallback(() => {
    console.log('inside add child node logic')
    const newNodeId = `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newPageLabel = `Page ${getNextPageNumber()}`;
  
    const newNode: CustomNodeType = {
      id: newNodeId,
      type: 'custom',
      data: {
        label: newPageLabel,
        sections: [],
        level: (data.level ?? 0) + 1,
      },
      position: { x: 0, y: 0 }, // layout will update this
    };
  
    const newEdge: Edge = {
      id: `edge-${id}-${newNodeId}`,
      source: id,
      target: newNodeId,
      type: 'smoothstep',
    };
  
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
  }, [id, data.level, setNodes, setEdges, getNextPageNumber]);
  
  const addSiblingNode = useCallback(
    (positionType: 'before' | 'after' | 'end') => {
      const parentEdge = getEdges().find((edge) => edge.target === id);
      if (!parentEdge) return; // Root node has no parent
  
      const parentId = parentEdge.source;
      const newNodeId = `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const newLabel = `Page ${getNextPageNumber()}`;
  
      const newNode: CustomNodeType = {
        id: newNodeId,
        type: 'custom',
        data: {
          label: newLabel,
          sections: [],
          level: data.level, // same level as current
        },
        position: { x: 0, y: 0 },
      };
  
      const newEdge: Edge = {
        id: `edge-${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        type: 'smoothstep',
      };
  
      setNodes((nds) => [...nds, newNode]);
  
      setEdges((eds) => {
        const siblings = eds.filter((e) => e.source === parentId);
        const others = eds.filter((e) => e.source !== parentId);
  
        if (positionType === 'end') {
          return [...others, ...siblings, newEdge];
        }
  
        const currentIndex = siblings.findIndex((e) => e.target === id);
        if (currentIndex === -1) return [...others, ...siblings, newEdge];
  
        const insertIndex = positionType === 'before' ? currentIndex : currentIndex + 1;
        const newSiblingEdges = [...siblings];
        newSiblingEdges.splice(insertIndex, 0, newEdge);
  
        return [...others, ...newSiblingEdges];
      });
    },
    [id, data.level, setNodes, setEdges, getNextPageNumber, getEdges]
  );
  

  const findAllDescendantIds = useCallback((nodeId: string, allEdges: Edge[]): string[] => {
    const childrenEdges = allEdges.filter(edge => edge.source === nodeId);
    const directChildrenIds = childrenEdges.map(edge => edge.target);
    const descendantIds = directChildrenIds.flatMap(childId => findAllDescendantIds(childId, allEdges));
    return [...directChildrenIds, ...descendantIds];
  }, []);

  const deleteNodeAndDescendants = useCallback((): void => {
    if (id === "root") {
      if (window.confirm("Deleting the 'Home' node will clear the entire sitemap. Are you sure?")) {
        const allNodes = getNodes(); const allEdges = getEdges();
        deleteElements({ nodes: allNodes.map(n => ({ id: n.id })), edges: allEdges.map(e => ({ id: e.id })) });
        setPageCount(0);
      } else { setShowMenu(false); return; }
    } else {
      const allCurrentEdges = getCurrentEdges();
      const descendantIds = findAllDescendantIds(id, allCurrentEdges);
      const allNodeIdsToDelete = [id, ...descendantIds];
      const allEdgeIdsToDelete = allCurrentEdges.filter(edge => allNodeIdsToDelete.includes(edge.source) || allNodeIdsToDelete.includes(edge.target)).map(edge => edge.id);
      deleteElements({ nodes: allNodeIdsToDelete.map(nid => ({ id: nid })), edges: allEdgeIdsToDelete.map(eid => ({ id: eid })) });
    }
    setShowMenu(false);
    // triggerLayout();
  }, [id, getCurrentEdges, deleteElements, findAllDescendantIds, setPageCount, getNodes, getEdges]);

  const addSection = useCallback(() => {
    const newSection: Section = {
      id: `section-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`, // Unique string ID
      title: `New Section`, // Default title
      description: '',
    };

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id && node.type === 'custom') {
            const currentSections = node.data.sections || []; 
            return {
              ...node,
              data: {
                ...node.data,
                sections: [...currentSections, newSection],
              },
            };
        }
        return node;
      })
    );
    // triggerLayout();
  }, [id, setNodes]);

  const deleteSection = useCallback((sectionIdToDelete: string | number) => {
     setNodes((nds) =>
        nds.map((node) => {
            if (node.id === id && node.type === 'custom') {
                const currentSections = node.data.sections || [];
                return {
                  ...node,
                  data: {
                    ...node.data,
                    sections: currentSections.filter((section: Section) => section.id !== sectionIdToDelete)
                  }
                };
            }
            return node;
        })
     );
    //  triggerLayout();
  }, [id, setNodes]);

  const handleSectionClick = useCallback((sectionId: string | number, field: 'title' | 'description', currentValue: string) => {
    setEditingSectionId(sectionId);
    setEditingField(field);
    if (field === 'title') {
      setEditSectionTitle(currentValue);
      setEditSectionDescription('');
    } else {
      setEditSectionDescription(currentValue);
      setEditSectionTitle(''); // Clear other field potentially
    }
  }, []);

  const handleSectionSave = useCallback(() => {
    if (editingSectionId === null || editingField === null) return; // Nothing to save

    const valueToSave = (editingField === 'title' ? editSectionTitle : editSectionDescription).trim();

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id && node.type === 'custom') {
          const currentSections = node.data.sections || [];
          return {
            ...node,
            data: {
              ...node.data,
              sections: currentSections.map((section: Section) =>
                section.id === editingSectionId
                  ? { ...section, [editingField]: valueToSave } // Update the specific field
                  : section
              ),
            },
          };
        }
        return node;
      })
    );

    // Reset editing state
    setEditingSectionId(null);
    setEditingField(null);
    setEditSectionTitle('');
    setEditSectionDescription('');

    // triggerLayout();

  }, [editingSectionId, editingField, editSectionTitle, editSectionDescription, id, setNodes]);

  const handleSectionInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSectionSave();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        // Cancel editing
        setEditingSectionId(null);
        setEditingField(null);
        setEditSectionTitle('');
        setEditSectionDescription('');
        e.preventDefault();
      }
    },
    [handleSectionSave] // Dependency on save handler
  );

  // Focus section input when editing starts
  useEffect(() => {
    if (editingSectionId !== null && editingField !== null && sectionInputRef.current) {
      sectionInputRef.current.focus();
      sectionInputRef.current.select();
    }
  }, [editingSectionId, editingField]);


  // --- Header Editing ---
  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditLabel(data.label);
    setIsEditing(true);
    setShowMenu(false); // Hide menu when starting edit
  }, [data.label]);

  const handleSaveLabel = useCallback(() => {
    const trimmedLabel = editLabel.trim();
    if (trimmedLabel && trimmedLabel !== data.label) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id && node.type === 'custom'
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: trimmedLabel,
                },
              }
            : node
        )
      );
    } else if (!trimmedLabel) { console.warn("Node label cannot be empty."); setEditLabel(data.label); }
    setIsEditing(false);
  }, [editLabel, data.label, id, setNodes]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { handleSaveLabel(); e.preventDefault(); }
    else if (e.key === 'Escape') { setEditLabel(data.label); setIsEditing(false); e.preventDefault(); }
  }, [handleSaveLabel, data.label]);

  useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);

  // --- Render ---
  return (
    <div className={`relative rounded-md border bg-white shadow-md w-64 ${selected ? 'border-cyan-500 ring-2 ring-cyan-300' : 'border-neutral-200'} node-wrapper group transition-all duration-150 ease-in-out`}>
      {!isRootNode() && (
          <Handle type="target" position={Position.Top} id={`${id}-target`} className="!h-3 !w-3 !rounded-full !bg-cyan-600 !-top-[7px] !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" isConnectable={false} />
      )}

      {/* Header */}
      <div className="relative">
        {isEditing ? (
          <div className="flex items-center justify-between rounded-t-md border-b border-neutral-200 bg-neutral-50 px-3 py-2">
            <input ref={inputRef} type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} onBlur={handleSaveLabel} onKeyDown={handleInputKeyDown} className="flex-grow border border-neutral-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" onClick={(e) => e.stopPropagation()} />
          </div>
        ) : (
          <div className={`flex items-center justify-between rounded-t-md border-b border-neutral-200 bg-neutral-50 px-3 py-2 ${!isRootNode() ? 'cursor-pointer' : ''} hover:bg-neutral-100 transition-colors`} onClick={handleHeaderClick}>
            <div className="flex items-center gap-2 overflow-hidden"> <span className="text-neutral-600 flex-shrink-0">{isRootNode() ? '🏠' : '📄'}</span> <span className="text-sm font-medium text-neutral-800 truncate" title={data.label}>{data.label}</span> </div>
            <button className="flex-shrink-0 ml-2 text-neutral-400 hover:text-neutral-700 focus:outline-none p-1 rounded hover:bg-neutral-200" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} title="Node options"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /> </svg> </button>
            {showMenu && (
              <div className="absolute top-full right-2 mt-1 z-20 min-w-[120px] rounded-md border border-neutral-200 bg-white shadow-lg py-1">
                <button onClick={(e) => { e.stopPropagation(); handleHeaderClick(e); }} className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"> Rename </button>
                {/* <button onClick={(e) => { e.stopPropagation(); addChildNode(); }} disabled={!canAddChild} className={`block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors ${!canAddChild ? 'opacity-50 cursor-not-allowed' : ''}`}> Add Child Page </button> */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addChildNode();
                    setShowMenu(false); // optionally close menu
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Add Child Page
                </button>
                  
                {!isRootNode() && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addSiblingNode('before');
                        setShowMenu(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      Add Page Before
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addSiblingNode('after');
                        setShowMenu(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      Add Page After
                    </button>
                  </>
                )}

                <div className="my-1 h-px bg-neutral-200"></div>
                <button onClick={(e) => { e.stopPropagation(); deleteNodeAndDescendants(); }} className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"> Delete {isRootNode() ? 'Sitemap' : 'Node'} </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content - Sections */}
      <div className="p-3 space-y-2 text-xs text-neutral-500 min-h-[60px]"> {/* Increased min-height slightly */}
        {/* <div className="text-neutral-400">Level: {data.level ?? 0}</div> */}

        {/* Display Sections or Add Button */}
        {data.sections && data.sections.length > 0 ? (
          <div className="space-y-2 border-t border-neutral-100 pt-2">
            {/* <span className="font-medium text-xs text-neutral-600 block mb-1">Sections:</span> */}
            {data.sections.map((section) => (
              <div key={section.id} className="group/section relative space-y-1 border-b border-dashed border-neutral-200 pb-2 last:border-b-0">
                 {/* Section Title */}
                 <div className="flex items-center justify-between">
                    {editingSectionId === section.id && editingField === 'title' ? (
                    <input
                        ref={sectionInputRef}
                        type="text"
                        value={editSectionTitle}
                        onChange={(e) => setEditSectionTitle(e.target.value)}
                        onBlur={handleSectionSave}
                        onKeyDown={handleSectionInputKeyDown}
                        className="flex-grow border border-neutral-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 mr-1"
                        onClick={(e) => e.stopPropagation()}
                    />
                    ) : (
                    <div
                        className="flex-grow text-xs text-neutral-700 font-medium truncate cursor-pointer hover:bg-neutral-100 p-1 rounded mr-1"
                        onClick={(e) => { e.stopPropagation(); handleSectionClick(section.id, 'title', section.title); }}
                        title={section.title}
                    >
                        {section.title || '(Untitled Section)'}
                    </div>
                    )}
                    {/* Delete Section Button */}
                     <button
                        onClick={(e) => {e.stopPropagation(); deleteSection(section.id);}}
                        className="flex-shrink-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover/section:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded"
                        title="Delete section"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </button>
                 </div>

                {/* Section Description */}
                {editingSectionId === section.id && editingField === 'description' ? (
                  <input
                    ref={sectionInputRef}
                    type="text"
                    value={editSectionDescription}
                    onChange={(e) => setEditSectionDescription(e.target.value)}
                    onBlur={handleSectionSave}
                    onKeyDown={handleSectionInputKeyDown}
                    className="w-full border border-neutral-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 mt-1"
                    placeholder="Description..."
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className={`w-full text-xs text-neutral-500 hover:bg-neutral-100 p-1 rounded mt-1 ${!section.description ? 'italic text-neutral-400' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleSectionClick(section.id, 'description', section.description); }}
                    title={section.description}
                  >
                    {section.description || 'Add description...'}
                  </div>
                )}
              </div>
            ))}
             {/* Add Section Button (when sections exist) */}
             <button
                onClick={addSection}
                className="mt-2 flex items-center justify-center w-full py-1 text-xs text-neutral-500 bg-neutral-50 rounded hover:bg-neutral-100 border border-dashed border-neutral-200"
                title="Add new section"
                >
                + Add Section
            </button>
          </div>
        ) : (
          // Placeholder when no sections exist
          <div className="mt-2 flex flex-col items-center gap-2 pt-2">
            <div className="text-xs text-neutral-400 italic">No sections added.</div>
            <button
              onClick={addSection}
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-600 bg-neutral-100 rounded hover:bg-neutral-200 border border-neutral-200"
              title="Add first section"
            >
              <span className="text-sm">+</span> Section
            </button>
            {/* Keep Generate Content button if needed */}
             {/* <button className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 bg-purple-50 rounded hover:bg-purple-100">
               <span className="text-sm">✨</span> Generate content
             </button> */}
          </div>
        )}
      </div>

      {/* Action Buttons for Nodes */}
      {!isRootNode() && (<button onClick={(e)=>{e.stopPropagation(); addSiblingNode('before');}} className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-cyan-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add page before"> + </button>)}
      {!isRootNode() && (<button onClick={(e)=>{e.stopPropagation(); addSiblingNode('after');}} className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-cyan-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add page after"> + </button>)}
      {/* {canAddChild && (<button onClick={(e)=>{e.stopPropagation(); addChildNode();}} className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-cyan-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10" title="Add child page"> + </button>)} */}
      {!hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addChildNode();
          }}
          className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-cyan-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
          title="Add child page"
        >
          +
        </button>
      )}


      {/* Outgoing Handle */}
      <Handle type="source" position={Position.Bottom} id={`${id}-source`} className="!h-3 !w-3 !rounded-full !bg-cyan-600 !-bottom-[7px] !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity" isConnectable={false} />
    </div>
  );
}

// Memoization
export default memo(CustomNodeComponent, (prevProps, nextProps) => {
    const prevData = prevProps.data; const nextData = nextProps.data;
    if (prevProps.id !== nextProps.id || prevProps.selected !== nextProps.selected || !prevData || !nextData) return false;
    return prevData.label === nextData.label && prevData.level === nextData.level && JSON.stringify(prevData.sections) === JSON.stringify(nextData.sections);
});