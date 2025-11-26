import {json, type ActionFunctionArgs, type LoaderFunctionArgs, redirect} from '@netlify/remix-runtime';
import {Form, useActionData, useNavigation, useRouteLoaderData} from '@remix-run/react';
import {useState} from 'react';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';
import {ADMIN_EMAIL} from '~/lib/email';

export async function loader({context}: LoaderFunctionArgs) {
  // Check if user is already logged in
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (isLoggedIn) {
    return redirect('/account');
  }
  return json({});
}

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  // Validate input
  if (!email || !firstName || !lastName) {
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

  try {
    // Generate a secure random password - customer will reset it via email
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
    
    // Generate unique discount code for this customer
    // Format: WELCOME15-{first 8 chars of email hash}
    const emailHash = Buffer.from(email.toLowerCase()).toString('base64').slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const discountCode = `WELCOME15-${emailHash}`;
    
    // Create customer using Storefront API with password and marketing consent
    const {data, errors} = await context.storefront.mutate(
      `#graphql
        mutation customerCreate($input: CustomerCreateInput!) {
          customerCreate(input: $input) {
            customer {
              id
              email
              firstName
              lastName
            }
            customerUserErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            email,
            firstName,
            lastName,
            password: randomPassword,
            acceptsMarketing: true,
          },
        },
      },
    );

    if (errors?.length) {
      return json(
        {error: errors[0].message, success: false},
        {status: 400},
      );
    }

    if (data?.customerCreate?.customerUserErrors?.length) {
      const error = data.customerCreate.customerUserErrors[0];
      // If email already exists, still generate a discount code for them
      if (error.message?.toLowerCase().includes('taken') || 
          error.message?.toLowerCase().includes('exists') ||
          error.message?.toLowerCase().includes('already')) {
        return json({
          error: null,
          success: true,
          discountCode,
          message: 'Thank you for signing up! Your email sign-up discount code is below.',
        });
      }
      return json(
        {error: error.message, success: false},
        {status: 400},
      );
    }

    // Success - log new signup for admin notification
    console.log('New customer signup:', {email, firstName, lastName, discountCode, adminEmail: ADMIN_EMAIL});
    
    // TODO: Send notification email to ${ADMIN_EMAIL} when new customer signs up
    
    // Success - return discount code
    return json({
      error: null,
      success: true,
      discountCode,
      message: 'Thank you for signing up with your email! Your 15% off discount code is below.',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return json(
      {error: 'Something went wrong. Please try again.', success: false},
      {status: 500},
    );
  }
}

export default function Signup() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSubmitting = navigation.state === 'submitting';

  if (actionData?.success && !showSuccess) {
    setShowSuccess(true);
  }

  const copyDiscountCode = () => {
    if (actionData?.discountCode) {
      navigator.clipboard.writeText(actionData.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

      {/* Signup Form - Centered to align with BUNKER logo */}
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <div className="w-full max-w-md mx-auto">
          {/* Success Message */}
          {showSuccess && actionData?.success && (
            <div className="mb-8 space-y-6">
              <div className="p-6 bg-black text-white text-center">
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">
                  Welcome to BUNKER
                </h2>
                <p className="text-sm uppercase tracking-wider mb-4">
                  {actionData.message || 'Your exclusive discount code is below!'}
                </p>
              </div>
              
              {/* Discount Code Display */}
              {actionData.discountCode && (
                <div className="p-6 border-2 border-black text-center">
                  <p className="text-xs uppercase tracking-wider text-gray-600 mb-2">
                    Thank you for signing up!
                  </p>
                  <p className="text-sm uppercase tracking-wider text-black font-semibold mb-4">
                    Your Email Sign-Up Discount Code
                  </p>
                  <div className="mb-4 relative">
                    <code className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-black bg-gray-50 px-6 py-4 inline-block border-2 border-dashed border-gray-300 select-all">
                      {actionData.discountCode}
                    </code>
                    <button
                      onClick={copyDiscountCode}
                      className="ml-3 px-4 py-2 text-xs uppercase tracking-wider border border-black hover:bg-black hover:text-white transition-colors"
                    >
                      {copied ? 'COPIED!' : 'COPY'}
                    </button>
                  </div>
                  <p className="text-sm uppercase tracking-wider text-black mb-2 font-semibold">
                    15% OFF YOUR FIRST PURCHASE
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                    Use this code at checkout
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-4">
                    One-time use only • Valid for email sign-up customers
                  </p>
                  <div className="mt-6">
                    <a
                      href="/#products"
                      className="inline-block px-8 py-3 bg-white text-black border-2 border-black text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors"
                    >
                      Start Shopping
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signup Form */}
          {!showSuccess && (
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4 text-black">
                  Sign Up
                </h1>
                <p className="text-sm uppercase tracking-wider text-black font-semibold mb-2">
                  15% OFF YOUR FIRST PURCHASE
                </p>
                <p className="text-xs uppercase tracking-wider text-gray-600">
                  Sign up with your email to receive your exclusive discount code
                </p>
              </div>

              <Form method="post" className="space-y-6">
                {actionData?.error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm uppercase tracking-wider text-center">
                    {actionData.error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs uppercase tracking-wider text-black mb-2 text-left"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black text-left"
                    placeholder="FIRST NAME"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs uppercase tracking-wider text-black mb-2 text-left"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black text-left"
                    placeholder="LAST NAME"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs uppercase tracking-wider text-black mb-2 text-left"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black text-left"
                    placeholder="EMAIL"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white text-sm uppercase tracking-wider font-normal hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'SIGNING UP...' : 'SIGN UP'}
                </button>

                <p className="text-xs text-center text-gray-500 uppercase tracking-wider mt-4">
                  By signing up with your email, you'll receive your 15% off discount code and agree to receive marketing emails
                </p>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

