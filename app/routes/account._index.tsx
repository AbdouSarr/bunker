import {redirect} from '@netlify/remix-runtime';

export async function loader() {
  // Redirect to homepage instead of orders page
  // Customers can access their account via the header "ACCOUNT" link
  return redirect('/');
}
