import React from 'react';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import type {ShopifyProduct} from './types';

// Updated ProductCard component with real Lucide icons
import { LayoutGrid, Ruler } from 'lucide-react';

// Updated DetailsIcon function
function DetailsIcon() {
  return <LayoutGrid size={12} className="mr-2" />;
}

// Updated SizeIcon function
function SizeIcon() {
  return <Ruler size={12} className="mr-2" />;
}
interface ProductCardProps {
  product: ShopifyProduct;
}

function ProductCard({product}: ProductCardProps) {
  const {title, vendor, descriptionHtml, variants} = product;
  const {open} = useAside();
  const [isVisible, setIsVisible] = React.useState(false);
  const [previousProductId, setPreviousProductId] = React.useState<string | null>(null);

  // Ensure we have variants and get the first available one
  const availableVariants = variants.nodes.filter(variant => variant.availableForSale);
  const firstVariant = availableVariants[0] || variants.nodes[0];
  
  const [selectedVariant, setSelectedVariant] = React.useState<
    typeof firstVariant | null
  >(null);

  // CRITICAL: Reset all state when product changes
  React.useEffect(() => {
    // Check if product actually changed
    const productChanged = previousProductId !== null && previousProductId !== product.id;
    
    if (productChanged) {
      // Fade out briefly before changing content
      setIsVisible(false);
      setTimeout(() => {
        // Update product data
        const newAvailableVariants = variants.nodes.filter(variant => variant.availableForSale);
        const newFirstVariant = newAvailableVariants[0] || variants.nodes[0];
        setSelectedVariant(newFirstVariant || null);
        setPreviousProductId(product.id);
        // Fade back in
        setTimeout(() => setIsVisible(true), 50);
      }, 200);
    } else {
      // First time or same product - just set data and show
      const newAvailableVariants = variants.nodes.filter(variant => variant.availableForSale);
      const newFirstVariant = newAvailableVariants[0] || variants.nodes[0];
      setSelectedVariant(newFirstVariant || null);
      setPreviousProductId(product.id);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [product.id, product.handle, variants.nodes, previousProductId]);

  // Debug logging
  React.useEffect(() => {
    console.log('ProductCard Debug:', {
      productId: product.id,
      title,
      selectedVariant: selectedVariant?.id,
      selectedVariantTitle: selectedVariant?.title,
      firstVariant: firstVariant?.id,
      availableVariantsCount: availableVariants.length,
      totalVariantsCount: variants.nodes.length
    });
  }, [selectedVariant, product.id]);

  const price = selectedVariant?.price;
  const isSoldOut = !selectedVariant || !selectedVariant.availableForSale;

  // Function to extract plain text from HTML and convert to uppercase
  const getPlainTextFromHtml = (html: string) => {
    if (typeof window !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return (doc.body.textContent || '').toUpperCase();
    }
    return html.toUpperCase(); // Fallback for server-side rendering
  };

  const handleVariantChange = (variantId: string) => {
    const newVariant = variants.nodes.find((v) => v.id === variantId);
    if (newVariant && newVariant.availableForSale) {
      setSelectedVariant(newVariant);
    }
  };

  // Separate variants into size and color options
  const sizeVariants = variants.nodes.filter(
    (variant) =>
      !variant.title.toLowerCase().includes('red') &&
      !variant.title.toLowerCase().includes('blue') &&
      !variant.title.toLowerCase().includes('green') &&
      !variant.title.toLowerCase().includes('black') &&
      !variant.title.toLowerCase().includes('white') &&
      !variant.title.toLowerCase().includes('pink') &&
      !variant.title.toLowerCase().includes('yellow') &&
      !variant.title.toLowerCase().includes('purple') &&
      !variant.title.toLowerCase().includes('orange') &&
      !variant.title.toLowerCase().includes('brown') &&
      !variant.title.toLowerCase().includes('gray') &&
      !variant.title.toLowerCase().includes('grey'),
  );

  const colorVariants = variants.nodes.filter(
    (variant) =>
      variant.title.toLowerCase().includes('red') ||
      variant.title.toLowerCase().includes('blue') ||
      variant.title.toLowerCase().includes('green') ||
      variant.title.toLowerCase().includes('black') ||
      variant.title.toLowerCase().includes('white') ||
      variant.title.toLowerCase().includes('pink') ||
      variant.title.toLowerCase().includes('yellow') ||
      variant.title.toLowerCase().includes('purple') ||
      variant.title.toLowerCase().includes('orange') ||
      variant.title.toLowerCase().includes('brown') ||
      variant.title.toLowerCase().includes('gray') ||
      variant.title.toLowerCase().includes('grey'),
  );

  // If we can't clearly separate variants, fall back to showing all as size variants
  const hasSeparateColorVariants =
    colorVariants.length > 0 && sizeVariants.length > 0;
  const displaySizeVariants = hasSeparateColorVariants
    ? sizeVariants
    : variants.nodes;
  const displayColorVariants = hasSeparateColorVariants ? colorVariants : [];

  return (
    <div
      className="
        relative w-full p-4 rounded-xl font-mono text-white box-border
        bg-black/30 backdrop-blur-md border border-black/2 uppercase
        max-h-[70vh] overflow-hidden
        transition-all duration-300 ease-out
      "
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `translateY(${isVisible ? 0 : 20}px)`,
      }}
    >
      {/* NAME AND PRICE DIV */}
      <div 
        className="flex justify-between items-center mb-3 transition-all duration-300 ease-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? 0 : 10}px)`,
          transitionDelay: '50ms'
        }}
      >
        <div>
          <div className="text-xs tracking-wider opacity-80 mb-0">{vendor}</div>
          <div className="text-md md:text-lg leading-tight">{title}</div>
        </div>
        {price && (
          <div className="text-lg font-bold tracking-wider">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currencyCode,
            }).format(parseFloat(price.amount))}
          </div>
        )}
      </div>
      <div 
        className="flex gap-3 mb-4 ease-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? 0 : 10}px)`,
          transitionDelay: '100ms'
        }}
      >
        <div className="flex-grow flex-shrink basis-2/3 p-3 rounded-lg flex flex-col bg-black/10 backdrop-blur-md border border-black/2">
          <div className="flex items-center text-xs tracking-wider pb-1 mb-1 opacity-90">
            <DetailsIcon />
            <span>Details</span>
          </div>
          <div className="flex-1 text-xs text-gray-200 overflow-y-auto max-h-10">
            {getPlainTextFromHtml(descriptionHtml)}
          </div>
        </div>
        <div className="flex-grow flex-shrink basis-1/3 flex flex-col rounded-lg bg-black/10 backdrop-blur-md border border-black/2">
          <div className="flex items-center justify-between px-2 pt-3 pb-3 text-xs tracking-wider opacity-90">
            <div className="flex items-center">
              <SizeIcon />
              <span>Size</span>
            </div>
          </div>
          <div className="flex flex-1">
            {displaySizeVariants.map((variant, i) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => handleVariantChange(variant.id)}
                disabled={!variant.availableForSale}
                className={`
                  flex-1 flex items-center justify-center uppercase text-xs tracking-wider cursor-pointer
                  transition-all duration-200
                  border border-black/10
                  ${i === 0 ? 'rounded-bl-md' : ''}
                  ${i === displaySizeVariants.length - 1 ? 'rounded-br-lg' : ''}
                  ${
                    selectedVariant?.id === variant.id
                      ? 'bg-white bg-opacity-90 text-black'
                      : 'bg-black/30 text-gray-200 hover:bg-white hover:bg-opacity-20'
                  }
                  ${
                    !variant.availableForSale
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }
                `}
              >
                {variant.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color selection section - only shown if there are separate color variants */}
      {displayColorVariants.length > 0 && (
        <div 
          className="mb-4 transition-all duration-300 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: `translateY(${isVisible ? 0 : 10}px)`,
            transitionDelay: '150ms'
          }}
        >
          <div className="flex flex-col rounded-lg bg-black/10 backdrop-blur-md border border-black/2">
            <div className="flex items-center justify-between px-3 pt-3 pb-3 text-xs tracking-wider opacity-90">
              <span>Color</span>
            </div>
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {displayColorVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantChange(variant.id)}
                  disabled={!variant.availableForSale}
                  className={`
                    px-3 py-2 uppercase text-xs tracking-wider cursor-pointer rounded
                    transition-all duration-200
                    border border-black/10
                    ${
                      selectedVariant?.id === variant.id
                        ? 'bg-white bg-opacity-90 text-black'
                        : 'bg-black/30 text-gray-200 hover:bg-white hover:bg-opacity-20'
                    }
                    ${
                      !variant.availableForSale
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }
                  `}
                >
                  {variant.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className="
          flex-1 flex items-center justify-center
          w-full py-3 bg-white bg-opacity-90
          text-black font-bold text-sm tracking-wider
          rounded-md border-none cursor-pointer
          transition-all duration-300 ease-out
          min-h-[48px]
        "
        style={{
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${isVisible ? 0 : 10}px)`,
          transitionDelay: '200ms'
        }}
      >
        <AddToCartButton
          lines={
            selectedVariant && selectedVariant.availableForSale
              ? [{merchandiseId: selectedVariant.id, quantity: 1}]
              : []
          }
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => open('cart')}
          className='w-full'
        >
          <span className="uppercase text-black pointer-events-none select-none">
            {!selectedVariant
              ? 'Select Variant'
              : !selectedVariant.availableForSale
              ? 'Sold Out'
              : 'Add to Cart'}
          </span>
        </AddToCartButton>
      </div>
    </div>
  );
}

interface ProductCardPreviewProps {
  selectedProduct: ShopifyProduct;
}

const ProductCardPreview = ({selectedProduct}: ProductCardPreviewProps) => {
  return (
    <div className="w-screen flex justify-center px-3">
      <div className="w-full md:w-10/12 lg:w-6/12 max-w-2xl">
        <ProductCard product={selectedProduct} />
      </div>
    </div>
  );
};

export default ProductCardPreview;
