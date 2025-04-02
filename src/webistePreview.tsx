import { useState, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { Maximize2, Minimize2,Smartphone, Tablet, Monitor } from 'lucide-react';
import { ResponsiveIframeViewer, ViewportSize,ViewportSizeType } from './responsive-iframe/main';

const SITEMAP_STORAGE_KEY = 'sitemap_data';

function Website() {
  const [generatedWebsite, setGeneratedWebsite] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [deploying, setDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [currentViewport,setCurrentViewport] = useState<ViewportSizeType>(ViewportSize.desktop)
  const previewRef = useRef<HTMLDivElement>(null);

  const changeViewport = (size: ViewportSizeType) => {
    setCurrentViewport(size);
  };
  const fetchWebsiteContent = async () => {
    const savedDataStr = localStorage.getItem(SITEMAP_STORAGE_KEY);
    if (!savedDataStr) {
      setError('No sitemap data found. Please generate a sitemap first.');
      return;
    }
    let savedData;
    try {
      savedData = JSON.parse(savedDataStr);
    } catch (err) {
      setError('Error parsing sitemap data from localStorage.');
      return;
    }
    // const projectBrief = savedData.projectBrief

    // const imageUrl = savedData.imageUrl;


    const rootNode = savedData.savedNodes?.find((node: any) => node.id === 'root');
    const sections = savedData.fullResponse.Pages[0].sections;
    const websitePrompt = sections
      .map(
        (section: any) =>
          `${section.sectionName}. ${section.section_description}. ${section.section_outline}.`
      )
      .join(' ');
    const businessDescription = savedData.projectBrief.business_description 
    if (!rootNode) {
      setError('Root node not found in sitemap data.');
      return;
    }
    const payload = {
      // projectBrief,
      pageTitle: rootNode.data.label,
      websitePrompt: savedData.fullResponse,
      businessDescription:businessDescription
    };


    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        'http://localhost:8000/website_generator/website-generator',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(payload, "Payload for generating the website");
      
      console.log(res, "Response for generating the website");
      setGeneratedWebsite(res.data);
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

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
      console.log("Zip Blob:", zipBlob); // Debug: Blob size

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
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`container mx-auto p-6 transition-all duration-300 ${isFullScreen ? 'hidden' : 'block'}`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel - Controls */}
          <div className="md:w-1/3 bg-white p-6 rounded-lg shadow-md">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Website Generation</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Generate your website from the saved sitemap. Make sure you have created a sitemap first.
                </p>
                <button
                  onClick={fetchWebsiteContent}
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 shadow-sm flex items-center justify-center disabled:bg-gray-600"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Website'
                  )}
                </button>
              </div>

              {generatedWebsite && (
                <div>
                  <button
                    onClick={deployWebsite}
                    disabled={deploying}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 shadow-sm flex items-center justify-center disabled:bg-gray-600"
                  >
                    {deploying ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deploying...
                      </span>
                    ) : (
                      'Deploy Website'
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {deployUrl && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-600 text-sm">
                    Website deployed successfully! Visit: <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="underline">{deployUrl}</a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-medium text-gray-700">Website Preview</h2>

                  <div className='flex gap-1 px-4'>
                  <button
                    onClick={() => changeViewport(ViewportSize.mobile)}
                    className={`p-2 rounded-md ${currentViewport === ViewportSize.mobile ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title="Mobile View"
                  >
                    <Smartphone size={20} />
                  </button>
                  <button
                    onClick={() => changeViewport(ViewportSize.tablet)}
                    className={`p-2 rounded-md ${currentViewport === ViewportSize.tablet ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title="Tablet View"
                  >
                    <Tablet size={20} />
                  </button>
                  <button
                    onClick={() => changeViewport(ViewportSize.desktop)}
                    className={`p-2 rounded-md ${currentViewport === ViewportSize.desktop ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title="Desktop View"
                  >
                    <Monitor size={20} />
                  </button>
                  <button
                    onClick={toggleFullScreen}
                    className="text-gray-600 hover:text-blue-600 focus:outline-none"
                    title="Toggle fullscreen"
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>
              
              </div>
              <div className="relative" style={{ height: '70vh' }} ref={previewRef}>
                {generatedWebsite && generatedWebsite.code ? (
              
                  <ResponsiveIframeViewer
                  src={generatedWebsite.code}
                  title="Website Preview"
                  size={ViewportSize.mobile}
                  enabledControls={[ViewportSize.mobile, ViewportSize.fluid]}
                  allowResizingX
                />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No website preview available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      {isFullScreen && generatedWebsite && generatedWebsite.code && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleFullScreen}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none"
              title="Exit fullscreen"
            >
              <Minimize2 size={24} />
            </button>
          </div>
          <iframe
            title="Website Preview Fullscreen"
            srcDoc={generatedWebsite.code}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
}

export default Website;
