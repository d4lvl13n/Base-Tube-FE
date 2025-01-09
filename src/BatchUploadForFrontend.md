

# Batch Upload for Frontend

This document describes how a frontend application can interact with the new Hybrid Batch Upload endpoints for uploading multiple videos. The system automatically decides between single-file uploading (for files ≤150MB) or chunked (multipart) uploading (for files >150MB). Below is an overview of the relevant endpoints, payloads, progress tracking, error handling, and recommended front-end flows.

---

## 1. Endpoints Overview

1. POST /api/v1/videos/batch/init  
   • Initializes one or more file uploads in a single “batch.”  
   • The request body should include an array of “file metadata” objects (i.e., filename, size).  
   • The response returns an array of “UploadSession” objects, each describing how to upload an individual file (e.g., isChunked, totalChunks, presignedUrls).  

2. POST /api/v1/videos/batch/chunk/:uploadId/:chunkIndex  
   • For chunked uploads (files > 150MB), this endpoint receives a single chunk per request.  
   • Each request increments chunkIndex.  
   • The server updates progress in Redis and returns success or error.  

3. POST /api/v1/videos/batch/complete/:uploadId  
   • Finalizes an upload once all chunks (or the single-file upload) have finished.  
   • Creates the video record in the database and triggers background processing.  
   • Removes Redis keys for that upload session, cleaning up.  

4. GET /api/v1/videos/batch/progress/:uploadId  
   • Returns real-time progress for a single file within the batch (by uploadId).  
   • Progress is stored in Redis as an integer percentage (0–100) and includes a list of failedChunks if any.  
   • Useful for polling in the frontend or showing progress bars.

5. POST /api/v1/videos/batch/retry/:uploadId  
   • Identifies any chunks that have failed (marked as “failed” in Redis).  
   • Returns new presigned URLs for those specific chunks so the frontend can retry them without redoing the entire upload.  

---

## 2. Frontend Process Flow

Below is an example outline of how the frontend might handle each step.

### Step 1: Gather File Info and “Init” the Batch

1. User selects multiple files (up to 5).  
2. For each file, gather basic info:  
   - filename  
   - size (in bytes)  
   - optional: type or MIME  
3. Make a POST request to /api/v1/videos/batch/init with an array of file objects and the channel_id parameter (if applicable).

Example request body:
json
{
"channel_id": "123",
"files": [
{ "filename": "myVideo1.mp4", "size": 104857600, "type": "video/mp4" },
{ "filename": "myVideo2.mp4", "size": 524288001, "type": "video/mp4" }
]
}

