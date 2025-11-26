import {json, type ActionFunctionArgs, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {type MetaFunction, Form, useActionData, useRouteLoaderData} from '@remix-run/react';
import {useState} from 'react';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';
import {ADMIN_EMAIL} from '~/lib/email';

export const meta: MetaFunction = () => {
  return [{title: 'Bunker Studio | Limited Edition'}];
};

export async function loader({}: LoaderFunctionArgs) {
  return json({});
}

export async function action({request}: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  if (!email) {
    return json({error: 'Email is required'}, {status: 400});
  }

  // TODO: Implement email submission logic (e.g., send to email service, save to database, etc.)
  // Send PR inquiry email to: ${ADMIN_EMAIL}
  // Email should include: email address
  console.log('PR Inquiry submission:', {email, adminEmail: ADMIN_EMAIL});
  
  // For now, just return success
  return json({success: true, message: 'Thank you for your inquiry. We will be in touch soon.'});
}

export default function LimitedEdition() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const actionData = useActionData<typeof action>();
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {rootData?.header && (
        <BalenciagaHeader
          header={rootData.header}
          cart={rootData.cart}
          isLoggedIn={rootData.isLoggedIn}
          publicStoreDomain={rootData.publicStoreDomain}
        />
      )}

      {/* Limited Edition Page Content */}
      <div className="pt-20">
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 md:px-8 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h1 className="text-4xl md:text-6xl font-normal uppercase tracking-wider text-black">
              Limited Edition
            </h1>
            
            <div className="text-base md:text-lg uppercase tracking-wider text-black leading-relaxed space-y-6">
              <p>
                LIMITED EDITION BUNKER PIECES ARE ONE-OF-ONE DESIGNS CREATED FOR OUR 
                SPECIALIZED BUNKER CLIENTELE OR HAND-SELECTED INDIVIDUALS OF THE BRAND'S 
                CHOOSING WHO ALIGN WITH OUR ETHOS.
              </p>
              <p>
                LIMITED PRODUCTION ENSURES EXCLUSIVITY AND UNIQUENESS.
              </p>
            </div>

            {/* PR INQUIRIES Email Form */}
            <div className="mt-16 pt-8 border-t border-black">
              <Form method="post" className="max-w-md mx-auto space-y-4">
                <label htmlFor="email" className="block text-xs uppercase tracking-wider text-black mb-2">
                  PR INQUIRIES
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-black text-white text-xs uppercase tracking-wider font-normal hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    SUBMIT
                  </button>
                </div>
                {actionData?.error && (
                  <p className="text-xs uppercase tracking-wider text-red-600 mt-2">
                    {actionData.error}
                  </p>
                )}
                {actionData?.success && (
                  <p className="text-xs uppercase tracking-wider text-black mt-2">
                    {actionData.message}
                  </p>
                )}
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

