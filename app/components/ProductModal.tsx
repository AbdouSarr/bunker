import {useState, useEffect, useCallback, useRef} from 'react';
import type {Product3DDataFragment} from '~/lib/fragments';
import {Bookmark, ChevronLeft, ChevronRight, X} from '~/components/icons';
import {useSavedItems} from '~/hooks/useSavedItems';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

interface ProductModalProps {
  product: Product3DDataFragment | null;
  isOpen: boolean;
  onClose: () => void;
}

// Shopify image optimization helper
function getOptimizedImageUrl(url: string, width: number = 800): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=85`;
}

export function ProductModal({product, isOpen, onClose}: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const {checkIfSaved, addItem, removeSavedItem, isClient} = useSavedItems();
  const [isSaved, setIsSaved] = useState(false);
  const {open} = useAside();
  const lastProductIdRef = useRef<string | null>(null);

  // Reset state when product changes (only when product.id actually changes)
  useEffect(() => {
    if (product && product.id !== lastProductIdRef.current) {
      lastProductIdRef.current = product.id;
      setCurrentImageIndex(0);
      // Initialize selected options from first available variant
      const firstVariant = product.variants.nodes[0];
      if (firstVariant?.selectedOptions) {
        const initialOptions: Record<string, string> = {};
        firstVariant.selectedOptions.forEach((opt) => {
          if (opt.name && opt.value) {
            initialOptions[opt.name.toLowerCase()] = opt.value;
          }
        });
        setSelectedOptions(initialOptions);
      }
    }
  }, [product?.id]);

  // Separate effect for saved state
  useEffect(() => {
    if (product && isClient) {
      setIsSaved(checkIfSaved(product.id));
    }
  }, [product?.id, isClient, checkIfSaved]);

  // Handle escape key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && product && product.images.nodes.length > 1) {
        setCurrentImageIndex((prev) =>
          prev === 0 ? product.images.nodes.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight' && product && product.images.nodes.length > 1) {
        setCurrentImageIndex((prev) =>
          prev === product.images.nodes.length - 1 ? 0 : prev + 1
        );
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, product]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Prevent event propagation for all interactive elements
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen || !product) return null;

  const {title, descriptionHtml, images, variants, options} = product;
  const imageNodes = images.nodes;
  const hasMultipleImages = imageNodes.length > 1;

  // Find the variant that matches all selected options
  const selectedVariant = variants.nodes.find((variant) => {
    if (!variant.selectedOptions) return false;
    return variant.selectedOptions.every((option) => {
      if (!option.name || !option.value) return false;
      return selectedOptions[option.name.toLowerCase()] === option.value;
    });
  }) || variants.nodes[0];

  // Get size options
  const sizeOption = (options as Array<{name: string | null; values: string[]}> | undefined)?.find(
    opt => opt.name?.toLowerCase() === 'size'
  );

  // Get color options
  const colorOption = (options as Array<{name: string | null; values: string[]}> | undefined)?.find(
    opt => opt.name?.toLowerCase() === 'color'
  );

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === imageNodes.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? imageNodes.length - 1 : prev - 1
    );
  };

  const goToSlide = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  };

  const handleOptionChange = (optionName: string, optionValue: string) => {
    setSelectedOptions((prev) => {
      // Only update if the value actually changed
      const key = optionName.toLowerCase();
      if (prev[key] === optionValue) return prev;

      return {
        ...prev,
        [key]: optionValue,
      };
    });
  };

  const handleSizeClick = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOptionChange('size', size);
  };

  const handleColorClick = (color: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOptionChange('color', color);
  };

  const handleAddToCart = () => {
    open('cart');
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 md:p-8"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Content */}
      <div
        className="relative bg-white w-full h-full max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={handleContentClick}
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 z-50 p-2 bg-white hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Modal Content - No scroll, dynamic flex layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Image Section - fills remaining space */}
          <div className="w-full lg:w-3/5 flex flex-col bg-white overflow-hidden lg:flex-1">
              {/* Main Image Container - Custom Carousel */}
              <div className="relative flex-1 flex items-center justify-center p-4 md:p-6 min-h-[300px] lg:min-h-0">
                {imageNodes.length > 0 ? (
                  <>
                    {/* Carousel Container */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {imageNodes.map((image, index) => (
                        <div
                          key={image.id || `image-${index}`}
                          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                            index === currentImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          }`}
                        >
                          <img
                            src={getOptimizedImageUrl(image.url, 800)}
                            alt={image.altText || title}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Navigation Arrows */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-100 border border-black z-20 transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-100 border border-black z-20 transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">
                    No Image
                  </span>
                )}
              </div>

              {/* Thumbnail Gallery - Visual selector at bottom */}
              {hasMultipleImages && (
                <div className="flex gap-2 p-3 overflow-x-auto justify-center border-t border-gray-200 bg-white">
                  {imageNodes.map((image, index) => (
                    <button
                      key={image.id || `thumb-${index}`}
                      onClick={(e) => goToSlide(index, e)}
                      className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 border-2 transition-all bg-white touch-manipulation ${
                        index === currentImageIndex
                          ? 'border-black'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={getOptimizedImageUrl(image.url, 100)}
                        alt={image.altText || `${title} - Image ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section - determines its own height */}
            <div className="w-full lg:w-2/5 p-4 md:p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col lg:flex-shrink-0">
              <div className="space-y-3">
                {/* Product Title - BIGGER */}
                <h2
                  id="modal-title"
                  className="text-sm md:text-base lg:text-lg uppercase tracking-wider text-black leading-tight font-medium"
                  style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                >
                  {title}
                </h2>

                {/* Price */}
                {selectedVariant?.price && (
                  <div
                    className="text-xs md:text-sm uppercase tracking-wider text-black"
                    style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                  >
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: selectedVariant.price.currencyCode,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(parseFloat(selectedVariant.price.amount))}
                  </div>
                )}

                {/* Description */}
                {descriptionHtml && (
                  <div
                    className="text-[10px] md:text-xs uppercase tracking-wider text-black/70 leading-tight line-clamp-3"
                    style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                    dangerouslySetInnerHTML={{__html: descriptionHtml}}
                  />
                )}

                {/* Size Options */}
                {sizeOption && sizeOption.values.length > 0 && (
                  <div className="space-y-1.5">
                    <div
                      className="text-[10px] md:text-xs uppercase tracking-wider text-black"
                      style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                    >
                      Size
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizeOption.values.map((size) => {
                        // Check if there's an available variant with this size and current other options
                        const isAvailable = variants.nodes.some((v) => {
                          if (!v.availableForSale) return false;
                          if (!v.selectedOptions) return false;

                          // Must have this size
                          const hasSize = v.selectedOptions.some(
                            opt => opt.name?.toLowerCase() === 'size' && opt.value === size
                          );
                          if (!hasSize) return false;

                          // All other non-size options must match current selection
                          return v.selectedOptions
                            .filter(opt => opt.name?.toLowerCase() !== 'size')
                            .every(opt =>
                              opt.name && selectedOptions[opt.name.toLowerCase()] === opt.value
                            );
                        });

                        const isSelected = selectedOptions['size'] === size;

                        return (
                          <button
                            key={size}
                            onClick={(e) => handleSizeClick(size, e)}
                            disabled={!isAvailable}
                            className={`px-3 py-2 text-[10px] md:text-xs uppercase tracking-wider transition-all ${
                              isSelected
                                ? 'bg-black text-white'
                                : 'bg-white text-black border border-black hover:bg-gray-100'
                            } ${
                              !isAvailable
                                ? 'opacity-30 cursor-not-allowed line-through'
                                : 'cursor-pointer'
                            }`}
                            style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Options */}
                {colorOption && colorOption.values.length > 1 && (
                  <div className="space-y-1.5">
                    <div
                      className="text-[10px] md:text-xs uppercase tracking-wider text-black"
                      style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                    >
                      Color
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colorOption.values.map((color) => {
                        // Check if there's an available variant with this color and current other options
                        const isAvailable = variants.nodes.some((v) => {
                          if (!v.availableForSale) return false;
                          if (!v.selectedOptions) return false;

                          // Must have this color
                          const hasColor = v.selectedOptions.some(
                            opt => opt.name?.toLowerCase() === 'color' && opt.value === color
                          );
                          if (!hasColor) return false;

                          // All other non-color options must match current selection
                          return v.selectedOptions
                            .filter(opt => opt.name?.toLowerCase() !== 'color')
                            .every(opt =>
                              opt.name && selectedOptions[opt.name.toLowerCase()] === opt.value
                            );
                        });

                        const isSelected = selectedOptions['color'] === color;

                        return (
                          <button
                            key={color}
                            onClick={(e) => handleColorClick(color, e)}
                            disabled={!isAvailable}
                            className={`px-3 py-2 text-[10px] md:text-xs uppercase tracking-wider transition-all ${
                              isSelected
                                ? 'bg-black text-white'
                                : 'bg-white text-black border border-black hover:bg-gray-100'
                            } ${
                              !isAvailable
                                ? 'opacity-30 cursor-not-allowed line-through'
                                : 'cursor-pointer'
                            }`}
                            style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'}}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  {/* Add to Cart Button - WITH PADDING */}
                  <AddToCartButton
                    disabled={!selectedVariant || !selectedVariant.availableForSale}
                    onClick={handleAddToCart}
                    lines={
                      selectedVariant
                        ? [
                            {
                              merchandiseId: selectedVariant.id,
                              quantity: 1,
                              selectedVariant: {
                                ...selectedVariant,
                                image: null,
                                product: {
                                  title: product.title,
                                  handle: product.handle,
                                },
                                compareAtPrice: null,
                                requiresShipping: true,
                                sku: '',
                                unitPrice: null,
                              },
                            },
                          ]
                        : []
                    }
                    className="flex-1 px-6 py-3 bg-black text-white text-xs md:text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
                  </AddToCartButton>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveToggle}
                    className="px-4 py-3 border border-black hover:bg-gray-100 transition-colors flex items-center justify-center"
                    aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                  >
                    <Bookmark
                      size={18}
                      strokeWidth={1.5}
                      className={isSaved ? 'fill-black text-black' : 'text-black'}
                    />
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
