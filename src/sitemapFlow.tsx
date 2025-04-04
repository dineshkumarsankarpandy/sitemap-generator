import { useState, useCallback, useRef, useEffect, useContext, createContext } from 'react';
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
import { useBlocker, useParams } from 'react-router-dom';
import apiClient from './services/api';
import EditableProjectName from './editablePojectName';


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
  level?: number;
}


// type CustomNodeType = Node<CustomNodeData, 'custom'>;

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

const SITEMAP_STORAGE_KEY = 'sitemap_data';

const initialNodes: Node[] = [
  {
    id: 'root',
    type: 'custom',
    data: { label: 'Home', sections: [] },
    position: { x: 0, y: 0 },
  },
];

const initialEdges: Edge[] = [];

// --- ELK Layout Function ---
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
      height:
        400 +
        (Array.isArray((node.data as any).sections)
          ? (node.data as any).sections.length
          : 1) * 30,
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
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- LocalStorage Helpers ---
const loadInitialState = () => {
  const savedData = localStorage.getItem(SITEMAP_STORAGE_KEY);
  if (savedData) {
    const { savedNodes, savedEdges, savedPageCount } = JSON.parse(savedData);
    if (savedNodes.length === 0) {
      return { nodes: initialNodes, edges: initialEdges, pageCount: 0 };
    }
    return { nodes: savedNodes, edges: savedEdges, pageCount: savedPageCount };
  }
  return { nodes: initialNodes, edges: initialEdges, pageCount: 0 };
};


function useNavigationBlocker(when: boolean) {
  const blocker = useBlocker(when);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}

const isValidSitemapData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    data.sitemap_data &&
    Array.isArray(data.sitemap_data.nodes) &&
    Array.isArray(data.sitemap_data.edges)
  );
};

