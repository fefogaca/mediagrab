# MediaGrab - The Ultimate Media Downloading API

MediaGrab is a powerful, reliable, and easy-to-integrate API for instantly generating download links for any video or audio from various sources.

## Features

- **Easy to Use:** Simply paste a link to get download links.
- **Admin Dashboard:** Manage users and API keys.
- **Secure:** Uses JWT for authentication and bcrypt for password hashing.
- **Free Tier:** A free developer tier for personal projects and exploring the API.

## Getting Started

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mediagrab
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variable:

```
JWT_SECRET=your_super_secret_jwt_key
```

Replace `your_super_secret_jwt_key` with a strong, random string. You can generate one using a command like `openssl rand -base64 32`.

### Database Setup

This project uses SQLite as its database. To set up the database schema and create the necessary tables, run the following command:

```bash
node scripts/setup.js
```

### Creating an Admin User

To create an admin user, run the following command and follow the prompts:

```bash
node scripts/create-admin.js
```

### Running the Development Server

Once you have installed the dependencies, set up the environment variables, and created an admin user, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Usage

### Free API Key Generation

To get a free API key for the Developer plan, go to the **Pricing** page and click the "Get Started" button. The API key will be displayed on the page.

### Public Download Endpoint

- **Endpoint:** `/api/public-download`
- **Method:** `GET`
- **Query Parameter:** `url` (the URL of the media to download)

**Example:**

```
/api/public-download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

This will return a JSON object with the video title and a list of available formats with their download links.
