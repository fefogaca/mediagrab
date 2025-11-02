'use client';

import React from 'react';

// Simple component to render code blocks with syntax highlighting imitation
const CodeBlock = ({ children, lang }: { children: string; lang: string }) => {
  return (
    <div className="bg-gray-800 rounded-lg my-6 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-400">{lang}</span>
        <button 
          onClick={() => navigator.clipboard.writeText(children)}
          className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="p-4 text-sm text-white overflow-x-auto"><code>{children}</code></pre>
    </div>
  );
};

const DocsPage = () => {
  const exampleResponse = JSON.stringify({
    "title": "Example Video Title",
    "requested_url": "https://...",
    "formats": [
      {
        "format_id": "313",
        "ext": "mp4",
        "resolution": "3840x2160",
        "quality": 4,
        "vcodec": "av01.0.13M.10",
        "acodec": "none",
        "filesize_approx": 157383383,
        "download_url": "http://localhost:3000/api/download-direct?url=...&format=313"
      },
      {
        "format_id": "140",
        "ext": "m4a",
        "resolution": "Audio Only",
        "quality": 1,
        "vcodec": "none",
        "acodec": "mp4a.40.2",
        "filesize_approx": 3094343,
        "download_url": "http://localhost:3000/api/download-direct?url=...&format=140"
      }
    ]
  }, null, 2);

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Introduction</h1>
      <p>Welcome to the MediaGrab API! Our API provides a simple and powerful way to get information and download links for videos from various online platforms.</p>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-12">Getting Started</h2>
      <p>To get started, you need an API key. You can generate and manage your API keys from the admin dashboard.</p>
      <ol>
        <li><a href="/register">Create an account</a> or <a href="/login">log in</a>.</li>
        <li>Navigate to the <strong>API Keys</strong> section in the admin panel.</li>
        <li>Generate your new API key.</li>
      </ol>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-12">Authentication</h2>
      <p>All API requests must be authenticated. Provide your API key as the <code>apikey</code> query parameter in your request.</p>
      <CodeBlock lang="bash">
        {`curl "http://localhost:3000/api/download?url=<VIDEO_URL>&apikey=<YOUR_API_KEY>"`}
      </CodeBlock>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-12">API Reference</h2>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8">Get Video Info</h3>
      <p>This endpoint retrieves available formats, resolutions, and direct download links for a given video URL.</p>
      <p><strong>Endpoint:</strong> <code>GET /api/download</code></p>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li><code>url</code> (required): The URL of the video you want to process.</li>
        <li><code>apikey</code> (required): Your API key for authentication.</li>
      </ul>
      
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Example Request:</h4>
      <CodeBlock lang="bash">
        {`curl "http://localhost:3000/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&apikey=user-key-123"`}
      </CodeBlock>

      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6">Example Response:</h4>
      <p>A successful request returns a JSON object with the video title and a list of available formats.</p>
      <CodeBlock lang="json">
        {exampleResponse}
      </CodeBlock>
    </div>
  );
};

export default DocsPage;
