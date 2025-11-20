import React, {useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Bookmark, ChevronLeft, ChevronRight} from '~/components/icons';
import type {Product3DDataFragment} from '~/lib/fragments';
import {useSavedItems} from '~/hooks/useSavedItems';
import {saveItem, removeItem} from '~/lib/savedItems';

interface ProductGridCardProps {
  product: Product3DDataFragment;
}

export default function ProductGridCard({product}: ProductGridCardProps) {
  const {title, handle, images, variants, options} = product;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const {checkIfSaved, addItem, removeSavedItem, isClient} = useSavedItems();
  const [isSaved, setIsSaved] = useState(false);

  // Check if product is saved on mount
  useEffect(() => {
    if (isClient) {
      setIsSaved(checkIfSaved(product.id));
    }
  }, [isClient, product.id, checkIfSaved]);

  // Get the first available variant for price
  const availableVariants = variants.nodes.filter(
    (variant) => variant.availableForSale,
  );
  const firstVariant = availableVariants[0] || variants.nodes[0];
  const price = firstVariant?.price;

  // Get available sizes - extract size option values
  const sizeOption = (options as Array<{name: string | null; values: string[]}> | undefined)?.find(
    opt => opt.name?.toLowerCase() === 'size'
  );
  const availableSizes = sizeOption?.values?.filter((size) => {
    // Check if any variant with this size is available
    return variants.nodes.some(v => 
      v.availableForSale && 
      v.selectedOptions?.some(opt => opt.name?.toLowerCase() === 'size' && opt.value === size)
    );
  }) || [];

  // Get color count - count unique color values
  const uniqueColors = new Set(
    variants.nodes
      .filter(v => v.availableForSale)
      .map(v => v.selectedOptions?.find(opt => opt.name?.toLowerCase() === 'color')?.value)
      .filter(Boolean)
  );
  const colorCount = uniqueColors.size;

  const imageNodes = images.nodes;
  const hasMultipleImages = imageNodes.length > 1;

  // Auto-switch to product detail shot (second image) on hover
  useEffect(() => {
    if (isHovered && hasMultipleImages && imageNodes.length > 1) {
      // Switch to second image (product detail shot) immediately on hover
      setCurrentImageIndex(1);
    } else if (!isHovered) {
      // Reset to first image when not hovering
      setCurrentImageIndex(0);
    }
  }, [isHovered, hasMultipleImages, imageNodes.length]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % imageNodes.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + imageNodes.length) % imageNodes.length);
  };

  return (
    <div className="group relative bg-white border-r border-b border-black">
      {/* Save Item Button - Top Right */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isClient) return;

          const firstImage = imageNodes[0];
          const availableVariants = variants.nodes.filter(
            (variant) => variant.availableForSale,
          );
          const firstVariant = availableVariants[0] || variants.nodes[0];
          const productData = {
            id: product.id,
            title: product.title,
            handle: product.handle,
            imageUrl: firstImage?.url || '',
            price: firstVariant?.price?.amount || '0',
            currencyCode: firstVariant?.price?.currencyCode || 'USD',
            variantId: firstVariant?.id,
          };

          if (isSaved) {
            removeSavedItem(product.id);
            setIsSaved(false);
          } else {
            addItem(productData);
            setIsSaved(true);
          }
        }}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white hover:bg-gray-50 transition-colors"
        aria-label={isSaved ? 'Remove from saved' : 'Save item'}
      >
        <span className="text-xs uppercase tracking-wider text-black">
          SAVE ITEM
        </span>
      </button>

      {/* Product Image Gallery - Shows all images */}
      <Link to={`/products/${handle}`} prefetch="intent">
        <div
          className="relative aspect-square bg-white overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setCurrentImageIndex(0); // Reset to first image on leave
          }}
        >
          {imageNodes.length > 0 ? (
            <>
              {/* Main Image - Zoomed out to show full product */}
              <img
                src={imageNodes[currentImageIndex].url}
                alt={imageNodes[currentImageIndex].altText || title}
                className="w-full h-full object-contain transition-opacity duration-500"
              />
              
              {/* Image Navigation Arrows - Show when multiple images */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white border border-black opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white border border-black opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  {/* Image Indicator Dots - Show all images */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {imageNodes.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-black w-4'
                            : 'bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-xs uppercase tracking-wider text-gray-400">
                No Image
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info - Exact Balenciaga layout */}
      <div className="p-4 space-y-1">
        {/* Sizes - First line like Balenciaga */}
        {availableSizes.length > 0 && (
          <div className="text-xs uppercase tracking-wider text-black mb-1">
            {availableSizes.slice(0, 5).join(' · ')}
            {availableSizes.length > 5 && ' ...'}
          </div>
        )}

        {/* Title */}
        <Link to={`/products/${handle}`} prefetch="intent">
          <h3 className="text-xs uppercase tracking-wider text-black hover:opacity-70 transition-opacity line-clamp-2 leading-tight mb-1">
            {title}
          </h3>
        </Link>

        {/* Color count - if multiple colors */}
        {colorCount > 1 && (
          <div className="text-xs uppercase tracking-wider text-black mb-1">
            {colorCount} {colorCount === 1 ? 'color' : 'colors'}
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="text-xs uppercase tracking-wider text-black mt-1">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currencyCode,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(parseFloat(price.amount))}
          </div>
        )}
      </div>
    </div>
  );
}
