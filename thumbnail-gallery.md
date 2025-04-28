# AI Thumbnail Gallery API Documentation

## Overview

The Thumbnail Gallery API provides access to all AI-generated thumbnails created in the system. This document outlines how to interact with the API to browse, view, and manage thumbnails.

## Authentication

- **Public Endpoints**: Gallery listing and individual thumbnail details are publicly accessible without authentication.
- **Protected Endpoints**: Thumbnail generation and management endpoints require authentication.

## API Endpoints

### Gallery Endpoints

#### List All Thumbnails

Retrieve a paginated list of thumbnails with optional filtering.

```
GET /api/thumbnails
```

**Query Parameters:**

| Parameter | Type    | Default | Description                                        |
|-----------|---------|---------|---------------------------------------------------|
| search    | string  | -       | Search term to filter thumbnails by prompt content |
| videoId   | number  | -       | Filter thumbnails by source video ID               |
| used      | boolean | -       | Filter by usage status (true/false)                |
| limit     | number  | 30      | Number of thumbnails per page                      |
| offset    | number  | 0       | Pagination offset                                  |
| sort      | string  | created_at | Field to sort by                                |
| order     | string  | desc    | Sort order (asc/desc)                              |

**Response:**

```json
{
  "count": 120,
  "thumbnails": [
    {
      "id": 1,
      "storj_key": "a1b2c3d4.webp",
      "prompt": "Create a vibrant YouTube thumbnail for gaming video...",
      "model": "gpt-image-1",
      "quality": "high",
      "style": "vibrant",
      "size": "1536x1024",
      "video_id": 42,
      "used_in_video_id": 42,
      "is_used": true,
      "created_by": null,
      "config": { "n": 3, "quality": "high" },
      "download_count": 23,
      "created_at": "2023-06-15T18:30:00Z",
      "updated_at": "2023-06-15T19:45:00Z",
      "thumbnailUrl": "https://storage.example.com/thumbnails/a1b2c3d4.webp"
    },
    // ... more thumbnails
  ],
  "limit": 30,
  "offset": 0,
  "hasMore": true
}
```

#### Get Thumbnail Details

Retrieve details for a specific thumbnail by ID.

```
GET /api/thumbnails/:id
```

**Path Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| id        | number | Thumbnail ID      |

**Response:**

```json
{
  "id": 1,
  "storj_key": "a1b2c3d4.webp",
  "prompt": "Create a vibrant YouTube thumbnail for gaming video...",
  "model": "gpt-image-1",
  "quality": "high",
  "style": "vibrant",
  "size": "1536x1024",
  "video_id": 42,
  "used_in_video_id": 42,
  "is_used": true,
  "created_by": null,
  "config": { "n": 3, "quality": "high" },
  "download_count": 23,
  "created_at": "2023-06-15T18:30:00Z",
  "updated_at": "2023-06-15T19:45:00Z",
  "thumbnailUrl": "https://storage.example.com/thumbnails/a1b2c3d4.webp"
}
```

#### Download Thumbnail

Download a thumbnail image directly and track usage statistics (no authentication required).

```
GET /api/thumbnails/:id/download
```

**Path Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| id        | number | Thumbnail ID      |

**Response:**

The response is the actual thumbnail image file with appropriate download headers:
- `Content-Type`: image/webp (or appropriate MIME type)
- `Content-Disposition`: attachment; filename="filename.webp"
- `Content-Length`: file size in bytes

**Notes:**
- Each download is automatically tracked in the system
- Thumbnail download count is incremented for analytics purposes
- No authentication is required to download thumbnails

### Thumbnail Generation Endpoints (For Reference)

These endpoints are available for generating new thumbnails:

#### Generate Thumbnail for a Video

```
POST /api/videos/:videoId/thumbnail/generate
```

#### Generate Thumbnail from Prompt

```
POST /api/thumbnail/generate
```

#### Generate Thumbnail with Reference Image

