import type {LoaderFunctionArgs} from '@netlify/remix-runtime';

export async function loader({context}: LoaderFunctionArgs) {
  // Hydrogen handles the OAuth flow and redirects automatically
  return context.customerAccount.authorize();
}
