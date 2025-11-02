# MediaGrab - Ultimate Media Downloader API

![MediaGrab Logo](public/next.svg) <!-- Replace with an actual logo if available -->

## Table of Contents
- [About](#about)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the Development Server](#running-the-development-server)
- [Usage](#usage)
  - [Public Web Downloader](#public-web-downloader)
  - [Developer API](#developer-api)
- [Admin Dashboard](#admin-dashboard)
- [Contributing](#contributing)
- [License](#license)

## About
MediaGrab is a robust and flexible media downloading service built with Next.js. It offers a user-friendly web interface for direct, public media downloads and a powerful API for developers to integrate media downloading capabilities into their own applications. The developer API includes API key management and usage limits based on pricing tiers.

## Features
- **Public Web Downloader:** Quickly generate download links for videos and audio directly from the landing page without needing an API key.
- **Developer API:** A secure, API key-authenticated endpoint for programmatic access to media download functionalities.
- **API Key Management:** Admin dashboard to create, manage, and monitor API keys, including setting usage limits for different tiers.
- **Usage Limits:** Enforce per-API key usage limits to support various pricing plans (Developer, Pro, Enterprise).
- **Admin Dashboard:** Comprehensive dashboard for user management, API key oversight, and analytics.
- **Theme Toggle:** User-friendly dark/light mode toggle for enhanced accessibility and preference.
- **Responsive Design:** Optimized for various devices and screen sizes.
- **Static Pages:** Dedicated pages for Pricing, Docs, Contact, Terms of Service, and Privacy Policy.

## Technologies Used
- **Framework:** Next.js (App Router)
- **Frontend:** React, Tailwind CSS, Headless UI
- **Backend:** Node.js, Express.js (for Next.js API Routes)
- **Database:** SQLite (with `sqlite` package)
- **Media Processing:** `yt-dlp-wrap` (a wrapper for `yt-dlp`)
- **Authentication:** `bcrypt` (for password hashing), `jsonwebtoken` (for JWTs)

## Getting Started
Follow these instructions to set up and run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- npm or Yarn
- Git

### Installation
1.  **Clone the repository:**
    ```bash
    git clone git@github.com:fefogaca/mediagrab.git
    cd mediagrab
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Database Setup
The project uses SQLite. You need to create and migrate the database for API key and user management.

```bash
# Create/Initialize the database (if not already present)
node scripts/migrate.js

# Create an admin user (optional, for dashboard access)
node scripts/create-admin.js
```

> **Note:** The `migrate.js` script adds `usage_count` and `usage_limit` columns to the `api_keys` table. Run it once.

### Running the Development Server
To run the application in development mode:

```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Public Web Downloader
Visit the landing page ([http://localhost:3000](http://localhost:3000)), paste a video or audio URL, and click "Get Links" to instantly retrieve available download options. No API key is required.

### Developer API
For programmatic access to media downloading, use the API endpoint with an authenticated API key. API keys can be generated and managed in the Admin Dashboard.

**Endpoint:** `GET /api/download`

**Authentication:** Requires a valid API key passed as a query parameter `apikey`.

**Usage Limits:** Each API key has a `usage_count` and `usage_limit` enforced. Exceeding the limit will result in a `429 Too Many Requests` response.

**Parameters:**
- `url` (required): The URL of the video or audio to process.
- `apikey` (required): Your unique API key.

**Example Request (cURL):**
```bash
curl -X GET "http://localhost:3000/api/download?url=YOUR_MEDIA_URL&apikey=YOUR_API_KEY"
```

**Example Request (JavaScript using `fetch`):**
```javascript
fetch(`/api/download?url=${encodeURIComponent(yourMediaUrl)}&apikey=${yourApiKey}`)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**Example Response (Success):**
```json
{
  "title": "Example Video Title",
  "requested_url": "https://www.youtube.com/watch?v=...",
  "formats": [
    {
      "format_id": "248",
      "ext": "webm",
      "resolution": "1920x1080",
      "quality": null,
      "vcodec": "vp9",
      "acodec": "none",
      "filesize_approx": 123456789,
      "download_url": "http://localhost:3000/api/download-direct?url=...&format=248"
    },
    {
      "format_id": "251",
      "ext": "webm",
      "resolution": "Audio Only",
      "quality": null,
      "vcodec": "none",
      "acodec": "opus",
      "filesize_approx": 543210,
      "download_url": "http://localhost:3000/api/download-direct?url=...&format=251"
    }
  ]
}
```

**Example Response (Error - Invalid API Key):**
```json
{ "error": "Invalid API key." }
```

**Example Response (Error - Limit Exceeded):**
```json
{ "error": "API usage limit exceeded." }
```

## Admin Dashboard
Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin) to manage users, generate API keys with custom usage limits, and monitor overall API usage statistics.

## Contributing
We welcome contributions! Please follow standard GitHub practices: fork the repository, create a new branch, commit your changes, and open a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.