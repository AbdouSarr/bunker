import React, {useState, useEffect} from 'react';
import {Bookmark, ChevronLeft, ChevronRight} from '~/components/icons';
import type {Product3DDataFragment} from '~/lib/fragments';
import {useSavedItems} from '~/hooks/useSavedItems';

interface ProductGridCardProps {
  product: Product3DDataFragment;
  onProductClick: (product: Product3DDataFragment) => void;
}

export default function ProductGridCard({product, onProductClick}: ProductGridCardProps) {
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
    <div className="group relative bg-white border-r border-b border-black w-full h-full box-border" style={{borderWidth: '1px'}}>
      {/* Product Image Gallery - Shows all images */}
      <div
        className="relative aspect-square bg-white overflow-hidden cursor-pointer"
        onClick={() => onProductClick(product)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0); // Reset to first image on leave
        }}
      >
          {imageNodes.length > 0 ? (
            <>
              {/* Main Image - Fixed size to ensure all images are exactly the same - Zoomed out to show full model */}
              <img
                src={imageNodes[currentImageIndex].url}
                alt={imageNodes[currentImageIndex].altText || title}
                className="w-full h-full object-contain transition-opacity duration-500 bg-white"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  padding: '12px',
                }}
              />

              {/* Image Navigation Arrows - Show when multiple images - White/Transparent */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-transparent hover:bg-white/20 border border-transparent hover:border-white/30 opacity-0 group-hover:opacity-100 transition-all z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={16} className="text-white drop-shadow-lg" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-transparent hover:bg-white/20 border border-transparent hover:border-white/30 opacity-0 group-hover:opacity-100 transition-all z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight size={16} className="text-white drop-shadow-lg" />
                  </button>

                  {/* Image Indicator Dots - Show all images */}
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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
                            : 'bg-black/20 hover:bg-black'
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
                N/A
              </span>
            </div>
          )}
        </div>

      {/* Product Info - Exact Balenciaga layout - Compact */}
      <div className="p-4 space-y-1">
        {/* Sizes - First line like Balenciaga */}
        {availableSizes.length > 0 && (
          <div className="text-[10px] uppercase tracking-wider text-black/40">
            {availableSizes.slice(0, 5).join(' · ')}
            {availableSizes.length > 5 && ' ...'}
          </div>
        )}

        {/* Title */}
        <button
          onClick={() => onProductClick(product)}
          className="text-left w-full"
        >
          <h3 className="text-[10px] uppercase tracking-wider text-black hover:opacity-70 transition-opacity line-clamp-2 leading-tight mb-0.5">
            {title}
          </h3>
        </button>

        {/* Color count - if multiple colors */}
        {colorCount > 1 && (
          <div className="text-[10px] uppercase tracking-wider text-black">
            {colorCount} {colorCount === 1 ? 'color' : 'colors'}
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="text-[10px] uppercase tracking-wider text-black">
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
