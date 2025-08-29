# Urls-Random
A small web page that supports the convergence of multiple URLs.

 [Read the Chinese version](README_CN.md)

### Step 1: Create a Cloudflare Account

If you don't have an account yet, please visit the [Cloudflare website](https://dash.cloudflare.com/sign-up) to register for a free account.

### Step 2: Create a Worker Service

1.  After logging into the Cloudflare dashboard, find and click on **Workers & Pages** in the left-hand menu.
2.  Click **Create application**, then select **Create Worker**.
3.  Give your Worker a unique name (e.g., `my-link-fuser-api`) and then click **Deploy**.

### Step 3: Configure the Worker Code

1.  After successful deployment, click **Edit code** to enter the online code editor.
2.  The editor will contain some default "Hello World" code. Please **delete all of it**.
3.  Copy the **entire content** of the `worker.js` file you have and paste it into the online editor.
4.  Click the **Deploy** button in the top right corner to save and publish your code.

### Step 4: Create and Bind a KV Namespace

KV is Cloudflare's key-value database, which we will use to store your link pool data.

1.  **Create the KV Namespace:**
    *   In the Cloudflare dashboard's left menu, find and click **KV**.
    *   Click **Create a namespace**.
    *   Give your database a name (e.g., `link-fuser-data`) and click **Add**.
2.  **Bind the Namespace to the Worker:**
    *   Navigate back to your Worker's management page (**Workers & Pages** -> your worker).
    *   Click on the **Settings** tab, then select the **Variables** sub-menu.
    *   Scroll down to **KV Namespace Bindings** and click **Add binding**.
    *   In the **Variable name** field, you **must** enter `LINK_FUSER_KV`. This needs to match `env.LINK_FUSER_KV` in the `worker.js` code.
    *   In the **KV namespace** field, select the KV namespace you just created (e.g., `link-fuser-data`).
    *   Click **Save and deploy** at the bottom of the page to apply the changes.

### Step 5: Get Worker URL and Configure the Frontend

1.  Return to your Worker's main overview page. You will see your Worker's URL in the top right, typically in the format `https://<your-worker-name>.<your-subdomain>.workers.dev`. Please **copy** this URL.
2.  Go back to your `index.html` file.
3.  In this file, you need to find **one** placeholders that say `'YOUR_WORKER_URL_HERE'`.
4.  **Replace both** of these placeholders with the URL you just copied.

**Example:** If your Worker URL is `https://my-link-fuser-api.user.workers.dev`, the configuration in the code should be changed to:

```text-plain
const WORKER_URL = '[https://my-link-fuser-api.user.workers.dev](https://my-link-fuser-api.user.workers.dev)';

```

### Step 6: Deploy the Frontend Page

Your frontend file is now configured. You can deploy the `link-fuser-pro-backend.html` file anywhere:

*   **Recommended:** Use Cloudflare Pages (it's convenient to manage it in the same place as your Worker).
*   **Other options:** GitHub Pages, Vercel, or any other static website hosting service you prefer.

Once deployed, you can visit your frontend page's URL and start using the application! All your data will be securely stored in your Cloudflare KV namespace.
