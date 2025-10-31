import {json, redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {Form, useActionData, type MetaFunction} from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [{title: 'Password Required'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const requiredPassword = process.env.PASSWORD;
  
  // If no password is required, redirect to home
  if (!requiredPassword) {
    throw redirect('/');
  }
  
  // If already authenticated, redirect to home
  const isAuthenticated = await context.session.get('authenticated');
  if (isAuthenticated) {
    throw redirect('/');
  }
  
  return json({});
}

export async function action({context, request}: LoaderFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get('password');
  const requiredPassword = process.env.PASSWORD;

  if (password === requiredPassword) {
    const session = context.session;
    session.set('authenticated', true);
    return redirect('/', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  }

  return json({error: 'Invalid password'}, {status: 401});
}

export default function PasswordPage() {
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="w-screen h-screen bg-black text-white flex items-center justify-center" style={{fontFamily: 'monospace'}}>
      <div className="text-center">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm mb-2">
              password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="bg-transparent border border-white px-3 py-2 text-white focus:outline-none focus:border-gray-400"
              style={{fontFamily: 'monospace'}}
              autoFocus
            />
          </div>
          {actionData?.error && (
            <div className="text-red-400 text-sm">{actionData.error}</div>
          )}
          <button
            type="submit"
            className="border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
            style={{fontFamily: 'monospace'}}
          >
            enter
          </button>
        </Form>
      </div>
    </div>
  );
}