```
POST /api/thumbnail/generate-with-reference
```

#### Edit Images with Prompt

```
POST /api/thumbnail/edit-images
```

#### Create Image Variation

```
POST /api/thumbnail/create-variation
```

## Client Integration Examples

### Browsing the Thumbnail Gallery

```javascript
// Example using fetch API
async function fetchThumbnails(search = '', videoId = null, used = null, page = 1, limit = 30) {
  const offset = (page - 1) * limit;
  
  let url = `/api/thumbnails?limit=${limit}&offset=${offset}`;
  
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (videoId !== null) url += `&videoId=${videoId}`;
  if (used !== null) url += `&used=${used}`;
  
  const response = await fetch(url);
  return await response.json();
}

// Example usage
const thumbnails = await fetchThumbnails('gaming', null, false, 1, 24);
console.log(`Found ${thumbnails.count} gaming thumbnails`);

// Rendering example with React
function ThumbnailGallery({ thumbnails }) {
  return (
    <div className="gallery-grid">
      {thumbnails.map(thumbnail => (
        <div key={thumbnail.id} className="thumbnail-card">
          <img src={thumbnail.thumbnailUrl} alt={`AI Thumbnail ${thumbnail.id}`} />
          <div className="thumbnail-info">
            <p className="prompt">{thumbnail.prompt.substring(0, 100)}...</p>
            <p className="details">
              {thumbnail.model} • {thumbnail.quality} • {thumbnail.size}
            </p>
            {!thumbnail.is_used && (
              <button onClick={() => downloadThumbnail(thumbnail.id, `thumbnail-${thumbnail.id}.webp`)}>
                Download Thumbnail
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Downloading a Thumbnail

```javascript
// Direct download approach
function downloadThumbnail(thumbnailId, filename) {
  // Create a link to trigger the download
  const link = document.createElement('a');
  link.href = `/api/thumbnails/${thumbnailId}/download`;
  link.download = filename || `thumbnail-${thumbnailId}.webp`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Example usage
downloadThumbnail(123, 'my-thumbnail.webp');

// Alternative: Fetch and use the blob
async function fetchAndUseThumbnail(thumbnailId) {
  try {
    const response = await fetch(`/api/thumbnails/${thumbnailId}/download`);
    if (!response.ok) throw new Error('Download failed');
    
    // Get the blob data
    const imageBlob = await response.blob();
    
    // Create an object URL from the blob
    const imageUrl = URL.createObjectURL(imageBlob);
    
    // Use the image (example: set as source for an img element)
    document.getElementById('previewImage').src = imageUrl;
    
    return imageUrl;
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    return null;
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Thumbnail not found
- `500 Internal Server Error`: Server error

Error responses include a message explaining what went wrong:

```json
{
  "message": "Thumbnail not found"
}
```

## Pagination and Performance

For optimal performance when working with the gallery:

1. Use pagination parameters (`limit` and `offset`) to limit the number of thumbnails fetched at once
2. Consider implementing infinite scroll with progressive loading
3. Use the filtering parameters to reduce the result set when appropriate
4. For galleries with thousands of thumbnails, consider implementing client-side caching

## Image URLs and Storage

- The `thumbnailUrl` field provides a pre-signed URL for direct image access
- URLs are typically valid for 24 hours
- For long-term storage needs, download the images or refresh the URLs 

## Download Statistics

The system tracks thumbnail popularity through download counts:

- Each time a thumbnail is downloaded via the `/api/thumbnails/:id/download` endpoint, its download count is incremented
- Download counts are included in thumbnail responses as the `download_count` field
- This data can be used to:
  - Identify the most popular thumbnail styles
  - Compare thumbnail performance by style, quality, or content
  - Train future AI models based on user preferences
  - Build a "trending thumbnails" section in your UI

No authentication is required for downloading thumbnails, allowing you to gather statistics from all users while maintaining a frictionless experience. 