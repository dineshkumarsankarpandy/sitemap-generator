import { useState, useCallback, useRef, useEffect,useContext,createContext } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  ReactFlowInstance,
  BackgroundVariant,
  Panel
} from '@xyflow/react';

import ELK from 'elkjs/lib/elk.bundled.js';
import CustomNode from './customNode';

import '@xyflow/react/dist/style.css';
import { PrimarySetupForm } from './primarSetupForm';
import { Sidebar } from './sidebar';

const elk = new ELK();


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
  // level: number;
}

type CustomNodeType = Node<CustomNodeData, 'custom'>;

// --- Context Definition ---
interface SitemapContextProps {
  getNextPageNumber: () => number;
  setPageCount: (count: number) => void;
}


// Create the context with a default undefined value
const SitemapContext = createContext<SitemapContextProps | undefined>(undefined);


// Custom hook to use the Sitemap context
export const useSitemapFunctions = (): SitemapContextProps => {
  const context = useContext(SitemapContext);
  if (!context) throw new Error('useSitemapFunctions must be used inside SitemapContext');
  return context;
};

// --- Constants ---
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// const NODE_WIDTH = 258;
// const NODE_HEADER_HEIGHT = 500;
// const SECTION_HEIGHT = 30;
const SITEMAP_STORAGE_KEY = 'sitemap_data';

const initialNodes: Node[] = [
  {
    id: 'root',
    type: 'custom',
    data: { label: 'Home', sections: [], level: 0 },
    position: { x: 0, y: 0 },
  },
];

const initialEdges: Edge[] = [];


// --- ELK Layout Function (Keep as before) ---
const getLayoutedElements = async (
  nodes: Node[],
  edges: Edge[]
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'mrtree',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNodeBetweenLayers': '100',
      'elk.spacing.nodeNode': '70',
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
      'elk.alignment': 'CENTER',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 260,
      height: 400 + ((Array.isArray((node.data as any).sections) ? (node.data as any).sections.length : 1) * 30),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layoutNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: (layoutNode?.x ?? 0),
        y: (layoutNode?.y ?? 0),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
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
  // const loadedState = useRef(loadInitialState());

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [pageCount, setPageCount] = useState(1);
  // const [layoutTrigger, setLayoutTrigger] = useState(0);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const [error, setError] = useState<string | null>(null);
  // const [isLayouting, setIsLayouting] = useState(false);
  const [primarySetupOpen, setPrimarySetupOpen] = useState<boolean>(false);
  const [projectBrief, setProjectBrief] = useState<any>({});
  const [imageUrl, setImageUrl] = useState('');
  const [fullResponse, setFullResponse] = useState<any>({});
  // const [showSitemap, setShowSitemap] = useState<boolean>(true);



  // --- Layout Trigger ---
  //  const triggerLayout = useCallback(() => {
  //   setLayoutTrigger((prev) => prev + 1);
  // }, []);

  // useEffect(() => {
  //   if (layoutTrigger === 0) return;

  //   let mounted = true;

  //   getLayoutedElements(nodes, edges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
  //     if (mounted) {
  //       setNodes(layoutedNodes);
  //       reactFlowInstanceRef.current?.fitView({ padding: 0.3, duration: 500 });
  //       setEdges(layoutedEdges);
  //     }
  //   });

  //   return () => {
  //     mounted = false;
  //   };
  // }, [layoutTrigger]);

  useEffect(() => {
    const layoutAndUpdate = async () => {
      try {
        const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(nodes, edges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        reactFlowInstanceRef.current?.fitView({ padding: 0.2, duration: 300 });
      } catch (error) {
        console.error('Layout failed:', error);
      }
    };
  
    layoutAndUpdate();
  }, [nodes.length, edges.length]);

  const getNextPageNumber = () => {
    const next = pageCount + 1;
    setPageCount(next);
    return next;
  };

  const addNode = (position = 'end', referenceNodeId = 'root') => {
    
    const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    const newNode: Node = {
      id: newId,
      type: 'custom',
      data: {
        label: `Page ${getNextPageNumber()}`,
        sections: [],
        level: 1,
      },
      position: { x: 0, y: 0 },
    };

    const newEdge: Edge = {
      id: `e-${referenceNodeId}-${newId}`,
      source: referenceNodeId,
      target: newId,
      type: 'smoothstep',
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      console.log('Updated node list:', updated);
      return updated;
    }
  );
    console.log('Creating new node', newNode);
    console.log('New node added:', newNode);

    setEdges((eds) => {
      if (position === 'end' || position === 'child' || !referenceNodeId) {
        return [...eds, newEdge];
      } else {
        const index = eds.findIndex((e) => e.target === referenceNodeId);
        if (position === 'before') {
          return [...eds.slice(0, index), newEdge, ...eds.slice(index)];
        } else {
          return [...eds.slice(0, index + 1), newEdge, ...eds.slice(index + 1)];
        }
      }
    });

    // triggerLayout();
  };

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
      const sitemapData = data.sitemap;
      const projectBriefData = data.project_brief;

      if (!sitemapData || !sitemapData.Pages || !Array.isArray(sitemapData.Pages)) {
        console.error('Invalid sitemap data received', sitemapData);
        return;
      }

      if (!projectBriefData?.business_name) {
        console.error('Invalid project brief received', projectBriefData);
        return;
      }

      setProjectBrief(projectBriefData);
      setFullResponse(sitemapData);
      setImageUrl(data.imageUrl);

      const homepage = sitemapData.Pages[0];
      const childPages = sitemapData.Pages.slice(1);

      // Get current root node to preserve its position
      const currentRoot = nodes.find((node) => node.id === 'root');
      if (!currentRoot) {
        console.error('Root node not found');
        return;
      }

      // Update root node with homepage details
      const updatedRoot: Node<CustomNodeType['data'], string> = {
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
      const newNodes: Node<CustomNodeType['data']>[] = childPages.map((page: any, index: any) => {
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

  return (
    <>
     {/* <SitemapContext.Provider value={{ getNextPageNumber, triggerLayout, setPageCount }}>
    </SitemapContext.Provider> */}
    <SitemapContext.Provider value={{ getNextPageNumber, setPageCount }}>
      <ReactFlowProvider>
        <div ref={reactFlowWrapper} className="w-full h-screen">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={false} // ⛔ Disable node dragging
            onInit={(instance) => (reactFlowInstanceRef.current = instance)}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <MiniMap />
            <Controls />

            <Panel position="bottom-center">
                 <Sidebar onOpenDialog={handleOpenDialog}/>
            </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
      </SitemapContext.Provider>
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