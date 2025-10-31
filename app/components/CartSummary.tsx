import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  if (layout === 'aside') {
    return (
      <div className="border-t border-gray-200 pt-8 font-mono">
        <div className="space-y-4 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 uppercase tracking-wider">SUBTOTAL ({cart.totalQuantity || 0})</span>
            <span className="font-medium">
              {cart.cost?.subtotalAmount?.amount ? (
                <Money data={cart.cost?.subtotalAmount} />
              ) : (
                '---'
              )}
            </span>
          </div>
          
          {cart.cost?.totalAmount?.amount && cart.cost?.subtotalAmount?.amount !== cart.cost?.totalAmount?.amount && (
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="uppercase tracking-wider font-medium">TOTAL (USD)</span>
              <span className="font-medium">
                <Money data={cart.cost?.totalAmount} />
              </span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <CartDiscounts discountCodes={cart.discountCodes} layout={layout} />
        </div>
        
        <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6 font-mono">
      <h3 className="text-sm uppercase tracking-wider font-medium mb-6 border-b border-gray-200 pb-3">ORDER SUMMARY</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <dt className="text-gray-600 uppercase tracking-wider">SUBTOTAL</dt>
          <dd className="font-medium">
            {cart.cost?.subtotalAmount?.amount ? (
              <Money data={cart.cost?.subtotalAmount} />
            ) : (
              '---'
            )}
          </dd>
        </div>
        
        <CartDiscounts discountCodes={cart.discountCodes} layout={layout} />
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between font-medium">
            <dt className="uppercase tracking-wider">TOTAL (USD)</dt>
            <dd>
              {cart.cost?.totalAmount?.amount ? (
                <Money data={cart.cost?.totalAmount} />
              ) : (
                '---'
              )}
            </dd>
          </div>
        </div>
      </div>
      
      <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl, layout}: {checkoutUrl?: string; layout?: CartLayout}) {
  if (!checkoutUrl) return null;

  const buttonClass = layout === 'aside'
    ? "w-full bg-black py-4 px-6 font-mono text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors block text-center"
    : "w-full bg-black py-4 px-6 font-mono text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors block text-center";

  return (
    <a 
      href={checkoutUrl} 
      target="_self"
      className={buttonClass}
    >
      <span className="text-white">CHECKOUT</span>
    </a>
  );
}

function CartDiscounts({
  discountCodes,
  layout,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
  layout?: CartLayout;
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  if (layout === 'aside') {
    return (
      <div className="space-y-4">
        {codes.length > 0 && (
          <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-3">
            <span className="text-gray-600 uppercase tracking-wider">DISCOUNT</span>
            <UpdateDiscountForm>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 text-xs font-mono">
                  {codes?.join(', ')}
                </code>
                <button className="text-xs uppercase tracking-wider text-gray-500 hover:text-black">
                  REMOVE
                </button>
              </div>
            </UpdateDiscountForm>
          </div>
        )}

        <UpdateDiscountForm discountCodes={codes}>
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              name="discountCode" 
              placeholder="DISCOUNT CODE" 
              className="flex-1 px-3 py-3 border border-gray-300 text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-black"
            />
            <button 
              type="submit"
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              APPLY
            </button>
          </div>
        </UpdateDiscountForm>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {codes.length > 0 && (
        <div className="flex justify-between items-center text-sm">
          <dt className="text-gray-600 uppercase tracking-wider">DISCOUNT</dt>
          <UpdateDiscountForm>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-2 py-1 text-xs font-mono">
                {codes?.join(', ')}
              </code>
              <button className="text-xs uppercase tracking-wider text-gray-500 hover:text-black transition-colors">
                REMOVE
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            name="discountCode" 
            placeholder="DISCOUNT CODE" 
            className="h-full px-3 py- border border-gray-300 text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-black"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-mono uppercase tracking-wider transition-colors"
          >
            APPLY
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}