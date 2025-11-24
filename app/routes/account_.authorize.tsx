import {redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';

export async function loader({context, request}: LoaderFunctionArgs) {
  // Hydrogen handles the OAuth flow
  const response = await context.customerAccount.authorize();
  
  // After successful authorization, redirect to homepage
  // The authorize() function may return a redirect response or a success response
  // If it's already a redirect (3xx status), we need to check if we should override it
  if (response instanceof Response) {
    // If it's a redirect response, we'll override it to go to homepage
    if (response.status >= 300 && response.status < 400) {
      // Get the return URL from query params or default to homepage
      const url = new URL(request.url);
      const returnUrl = url.searchParams.get('return_to') || '/';
      
      // Ensure return URL is safe (same origin, no protocol-relative URLs)
      if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
        return redirect(returnUrl);
      }
      // Default to homepage if return URL is invalid
      return redirect('/');
    }
    
    // If it's a successful response (200), redirect to homepage
    if (response.status === 200 || response.status === 201) {
      return redirect('/');
    }
  }
  
  // Default: redirect to homepage after successful login
  return redirect('/');
}
