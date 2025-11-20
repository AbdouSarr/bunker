import React, {useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Bookmark, ChevronLeft, ChevronRight} from '~/components/icons';
import type {Product3DDataFragment} from '~/lib/fragments';

interface ProductGridCardProps {
  product: Product3DDataFragment;
}

export default function ProductGridCard({product}: ProductGridCardProps) {
  const {title, handle, images, variants} = product;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get the first available variant for price
  const availableVariants = variants.nodes.filter(
    (variant) => variant.availableForSale,
  );
  const firstVariant = availableVariants[0] || variants.nodes[0];
  const price = firstVariant?.price;

  // Get available sizes
  const availableSizes = variants.nodes
    .filter((v) => v.availableForSale)
    .map((v) => v.title)
    .slice(0, 4); // Show max 4 sizes like Balenciaga

  const imageNodes = images.nodes;
  const hasMultipleImages = imageNodes.length > 1;

  // Auto-cycle through images on hover
  useEffect(() => {
    if (isHovered && hasMultipleImages) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageNodes.length);
      }, 2000); // Change image every 2 seconds
      return () => clearInterval(interval);
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
    <div className="group relative">
      {/* Save Item Button - Top Right */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsSaved(!isSaved);
        }}
        className="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Save item"
      >
        <Bookmark
          size={16}
          strokeWidth={1.5}
          className={isSaved ? 'fill-black text-black' : 'text-black'}
        />
      </button>

      {/* Product Image Gallery - Shows all images */}
      <Link to={`/products/${handle}`} prefetch="intent">
        <div
          className="relative aspect-square bg-white overflow-hidden mb-3"
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-black opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-black opacity-0 group-hover:opacity-100 transition-opacity z-20"
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

      {/* Product Info - Clean, minimal like Balenciaga */}
      <div className="space-y-1">
        {/* Sizes - Inline with title like Balenciaga */}
        {availableSizes.length > 0 && (
          <div className="text-xs uppercase tracking-wider text-black mb-1">
            {availableSizes.join(' · ')}
            {variants.nodes.length > 4 && ' ...'}
          </div>
        )}

        {/* Title */}
        <Link to={`/products/${handle}`} prefetch="intent">
          <h3 className="text-xs uppercase tracking-wider text-black hover:opacity-70 transition-opacity line-clamp-2 leading-tight">
            {title}
          </h3>
        </Link>

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
