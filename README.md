# Linkly — URL Shortener
LIVE DEMO - https://linkly-url-shortener-gamma.vercel.app/
<img width="1917" height="922" alt="image" src="https://github.com/user-attachments/assets/b59a332b-9315-4a73-8ab7-ef0b85d3f159" />

Linkly is a URL-shortening application that converts long URLs into compact shareable links and QR codes.

Features

Create short links from long URLs.

Open short links to redirect to the original destination.

Generate and download QR codes for short links.

Share short links and QR codes with other devices.

Frontend/backend configuration for local development and deployment.

Features can vary depending on the code included in your project version.

How QR Codes Work Across Devices

A QR code stores a URL. When another device scans it, that device must be able to open the encoded URL over the internet.

Do not use localhost or 127.0.0.1 in QR codes intended for other devices. Those addresses point to the device doing the scanning, not to your computer or deployed server.

For example, this is only suitable for local testing:

http://localhost:5000/abc123

A shareable QR code should contain your deployed public short-link URL, for example:

https://your-frontend-domain.example/abc123

Use your actual deployed domain; the example above is a placeholder.

Requirements

Install the versions of Node.js and npm supported by your project. Check the package.json files for the exact scripts and dependencies.

Run Locally

The project may have separate frontend and backend directories. Open a terminal in each directory and install dependencies:

npm install

Then inspect each directory's package.json and run the script provided by the project, commonly:

npm run dev

For a production-style local server, the available script may instead be:

npm start

Run only scripts that exist in that directory's package.json.

Local testing from another device on the same Wi-Fi

Find your computer's local IPv4 address.

Configure the server to listen on an accessible network interface, not only 127.0.0.1.

Allow the relevant port through your computer's firewall if appropriate.

Use the computer's LAN IP address in the URL, such as http://192.168.1.20:5000.

Make sure both devices are connected to the same network.

A LAN address usually works only on the same local network. For QR codes that should work anywhere, deploy the app and use a public HTTPS URL.

Deployment Configuration

Backend

In your hosting provider's environment-variable settings, set the base/public URL variable to the public URL that your short links should use.

If your backend supports BASE_URL, configure it to the appropriate deployed URL. Do not leave it set to http://localhost:5000 in production.

Example (replace with your real URL):

BASE_URL=https://your-public-short-link-domain.example

Important: Some projects expect BASE_URL to be the frontend domain, while others expect the backend domain. Check the short-link redirect route and QR-generation code in your version to confirm which host is expected. The URL encoded in the QR code must resolve to a public route that can redirect to the original URL.

Frontend

If your frontend uses Vite and reads VITE_API_URL, configure it to the deployed backend API URL, including /api only if your code expects that prefix.

Example:

VITE_API_URL=https://your-backend-domain.example/api

Replace the example with your real backend URL and match the route prefix used by your server.

After changing environment variables

Save the variables in your hosting dashboard.

Redeploy/restart the backend.

Redeploy the frontend if its variables changed.

Create a new short link and download a new QR code.

Test the new QR code on a phone with Wi-Fi turned off and mobile data enabled.

Previously downloaded QR images keep the URL encoded when they were created. They do not update automatically.

QR Code Troubleshooting

If a QR code works on your computer but not on another device, check the following:

QR encodes localhost: Generate a new QR code after correcting the public URL configuration.

Short link returns 404: Confirm that the short-link route exists and the generated short code is stored correctly.

API is unavailable: Open the deployed backend's health/root endpoint if the project provides one; check hosting logs.

CORS error: CORS usually affects browser API requests. It does not by itself prevent a camera from reading a QR code, though it can break the web app's API calls.

Mixed content or TLS issue: Use HTTPS for the deployed frontend and public links.

Link is expired/deleted: Check the short-link record and any expiration logic.

Redirect target is invalid: Confirm the original URL includes https:// or http://.

Testing only on localhost: A phone cannot access your computer's localhost; use a public deployment URL or a LAN IP for same-Wi-Fi testing.

Security Notes

Never commit .env files or real secrets to Git.

Keep .env.example limited to placeholder values.

Use HTTPS for production.

Validate destination URLs before redirecting.

Apply rate limiting and abuse protection to public URL-shortening endpoints where available.

Git

From the project root:

git status
git add README.md
git commit -m "Add project README"
git push

License

Add the license that applies to your project. Do not claim an open-source license unless you have selected one.
