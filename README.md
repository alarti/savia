# AI Chat Interface

This is a simple web-based chat interface that uses the Pollinations AI for generating responses. It includes Google authentication via Supabase and is designed to be easily deployed on GitHub Pages.

## Features

-   Clean, modern chat UI
-   Google authentication using Supabase
-   AI-powered responses from Pollinations AI
-   Ready for deployment on GitHub Pages

## Setup

To get this project running, you need to configure it with your own Supabase project.

### 1. Create a Supabase Project

If you don't have one already, create a new project on [Supabase](https://supabase.com/).

### 2. Get Supabase Credentials

-   In your Supabase project dashboard, go to **Project Settings** > **API**.
-   You will find your **Project URL** and your **Project API keys** (use the `anon` `public` key).

### 3. Configure Google Authentication

-   In your Supabase project dashboard, go to **Authentication** > **Providers**.
-   Enable the **Google** provider. You will need to provide a **Client ID** and **Client Secret** from the Google Cloud Console. Follow the Supabase documentation for a detailed guide on how to do this.
-   **Important**: When setting up your Google OAuth credentials, you must add your GitHub Pages URL (and your local development URL) to the list of authorized redirect URIs.
    -   Example GitHub Pages URL: `https://<your-github-username>.github.io/<your-repo-name>/`
    -   Example local development URL: `http://127.0.0.1:5500/` (or whatever port you are using)

### 4. Set Up the Database

This project uses a Supabase table to store chat history.

1.  Find the `supabase_schema.sql` file in this repository.
2.  Open the file and copy its entire contents.
3.  In your Supabase project dashboard, navigate to the **SQL Editor**.
4.  Click **"New query"** and paste the SQL script you copied.
5.  Click **"Run"**. This will create the `conversations` and `messages` tables.
6.  **Important**: You must enable Row Level Security (RLS) for the chat history to work correctly. Go to **Authentication** > **Policies**, find both the `conversations` and `messages` tables, and click **"Enable RLS"** for each one.

### 5. Add Credentials to `script.js`

Open the `script.js` file and replace the placeholder values for `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your own credentials:

```javascript
// script.js

// Replace these with your own Supabase project URL and anon key.
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <-- PASTE YOUR URL HERE
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- PASTE YOUR ANON KEY HERE
```

## Deployment

This project is designed to be deployed as a static site on GitHub Pages.

1.  **Create a new GitHub repository** and upload the `index.html`, `style.css`, and `script.js` files.
2.  **Go to your repository's settings** and navigate to the **Pages** section.
3.  **Choose the branch** you want to deploy from (usually `main` or `master`).
4.  **Click "Save"**. Your site should be live at `https://<your-github-username>.github.io/<your-repo-name>/` in a few minutes.

That's it! Your AI chat interface should now be up and running.
