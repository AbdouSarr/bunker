import {json, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {type MetaFunction, useRouteLoaderData} from '@remix-run/react';
import {Form, useActionData, useNavigation} from '@remix-run/react';
import type {ActionFunctionArgs} from '@netlify/remix-runtime';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';
import {ADMIN_EMAIL} from '~/lib/email';

export const meta: MetaFunction = () => {
  return [{title: 'Bunker Studio | Contact'}];
};

export async function loader({}: LoaderFunctionArgs) {
  return json({});
}

export async function action({request}: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  // Validate input
  if (!name || !email || !subject || !message) {
    return json(
      {error: 'All fields are required', success: false},
      {status: 400},
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json(
      {error: 'Please enter a valid email address', success: false},
      {status: 400},
    );
  }

  // TODO: Implement email sending logic (e.g., send to email service, save to database, etc.)
  // Send email to: ${ADMIN_EMAIL}
  // Email should include: name, email, subject, message
  console.log('Contact form submission:', {name, email, subject, message, adminEmail: ADMIN_EMAIL});
  
  // For now, just return success
  return json({
    success: true,
    message: 'Thank you for your message. We will get back to you soon.',
  });
}

export default function Contact() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

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

      {/* Contact Page Content */}
      <div className="pt-20">
        <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Page Title */}
          <h1 className="text-4xl md:text-5xl font-normal uppercase tracking-wider text-black mb-12 text-center">
            Contact
          </h1>

          {/* Contact Information */}
          <div className="mb-12 text-center space-y-4">
            <div className="text-sm md:text-base uppercase tracking-wider text-black">
              <p className="mb-2">
                <strong>EMAIL:</strong> INFO@BUNKERSTUDIO.COM
              </p>
              <p>
                <strong>CUSTOMER SERVICE:</strong> AVAILABLE MON-FRI 9AM - 9PM ET
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            {actionData?.success ? (
              <div className="p-6 bg-black text-white text-center">
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">
                  Thank You
                </h2>
                <p className="text-sm uppercase tracking-wider">
                  {actionData.message}
                </p>
              </div>
            ) : (
              <Form method="post" className="space-y-6">
                {actionData?.error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm uppercase tracking-wider">
                    {actionData.error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs uppercase tracking-wider text-black mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="NAME"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs uppercase tracking-wider text-black mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="EMAIL"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs uppercase tracking-wider text-black mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="SUBJECT"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs uppercase tracking-wider text-black mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    placeholder="MESSAGE"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white text-sm uppercase tracking-wider font-normal hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

