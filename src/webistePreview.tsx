import { useState, useRef,useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { Maximize2, Minimize2, Loader2, AlertTriangle, FileCode, } from 'lucide-react';
import { ResponsiveIframeViewer, ViewportSize,ViewportSizeType } from './responsive-iframe/main';
import apiClient from './services/api';
import { useParams } from 'react-router-dom';

const SITEMAP_STORAGE_KEY = 'sitemap_data';

interface SavedSection {
  id: string | number;
  title: string;
  description: string;
}
interface SavedNodeData {
  label: string;
  sections: SavedSection[];
  level?: number;
}
interface SavedNode {
  id: string;
  type?: string;
  data: SavedNodeData;
  position?: { x: number; y: number };
}
interface ProjectBrief {
  business_name?: string;
  business_description?: string;
}
interface SavedSitemapData {
  savedNodes: SavedNode[];
  projectBrief?: ProjectBrief;
}

interface PageInfo {
    id: string;
    name: string;
}




function Website() {
  const { projectId } = useParams<{ projectId: string }>(); 
  const [generatedPagesHtml, setGeneratedPagesHtml] = useState<Record<string, string> | null>(null);
  const [pageList, setPageList] = useState<PageInfo[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);


  const [generatedWebsite, setGeneratedWebsite] = useState<any>(null); 
  const [loading, setLoading] = useState<boolean>(false);
  const [deploying, setDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [currentViewport,setCurrentViewport] = useState<ViewportSizeType>(ViewportSize.desktop)
  const previewRef = useRef<HTMLDivElement>(null);


// Clear generated website if projectId changes
 useEffect(() => {
    setGeneratedPagesHtml(null);
    setPageList([]);
    setSelectedPageId(null);
    setError(null);
    setDeployUrl(null);
  }, [projectId]);



  const changeViewport = (size: ViewportSizeType) => {
    setCurrentViewport(size);
  };


  const fetchWebsiteContent = async () => {
    if (!projectId) {
      setError("Project ID is missing.");
      return;
    }
    setError(null); // Clear previous errors
    setGeneratedPagesHtml(null);
    setPageList([]);
    setSelectedPageId(null);

    const savedDataStr = localStorage.getItem(SITEMAP_STORAGE_KEY);
    if (!savedDataStr) {
      setError('No sitemap data found in local storage. Please save the sitemap first.');
      return;
    }

    let savedData: SavedSitemapData;
    try {
      savedData = JSON.parse(savedDataStr);
      if (!savedData || !Array.isArray(savedData.savedNodes) || savedData.savedNodes.length === 0) {
        throw new Error("Saved data is missing or invalid.");
      }
    } catch (err: any) {
      setError(`Error reading sitemap data: ${err.message}.`);
      return;
    }

    // Construct Payload (same as before)
    let payload;
    try {
        // Filter out nodes without sections before creating the payload for generation
        const nodesWithSections = savedData.savedNodes.filter(node => node.data?.sections?.length > 0);
        if (nodesWithSections.length === 0) {
            setError("No pages with sections found in the sitemap. Cannot generate website.");
            return;
        }

        const sitemapPayload = {
            Pages: nodesWithSections.map((node) => ({ // Only include nodes with sections
                id: node.id,
                label: node.data.label,
                sections: node.data.sections.map((section) => ({
                    id: section.id,
                    title: section.title,
                    description: section.description,
                })),
            }))
        };

        const businessName = savedData.projectBrief?.business_name || 'Unnamed Project';
        const projectDescription = savedData.projectBrief?.business_description || '';

        payload = {
            project_id: parseInt(projectId, 10),
            sitemap: sitemapPayload,
            business_name: businessName,
            project_description: projectDescription,
        };
    } catch (err: any) {
        setError(`Failed to prepare data for generation: ${err.message}`);
        return;
    }

    // Call API
    setLoading(true);
    try {
      console.log("Sending payload to /website/create-website:", payload);
      const res = await apiClient.post(`/website/create-website`, payload);
      console.log("Response from /website/create-website:", res.data);

      // *** Process NEW Response Structure ***
      if (res.data && typeof res.data.page_html_map === 'object' && Object.keys(res.data.page_html_map).length > 0) {
        const pageHtmlMap: Record<string, string> = res.data.page_html_map;
        setGeneratedPagesHtml(pageHtmlMap);

    
        const generatedPageIds = Object.keys(pageHtmlMap);
        const availablePages = savedData.savedNodes
          .filter(node => generatedPageIds.includes(node.id)) // Only include pages that were generated
          .map(node => ({ id: node.id, name: node.data.label }));

        if (availablePages.length > 0) {
            setPageList(availablePages);
            setSelectedPageId(availablePages[0].id); // Select the first page by default
        } else {
            setError("Website generation finished, but no pages were successfully created.");
        }

      } else {
        // Handle cases where the map is empty or response format is wrong
         if (res.data && typeof res.data.page_html_map === 'object' && Object.keys(res.data.page_html_map).length === 0) {
             setError("Generation completed, but no pages were returned by the server.");
         } else {
             throw new Error("Invalid response structure received from server.");
         }
      }
    } catch (err: any) {
        console.error("Error generating website:", err);
        let errorMsg = "Failed to generate website.";
        if (err.response) { /* ... (keep detailed error handling based on status code) ... */
            switch (err.response.status) {
                case 400: errorMsg = `Error: Invalid data or no sections found. ${err.response.data?.detail || ''}`; break;
                case 403: errorMsg = `Error: Permission denied. ${err.response.data?.detail || ''}`; break;
                case 404: errorMsg = `Error: Project not found. ${err.response.data?.detail || ''}`; break;
                case 500: errorMsg = `Error: Server failed to generate website. ${err.response.data?.detail || 'Please try again later.'}`; break;
                default: errorMsg = `Request failed: ${err.response.data?.detail || err.response.statusText || 'Unknown error'}`;
            }
        } else if (err.request) { errorMsg = "Network error: Could not reach server."; }
          else { errorMsg = `An unexpected error occurred: ${err.message}`; }
        setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Dropdown Change ---
  const handlePageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPageId(event.target.value);
  };

  // --- Get Current Page HTML ---
  const currentPageHtml = generatedPagesHtml && selectedPageId ? generatedPagesHtml[selectedPageId] : null;





  


  const deployWebsite = async () => {
    if (!generatedWebsite || !generatedWebsite.code) {
      setError('No generated website available to deploy.');
      return;
    }

    setDeploying(true);
    setError(null);
    setDeployUrl(null);

    try {
      const zip = new JSZip();
      console.log("Raw HTML before zipping:", generatedWebsite.code); // Debug: Raw HTML
      zip.file("index.html", generatedWebsite.code); // Should be plain string
      const zipBlob = await zip.generateAsync({ type: "blob" });
      console.log("Zip Blob:", zipBlob);

      const uniqueSitemapId = `${Date.now()}`
      const formData = new FormData();
      formData.append("file", zipBlob, `website_${uniqueSitemapId}.zip`);
      formData.append("sitemap_id", generatedWebsite.sitemap_id || uniqueSitemapId);

      const res = await axios.post(
        'http://localhost:8000/website_generator/deploy-website',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log(res, "Response for depoloying the website in vercel")

      setDeployUrl(res.data.deployment_url);
    } catch (err: any) {
      setError(`Deployment failed: ${err.response?.data?.detail || err.message}`);
      console.error(err);
    } finally {
      setDeploying(false);
    }
  };
  const toggleFullScreen = () => {
    if (currentPageHtml) { // Only allow fullscreen if there's content
       setIsFullScreen(!isFullScreen);
    }
 };


 return (
  <div className="min-h-screen bg-gray-50">
    {/* Main container - hidden in fullscreen */}
    <div className={`container mx-auto p-4 md:p-6 transition-all duration-300 ${isFullScreen ? 'hidden' : 'block'}`}>
      <div className="flex flex-col md:flex-row gap-6">

        {/* Left Panel - Controls */}
        <div className="md:w-1/3 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="space-y-6">
            {/* Generation Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Website Generation</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Generate HTML for each page based on the saved sitemap for Project ID: <span className="font-medium">{projectId || 'N/A'}</span>.
              </p>
              <button
                onClick={fetchWebsiteContent}
                disabled={loading || !projectId}
                className="w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <> <Loader2 className="animate-spin h-4 w-4"/> Generating... </>
                ) : (
                   <> <FileCode className="h-4 w-4"/> Generate Website </>
                )}
              </button>
            </div>

            {/* Page Selection Dropdown */}
            {pageList.length > 0 && (
              <div>
                 <label htmlFor="pageSelect" className="block text-sm font-medium text-gray-700 mb-1">
                     Preview Page
                 </label>
                 <select
                    id="pageSelect"
                    value={selectedPageId ?? ''}
                    onChange={handlePageChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading} 
                    >
                    {pageList.map(page => (
                        <option key={page.id} value={page.id}>
                            {page.name} (ID: {page.id})
                        </option>
                    ))}
                 </select>
              </div>
             )}

            {/* Deployment Button (Disabled) */}
            {generatedPagesHtml && (
              <div>
                <button
                  onClick={deployWebsite}
                  disabled={true} 
                  // disabled={deploying || loading || !selectedPageId} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Multi-page deployment not supported in this preview"
                >
                  Deploy Website (Disabled)
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Deploy URL Display (if deployment were enabled) */}
            {deployUrl && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm font-medium">Deployment Successful!</p>
                {/* ... rest of deploy URL display ... */}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            {/* Preview Header */}
            <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-medium text-gray-700">
                  Preview: {selectedPageId && pageList.find(p => p.id === selectedPageId)?.name || 'No page selected'}
              </h2>
              <div className='flex items-center gap-1'>
                 {/* Viewport buttons */}
                 {/* <button onClick={() => changeViewport(ViewportSize.mobile)} className={`p-2 rounded-md ${currentViewport === ViewportSize.mobile ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Mobile View"><Smartphone size={18} /></button>
                 <button onClick={() => changeViewport(ViewportSize.tablet)} className={`p-2 rounded-md ${currentViewport === ViewportSize.tablet ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Tablet View"><Tablet size={18} /></button>
                 <button onClick={() => changeViewport(ViewportSize.desktop)} className={`p-2 rounded-md ${currentViewport === ViewportSize.desktop ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Desktop View"><Monitor size={18} /></button> */}
                 {currentPageHtml && (
                     <button onClick={toggleFullScreen} className="ml-2 text-gray-600 hover:text-blue-600 focus:outline-none p-2" title="Toggle fullscreen"><Maximize2 size={18} /></button>
                 )}
              </div>
            </div>
            {/* Preview Content Area */}
            <div className="relative bg-gray-200" style={{ height: 'calc(100vh - 200px)' }}> {/* Adjust height as needed */}
               {loading && (
                   <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                      <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-2"/>
                       <p className="text-gray-600">Generating Preview...</p>
                   </div>
               )}
              {currentPageHtml ? (
                <ResponsiveIframeViewer
                  srcDoc={currentPageHtml} 
                  title={`Preview of ${pageList.find(p=>p.id===selectedPageId)?.name || 'page'}`}
                  size={currentViewport}
                  key={`${selectedPageId}-${currentViewport}`} 
                  allowResizingX={false}

                />
              ) : (
                !loading && (
                  <div className="flex items-center justify-center h-full text-center px-4">
                    <p className="text-gray-500 italic">
                        {error ? 'Generation failed. See error details.' : 'Click "Generate Website" to create page previews.'}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Fullscreen Preview */}
    {isFullScreen && currentPageHtml && (
      <div className="fixed inset-0 z-50 bg-white">
         <div className="absolute top-4 right-4 z-10">
          <button onClick={toggleFullScreen} className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none" title="Exit fullscreen">
            <Minimize2 size={24} />
          </button>
        </div>
        <iframe
          title="Website Preview Fullscreen"
          srcDoc={currentPageHtml}
          className="w-full h-full border-0"
          // Adjust sandbox as needed - allow-scripts is often necessary for JS, allow-same-origin if scripts need to interact more deeply
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    )}
  </div>
);
}

export default Website;

