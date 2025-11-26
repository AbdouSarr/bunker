import {json, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {Link} from '@remix-run/react';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {getSavedItems, removeItem, type SavedProduct} from '~/lib/savedItems';
import {useState, useEffect} from 'react';
import {Bookmark} from '~/components/icons';

export const meta = () => {
  return [{title: 'Bunker Studio | Saved Items'}];
};

export async function loader({request}: LoaderFunctionArgs) {
  // For server-side, we'll return empty and let client-side handle it
  return json({});
}

export default function SavedItems() {
  const {open} = useAside();
  const [savedItems, setSavedItems] = useState<SavedProduct[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSavedItems(getSavedItems());
  }, []);

  const handleRemove = (productId: string) => {
    removeItem(productId);
    setSavedItems(getSavedItems());
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Saved Items Content */}
      <div className="pt-20">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-normal uppercase tracking-wider text-black mb-8">
            Saved Items
          </h1>

          {!isClient ? (
            <div className="text-center py-20">
              <p className="text-sm uppercase tracking-wider text-gray-500">
                Loading...
              </p>
            </div>
          ) : savedItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm uppercase tracking-wider text-gray-500 mb-4">
                No saved items yet
              </p>
              <Link
                to="/"
                className="text-xs uppercase tracking-wider text-black hover:opacity-70 transition-opacity"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-l border-t border-black">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white border-r border-b border-black"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 z-10 p-2 bg-white hover:bg-gray-50 transition-colors"
                    aria-label="Remove from saved"
                  >
                    <Bookmark
                      size={16}
                      strokeWidth={1.5}
                      className="fill-black text-black"
                    />
                  </button>

                  {/* Product Image */}
                  <Link
                    to={`/products/${item.handle}`}
                    prefetch="intent"
                    className="block"
                  >
                    <div className="relative aspect-square bg-white overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-xs uppercase tracking-wider text-gray-400">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 space-y-2">
                    <Link
                      to={`/products/${item.handle}`}
                      prefetch="intent"
                      className="block"
                    >
                      <h3 className="text-xs uppercase tracking-wider text-black hover:opacity-70 transition-opacity line-clamp-2 leading-tight">
                        {item.title}
                      </h3>
                    </Link>

                    <div className="text-xs uppercase tracking-wider text-black">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: item.currencyCode,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(parseFloat(item.price))}
                    </div>

                    {/* Add to Cart Button */}
                    {item.variantId && (
                      <AddToCartButton
                        lines={[
                          {
                            merchandiseId: item.variantId,
                            quantity: 1,
                          },
                        ]}
                        onClick={() => open('cart')}
                        className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-wider font-normal hover:bg-gray-800 transition-colors"
                      >
                        Add to Cart
                      </AddToCartButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