json
{
"success": true,
"data": [
{
"uploadId": "8477b9af-...",
"fileId": "b14ede53-...",
"isChunked": false,
"totalChunks": 1,
"presignedUrls": ["https://.../PUT?..."],
"status": "initialized"
},
{
"uploadId": "bab41125-...",
"fileId": "444db937-...",
"isChunked": true,
"totalChunks": 10,
"presignedUrls": [
"https://.../PUT?partNumber=1",
"https://.../PUT?partNumber=2"
"... more chunk URLs ..."
],
"status": "initialized"
}
]
}
json
{
"success": true,
"data": {
"uploadId": "...",
"filename": "myVideo2.mp4",
"progress": 45,
"status": "uploading",
"failedChunks": [2, 7],
"totalChunks": 10,
"completedCount": 3
}
}
:
bash
POST /api/v1/videos/batch/retry/bab41125-...
:
json
{
"success": true,
"data": [
{ "chunkIndex": 2, "url": "https://.../PUT?partNumber=2&..." },
{ "chunkIndex": 7, "url": "https://.../PUT?partNumber=7&..." }
]
}
js
// 1. Init the batch
const channelId = 123;
const filesToUpload = selectedFiles.map(f => ({
filename: f.name,
size: f.size,
type: f.type,
}));
const initRes = await fetch('/api/v1/videos/batch/init', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ channel_id: channelId, files: filesToUpload })
});
const { data: uploadSessions } = await initRes.json();
// 2. For each upload session, check if chunked or not
for (const session of uploadSessions) {
const { uploadId, isChunked, presignedUrls, totalChunks, status } = session;
const file = findMatchingLocalFileByName(session.fileIdOrFilename);
if (!isChunked) {
// Single upload
await fetch(presignedUrls[0], { method: 'PUT', body: file });
} else {
// Chunked upload
for (let i = 0; i < totalChunks; i++) {
const chunk = file.slice(i CHUNK_SIZE, (i + 1) CHUNK_SIZE);
// If using presigned URLs:
const res = await fetch(presignedUrls[i], { method: 'PUT', body: chunk });
if (!res.ok) {
// Might mark chunk i as failed locally, or skip to poll / retry approach
console.error(Chunk ${i} failed to upload.);
}
// Alternatively, if using POST /batch/chunk directly:
// const formData = new FormData();
// formData.append('chunk', chunk, file.name);
// await fetch(/api/v1/videos/batch/chunk/${uploadId}/${i}, {
// method: 'POST',
// body: formData
// });
}
// (Optional) Check progress or poll
const progressRes = await fetch(/api/v1/videos/batch/progress/${uploadId});
const { data: progressData } = await progressRes.json();
if (progressData.failedChunks && progressData.failedChunks.length > 0) {
// Retry those chunks
const retryRes = await fetch(/api/v1/videos/batch/retry/${uploadId}, {
method: 'POST'
});
const { data: retryInfo } = await retryRes.json();
// re-upload each failed chunk with new URLs
for (const chunkObj of retryInfo) {
const { chunkIndex, url } = chunkObj;
const chunk = file.slice(chunkIndex CHUNK_SIZE, (chunkIndex + 1) CHUNK_SIZE);
const retryChunkRes = await fetch(url, { method: 'PUT', body: chunk });
if (!retryChunkRes.ok) {
console.error(Failed again for chunk ${chunkIndex}.);
}
}
}
}
// 3. Mark upload complete
const completeRes = await fetch(/api/v1/videos/batch/complete/${uploadId}, { method: 'POST' });
const { data: videoData } = await completeRes.json();
console.log(File ${file.name} is completed, videoData);
}
.



### Step 3: Upload Each File According to the Strategy

For each file:

1. If isChunked = false:
   - You only have one presigned URL or a single direct endpoint to upload the file.  
   - Perform a PUT (or POST) to the returned presigned URL (or a single request to the server’s chunk endpoint).  
   - On success, you can poll or wait for a final update, then proceed to Step 4.

2. If isChunked = true:
   - You have multiple chunk URLs or you can call the server’s /chunk/:uploadId/:chunkIndex for each chunk.  
   - Generally, chunk your file (e.g., 5MB per chunk) and upload in a loop:
     - For chunkIndex from 0 to totalChunks-1:  
       - Extract the slice of the file buffer.  
       - If you have presignedUrls[i], do a PUT request to that URL, including the chunk as the request body.  
       - Alternatively, call POST /batch/chunk/:uploadId/:chunkIndex with form-data to send the chunk.  
   - After each chunk, you may poll the progress endpoint or keep your own local state of progress.

### Step 4: Report Progress

- To display an on-screen progress bar, you can poll GET /api/v1/videos/batch/progress/:uploadId.  
- The server returns something like:
json
{
"success": true,
"data": {
"uploadId": "...",
"filename": "myVideo2.mp4",
"progress": 45,
"status": "uploading",
"failedChunks": [2, 7],
"totalChunks": 10,
"completedCount": 3
}
}


- “progress” is typically an integer 0–100.  
- “failedChunks” is an array of chunk indices that need to be retried.  
- When “status” = “completed,” the file’s upload is done.

### Step 5: Complete the Upload

Once all chunks for that file are done (or the single-file PUT is successful):

1. Make a POST request to /api/v1/videos/batch/complete/:uploadId.  
2. The server finalizes the upload with Storj, cleans up Redis keys, and creates a record in the “Video” table.  
3. The response returns basic video metadata.  
4. At this point, your front-end can mark that file as “finished uploading.”  

For a true “batch,” you’ll repeat Steps 3–5 for each file. You can finalize each file individually or wait until all are uploaded and finalize them in parallel.

---

## 3. (New) Retrying Failed Chunks

If any chunk fails (due to a network glitch, server error, etc.), the server will mark that chunk as “failed.” Here’s how you can retry:

