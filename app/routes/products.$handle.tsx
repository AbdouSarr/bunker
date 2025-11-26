import {Suspense, useState, useEffect} from 'react';
import {defer, redirect, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {Await, useLoaderData, type MetaFunction} from '@remix-run/react';
import type {ProductFragment} from 'storefrontapi.generated';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
} from '@shopify/hydrogen';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import {getVariantUrl} from '~/lib/variants';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {Bookmark, ChevronLeft, ChevronRight, ZoomIn, ZoomOut} from '~/components/icons';
import {useSavedItems} from '~/hooks/useSavedItems';
import {saveItem, removeItem} from '~/lib/savedItems';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Bunker Studio | ${data?.product.title ?? ''}`}];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) =>
        option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: LoaderFunctionArgs) {
  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = context.storefront
    .query(VARIANTS_QUERY, {
      variables: {handle: params.handle!},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    variants,
  };
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const {product, variants} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedVariant,
    variants,
  );

  const {title, descriptionHtml, images} = product;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({x: 0, y: 0});
  const imageNodes = images?.nodes || [];
  const hasMultipleImages = imageNodes.length > 1;
  const {checkIfSaved, addItem, removeSavedItem, isClient} = useSavedItems();
  const [isSaved, setIsSaved] = useState(false);

  // Check if product is saved on mount
  useEffect(() => {
    if (isClient) {
      setIsSaved(checkIfSaved(product.id));
    }
  }, [isClient, product.id, checkIfSaved]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageNodes.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageNodes.length) % imageNodes.length);
  };

  // Keyboard navigation for images
  useEffect(() => {
    if (imageNodes.length <= 1) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentImageIndex((prev) => (prev - 1 + imageNodes.length) % imageNodes.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentImageIndex((prev) => (prev + 1) % imageNodes.length);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [imageNodes.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Product Page - Exact Balenciaga Layout */}
      <div className="pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Column - Full Height Image Gallery - Exact Balenciaga */}
          <div className="relative bg-white lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]">
            {/* Save Item Button - Top Right Corner */}
            <button
              onClick={() => {
                if (!isClient) return;
                
                const firstImage = imageNodes[0];
                const productData = {
                  id: product.id,
                  title: product.title,
                  handle: product.handle,
                  imageUrl: firstImage?.url || '',
                  price: selectedVariant?.price?.amount || '0',
                  currencyCode: selectedVariant?.price?.currencyCode || 'USD',
                  variantId: selectedVariant?.id,
                };

                if (isSaved) {
                  removeSavedItem(product.id);
                  setIsSaved(false);
                } else {
                  addItem(productData);
                  setIsSaved(true);
                }
              }}
              className="absolute top-4 right-4 z-30 p-2 bg-white hover:bg-gray-50 transition-colors"
              aria-label={isSaved ? 'Remove from saved' : 'Save item'}
            >
              <Bookmark
                size={20}
                strokeWidth={1.5}
                className={isSaved ? 'fill-black text-black' : 'text-black'}
              />
            </button>

            {/* Main Image Display - Full Body Shots - No Cutoffs with Click Zoom */}
            <div className="relative w-full h-full bg-white overflow-hidden" style={{minHeight: 'calc(100vh - 5rem)'}}>
              {imageNodes.length > 0 ? (
                <>
                  {/* Zoom Toggle Button */}
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="absolute top-4 left-4 z-30 p-2 bg-white hover:bg-gray-50 border border-black transition-colors"
                    aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
                  >
                    {isZoomed ? (
                      <ZoomOut size={20} strokeWidth={1.5} className="text-black" />
                    ) : (
                      <ZoomIn size={20} strokeWidth={1.5} className="text-black" />
                    )}
                  </button>

                  {/* Main Image Container - Shows complete product/model head to toe with click zoom - Zoomed out more */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      paddingTop: imageNodes.length > 1 ? '40px' : '40px',
                      paddingBottom: imageNodes.length > 1 ? '120px' : '40px',
                      paddingLeft: '40px',
                      paddingRight: '40px',
                    }}
                    onMouseMove={(e) => {
                      if (isZoomed) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setZoomPosition({x, y});
                      }
                    }}
                  >
                    <img
                      src={imageNodes[currentImageIndex].url}
                      alt={imageNodes[currentImageIndex].altText || title}
                      className="block transition-transform duration-200 ease-out"
                      style={{
                        maxWidth: '85%',
                        maxHeight: imageNodes.length > 1 ? 'calc(100% - 160px)' : 'calc(100% - 80px)',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        transform: isZoomed ? `scale(2.5)` : 'scale(1)',
                        transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center',
                        cursor: isZoomed ? 'move' : 'default',
                      }}
                    />
                  </div>
                  
                  {/* Navigation Arrows - Show for all images - Transparent */}
                  {imageNodes.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-transparent hover:bg-white/20 border border-transparent hover:border-white/30 z-20 transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={18} className="text-white drop-shadow-lg" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-transparent hover:bg-white/20 border border-transparent hover:border-white/30 z-20 transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight size={18} className="text-white drop-shadow-lg" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm uppercase tracking-wider text-gray-400">
                    No Image
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery - Bottom - Always show if multiple images */}
            {imageNodes.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-black p-3 z-30">
                <div className="flex gap-2 overflow-x-auto justify-center" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  <style>{`
                    .overflow-x-auto::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {imageNodes.map((image, index) => (
                    <button
                      key={image.id || `image-${index}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 border transition-all bg-white ${
                        index === currentImageIndex
                          ? 'border-black border-2'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      aria-label={`View image ${index + 1} of ${imageNodes.length}`}
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `${title} - Image ${index + 1}`}
                        className="w-full h-full object-contain"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center',
                        }}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Product Info - Exact Balenciaga Layout with Clear Spacing */}
          <div className="bg-white p-6 lg:p-10 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <div className="max-w-lg mx-auto lg:mx-0 space-y-6">
              {/* Product Title - Clear and Spaced */}
              <div>
                <h1 className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black leading-tight">
                  {title}
                </h1>
              </div>

              {/* Price - Clear and Spaced */}
              <div>
                <ProductPrice
                  price={selectedVariant?.price}
                  compareAtPrice={selectedVariant?.compareAtPrice}
                />
              </div>

              {/* Product Description - Clear and Spaced */}
              {descriptionHtml && (
                <div className="text-xs uppercase tracking-wider text-black leading-relaxed">
                  <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
                </div>
              )}

              {/* Product Form - Size, Color, Add to Cart - Well Spaced */}
              <div className="space-y-6">
                <Suspense
                  fallback={
                    <ProductForm
                      product={product}
                      selectedVariant={selectedVariant}
                      variants={[]}
                    />
                  }
                >
                  <Await
                    errorElement="There was a problem loading product variants"
                    resolve={variants}
                  >
                    {(data) => (
                      <ProductForm
                        product={product}
                        selectedVariant={selectedVariant}
                        variants={data?.product?.variants.nodes || []}
                      />
                    )}
                  </Await>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    images(first: 250) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const;
