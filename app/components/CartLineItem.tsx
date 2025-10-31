import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * A single line item in the cart with minimal monospaced design
 */
export function CartLineItem({
  layout,
  line,
}: {
  layout: CartLayout;
  line: CartLine;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();

  const containerClass =
    layout === 'aside'
      ? 'border-b border-gray-100 py-4 font-mono text-sm'
      : 'border-b border-gray-100 py-6 font-mono';

  return (
    <div key={id} className={containerClass}>
      <div className="flex gap-4">
        {image && (
          <div className="flex-shrink-0">
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={layout === 'aside' ? 60 : 80}
              loading="lazy"
              width={layout === 'aside' ? 60 : 80}
              className="bg-gray-50 border border-gray-200"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <Link
              prefetch="intent"
              to={lineItemUrl}
              onClick={() => {
                if (layout === 'aside') {
                  close();
                }
              }}
              className="text-black hover:text-gray-600 font-medium uppercase tracking-wide block"
            >
              {product.title}
            </Link>

            {selectedOptions.length > 0 && (
              <div className="mt-2 space-y-1">
                {selectedOptions.map((option) => (
                  <div
                    key={option.name}
                    className="text-xs text-gray-500 uppercase tracking-wider"
                  >
                    {option.name}: {option.value}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CartLineQuantity line={line} layout={layout} />
              <div className="text-right">
                <ProductPrice price={line?.cost?.totalAmount} />
              </div>
            </div>
            <CartLineRemoveButton lineIds={[id]} disabled={!!line.isOptimistic} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal quantity controls with monospaced styling
 */
function CartLineQuantity({
  line,
  layout,
}: {
  line: CartLine;
  layout: CartLayout;
}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-gray-300">
        {quantity === 1 ? (
          <button
            aria-label="Remove item"
            disabled={!!isOptimistic}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 font-mono"
            onClick={() => {
              // This button is used when quantity is 1, but we'll handle the remove action in the parent component
            }}
          >
            -
          </button>
        ) : (
          <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
            <button
              aria-label="Decrease quantity"
              disabled={!!isOptimistic}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 font-mono"
            >
              -
            </button>
          </CartLineUpdateButton>
        )}
        <span className="w-12 h-8 flex items-center justify-center text-center border-x border-gray-300 bg-white font-mono text-sm">
          {quantity.toString().padStart(2, '0')}
        </span>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            disabled={!!isOptimistic}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 font-mono"
          >
            +
          </button>
        </CartLineUpdateButton>
      </div>
    </div>
  );
}

/**
 * Minimal remove button
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
  children,
}: {
  lineIds: string[];
  disabled: boolean;
  children?: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      {children || (
        <button
          disabled={disabled}
          type="submit"
          className="text-xs uppercase tracking-wider text-gray-500 hover:text-black disabled:opacity-30 font-mono"
        >
          REMOVE
        </button>
      )}
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}