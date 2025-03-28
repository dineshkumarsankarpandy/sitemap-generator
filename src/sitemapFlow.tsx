import { useState, useCallback, useRef, useEffect, createContext, useContext, useMemo } from 'react'; 
import {
  ReactFlow,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  // Connection,
  NodeTypes,
  ReactFlowInstance,
  BackgroundVariant,
  Background,
  ReactFlowProvider, // Keep ReactFlowProvider for useReactFlow hook
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as htmlToImage from 'html-to-image';
import ELK from 'elkjs/lib/elk.bundled.js';
import CustomNode from './customNode';
import StickyNoteNode from './stickyNote';
import { Sidebar } from './sidebar';
import { PrimaryNavbar } from './sitemapBar';
// import { PageDialog } from './primarSetupForm';
import { PrimarySetupForm } from './primarSetupForm';

// --- Interfaces ---
interface Section {
  id: number | string;
  title: string;
  description: string;
}

// --- REMOVE functions from NodeData ---
interface CustomNodeData extends Record<string, unknown> {
  label: string;
  sections: Section[];
  onHeaderClick?: (nodeId: string, label: string) => void; // Still okay if needed for dialogs
  level: number;
  // REMOVED: getNextPageNumber
  // REMOVED: triggerLayout
}

interface StickyNoteData extends Record<string, unknown> {
  label: string;
  content?: string;
  color?: string;
}

type StickyNoteType = Node<StickyNoteData, 'stickyNote'>;
type CustomNodeType = Node<CustomNodeData, 'custom'>;
export type AppNode = CustomNodeType | StickyNoteType;

// --- Context Definition ---
interface SitemapContextProps {
  getNextPageNumber: () => number;
  triggerLayout: () => void;
  setPageCount: (count: number) => void;
  // Add other shared functions/state if needed
}

// Create the context with a default undefined value
const SitemapContext = createContext<SitemapContextProps | undefined>(undefined);

// Custom hook to use the Sitemap context
export const useSitemapFunctions = (): SitemapContextProps => {
  const context = useContext(SitemapContext);
  if (context === undefined) {
    throw new Error('useSitemapFunctions must be used within a SitemapProvider');
  }
  return context;
};
// --- End Context Definition ---


// --- Constants ---
const nodeTypes: NodeTypes = {
  custom: CustomNode,
  stickyNote: StickyNoteNode,
};

const initialNodes: AppNode[] = [
  {
    id: 'root',
    type: 'custom',
    data: { label: 'Home', sections: [], level: 0 }, // No functions needed here
    position: { x: 0, y: 0 },
  },
];
const initialEdges: Edge[] = [];
const elk = new ELK();
const NODE_WIDTH = 258;
const NODE_HEADER_HEIGHT = 40;
const SECTION_HEIGHT = 30;
const NODE_BASE_PADDING = 55;
const SITEMAP_STORAGE_KEY = 'sitemap_data';

// --- ELK Layout Function (Keep as before) ---

 
const getLayoutedElements = async (nodes: AppNode[], edges: Edge[]): Promise<{ nodes: AppNode[]; edges: Edge[] }> => {
  const topmostNodes = nodes.filter((node) => !edges.some((edge) => edge.target === node.id));
  const topmostYPositions: { [key: string]: number } = {};
  topmostNodes.forEach((node) => {
    topmostYPositions[node.id] = node.position.y;
  });
 
  const elkGraph = {
    id: 'root',
    properties: {
      'elk.algorithm': 'mrtree',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNodeBetweenLayers': 200,
      'elk.spacing.nodeNode': 200,
      'elk.alignment': 'CENTER',
      'elk.padding': '[top=100,left=50,bottom=50,right=50]',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEADER_HEIGHT + ('sections' in node.data && Array.isArray((node.data as CustomNodeData).sections) && (node.data as CustomNodeData).sections.length > 0 ? (node.data as CustomNodeData).sections.length * SECTION_HEIGHT : SECTION_HEIGHT),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
 
  try {
    const result = await elk.layout(elkGraph);
    let layoutedNodes = nodes.map((node) => {
      const elkNode = result.children?.find((n: any) => n.id === node.id);
      if (!elkNode) {
        console.error(`Node ${node.id} not found in ELK layout`);
        return node;
      }
      const yPosition = topmostYPositions[node.id] !== undefined ? topmostYPositions[node.id] : elkNode.y!;
      return {
        ...node,
        position: {
          x: elkNode.x! - NODE_WIDTH / 2,
          y: yPosition,
        },
      };
    });
 
    const nodesByParent: { [key: string]: AppNode[] } = {};
    edges.forEach((edge) => {
      const parentId = edge.source;
      const child = layoutedNodes.find((node) => node.id === edge.target);
      if (child) {
        if (!nodesByParent[parentId]) {
          nodesByParent[parentId] = [];
        }
        nodesByParent[parentId].push(child);
      }
    });
 
    Object.keys(nodesByParent).forEach((parentId) => {
      const siblings = nodesByParent[parentId];
      if (siblings.length > 1) {
        const minY = Math.min(...siblings.map((sibling) => sibling.position.y));
        siblings.forEach((sibling) => {
          sibling.position.y = minY;
        });
      }
    });
 
    return {
      nodes: layoutedNodes,
      edges,
    };
  } catch (error) {
    console.error('ELK layout error:', error);
    throw error;
  }
};
 

// --- LocalStorage (Keep as before, ensure functions are NOT saved) ---
const loadInitialState = () => {
  const savedData = localStorage.getItem('sitemap_data');
  if (savedData) {
    const { savedNodes, savedEdges, savedPageCount } = JSON.parse(savedData);
    if (savedNodes.length === 0) {
      return {
        nodes: initialNodes,
        edges: initialEdges,
        pageCount: 0 // Or 0, depending on your preference
      };
    }
    return { nodes: savedNodes, edges: savedEdges, pageCount: savedPageCount };
  }
  return {
    nodes: [{ id: 'root', type: 'custom', data: { label: 'Home' }, position: { x: 0, y: 0 } }],
    edges: [],
    pageCount: 0
  };
};

// --- Main Component ---
function SitemapFlow() {
  const loadedState = useRef(loadInitialState());

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(loadedState.current.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(loadedState.current.edges);
  const [pageCount, setPageCount] = useState<number>(0);
  // const [dialogNodeId, setDialogNodeId] = useState<string | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<AppNode, Edge> | null>(null);
  const [layoutTrigger, setLayoutTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const [primarySetupOpen, setPrimarySetupOpen] = useState<boolean>(false);
  const [projectBrief, setProjectBrief] = useState<any>({});
  const [imageUrl, setImageUrl] = useState('');
  const [fullResponse, setFullResponse] = useState<any>({});
  const [showSitemap, setShowSitemap] = useState<boolean>(true);



  // --- Layout Trigger ---
  const triggerLayout = useCallback(() => {
    setError(null);
    setLayoutTrigger((prev) => prev + 1);
  }, []); 

  // --- LocalStorage Saving Effect (Keep as before) ---
  useEffect(() => {
    try {
      // Filter out functions *if any accidentally remain* before saving
      const nodesToSave = nodes.map(node => {
        if (node.type === 'custom') {
          const { data, ...restNode } = node;
          const {
             // List any potential functions to exclude from saving
             onHeaderClick, // Example if passed down
             // getNextPageNumber, // No longer in data
             // triggerLayout, // No longer in data
             ...restData // Keep label, sections, level
          } = data;
          // Ensure required fields exist
          restData.level = restData.level ?? 0;
          restData.sections = restData.sections ?? [];
          restData.label = restData.label ?? 'Untitled';
          return { ...restNode, data: restData };
        }
        return node; // Keep sticky notes etc.
      });

      const dataToSave = {
        savedNodes: nodesToSave,
        savedEdges: edges,
        savedPageCount: pageCount,
      };
      localStorage.setItem(SITEMAP_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving sitemap to localStorage:', error);
    }
  }, [nodes, edges, pageCount]);


  // --- ELK Layout Effect (Keep as before) ---
  useEffect(() => {
    if (nodes.some(n => n.type === 'custom') && layoutTrigger > 0) {
      let isMounted = true;
      setIsLayouting(true);
      setError(null);
      // console.log("Running ELK layout...");
      getLayoutedElements(nodes, edges)
        .then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          if (isMounted) {
            // console.log("Applying layouted nodes:", layoutedNodes.length);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
          }
        })
        .catch((err) => { if (isMounted) { console.error('Layout effect error:', err); setError(`Layout failed: ${err.message || 'Unknown ELK error'}`); }})
        .finally(() => { if (isMounted) { setIsLayouting(false); }});
      return () => { isMounted = false; };
    }
  }, [layoutTrigger, nodes, edges, setNodes, setEdges]);


  const getNextPageNumber = useCallback(() => {
    const nextPage = pageCount + 1;
    setPageCount(nextPage);
    return nextPage;
  }, [pageCount]);

 

  // --- Other Actions (Keep as before) ---
   const handleDeleteSitemap = useCallback(() => {
        if (
            confirm(
                'Are you sure you want to delete the entire sitemap? This cannot be undone.',
            )
        ) {
            setNodes([]);
            setEdges([]);
            setPageCount(0);
            localStorage.removeItem(SITEMAP_STORAGE_KEY);
            setError(null);
        }
    }, [setNodes, setEdges, setPageCount]);

    const downloadImage = useCallback(() => {
        if (reactFlowWrapper.current) {
            const flowElement = reactFlowWrapper.current.querySelector(
                '.react-flow',
            ) as HTMLElement;
            if (!flowElement) {
                setError('Cannot export image - flow element not found.');
                return;
            }
            setError(null);
            htmlToImage
                .toPng(flowElement, {
                    backgroundColor: '#f9fafb',
                    pixelRatio: 1.5,
                    filter: (element) =>
                        !(
                            element.classList?.contains('react-flow__controls') ||
                            element.classList?.contains('react-flow__minimap') ||
                            element.classList?.contains('react-flow__attribution')
                        ),
                })
                .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = 'sitemap.png';
                    link.href = dataUrl;
                    link.click();
                    link.remove();
                })
                .catch((error) => {
                    console.error('Error downloading image:', error);
                    setError('Failed to export image.');
                });
        } else {
            setError('Cannot export image - component not ready.');
        }
    }, []);

    const addStickyNote = useCallback(() => {
        if (!reactFlowInstanceRef.current || !reactFlowWrapper.current) {
             console.warn("Cannot add sticky note: React Flow instance/wrapper not ready.");
             return;
        }
        const newNodeId = `sticky-${Date.now()}`;
        const position = reactFlowInstanceRef.current.screenToFlowPosition({
            x: reactFlowWrapper.current.clientWidth / 2,
            y: reactFlowWrapper.current.clientHeight / 2,
        });
        const newNode: StickyNoteType = {
            id: newNodeId, type: 'stickyNote',
            data: { label: 'New Note', content: '', color: '#FFFF99' },
            position: position, draggable: true,
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);


  const sitemapContextValue = useMemo(() => ({
    getNextPageNumber,
    triggerLayout,
    setPageCount
  }), [getNextPageNumber, triggerLayout,setPageCount]);


  const handleOpenDialog = useCallback(() => {
    setPrimarySetupOpen(true);
  }, []);


  const handlePrimarySetupRegenerate = useCallback(
    (businessName: string, businessDescription: string, siteMapPrompt: string, noOfPage: number, language: string) => {
      console.log('Generating sitemap with:', { businessName, businessDescription, siteMapPrompt, noOfPage, language });
      setPrimarySetupOpen(false);
    },
    []
  );


  const handleSitemapGenerated = useCallback(
    (data: any) => {
      console.log('handleSitemapGenerated received data:', data);
      const sitemapData = data[0];
      const projectBriefData = data[1];

      // Validate input data
      if (!sitemapData || !sitemapData.Pages || !Array.isArray(sitemapData.Pages)) {
        console.error('Invalid sitemap data received', sitemapData);
        return;
      }

      if (!projectBriefData?.business_name) {
        console.error('Invalid project brief received', projectBriefData);
        return;
      }

      // Update state with project brief and full response
      setProjectBrief(projectBriefData);
      setFullResponse(sitemapData);
      setImageUrl(data.imageUrl);

      // Define homepage and child pages by extracting the first element as the homepage
      const homepage = sitemapData.Pages[0];
      const childPages = sitemapData.Pages.slice(1);

      // Get current root node to preserve its position
      const currentRoot = nodes.find((node) => node.id === 'root');
      if (!currentRoot) {
        console.error('Root node not found');
        return;
      }

      // Update root node with homepage details
      const updatedRoot: Node<AppNode['data'], string> = {
        ...currentRoot,
        data: {
          ...currentRoot.data,
          label: homepage.pageName,
          sections: homepage.sections.map((section: any, index: number) => ({
            id: `${Date.now()}-${index}`,
            title: section.sectionName,
            description: section.section_description,
          })),
          getNextPageNumber,
        },
      };

      const HORIZONTAL_SPACING = 250; // Horizontal gap between child nodes
      const VERTICAL_SPACING = 150;  // Vertical gap between root and children
      const NODE_WIDTH = 250;        // Width of each node (assumed from CustomNode)

      // Calculate starting x position to center child nodes below root
      const numChildren = childPages.length;
      const totalWidth = (numChildren - 1) * HORIZONTAL_SPACING;
      const startX = updatedRoot.position.x - totalWidth / 2;

      // Create child nodes for remaining pages
      const newNodes: Node<AppNode['data']>[] = childPages.map((page: any, index: any) => {
        const newNodeId = `node-${Date.now()}-${index}`;
        const newPosition = {
          x: startX + index * HORIZONTAL_SPACING,
          y: updatedRoot.position.y + VERTICAL_SPACING,
        };
        return {
          id: newNodeId,
          type: 'custom',
          data: {
            label: page.pageName,
            sections: page.sections.map((section: any, secIndex: any) => ({
              id: `${newNodeId}-section-${secIndex}`,
              title: section.sectionName,
              description: section.section_description,
            })),
          
            getNextPageNumber,
            level: 1, // Direct children of root are level 1
            subtreeWidth: NODE_WIDTH,
          },
          position: newPosition,
        };
      });

      // Create edges connecting root to child nodes
      const newEdges: Edge[] = newNodes.map((node) => ({
        id: `edge-root-${node.id}`,
        source: 'root',
        target: node.id,
        type: 'smoothstep',
      }));

      // Update React Flow state with all nodes and edges
      setNodes([updatedRoot as CustomNodeType, ...newNodes as CustomNodeType[]]);
      setEdges(newEdges);
    },
    [nodes, setNodes, setEdges, getNextPageNumber]
  );



  // const handleRegenerate = useCallback(
  //   (pageName: string, pagePrompt: string) => {
  //     if (dialogNodeId && pageName.trim()) {
  //       setNodes((nds) =>
  //         nds.map((node) => {
  //           if (node.id === dialogNodeId && node.type === 'custom') {
  //             return {
  //               ...node,
  //               data: {
  //                 ...(node.data as CustomNodeData),
  //                 label: pageName,
  //                 sections: pagePrompt
  //                   ? [{ id: Date.now(), title: pagePrompt, description: '' }]
  //                   : (node.data as CustomNodeData).sections,
  //               },
  //             };
  //           }
  //           return node;
  //         })
  //       );
  //       setDialogNodeId(null);
  //     }
  //   },
  //   [dialogNodeId, setNodes]
  // );


  // const handleUpdateLabel = useCallback(
  //   (nodeId: string, newLabel: string) => {
  //     if (newLabel.trim()) {
  //       setNodes((nds) =>
  //         nds.map((node) => {
  //           if (node.id === nodeId) {
  //             return {
  //               ...node,
  //               data: {
  //                 ...(node.data as CustomNodeData),
  //                 label: newLabel,
  //               },
  //             };
  //           }
  //           return node;
  //         })
  //       );
  //     }
  //   },
  //   [setNodes]
  // );




  // --- Render ---
  return (
    <>
      <PrimaryNavbar
          title="Primary Sitemap"
          onDelete={showSitemap ? handleDeleteSitemap : undefined}
          onSetupOpen={handleOpenDialog}
        />

    <SitemapContext.Provider value={sitemapContextValue}>
      <ReactFlowProvider> {/* Keep for useReactFlow hook */}
        <div className="flex w-full h-screen bg-gray-100">
          <Sidebar
              onOpenDialog={handleOpenDialog}
              onDownloadImage={downloadImage}
              onStickyNode={addStickyNote}
              // onDeleteSitemap={handleDeleteSitemap}
          />

      
          <div ref={reactFlowWrapper} className="flex-1 h-full relative">
              {/* Error Message UI */}
              {error && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-10 shadow-md">
                      <span className="font-medium">Error:</span> {error}
                      <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-3 py-1 text-red-500 hover:text-red-700">×</button>
                  </div>
              )}
              {/* Layouting Indicator UI */}
              {isLayouting && ( <div className="absolute top-2 left-10 bg-blue-100 text-blue-700 px-3 py-1 rounded z-10 text-sm"> Applying layout... </div> )}

              {/* ReactFlow or Placeholder */}
              {nodes.length > 0 ? (
                <ReactFlow
                    nodes={nodes} edges={edges}
                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    onInit={(instance) => {
                        reactFlowInstanceRef.current = instance;
                        setTimeout(triggerLayout, 50);
                    }}
                    snapToGrid snapGrid={[10, 10]}
                    className="h-full"
                    fitView fitViewOptions={{ padding: 0.2, duration: 500 }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
                    <MiniMap pannable zoomable nodeStrokeWidth={3} nodeColor={(n) => n.type === 'stickyNote' ? ((n.data as StickyNoteData).color || '#FFFF99') : '#0891b2'}/>
                    <Controls />
                </ReactFlow>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500"> Sitemap is empty. </div>
              )}
          </div>
        </div>
      </ReactFlowProvider>
    </SitemapContext.Provider>
    
    {/* <PageDialog
        open={!!dialogNodeId}
        onOpenChange={(open) => setDialogNodeId(open ? dialogNodeId : null)}
        onRegenerate={handleRegenerate}
        nodeId={dialogNodeId || ''}
        onUpdateLabel={handleUpdateLabel}
      /> */}

<PrimarySetupForm
        open={primarySetupOpen}
        onOpenChange={setPrimarySetupOpen}
        onRegenerate={handlePrimarySetupRegenerate}
        nodeId="root"
        onSitemapGenerated={handleSitemapGenerated}
      />
    </>
  );
}

export default SitemapFlow;