// --- Main Component ---
function SitemapFlow() {
  const { projectId } = useParams<{ projectId: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [pageCount, setPageCount] = useState(1);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [primarySetupOpen, setPrimarySetupOpen] = useState<boolean>(false);
  const [projectBrief, setProjectBrief] = useState<any>({});
  const [imageUrl, setImageUrl] = useState('');
  const [fullResponse, setFullResponse] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  
  useEffect(() => {
    if (!projectId) {
      console.log("Fetch aborted: Project ID is missing.");
      setError("Project ID is missing.");
      setNodes(initialNodes); 
      setEdges(initialEdges);
      setPageCount(1);
      setProjectBrief({ business_name: 'New Project', business_description: '' });
      setIsLoading(false);
      setHasUnsavedChanges(false); 
      return;
    }

    let isMounted = true;
    console.log(`Fetching data for project ID: ${projectId}`);

    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);
      setSaveStatus('idle');
  

      try {
        const response = await apiClient.get(`/projects/${projectId}`);
        if (!isMounted) return;

        const projectData = response.data;
        console.log('Fetched project data:', projectData);
        const activeSitemap = projectData.active_sitemap;
        const currentBrief = {
          business_name: projectData.project_name || 'Unnamed Project',
          business_description: activeSitemap?.project_description || '',
        };
        setProjectBrief(currentBrief);

        if (activeSitemap && activeSitemap.sitemap_data && Array.isArray(activeSitemap.sitemap_data.nodes) && activeSitemap.sitemap_data.nodes.length > 0 && Array.isArray(activeSitemap.sitemap_data.edges)) {
          console.log('Loading saved sitemap from backend:', activeSitemap.sitemap_data);

          const loadedNodes = activeSitemap.sitemap_data.nodes.map((node: any) => ({
            id: node.id,
            type: node.type ?? 'custom',
            position: node.position ?? { x: 0, y: 0 },
            data: {
              label: node.data?.label ?? 'Untitled',
              sections: node.data?.sections ?? [],
              level: node.data?.level ?? 0,
            },
            width: node.width,
            height: node.height,
            ...node, 
          }));

          const loadedEdges = activeSitemap.sitemap_data.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type ?? 'smoothstep',
            ...edge, 
          }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);
          setPageCount(activeSitemap.no_of_pages || loadedNodes.length); // Use saved count or calculate
          console.log(`Loaded ${loadedNodes.length} nodes and ${loadedEdges.length} edges.`);

        } else {
          console.log('No valid sitemap data found, using initial state.');
          setNodes(initialNodes);
          setEdges(initialEdges);
          setPageCount(initialNodes.length);
        }
        setHasUnsavedChanges(false);

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching project data:', err);
        let errorMsg = 'Failed to load project data.';
        if (err.response?.status === 404) errorMsg = `Project with ID ${projectId} not found.`;
        if (err.response?.status === 403) errorMsg = "Permission denied to access this project.";
        setError(errorMsg);
        setProjectBrief({ business_name: 'Error Loading', business_description: '' });
        setNodes(initialNodes);
        setEdges(initialEdges);
        setPageCount(initialNodes.length);
        setHasUnsavedChanges(false); 
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log("Loading finished.");
        }
      }
    };

    fetchProjectData();

    return () => {
      isMounted = false;
      console.log("SitemapFlow cleanup.");
    };
  }, [projectId]);

  

  // --- Layout Update ---
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



  // --- Save to Backend Function ---
  const saveSitemapToBackend = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const sitemapData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: { label: node.data.label, sections: node.data.sections, level: node.data.level },
          position: node.position,
        })),
        edges,
      };

      const payload = {
        project_name: projectBrief.business_name || 'Unnamed Project',
        project_description: projectBrief.business_description || 'No description provided',
        no_of_pages: pageCount,
        sitemap_data: sitemapData || {},
      };

      const response = await apiClient.put(`/sitemap/save-sitemap/${projectId}`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Sitemap saved successfully:', response.data);
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving sitemap to backend:', error);
      setError('Failed to save sitemap to the server.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [nodes, edges, projectBrief, pageCount]);

  // --- Set Unsaved Changes Flag ---
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [nodes, edges]);

  // --- Warn on Browser Unload ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // --- Block In-App Navigation if Unsaved Changes ---
  useNavigationBlocker(hasUnsavedChanges);

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
    });

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
  };

  // --- LocalStorage Saving Effect ---
  useEffect(() => {
    try {
      const nodesToSave = nodes.map(node => {
        if (node.type === 'custom') {
          const { data, ...restNode } = node;
          const { onHeaderClick, ...restData } = data;
          restData.level = restData.level ?? 0;
          restData.sections = restData.sections ?? [];
          restData.label = restData.label ?? 'Untitled';
          return { ...restNode, data: restData };
        }
        return node;
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

  // --- Other Actions ---
  const handleDeleteSitemap = useCallback(() => {
    if (confirm('Are you sure you want to delete the entire sitemap? This cannot be undone.')) {
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

      const currentRoot = nodes.find((node) => node.id === 'root');
      if (!currentRoot) {
        console.error('Root node not found');
        return;
      }

      const updatedRoot: Node<CustomNodeData, string> = {
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

      const HORIZONTAL_SPACING = 250;
      const VERTICAL_SPACING = 150;
      const NODE_WIDTH = 250;

      const numChildren = childPages.length;
      const totalWidth = (numChildren - 1) * HORIZONTAL_SPACING;
      const startX = updatedRoot.position.x - totalWidth / 2;

      const newNodes: Node<CustomNodeData>[] = childPages.map((page: any, index: any) => {
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
            level: 1,
          },
          position: newPosition,
        };
      });

      const newEdges: Edge[] = newNodes.map((node) => ({
        id: `edge-root-${node.id}`,
        source: 'root',
        target: node.id,
        type: 'smoothstep',
      }));

      setNodes([updatedRoot, ...newNodes]);
      setEdges(newEdges);
      setHasUnsavedChanges(true);
    },
    [nodes, setNodes, setEdges, getNextPageNumber]
  );


 
  return (
    <>
      <SitemapContext.Provider value={{ getNextPageNumber, setPageCount }}>
        <ReactFlowProvider>
          <div ref={reactFlowWrapper} className="w-full h-screen">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              nodesDraggable={false} // Disable node dragging
              onInit={(instance) => (reactFlowInstanceRef.current = instance)}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <MiniMap />
              <Controls position="top-right" />
              <Panel position="top-left" className="mt-4 mr-4 p-2 bg-white rounded shadow border border-gray-200 z-10"> {/* Added z-index */}
                <EditableProjectName projectId={projectId} />
              </Panel>

              <Panel position="bottom-left">
                <Sidebar onOpenDialog={handleOpenDialog} />
              </Panel>

              {/* Save Status Panel */}
              {saveStatus !== 'idle' && (
                <Panel position="top-center">
                  <div
                    className={`px-4 py-2 rounded shadow text-sm ${
                      saveStatus === 'saving'
                        ? 'bg-blue-100 text-blue-800'
                        : saveStatus === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {saveStatus === 'saving'
                      ? 'Saving...'
                      : saveStatus === 'success'
                      ? 'Sitemap saved successfully!'
                      : 'Failed to save sitemap.'}
                  </div>
                </Panel>
              )}

              {/* Save Changes Button Panel */}
              <Panel position="bottom-right">
                <button
                  onClick={async () => {
                    await saveSitemapToBackend();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600"
                >
                  Save Changes
                </button>
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
