import { useState, useEffect } from 'react';

interface ThumbnailQuota {
  count: number;
  date: string;
  email?: string;
}

interface GeneratedThumbnail {
  id: string; // Database ID from backend
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

interface ThumbnailGenerationOptions {
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'medium' | 'high';
  style?: string;
  n?: number; // Number of variations (1-4)
  referenceImage?: File;
  mask?: File; // Optional mask for reference image editing
  title?: string;
  titleStyle?: {
    bold: boolean;
    outline: boolean;
    shadow: boolean;
    uppercase: boolean;
  };
  titlePosition?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  titleColor?: {
    primary: string;
    name: string;
  };
}

interface UsePublicThumbnailGeneratorReturn {
  generateThumbnail: (prompt: string, options?: ThumbnailGenerationOptions) => Promise<void>;
  thumbnails: GeneratedThumbnail[];
  loading: boolean;
  error: string | null;
  quotaUsed: number;
  maxQuota: number;
  canGenerate: boolean;
  needsEmailCapture: boolean;
  submitEmailForDownload: (email: string, thumbnailId?: string) => Promise<void>;
  downloadThumbnail: (thumbnailId: string) => Promise<void>;
  forceDownload: (thumbnailId: string) => Promise<void>;
  clearError: () => void;
  getCurrentThumbnailContext: (thumbnailId?: string) => { prompt: string; thumbnailId: string; createdAt: string } | null;
}

const QUOTA_STORAGE_KEY = 'thumbnailQuota';
const DAILY_QUOTA_LIMIT = 50; // Increased for testing

// Helper function to build title instructions for the prompt
const buildTitleInstructions = (
  title: string, 
  titleStyle?: ThumbnailGenerationOptions['titleStyle'], 
  titlePosition?: ThumbnailGenerationOptions['titlePosition'], 
  titleColor?: ThumbnailGenerationOptions['titleColor']
): string => {
  let instructions = `Add the text "${title}" to the thumbnail`;
  
  // Add style instructions
  if (titleStyle) {
    const styles: string[] = [];
    if (titleStyle.bold) styles.push('bold');
    if (titleStyle.uppercase) styles.push('uppercase');
    if (titleStyle.outline) styles.push('outlined');
    if (titleStyle.shadow) styles.push('with drop shadow');
    
    if (styles.length > 0) {
      instructions += ` in ${styles.join(', ')} style`;
    }
  }
  
  // Add color instructions
  if (titleColor && titleColor.primary !== 'white') {
    instructions += ` in ${titleColor.name.toLowerCase()} color`;
  }
  
  // Add position instructions
  if (titlePosition) {
    const verticalPos = titlePosition.vertical === 'center' ? 'middle' : titlePosition.vertical;
    const horizontalPos = titlePosition.horizontal === 'center' ? 'center' : titlePosition.horizontal;
    instructions += ` positioned at the ${verticalPos} ${horizontalPos} of the thumbnail`;
  }
  
  instructions += '. Make sure the text is clearly readable and stands out against the background.';
  
  return instructions;
};

export const usePublicThumbnailGenerator = (): UsePublicThumbnailGeneratorReturn => {
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [needsEmailCapture, setNeedsEmailCapture] = useState(false);
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());

  // Initialize quota on mount
  useEffect(() => {
    const quota = getQuotaFromStorage();
    setQuotaUsed(quota.count);
  }, []);

  const getQuotaFromStorage = (): ThumbnailQuota => {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (stored) {
      const quota: ThumbnailQuota = JSON.parse(stored);
      
      // Reset quota if it's a new day
      if (quota.date !== today) {
        const newQuota: ThumbnailQuota = {
          count: 0,
          date: today,
          email: quota.email // Preserve email
        };
        localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(newQuota));
        return newQuota;
      }
      
      return quota;
    }
    
