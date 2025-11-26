import {defer, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {Await, useLoaderData, useRouteLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {useState, useEffect, lazy, Suspense, useCallback} from 'react';
import LoadingScreen from '~/components/3D/LoadingScreen';
import {ThreeDErrorBoundary} from '~/components/ErrorBoundary';
import ProductGrid from '~/components/ProductGrid';
import type {Product3DDataFragment} from '~/lib/fragments';
import type {RootLoader} from '~/root';
import {useAudio} from '~/contexts/AudioContext';

// Use React.lazy for dynamic import
const Storefront = lazy(() =>
  import('~/components/3D/Storefront').then((module) => ({
    default: module.Storefront,
  })),
);

export const meta: MetaFunction = () => {
  return [{title: 'Bunker Studio | Store'}];
};

// All fragments and the main query are now defined in a single string.
const PRODUCTS_QUERY = `#graphql
  fragment Metaobject3DFields on Metaobject {
    url: field(key: "url") { value }
    scale: field(key: "scale") { value }
    position: field(key: "position") { value }
    rotation: field(key: "rotation") { value }
  }

  fragment Product3DData on Product {
    id
    title
    handle
    vendor
    descriptionHtml
    images(first: 20) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 100) {
      nodes {
        id
        title
        price {
          amount
          currencyCode
        }
        availableForSale
        selectedOptions {
          name
          value
        }
      }
    }
    options {
      name
      values
    }
    mdx_model: metafield(namespace: "custom", key: "mdx_model") {
      reference {
        ... on Metaobject {
          ...Metaobject3DFields
        }
      }
    }
  }

  query products(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 100) {
      nodes {
        ...Product3DData
      }
    }
  }
` as const;

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const {products} = await storefront.query<{
    products: {nodes: Product3DDataFragment[]};
  }>(PRODUCTS_QUERY);

  // Filter products with 3D data for the 3D scene
  const productsWith3DData = products.nodes.filter(
    (product: Product3DDataFragment) =>
      product.mdx_model?.reference?.url?.value,
  );

  // Return both filtered 3D products and all products for the grid
  return {
    products3D: productsWith3DData,
    allProducts: products.nodes,
  };
}

export default function Homepage() {
  const {products3D, allProducts} = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {audioEnabled, toggleAudio} = useAudio();
  const [isClient, setIsClient] = useState(false);
  const [showStorefront, setShowStorefront] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (showStorefront) {
      // Emit event to notify PageLayout that storefront has loaded
      window.dispatchEvent(new Event('storefrontLoaded'));
    }
  }, [showStorefront]);

  // Handle case where rootData might be undefined
  if (!rootData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="homepage-container w-screen bg-white relative">
      {/* 3D Experience Section - Full viewport height accounting for Safari UI */}
      <div className="relative w-full h-[100dvh]">
        {isClient && !showStorefront && (
          <LoadingScreen
            onComplete={() => setShowStorefront(true)}
          />
        )}
        {isClient && showStorefront && (
          <ThreeDErrorBoundary>
            <Suspense fallback={null}>
              <Storefront
                shopifyProducts={products3D}
                cart={rootData.cart}
                audioEnabled={audioEnabled}
                onToggleAudio={toggleAudio}
              />
            </Suspense>
          </ThreeDErrorBoundary>
        )}
      </div>

      {/* Product Grid Section - Scrollable */}
      {isClient && showStorefront && (
        <div id="products">
          <ProductGrid products={allProducts} cart={rootData.cart} />
        </div>
      )}
    </div>
  );
}