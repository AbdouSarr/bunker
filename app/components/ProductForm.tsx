import {Link} from '@remix-run/react';
import {type VariantOption, VariantSelector} from '@shopify/hydrogen';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

export function ProductForm({
  product,
  selectedVariant,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Array<ProductVariantFragment>;
}) {
  const {open} = useAside();
  return (
    <div className="space-y-6">
      <VariantSelector
        handle={product.handle}
        options={product.options.filter((option) => option.values.length > 1)}
        variants={variants}
      >
        {({option}) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      
      <div className="pt-2">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
              : []
          }
          className="w-full py-4 bg-black text-white text-sm uppercase tracking-wider font-normal hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
        </AddToCartButton>
      </div>
    </div>
  );
}

function ProductOptions({option}: {option: VariantOption}) {
  return (
    <div key={option.name} className="space-y-3">
      <div className="text-xs uppercase tracking-wider text-black font-normal">
        {option.name}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {option.values.map(({value, isAvailable, isActive, to}) => {
          return (
            <Link
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              className={`px-5 py-2.5 text-xs uppercase tracking-wider transition-all min-w-[60px] text-center ${
                isActive
                  ? 'bg-white text-black border-4 border-black font-bold'
                  : 'bg-white text-black border-2 border-black hover:bg-gray-50'
              } ${
                !isAvailable
                  ? 'opacity-30 cursor-not-allowed line-through'
                  : 'cursor-pointer'
              }`}
            >
              {value}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