    // First time user
    const newQuota: ThumbnailQuota = {
      count: 0,
      date: today
    };
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(newQuota));
    return newQuota;
  };

  const updateQuotaInStorage = (updates: Partial<ThumbnailQuota>): void => {
    const current = getQuotaFromStorage();
    const updated = { ...current, ...updates };
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(updated));
  };

  const canGenerate = quotaUsed < DAILY_QUOTA_LIMIT;

  // Polling function for async jobs
  const pollJobStatus = async (jobId: string): Promise<void> => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/v1/images/job/${jobId}/public`, {
        method: 'GET',
        // Remove the Authorization header since we're using public endpoints
      });

      if (!response.ok) {
        throw new Error('Failed to get job status');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get job status');
      }

      const jobData = result.data;
      
      if (jobData.status === 'completed' && jobData.result) {
        // Job completed successfully
        setPollingJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });

        // Handle both single and multiple thumbnail responses
        let generatedThumbnails: GeneratedThumbnail[] = [];
        
        if (jobData.result.thumbnails) {
          // Multiple thumbnails response
          generatedThumbnails = jobData.result.thumbnails.map((thumb: any, index: number) => ({
            id: thumb.id ? thumb.id.toString() : `${Date.now()}-${index}`, // Use database ID if available
            prompt: jobData.result.prompt || 'Generated thumbnail',
            imageUrl: thumb.thumbnailUrl,
            createdAt: new Date().toISOString(),
          }));
        } else if (jobData.result.thumbnailUrl) {
          // Single thumbnail response
          generatedThumbnails = [{
            id: jobData.result.id ? jobData.result.id.toString() : Date.now().toString(), // Use database ID if available
            prompt: jobData.result.prompt || 'Generated thumbnail',
            imageUrl: jobData.result.thumbnailUrl,
            createdAt: new Date().toISOString(),
          }];
        }

        if (generatedThumbnails.length > 0) {
          setThumbnails(prev => [...generatedThumbnails, ...prev]);
        }

        setLoading(false);
      } else if (jobData.status === 'failed') {
        // Job failed
        setPollingJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setError(jobData.error || 'Thumbnail generation failed');
        setLoading(false);
      } else {
        // Job still processing, continue polling
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      setPollingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
      setError(err instanceof Error ? err.message : 'Failed to check job status');
      setLoading(false);
    }
  };

  const generateThumbnail = async (prompt: string, options?: ThumbnailGenerationOptions): Promise<void> => {
    if (!canGenerate) {
      setError('Daily quota exceeded. Please try again tomorrow.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt for your thumbnail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build the enhanced prompt with title instructions
      let enhancedPrompt = prompt.trim();
      
      if (options?.title) {
        const titleInstructions = buildTitleInstructions(options.title, options.titleStyle, options.titlePosition, options.titleColor);
        enhancedPrompt = `${prompt.trim()}. ${titleInstructions}`;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      // Use public endpoints that don't require authentication
      let endpoint = '/v1/images/generate/public';
      let requestBody: any = {
        prompt: enhancedPrompt,
        size: options?.size || 'auto',
        quality: options?.quality || 'high',
        n: Math.min(options?.n || 2, 4) // Limit to 4 variations max
      };

      // Add style if provided
      if (options?.style) {
        requestBody.style = options.style;
      }

      let headers: any = {
        'Content-Type': 'application/json',
        // Remove Authorization header - using public endpoints
      };

      // Handle reference image upload
      if (options?.referenceImage) {
        endpoint = '/v1/images/edit/public';
        const formData = new FormData();
        formData.append('image', options.referenceImage);
        formData.append('prompt', enhancedPrompt);
        formData.append('size', options.size || 'auto');
        formData.append('quality', options.quality || 'high');
        formData.append('n', String(Math.min(options.n || 2, 4)));
        
        if (options.style) {
          formData.append('style', options.style);
        }
        
        // Add mask if provided
        if (options.mask) {
          formData.append('mask', options.mask);
        }
        
        // Remove Content-Type header for FormData
        delete headers['Content-Type'];
        
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          body: formData,
        });

        if (response.status === 202) {
          // Async job started
          const result = await response.json();
          if (result.success && result.jobId) {
            setPollingJobs(prev => new Set(prev).add(result.jobId));
            pollJobStatus(result.jobId);
            
            // Update quota immediately for async jobs
            const newQuotaCount = quotaUsed + 1;
            setQuotaUsed(newQuotaCount);
            updateQuotaInStorage({ count: newQuotaCount });
            return;
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to generate thumbnail. Please try again.');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to generate thumbnail.');
        }

        // Handle response for reference image editing
        let generatedThumbnails: GeneratedThumbnail[] = [];
        
        if (result.data.thumbnails) {
          // Multiple thumbnails response
          generatedThumbnails = result.data.thumbnails.map((thumb: any, index: number) => ({
            id: thumb.id ? thumb.id.toString() : `${Date.now()}-${index}`, // Use database ID if available
            prompt: prompt.trim(),
            imageUrl: thumb.thumbnailUrl,
            createdAt: new Date().toISOString(),
          }));
        } else if (result.data.thumbnailUrl) {
          // Single thumbnail response
          generatedThumbnails = [{
            id: result.data.id ? result.data.id.toString() : Date.now().toString(), // Use database ID if available
            prompt: prompt.trim(),
            imageUrl: result.data.thumbnailUrl,
            createdAt: new Date().toISOString(),
          }];
        } else {
          throw new Error('No thumbnail URL found in response.');
        }

        setThumbnails(prev => [...generatedThumbnails, ...prev]);
        
        // Update quota (count each API call as 1, regardless of number of thumbnails generated)
        const newQuotaCount = quotaUsed + 1;
        setQuotaUsed(newQuotaCount);
        updateQuotaInStorage({ count: newQuotaCount });

      } else {
        // Regular text-to-image generation
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (response.status === 202) {
          // Async job started
          const result = await response.json();
          if (result.success && result.jobId) {
            setPollingJobs(prev => new Set(prev).add(result.jobId));
            pollJobStatus(result.jobId);
            
            // Update quota immediately for async jobs
            const newQuotaCount = quotaUsed + 1;
            setQuotaUsed(newQuotaCount);
            updateQuotaInStorage({ count: newQuotaCount });
            return;
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to generate thumbnail. Please try again.');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to generate thumbnail.');
        }

        // Handle both single and multiple thumbnail responses
        let generatedThumbnails: GeneratedThumbnail[] = [];
        
        if (result.data.thumbnails) {
          // Multiple thumbnails response
          generatedThumbnails = result.data.thumbnails.map((thumb: any, index: number) => ({
            id: thumb.id ? thumb.id.toString() : `${Date.now()}-${index}`, // Use database ID if available
            prompt: prompt.trim(),
            imageUrl: thumb.thumbnailUrl,
            createdAt: new Date().toISOString(),
          }));
        } else if (result.data.thumbnailUrl) {
          // Single thumbnail response
          generatedThumbnails = [{
            id: result.data.id ? result.data.id.toString() : Date.now().toString(), // Use database ID if available
            prompt: prompt.trim(),
            imageUrl: result.data.thumbnailUrl,
            createdAt: new Date().toISOString(),
          }];
        } else {
          throw new Error('No thumbnail URL found in response.');
        }

        setThumbnails(prev => [...generatedThumbnails, ...prev]);
        
        // Update quota (count each API call as 1, regardless of number of thumbnails generated)
        const newQuotaCount = quotaUsed + 1;
        setQuotaUsed(newQuotaCount);
        updateQuotaInStorage({ count: newQuotaCount });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const submitEmailForDownload = async (email: string, thumbnailId?: string): Promise<void> => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      // Get current thumbnail context for richer lead data
      const thumbnailContext = getCurrentThumbnailContext(thumbnailId);
      
      // Send email to Formspree for lead capture
      const formspreeResponse = await fetch('https://formspree.io/f/mvgrqevw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'AI Thumbnail Generator',
          timestamp: new Date().toISOString(),
          quotaUsed: quotaUsed,
          totalThumbnails: thumbnails.length,
          currentPrompt: thumbnailContext?.prompt || 'No prompt available',
          currentThumbnailId: thumbnailContext?.thumbnailId || 'N/A',
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'Direct',
          message: `New lead from AI Thumbnail Generator: ${email.trim()}\n\nUser Activity:\n- Thumbnails generated: ${thumbnails.length}\n- Quota used: ${quotaUsed}/${DAILY_QUOTA_LIMIT}\n- Current prompt: "${thumbnailContext?.prompt || 'N/A'}"\n- Thumbnail ID: ${thumbnailContext?.thumbnailId || 'N/A'}\n- Source: ${window.location.hostname}`
        }),
      });

      if (!formspreeResponse.ok) {
        throw new Error('Failed to save email. Please try again.');
      }

      // Save email to localStorage for future downloads (after successful Formspree submission)
      updateQuotaInStorage({ email: email.trim() });
      setNeedsEmailCapture(false);
      
    } catch (err) {
      console.error('Formspree submission error:', err);
      setError('Failed to save email. Please check your connection and try again.');
    }
  };

  const downloadThumbnail = async (thumbnailId: string): Promise<void> => {
    const quota = getQuotaFromStorage();
    
    // Check if user has provided email
    if (!quota.email) {
      setNeedsEmailCapture(true);
      return;
    }

    // Find the thumbnail (optional, for filename). Proceed even if not cached locally
    const thumbnail = thumbnails.find(t => t.id === thumbnailId);

    try {
      // Use the backend download endpoint instead of direct URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const downloadUrl = `${apiUrl}/api/v1/thumbnails/${thumbnailId}/download`;
      
      console.log('🔗 Downloading from backend:', downloadUrl);
      
      // Fetch the image as blob through the backend
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Derive file extension from content-type
      const contentType = response.headers.get('Content-Type') || '';
      let extension = 'png';
      if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('jpeg')) extension = 'jpg';
      else if (contentType.includes('png')) extension = 'png';

      const blob = await response.blob();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-thumbnail-${thumbnail ? thumbnail.id : thumbnailId}.${extension}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download thumbnail. Please try right-clicking the image and saving it manually.');
    }
  };

  // Force download without email check (used after email submission)
  const forceDownload = async (thumbnailId: string): Promise<void> => {
    console.log('🔥 forceDownload called with ID:', thumbnailId);
    console.log('📋 Available thumbnails:', thumbnails.map(t => ({ id: t.id, url: t.imageUrl })));
    
    // Find the thumbnail (optional). We'll still attempt download even if not cached locally
    const thumbnail = thumbnails.find(t => t.id === thumbnailId);

    console.log('✅ Found thumbnail:', thumbnail);

    try {
      console.log('📥 Fetching image through backend...');
      
      // Use the backend download endpoint instead of direct URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const downloadUrl = `${apiUrl}/api/v1/thumbnails/${thumbnailId}/download`;
      
      console.log('🔗 Downloading from backend:', downloadUrl);
      
      // Fetch the image as blob through the backend
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('Content-Type') || '';
      let extension = 'png';
      if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('jpeg')) extension = 'jpg';

      const blob = await response.blob();
      console.log('✅ Got blob:', blob.type, blob.size, 'bytes');

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      console.log('🔗 Created blob URL:', url);
      
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-thumbnail-${thumbnail ? thumbnail.id : thumbnailId}.${extension}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      console.log('🖱️ Clicking download link...');
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('🧹 Cleaned up download link and blob URL');
      }, 100);
      
      console.log('✅ Download should have started!');
    } catch (error) {
      console.error('❌ Download error:', error);
      setError('Failed to download thumbnail. Please try right-clicking the image and saving it manually.');
    }
  };

  // Function to get current thumbnail context for Formspree
  const getCurrentThumbnailContext = (thumbnailId?: string) => {
    if (thumbnailId) {
      const thumbnail = thumbnails.find(t => t.id === thumbnailId);
      return thumbnail ? {
        prompt: thumbnail.prompt,
        thumbnailId: thumbnail.id,
        createdAt: thumbnail.createdAt
      } : null;
    }
    return thumbnails.length > 0 ? {
      prompt: thumbnails[0].prompt,
      thumbnailId: thumbnails[0].id,
      createdAt: thumbnails[0].createdAt
    } : null;
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    generateThumbnail,
    thumbnails,
    loading,
    error,
    quotaUsed,
    maxQuota: DAILY_QUOTA_LIMIT,
    canGenerate,
    needsEmailCapture,
    submitEmailForDownload,
    downloadThumbnail,
    forceDownload,
    clearError,
    getCurrentThumbnailContext,
  };
}; 