1. Poll GET /batch/progress/:uploadId or handle an error response.  
2. If the response indicates failedChunks is non-empty, call POST /batch/retry/:uploadId.  
3. The server responds with new presigned URLs for just those failed chunks.  
4. You can then re-upload those chunks using the new URLs.  

Sample retry request:
bash
POST /api/v1/videos/batch/retry/bab41125-...

Sample retry response:

json
{
"success": true,
"data": [
{ "chunkIndex": 2, "url": "https://.../PUT?partNumber=2&..." },
{ "chunkIndex": 7, "url": "https://.../PUT?partNumber=7&..." }
]
}


---

## 4. Example Pseudocode (Updated With Retries)

---

// 1. Init the batch
const channelId = 123;
const filesToUpload = selectedFiles.map(f => ({
filename: f.name,
size: f.size,
type: f.type,
}));
const initRes = await fetch('/api/v1/videos/batch/init', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ channel_id: channelId, files: filesToUpload })
});
const { data: uploadSessions } = await initRes.json();
// 2. For each upload session, check if chunked or not
for (const session of uploadSessions) {
const { uploadId, isChunked, presignedUrls, totalChunks, status } = session;
const file = findMatchingLocalFileByName(session.fileIdOrFilename);
if (!isChunked) {
// Single upload
await fetch(presignedUrls[0], { method: 'PUT', body: file });
} else {
// Chunked upload
for (let i = 0; i < totalChunks; i++) {
const chunk = file.slice(i CHUNK_SIZE, (i + 1) CHUNK_SIZE);
// If using presigned URLs:
const res = await fetch(presignedUrls[i], { method: 'PUT', body: chunk });
if (!res.ok) {
// Might mark chunk i as failed locally, or skip to poll / retry approach
console.error(Chunk ${i} failed to upload.);
}
// Alternatively, if using POST /batch/chunk directly:
// const formData = new FormData();
// formData.append('chunk', chunk, file.name);
// await fetch(/api/v1/videos/batch/chunk/${uploadId}/${i}, {
// method: 'POST',
// body: formData
// });
}
// (Optional) Check progress or poll
const progressRes = await fetch(/api/v1/videos/batch/progress/${uploadId});
const { data: progressData } = await progressRes.json();
if (progressData.failedChunks && progressData.failedChunks.length > 0) {
// Retry those chunks
const retryRes = await fetch(/api/v1/videos/batch/retry/${uploadId}, {
method: 'POST'
});
const { data: retryInfo } = await retryRes.json();
// re-upload each failed chunk with new URLs
for (const chunkObj of retryInfo) {
const { chunkIndex, url } = chunkObj;
const chunk = file.slice(chunkIndex CHUNK_SIZE, (chunkIndex + 1) CHUNK_SIZE);
const retryChunkRes = await fetch(url, { method: 'PUT', body: chunk });
if (!retryChunkRes.ok) {
console.error(Failed again for chunk ${chunkIndex}.);
}
}
}
}
// 3. Mark upload complete
const completeRes = await fetch(/api/v1/videos/batch/complete/${uploadId}, { method: 'POST' });
const { data: videoData } = await completeRes.json();
console.log(File ${file.name} is completed, videoData);
}
.


---

## 5. Error Handling Considerations

• If the user attempts to finalize with missing chunks, the server will return an error (e.g., “Multipart upload info not found” or “Missing parts”).  
• For chunked uploads, large chunks (e.g., > 2GB each) will also fail.  
• If you see “failedChunks” returned by /batch/progress, call /batch/retry to retry just those parts.  
• Always check the “success” field in your JSON response; if false, display or log the error.  

---

## 6. Summary

• For files ≤150MB: a single upload request suffices (and the server sets status to 'completed').  
• For files >150MB: chunk-by-chunk uploading, with finalization at the end.  
• Progress is tracked on a file-by-file basis using Redis, and can be polled.  
• If any chunk fails, you can call /batch/retry/:uploadId to get a new presigned URL for that specific chunk.  
• You must call /batch/complete/:uploadId after all chunks finish to finalize.  

The newly introduced “retry” flow and progress endpoint updates let you see exactly which chunks have failed and re-upload them without starting over—improving the user’s experience and saving bandwidth. Ensure that your front-end logic gracefully handles these states (uploading, failed, retrying, completed) for each file. Once done, your multi-video batch is fully uploaded.

