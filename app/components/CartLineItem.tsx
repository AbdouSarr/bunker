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
  const {id, merchandise, isOptimistic} = line;
  const {close} = useAside();

  // Check if we have enough data to render
  const hasData = merchandise?.product?.handle;
  const product = merchandise?.product;
  const title = merchandise?.title;
  const image = merchandise?.image;
  const selectedOptions = merchandise?.selectedOptions || [];
  const lineItemUrl = hasData ? useVariantUrl(product.handle, selectedOptions) : '#';

  const containerClass =
    layout === 'aside'
      ? 'border-b border-gray-100 py-4 font-mono text-sm'
      : 'border-b border-gray-100 py-6 font-mono';

  return (
    <div key={id} className={containerClass}>
      <div className="flex gap-4">
        {/* Image - show skeleton if loading - Full garment visible */}
        <div className="flex-shrink-0 self-stretch">
          {image && hasData && !isOptimistic ? (
            <div className={`bg-gray-50 border border-gray-200 overflow-hidden h-full ${
              layout === 'aside' ? 'w-[80px]' : 'w-[120px]'
            }`}>
              <Image
                alt={title || 'Product'}
                data={image}
                loading="lazy"
                className="w-full h-full object-cover"
                sizes="(min-width: 1024px) 120px, 80px"
              />
            </div>
          ) : (
            <div
              className={`bg-gray-200 border border-gray-200 animate-pulse h-full ${
                layout === 'aside' ? 'w-[80px]' : 'w-[120px]'
              }`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Product title - show skeleton if loading */}
          {product?.title && hasData && !isOptimistic ? (
            <Link
              prefetch="intent"
              to={lineItemUrl}
              onClick={() => {
                if (layout === 'aside') {
                  close();
                }
              }}
              className="text-black hover:text-gray-600 font-medium uppercase tracking-wide block mb-2"
            >
              {product.title}
            </Link>
          ) : (
            <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
          )}

          {/* Variant options - show skeleton if loading */}
          {selectedOptions && selectedOptions.length > 0 && hasData && !isOptimistic ? (
            <div className="space-y-1 mb-3">
              {selectedOptions.map((option) => (
                <div
                  key={option.name}
                  className="text-xs text-gray-500 uppercase tracking-wider"
                >
                  {option.name}: {option.value}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-3">
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          )}

          {/* Price - show skeleton if loading */}
          {line?.cost?.totalAmount && hasData && !isOptimistic ? (
            <div className="mb-2">
              <ProductPrice price={line.cost.totalAmount} />
            </div>
          ) : (
            <div className="mb-2">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          )}

          <div className="mt-auto space-y-2">
            <CartLineQuantity line={line} layout={layout} />
            <CartLineRemoveButton lineIds={[id]} disabled={!!isOptimistic} isLoading={isOptimistic} />
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
  if (!line || typeof line?.quantity === 'undefined' || !line.id) return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-gray-300">
        {quantity === 1 ? (
          <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic}>
            <button
              type="submit"
              aria-label="Remove item"
              disabled={!!isOptimistic}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 font-mono"
            >
              -
            </button>
          </CartLineRemoveButton>
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
          {isOptimistic ? (
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            quantity.toString().padStart(2, '0')
          )}
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
  isLoading,
  children,
}: {
  lineIds: string[];
  disabled: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      {children || (
        <>
          {isLoading ? (
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          ) : (
            <button
              disabled={disabled}
              type="submit"
              className="text-xs uppercase tracking-wider text-gray-500 hover:text-black disabled:opacity-30 font-mono"
            >
              REMOVE
            </button>
          )}
        </>
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