import React, {useState} from 'react';
import {Link} from '@remix-run/react';
import {Bookmark} from '~/components/icons';
import type {Product3DDataFragment} from '~/lib/fragments';

interface ProductGridCardProps {
  product: Product3DDataFragment;
}

export default function ProductGridCard({product}: ProductGridCardProps) {
  const {title, handle, images, variants} = product;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

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

  const handleImageHover = () => {
    if (hasMultipleImages && currentImageIndex === 0) {
      setCurrentImageIndex(1);
    }
  };

  const handleImageLeave = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex(0);
    }
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

      {/* Product Image */}
      <Link to={`/products/${handle}`} prefetch="intent">
        <div
          className="relative aspect-square bg-white overflow-hidden mb-3"
          onMouseEnter={handleImageHover}
          onMouseLeave={handleImageLeave}
        >
          {imageNodes.length > 0 ? (
            <img
              src={imageNodes[currentImageIndex].url}
              alt={imageNodes[currentImageIndex].altText || title}
              className="w-full h-full object-cover transition-opacity duration-300"
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
