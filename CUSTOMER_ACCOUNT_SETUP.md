# Customer Account API Setup

## Fixing "redirect_uri mismatch" Error

If you're seeing a "redirect_uri mismatch" error when trying to log in, this means the redirect URI configured in your Shopify Customer Account API app doesn't match what the application is sending.

### Steps to Fix:

1. **Go to Shopify Admin**
   - Navigate to: Settings → Customer accounts → Customer Account API

2. **Check Your Redirect URIs**
   - In the Customer Account API app settings, you should have redirect URIs configured
   - The redirect URI should be: `https://yourdomain.com/account/authorize`
   - For local development: `http://localhost:8888/account/authorize` (or your dev server URL)

3. **Add the Correct Redirect URI**
   - Make sure the redirect URI exactly matches your application's URL
   - Include the protocol (http:// or https://)
   - Include the full path: `/account/authorize`
   - No trailing slashes

4. **For Netlify Deployments**
   - Production: `https://your-site.netlify.app/account/authorize`
   - Preview: `https://deploy-preview-XXX--your-site.netlify.app/account/authorize`
   - You may need to add multiple redirect URIs for different environments

5. **Save and Test**
   - Save the changes in Shopify
   - Try logging in again from your application

### Common Issues:

- **Missing protocol**: Make sure to include `https://` or `http://`
- **Wrong path**: Must be exactly `/account/authorize`
- **Trailing slash**: Don't include a trailing slash
- **Domain mismatch**: The domain must match your actual site URL

### Development vs Production:

Make sure you have separate redirect URIs configured for:
- Local development (e.g., `http://localhost:8888/account/authorize`)
- Staging/preview URLs
- Production URL

All of these need to be added to your Shopify Customer Account API app settings.

