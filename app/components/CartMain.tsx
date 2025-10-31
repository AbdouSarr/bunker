import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const cartHasItems = (cart?.totalQuantity ?? 0) > 0;

  return (
    <div className="w-full">
      <CartEmpty hidden={linesCount} layout={layout} />
      {linesCount && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-mono uppercase text-gray-900 mb-4">
                Cart Items ({cart?.totalQuantity} {cart?.totalQuantity === 1 ? 'item' : 'items'})
              </h2>
              <div className="space-y-4" aria-labelledby="cart-lines">
                {(cart?.lines?.nodes ?? []).map((line) => (
                  <CartLineItem key={line.id} line={line} layout={layout} />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            {cartHasItems && <CartSummary cart={cart} layout={layout} />}
          </div>
        </div>
      )}
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div hidden={hidden} className="h-full text-left py-16">
      <div className="max-w-md mx-auto">
        <div className="flex mb-6">
          {/* <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.6 8H19M7 13l-4-8m0 0l1.6 8M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
          </svg> */}
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 font-mono uppercase">YOUR CART IS EMPTY</h2>
        <p className="text-gray-600 font-mono uppercase text-sm mb-8">
          No items have been added yet. Please begin by selecting products to add to your cart.
        </p>
        <Link 
          to="/" 
          onClick={close} 
          prefetch="viewport"
          className="flex mt-6 items-center px-6 py-3 border border-transparent text-base font-medium shadow-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
        >
          <span className="font-mono uppercase text-sm text-white">Continue shopping →</span>
        </Link>
      </div>
    </div>
  );
}
