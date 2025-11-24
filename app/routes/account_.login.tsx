import type {LoaderFunctionArgs} from '@netlify/remix-runtime';

export async function loader({request, context}: LoaderFunctionArgs) {
  try {
    // Hydrogen will automatically construct the redirect URI
    // Make sure your Shopify Customer Account API app has the correct redirect URI configured:
    // For production: https://yourdomain.com/account/authorize
    // For development: http://localhost:8888/account/authorize (or your dev URL)
    return await context.customerAccount.login();
  } catch (error) {
    console.error('Login error:', error);
    // Return a user-friendly error page
    throw new Response('Unable to connect to login service. Please check your Shopify Customer Account API configuration.', {
      status: 500,
    });
  }
}
