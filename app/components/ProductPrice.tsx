import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  return (
    <div className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black">
      {compareAtPrice ? (
        <div className="flex items-center gap-3">
          {price ? (
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: price.currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(parseFloat(price.amount))}
            </span>
          ) : null}
          <s className="text-gray-500 text-xl">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: compareAtPrice.currencyCode,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(parseFloat(compareAtPrice.amount))}
          </s>
        </div>
      ) : price ? (
        <span>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: price.currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(parseFloat(price.amount))}
        </span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
