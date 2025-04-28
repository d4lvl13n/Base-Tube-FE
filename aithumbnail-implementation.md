# AI Thumbnail Generation API Documentation

## Overview

The AI Thumbnail Generation API allows creators to generate high-quality, context-aware thumbnails for videos using OpenAI's gpt-image-1 model. The service analyzes video metadata (title, description, category, etc.) to create thumbnails that are relevant to the content and visually appealing.

## Authentication

All endpoints require authentication using the standard authentication flow:
- Include authentication cookies or tokens as per the existing authentication mechanism
- Unauthorized requests will receive a 401 response

## Rate Limiting

To prevent API abuse and control costs, the following rate limits apply:
- **Development**: 100 requests per hour
- **Production**: 20 requests per hour

Requests exceeding this limit will receive a 429 response with the message: "Too many thumbnail generation requests, please try again later"

## Thumbnail Specifications

All generated thumbnails have the following specifications:
- **Dimensions**: 1536x1024 pixels (16:9 aspect ratio)
- **Format**: WebP with transparency support
- **Quality**: High-definition output optimized for web display

## New Features

### Multiple Thumbnail Options

The API now supports generating multiple thumbnail options in a single request using the `n` parameter. By default, each request generates 3 thumbnail options, allowing you to choose the best one for your content.

### Direct WebP Output

Thumbnails are now generated directly in WebP format from the AI model, resulting in better quality and smaller file sizes.

## API Endpoints

### 1. Generate Thumbnail for Existing Video

Generate a thumbnail for a specific video ID.

**Endpoint:** `POST /api/v1/thumbnails/videos/:videoId/thumbnail/generate`

**Request:**
```javascript
// Path parameter
videoId: number // Required: The ID of the video

// Body (JSON)
{
  "customPrompt": string, // Optional: Override automatic prompt generation
  "style": string,        // Optional: Style hint for generation (e.g., "cinematic", "cartoon", "photorealistic")
  "n": number,            // Optional: Number of thumbnail options to generate (1-10, default: 3)
  "background": string,   // Optional: "transparent", "opaque", or "auto" (default)
  "outputFormat": string, // Optional: "webp" (default), "png", or "jpeg"
  "outputCompression": number // Optional: Compression level (0-100) for WebP or JPEG (default: 100)
}
```

**Note:** The parameters `width`, `height`, and `quality` are supported for backward compatibility but are no longer used. All thumbnails are generated with a fixed high-quality configuration.

**Response (Multiple thumbnails):**
```javascript
{
  "success": true,
  "data": {
    "thumbnails": [
      {
        "thumbnailUrl": string, // Signed URL to access the first thumbnail
        "thumbnailPath": string  // Path to the first thumbnail in storage
      },
      {
        "thumbnailUrl": string, // Signed URL to access the second thumbnail
        "thumbnailPath": string  // Path to the second thumbnail in storage
      },
      {
        "thumbnailUrl": string, // Signed URL to access the third thumbnail
        "thumbnailPath": string  // Path to the third thumbnail in storage
      }
    ],
    "prompt": string        // The prompt used to generate the thumbnails
  }
}
```

**Response (Single thumbnail - backward compatibility):**
```javascript
{
  "success": true,
  "data": {
    "thumbnailUrl": string, // Signed URL to access the thumbnail
    "prompt": string        // The prompt used to generate the thumbnail
  }
}
```

**Example Usage:**
```javascript
// Using fetch API
async function generateThumbnailForVideo(videoId, options = {}) {
  const response = await fetch(`/api/v1/thumbnails/videos/${videoId}/thumbnail/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(options)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate thumbnail');
  }
  
  return response.json();
}

