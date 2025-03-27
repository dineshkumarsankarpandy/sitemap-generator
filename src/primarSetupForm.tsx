import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (businessName: string, businessDescription: string, siteMapPrompt: string, noOfPage: number, language: string) => void;
  nodeId: string;
  onSitemapGenerated?: (sitemap: any) => void;
  onImageGenerated?: (imageData: any) => void;
}


export function PrimarySetupForm({ open, onOpenChange, onRegenerate, onSitemapGenerated, onImageGenerated }: PageDialogProps) {
  // Sitemap state
  const [businessName, setBusinessName] = useState<string>('');
  const [businessDescription, setBusinessDescription] = useState<string>('');
  const [siteMapPrompt, setSiteMapPrompt] = useState<string>('');
  const [noOfPage, setNoOfPage] = useState<number>(0);
  const [language, setLanguage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleRegenerate = async () => {
    if (!businessName.trim()) {
      setError('Business name required.');
      return;
    }

    if (!businessDescription.trim()) {
      setError('Business Description required.');
      return;
    }

    // if (!siteMapPrompt.trim()) {
    //   setError('Sitemap Prompt is required.');
    //   return;
    // }
    
    if (noOfPage <= 0) {
      setError('Number of Pages must be greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      prompt: siteMapPrompt.trim()|| "",
      page: noOfPage,         
      language: language.trim() || 'english', 
    };

    try {
      const response = await axios.post(
        'http://localhost:8000/sitemap_generator/sitemap-generator',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Sitemap generated:', response);
      if (onSitemapGenerated) {
        onSitemapGenerated(response.data);
      }

      onRegenerate(businessName, businessDescription, siteMapPrompt, noOfPage, language);
      setBusinessName('');
      setBusinessDescription('');
      setSiteMapPrompt('');
      setLanguage('');
      setNoOfPage(1);
      onOpenChange(false);
    } catch (err) {
      console.error('Error generating sitemap:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(`Failed to generate sitemap: ${err.response.data.detail || 'Unknown error'}`);
      } else {
        setError('Failed to generate sitemap. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size <= 5 * 1024 * 1024) { // Check if file size is under 5MB
        setImageFile(file);
        setImageError(null);
      } else {
        setImageError('Image size must be less than 5MB.');
      }
    } else if (file) {
      setImageError('Please upload an image file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleImageGenerate = async () => {
    if (!imageFile) {
      setImageError('Please upload an image');
      return;
    }

    setImageLoading(true);
    setImageError(null);

    try {
      const base64Data = await fileToBase64(imageFile);

      
      const payload = {
        image: base64Data
      };

      const response = await axios.post(
        'http://localhost:8000/website_image/image-website',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Website generated via uploaded image:', response.data);
      if (onImageGenerated) {
        onImageGenerated(response.data);
      }
      localStorage.setItem('websiteCode', response.data.code);


      setImageFile(null);
      onOpenChange(false);
      navigate('/website-preview');
    } catch (err) {
      console.error('Error generating website:', err);
      if (axios.isAxiosError(err) && err.response) {
        setImageError(`Failed to generate website: ${err.response.data || 'Unknown error'}`);
      } else {
        setImageError('Failed to generate website. Please try again.');
      }
    } finally {
      setImageLoading(false);
    }
  };


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  if (!open) return null;
  
  return (
    <div
      className="p-4 absolute top-0 left-0 mt-4 mx-20 h-fit rounded-lg w-80 bg-white shadow-lg z-50 border-r border-gray-200"
      style={{ transition: 'transform 0.3s ease-in-out', transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
    >
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Generator</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <Tabs defaultValue="sitemap" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="sitemap" className="space-y-4">
            <div>
              <label className="block text-s font-medium text-gray-700 mb-1">Business Name</label>
              <Input 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder='Enter your Business name'
                className='w-72 h-[30px] bg-gray-100'
              />
            </div>

            <div>
              <label className="block text-s font-medium text-gray-700 mb-1">Business Description</label>
              <textarea 
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder='Enter your Business Description'
                className='w-72 h-[120px] px-2.5 py-1.5 bg-gray-100 rounded'
              />
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitemap Prompt *</label>
              <textarea
                value={siteMapPrompt}
                onChange={(e) => setSiteMapPrompt(e.target.value)}
                placeholder="Enter your Business ideas"
                className="w-72 h-[120px] px-2.5 py-1.5 bg-gray-100 rounded"
              />
            </div> */}
            
            <div> 
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pages</label>
              <Input
                value={noOfPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setNoOfPage(isNaN(val) ? 0 : val);
                }}
                placeholder="Enter no of pages..."
                className="w-72 h-[30px] bg-gray-100"
              />
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <Input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="default(english)"
                className="w-72 h-[30px] bg-gray-100"
              />
            </div> */}
            
            {error && <p className="text-xs text-red-500">{error}</p>}
            
            <div className="py-4">
              <Button
                size="default"
                onClick={handleRegenerate}
                className="w-full h-[30px] text-white rounded !bg-cyan-600"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Sitemap'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div
              className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } ${imageFile ? 'bg-green-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {imageFile ? (
                <div className="text-center p-2">
                  <div className="flex items-center justify-center text-green-600 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>File uploaded</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate max-w-xs">{imageFile.name}</p>
                  <button 
                    className="text-xs text-red-500 mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 mt-2">Drag and drop an image here, or click to select</p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
            </div>
            
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            
            <div className="py-4">
              <Button
                size="default"
                onClick={handleImageGenerate}
                className="w-full h-[30px] text-white rounded !bg-cyan-600"
                disabled={imageLoading || !imageFile}
              >
                {imageLoading ? 'Generating...' : 'Generate Website'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}