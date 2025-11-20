import {json, type ActionFunctionArgs, type LoaderFunctionArgs, redirect} from '@remix-run/react';
import {Form, useActionData, useNavigation} from '@remix-run/react';
import {useState} from 'react';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';
import {useRouteLoaderData} from '@remix-run/react';

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
    // Create customer using Storefront API
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
      // If email already exists, treat as success (they can login)
      if (error.message?.toLowerCase().includes('taken') || 
          error.message?.toLowerCase().includes('exists') ||
          error.message?.toLowerCase().includes('already')) {
        return json({
          error: null,
          success: true,
          message: 'Welcome back! Check your email for your 15% off discount code.',
        });
      }
      return json(
        {error: error.message, success: false},
        {status: 400},
      );
    }

    // Success - show success message
    return json({
      error: null,
      success: true,
      message: 'Welcome! Check your email for your 15% off discount code.',
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
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const [showSuccess, setShowSuccess] = useState(false);

  const isSubmitting = navigation.state === 'submitting';

  if (actionData?.success && !showSuccess) {
    setShowSuccess(true);
  }

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

      {/* Signup Form */}
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <div className="w-full max-w-md">
          {/* Success Message */}
          {showSuccess && actionData?.success && (
            <div className="mb-8 p-6 bg-black text-white text-center">
              <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">
                Welcome to BUNKER
              </h2>
              <p className="text-sm uppercase tracking-wider">
                {actionData.message || 'Check your email for your 15% off discount code!'}
              </p>
            </div>
          )}

          {/* Signup Form */}
          {!showSuccess && (
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4 text-black">
                  Sign Up
                </h1>
                <p className="text-sm uppercase tracking-wider text-gray-600">
                  Get 15% off your first purchase
                </p>
              </div>

              <Form method="post" className="space-y-6">
                {actionData?.error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm uppercase tracking-wider">
                    {actionData.error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs uppercase tracking-wider text-black mb-2"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="FIRST NAME"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs uppercase tracking-wider text-black mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 border border-black bg-white text-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="LAST NAME"
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white text-sm uppercase tracking-wider font-normal hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'SIGNING UP...' : 'SIGN UP'}
                </button>

                <p className="text-xs text-center text-gray-500 uppercase tracking-wider mt-4">
                  By signing up, you agree to receive marketing emails
                </p>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

