import React, {useState} from 'react';
import {ChevronLeft, ChevronRight} from '~/components/icons';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import type {Product3DDataFragment} from '~/lib/fragments';

interface ProductGridCardProps {
  product: Product3DDataFragment;
}

export default function ProductGridCard({product}: ProductGridCardProps) {
  const {title, handle, images, variants} = product;
  const {open} = useAside();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get the first available variant
  const availableVariants = variants.nodes.filter(
    (variant) => variant.availableForSale,
  );
  const firstVariant = availableVariants[0] || variants.nodes[0];
  const [selectedVariant, setSelectedVariant] = useState(firstVariant);

  const price = selectedVariant?.price;
  const isSoldOut = !selectedVariant || !selectedVariant.availableForSale;
  const imageNodes = images.nodes;
  const hasMultipleImages = imageNodes.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageNodes.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + imageNodes.length) % imageNodes.length,
    );
  };

  const handleVariantChange = (variantId: string) => {
    const newVariant = variants.nodes.find((v) => v.id === variantId);
    if (newVariant && newVariant.availableForSale) {
      setSelectedVariant(newVariant);
    }
  };

  return (
    <div className="group flex flex-col bg-white border-r border-b border-black">
      {/* Image Slider */}
      <div className="relative aspect-square bg-white overflow-hidden">
        {imageNodes.length > 0 ? (
          <>
            <img
              src={imageNodes[currentImageIndex].url}
              alt={imageNodes[currentImageIndex].altText || title}
              className="w-full h-full object-cover"
            />
            {/* Image Navigation */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-black p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black hover:text-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-black p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black hover:text-white"
                  aria-label="Next image"
                >
                  <ChevronRight size={16} />
                </button>
                {/* Image Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {imageNodes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 border border-black transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'bg-black'
                          : 'bg-white hover:bg-gray-200'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-sm text-gray-400 uppercase">
            No Image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="font-mono text-xs md:text-sm font-normal uppercase tracking-wider mb-3 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Price */}
        {price && (
          <div className="font-mono text-sm md:text-base font-normal mb-4">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currencyCode,
            }).format(parseFloat(price.amount))}
          </div>
        )}

        {/* Variant Selection - Simple size buttons */}
        {variants.nodes.length > 1 && (
          <div className="mb-4">
            <div className="text-xs font-mono uppercase tracking-wider mb-2">
              Size
            </div>
            <div className="flex flex-wrap gap-1">
              {variants.nodes.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantChange(variant.id)}
                  disabled={!variant.availableForSale}
                  className={`
                    px-2 py-1 text-xs font-mono uppercase tracking-wider border border-black transition-all duration-200
                    ${
                      selectedVariant?.id === variant.id
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }
                    ${
                      !variant.availableForSale
                        ? 'opacity-30 cursor-not-allowed line-through'
                        : ''
                    }
                  `}
                >
                  {variant.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <div className="mt-auto">
          <AddToCartButton
            lines={
              selectedVariant && selectedVariant.availableForSale
                ? [
                    {
                      merchandiseId: selectedVariant.id,
                      quantity: 1,
                      selectedVariant: {
                        ...selectedVariant,
                        product: {
                          id: product.id,
                          title: product.title,
                          handle: product.handle,
                          vendor: product.vendor,
                        },
                      },
                    },
                  ]
                : []
            }
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            onClick={() => open('cart')}
            className="w-full py-2.5 bg-black text-white font-mono text-xs uppercase tracking-wider border border-black hover:bg-white hover:text-black transition-colors duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-300"
          >
            {!selectedVariant
              ? 'Select Variant'
              : !selectedVariant.availableForSale
              ? 'Sold Out'
              : 'Add to Cart'}
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}
