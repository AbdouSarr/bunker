import {redirect} from '@netlify/remix-runtime';

export function checkPasswordProtection(request: Request, session: any) {
  const requiredPassword = process.env.PASSWORD;
  if (!requiredPassword) {
    return null; // No password protection enabled
  }

  const url = new URL(request.url);
  // Allow access to the password route itself
  if (url.pathname === '/password') {
    return null;
  }

  const isAuthenticated = session.get('authenticated');
  if (!isAuthenticated) {
    throw redirect('/password');
  }

  return null;
}