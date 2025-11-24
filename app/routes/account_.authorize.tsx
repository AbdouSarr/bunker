import {redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';

export async function loader({context, request}: LoaderFunctionArgs) {
  // Hydrogen handles the OAuth flow
  await context.customerAccount.authorize();
  
  // After successful authorization, always redirect to homepage
  // Get return URL from query params if provided, otherwise default to homepage
  const url = new URL(request.url);
  const returnUrl = url.searchParams.get('return_to');
  
  // If return_to is provided and safe, use it; otherwise go to homepage
  const redirectTo = (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) 
    ? returnUrl 
    : '/';
  
  // Always redirect to homepage (or return_to if provided) after successful login
  return redirect(redirectTo);
}