// Example call
generateThumbnailForVideo(123, {
  customPrompt: "Create a dramatic thumbnail with dark blue background and glowing text",
  n: 3, // Generate 3 options
  background: "auto" // Let AI decide on transparency
})
  .then(result => {
    if (result.data.thumbnails) {
      console.log('Generated thumbnail options:', result.data.thumbnails.length);
      console.log('First thumbnail URL:', result.data.thumbnails[0].thumbnailUrl);
    } else {
      console.log('Thumbnail URL:', result.data.thumbnailUrl);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 2. Generate Thumbnail from Custom Prompt

Generate a standalone thumbnail using a custom prompt without associating it with a video.

**Endpoint:** `POST /api/v1/thumbnails/thumbnail/generate`

**Request:**
```javascript
{
  "prompt": string,         // Required: The prompt to generate the thumbnail
  "style": string,          // Optional: Style hint for generation (e.g., "cinematic", "cartoon", "photorealistic")
  "n": number,              // Optional: Number of thumbnail options to generate (1-10, default: 3)
  "background": string,     // Optional: "transparent", "opaque", or "auto" (default)
  "outputFormat": string,   // Optional: "webp" (default), "png", or "jpeg"
  "outputCompression": number // Optional: Compression level (0-100) for WebP or JPEG (default: 100)
}
```

**Note:** The parameters `width`, `height`, and `quality` are supported for backward compatibility but are no longer used. All thumbnails are generated with a fixed high-quality configuration.

**Response (Multiple thumbnails):**
```javascript
{
  "success": true,
  "data": {
    "thumbnails": [
      {
        "thumbnailUrl": string, // Signed URL to access the first thumbnail
        "thumbnailPath": string  // Path to the first thumbnail in storage
      },
      // ... more thumbnails
    ],
    "prompt": string         // The prompt used to generate the thumbnails
  }
}
```

**Response (Single thumbnail - backward compatibility):**
```javascript
{
  "success": true,
  "data": {
    "thumbnailUrl": string,  // Signed URL to access the thumbnail
    "thumbnailPath": string, // Path to the thumbnail in storage
    "prompt": string         // The prompt used to generate the thumbnail
  }
}
```

**Example Usage:**
```javascript
// Using fetch API
async function generateThumbnailFromPrompt(prompt, options = {}) {
  const response = await fetch('/api/v1/thumbnails/thumbnail/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      prompt,
      ...options
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate thumbnail');
  }
  
  return response.json();
}

// Example call
generateThumbnailFromPrompt("A futuristic city with flying cars and neon lights", {
  n: 3, // Generate 3 options
  outputFormat: "webp"
})
  .then(result => {
    if (result.data.thumbnails) {
      // Handle multiple thumbnail options
      console.log(`Generated ${result.data.thumbnails.length} thumbnail options`);
      result.data.thumbnails.forEach((thumb, index) => {
        console.log(`Thumbnail ${index + 1} URL:`, thumb.thumbnailUrl);
      });
    } else {
      // Handle single thumbnail (backward compatibility)
      console.log('Thumbnail URL:', result.data.thumbnailUrl);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 3. Generate Thumbnail with Reference Image

Generate a thumbnail using a reference image to influence the style and composition.

**Endpoint:** `POST /api/v1/thumbnails/thumbnail/generate-with-reference`

**Request:**
```
Content-Type: multipart/form-data

referenceImage: File,   // Optional: Reference image file
videoId: number,        // Optional: Video ID to associate with
customPrompt: string,   // Optional: Custom prompt text
style: string,          // Optional: Style hint for generation
n: number,              // Optional: Number of thumbnail options to generate (1-10, default: 3)
outputFormat: string,   // Optional: "webp" (default), "png", or "jpeg"
outputCompression: number // Optional: Compression level (0-100) for WebP or JPEG (default: 100)
```

**Note:** The parameters `width`, `height`, `quality`, and `referenceImageDetail` are supported for backward compatibility but are no longer used.

**Response (Multiple thumbnails):**
```javascript
{
  "success": true,
  "data": {
    "thumbnails": [
      {
        "thumbnailUrl": string, // Signed URL to access the first thumbnail
        "thumbnailPath": string  // Path to the first thumbnail in storage
      },
      // ... more thumbnails
    ],
    "prompt": string         // The prompt used to generate the thumbnails
  }
}
```

**Response (Single thumbnail - backward compatibility):**
```javascript
{
  "success": true,
  "data": {
    "thumbnailUrl": string,  // Signed URL to access the thumbnail
    "thumbnailPath": string, // Path to the thumbnail in storage
    "prompt": string         // The prompt used to generate the thumbnail
  }
}
```

**Example Usage:**
```javascript
// Using FormData and fetch API
async function generateThumbnailWithReference(referenceImage, options = {}) {
  const formData = new FormData();
  formData.append('referenceImage', referenceImage);
  
  // Add optional parameters
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  const response = await fetch('/api/v1/thumbnails/thumbnail/generate-with-reference', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate thumbnail');
  }
  
  return response.json();
}

// Example call with file input and multiple thumbnail options
const fileInput = document.getElementById('referenceImageInput');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const result = await generateThumbnailWithReference(file, {
        videoId: 123, // Optional: associate with a video
        customPrompt: "Create a thumbnail with similar lighting and composition",
        n: 3 // Generate 3 thumbnail options
      });
      
      if (result.data.thumbnails) {
        displayThumbnailOptions(result.data.thumbnails);
      } else {
        console.log('Thumbnail URL:', result.data.thumbnailUrl);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

// Helper function to display thumbnail options
function displayThumbnailOptions(thumbnails) {
  const container = document.getElementById('thumbnailOptionsContainer');
  container.innerHTML = '';
  
  thumbnails.forEach((thumb, index) => {
    const option = document.createElement('div');
    option.className = 'thumbnail-option';
    
    const img = document.createElement('img');
    img.src = thumb.thumbnailUrl;
    img.alt = `Thumbnail option ${index + 1}`;
    
    const button = document.createElement('button');
    button.textContent = 'Use this thumbnail';
    button.onclick = () => selectThumbnail(thumb.thumbnailPath);
    
    option.appendChild(img);
    option.appendChild(button);
    container.appendChild(option);
  });
}

function selectThumbnail(thumbnailPath) {
  // Implementation to select and apply this thumbnail
  console.log('Selected thumbnail:', thumbnailPath);
}
```

## Recommended UI Implementation

### 1. Video Details Page Enhancement

Add an "AI Thumbnail" button in the video edit/upload flow:

```jsx
function VideoEditPage({ videoId, videoData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [style, setStyle] = useState('');
  
  async function handleGenerateThumbnail() {
    setIsGenerating(true);
    try {
      const result = await generateThumbnailForVideo(videoId, {
        customPrompt: customPrompt || undefined,
        style: style || undefined
      });
      setNewThumbnail(result.data.thumbnailUrl);
    } catch (error) {
      alert('Failed to generate thumbnail: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  }
  
  return (
    <div className="video-edit-page">
      {/* Other video edit fields */}
      
      <div className="thumbnail-section">
        <h3>Video Thumbnail</h3>
        
        {newThumbnail ? (
          <img src={newThumbnail} alt="Generated thumbnail" className="thumbnail-preview" />
        ) : (
          <img src={videoData.thumbnail_url} alt="Current thumbnail" className="thumbnail-preview" />
        )}
        
        <div className="ai-thumbnail-controls">
          <input 
            type="text" 
            placeholder="Custom prompt (optional)" 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          
          <input 
            type="text" 
            placeholder="Style hint (optional, e.g., cinematic, cartoon)" 
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
          
          <button 
            onClick={handleGenerateThumbnail} 
            disabled={isGenerating}
            className="generate-button"
          >
            {isGenerating ? 'Generating...' : 'Generate AI Thumbnail'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Advanced Thumbnail Generator Interface

For a dedicated thumbnail creation tool:

```jsx
function ThumbnailGenerator() {
  const [method, setMethod] = useState('prompt'); // 'prompt', 'reference', or 'video'
  const [videoId, setVideoId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceDetail, setReferenceDetail] = useState('high'); // 'low', 'high', or 'auto'
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      switch (method) {
        case 'video':
          result = await generateThumbnailForVideo(videoId, { style });
          break;
        case 'prompt':
          result = await generateThumbnailFromPrompt(prompt, { style });
          break;
        case 'reference':
          result = await generateThumbnailWithReference(referenceImage, {
            customPrompt: prompt || undefined,
            style: style || undefined,
            referenceImageDetail: referenceDetail
          });
          break;
      }
      
      setGeneratedThumbnail(result.data.thumbnailUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="thumbnail-generator">
      <h2>AI Thumbnail Generator</h2>
      
      <div className="generation-method">
        <label>
          <input 
            type="radio" 
            value="prompt" 
            checked={method === 'prompt'} 
            onChange={() => setMethod('prompt')} 
          />
          Custom Prompt
        </label>
        
        <label>
          <input 
            type="radio" 
            value="reference" 
            checked={method === 'reference'} 
            onChange={() => setMethod('reference')} 
          />
          Using Reference Image
        </label>
        
        <label>
          <input 
            type="radio" 
            value="video" 
            checked={method === 'video'} 
            onChange={() => setMethod('video')} 
          />
          From Video Context
        </label>
      </div>
      
      {method === 'video' && (
        <input 
          type="text" 
          placeholder="Enter Video ID" 
          value={videoId} 
          onChange={(e) => setVideoId(e.target.value)}
        />
      )}
      
      {(method === 'prompt' || method === 'reference') && (
        <textarea 
          placeholder="Enter your prompt" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
        />
      )}
      
      <input 
        type="text" 
        placeholder="Style hint (optional, e.g., cinematic, photorealistic)" 
        value={style} 
        onChange={(e) => setStyle(e.target.value)} 
      />
      
      {method === 'reference' && (
        <>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setReferenceImage(e.target.files[0])} 
          />
          
          <div className="reference-detail-control">
            <p>Reference Image Detail:</p>
            <select 
              value={referenceDetail}
              onChange={(e) => setReferenceDetail(e.target.value)}
            >
              <option value="low">Low (Faster)</option>
              <option value="high">High (Better Quality)</option>
              <option value="auto">Auto (AI Decides)</option>
            </select>
            <p className="detail-explanation">
              {referenceDetail === 'low' ? 
                'Lower detail uses fewer tokens and is good for simple style references.' :
                referenceDetail === 'high' ? 
                'Higher detail captures more visual information, recommended for complex references.' :
                'Auto lets the AI decide the appropriate level of detail.'}
            </p>
          </div>
        </>
      )}
      
      <button 
        onClick={handleGenerate} 
        disabled={isLoading || (method === 'video' && !videoId) || (method === 'prompt' && !prompt)}
      >
        {isLoading ? 'Generating...' : 'Generate Thumbnail'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {generatedThumbnail && (
        <div className="result">
          <h3>Generated Thumbnail</h3>
          <img src={generatedThumbnail} alt="Generated thumbnail" />
          <div className="actions">
            <button onClick={() => /* Save or apply logic */ console.log('Save clicked')}>
              Use This Thumbnail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

The API returns standardized error responses:

```javascript
{
  "success": false,
  "message": "Error message description"
}
```

Common error scenarios:

| Status Code | Description | Possible Causes |
|-------------|-------------|----------------|
| 400 | Bad Request | Invalid input parameters, missing required fields |
| 401 | Unauthorized | Missing or invalid authentication |
| 404 | Not Found | Video ID not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | AI service unavailable, generation failed |

## Best Practices

1. **Input Validation**: Always validate inputs on the client-side before making API calls
2. **Loading States**: Show clear loading indicators during thumbnail generation
3. **Error Handling**: Display user-friendly error messages
4. **Preview**: Always show a preview of the generated thumbnail before applying it
5. **Fallbacks**: Provide fallback options in case of generation failures

## Additional UI Recommendations

1. **Style Presets**: Offer pre-configured style options for different content types
2. **Text Overlay Tool**: Allow users to add text overlays to generated thumbnails
3. **Batch Generation**: For channels with consistent branding, offer batch generation
4. **A/B Testing**: Implement A/B testing to compare performance of different thumbnails
5. **Templates**: Save successful prompts as templates for future use

## Example Prompts for Different Content Types

| Content Type | Example Prompt |
|--------------|----------------|
| Gaming | "Create a dynamic gaming thumbnail featuring intense action with bright colors and clear focus on the main character" |
| Tutorial | "Create a clean, informative thumbnail with clear text space and a professional look" |
| Vlog | "Create a vibrant, personal thumbnail that captures emotion and daily life with warm tones" |
| Tech Review | "Create a clean, minimalist thumbnail with the product prominently displayed on a gradient background" |
| Cooking | "Create a mouth-watering close-up of food with rich colors and appetizing presentation" |







