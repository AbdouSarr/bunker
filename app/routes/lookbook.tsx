import {json, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {type MetaFunction, useRouteLoaderData, Link} from '@remix-run/react';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';
import {useState, useEffect, useCallback} from 'react';
import {ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight} from '~/components/icons';

export const meta: MetaFunction = () => {
  return [{title: 'Bunker Studio | Lookbook'}];
};

export async function loader({}: LoaderFunctionArgs) {
  return json({});
}

// Lookbook images - High-fashion editorial images
const LOOKBOOK_IMAGES = [
  {
    id: '1',
    url: '/lookbook/1.jpg',
    altText: 'Bunker Lookbook - Black jacket and light blue jeans on red background',
    layout: 'full', // full, half, third
  },
  {
    id: '2',
    url: '/lookbook/2.jpg',
    altText: 'Bunker Lookbook - Black jacket and navy pants on red background',
    layout: 'full',
  },
  {
    id: '3',
    url: '/lookbook/3.jpg',
    altText: 'Bunker Lookbook - Oversized black bomber with sunglasses on red background',
    layout: 'full',
  },
  {
    id: '4',
    url: '/lookbook/4.jpg',
    altText: 'Bunker Lookbook - Grayscale portrait with red eyes on red background',
    layout: 'half',
  },
  {
    id: '5',
    url: '/lookbook/5.jpg',
    altText: 'Bunker Lookbook - Two faces with red X mark on red background',
    layout: 'half',
  },
  {
    id: '6',
    url: '/lookbook/6.jpg',
    altText: 'Bunker Lookbook - Black jacket with hands in pockets on red background',
    layout: 'full',
  },
  {
    id: '7',
    url: '/lookbook/7.jpg',
    altText: 'Bunker Lookbook - Low-angle shot with black bomber and sunglasses',
    layout: 'full',
  },
  {
    id: '9',
    url: '/lookbook/9.jpg',
    altText: 'Bunker Lookbook - Purple hair with dark puffer jacket on red background',
    layout: 'full',
  },
  {
    id: '10',
    url: '/lookbook/10.jpg',
    altText: 'Bunker Lookbook - Black jacket and jeans with hands in pockets',
    layout: 'full',
  },
  {
    id: '11',
    url: '/lookbook/11.jpg',
    altText: 'Bunker Lookbook - Over-shoulder pose with black bomber jacket',
    layout: 'full',
  },
  {
    id: '12',
    url: '/lookbook/12.jpg',
    altText: 'Bunker Lookbook - Navy tracksuit on red background',
    layout: 'full',
  },
  {
    id: '13',
    url: '/lookbook/13.jpg',
    altText: 'Bunker Lookbook - Black hoodie and baggy jeans on red background',
    layout: 'full',
  },
];

export default function Lookbook() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    altText: string;
    index: number;
  } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const openImageModal = useCallback((image: {url: string; altText: string}, index: number) => {
    setSelectedImage({...image, index});
    setIsZoomed(false);
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
    setIsZoomed(false);
  }, []);

  const nextImage = useCallback(() => {
    setSelectedImage((prev) => {
      if (!prev || LOOKBOOK_IMAGES.length === 0) return prev;
      const nextIndex = (prev.index + 1) % LOOKBOOK_IMAGES.length;
      setIsZoomed(false);
      return {...LOOKBOOK_IMAGES[nextIndex], index: nextIndex};
    });
  }, []);

  const prevImage = useCallback(() => {
    setSelectedImage((prev) => {
      if (!prev || LOOKBOOK_IMAGES.length === 0) return prev;
      const prevIndex = (prev.index - 1 + LOOKBOOK_IMAGES.length) % LOOKBOOK_IMAGES.length;
      setIsZoomed(false);
      return {...LOOKBOOK_IMAGES[prevIndex], index: prevIndex};
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageModal();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, closeImageModal, nextImage, prevImage]);

  // Grid layout - Show all images side by side in a responsive grid
  const renderEditorialLayout = () => {
    return (
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-l border-t border-black">
        {LOOKBOOK_IMAGES.map((image, index) => (
          <div
            key={image.id}
            className="cursor-pointer group relative overflow-hidden border-r border-b border-black bg-white"
            onClick={() => openImageModal(image, index)}
            style={{aspectRatio: '3/4'}}
          >
            {failedImages.has(image.id) ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-xs uppercase tracking-wider text-gray-400 text-center px-4">
                  Image not found
                  <br />
                  <span className="text-[10px]">{image.url}</span>
                </p>
              </div>
            ) : (
              <img
                src={image.url}
                alt={image.altText}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                style={{
                  padding: '12px',
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
                loading={index < 4 ? 'eager' : 'lazy'}
                onError={() => setFailedImages(prev => new Set(prev).add(image.id))}
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {rootData?.header && (
        <BalenciagaHeader
          header={rootData.header}
          cart={rootData.cart}
          isLoggedIn={rootData.isLoggedIn}
          publicStoreDomain={rootData.publicStoreDomain}
        />
      )}

      {/* Lookbook Page Content - High Fashion Editorial Layout */}
      <div className="pt-20">
        {/* Hero Logo Section */}
        <div className="w-full py-16 md:py-24 flex items-center justify-center border-b border-black">
          <Link
            to="/"
            prefetch="intent"
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            {!logoFailed ? (
              <img
                src="/bunker-logo.png"
                alt="BUNKER"
                style={{
                  height: '12rem',
                  width: 'auto',
                  objectFit: 'contain',
                }}
                className="md:h-[416px] lg:h-[480px] xl:h-[576px]"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="text-8xl md:text-[14rem] lg:text-[16rem] xl:text-[18rem] font-bold uppercase tracking-wider text-black leading-none">
                BUNKER
              </span>
            )}
          </Link>
        </div>

        {/* Editorial Lookbook Gallery - Flowing Layout */}
        <div className="w-full">
          {LOOKBOOK_IMAGES.length > 0 ? (
            renderEditorialLayout()
          ) : (
            <div className="w-full py-32 text-center border-t border-black">
              <p className="text-sm uppercase tracking-wider text-black/60 mb-4">
                No images in lookbook yet
              </p>
              <p className="text-xs uppercase tracking-wider text-black/40 max-w-2xl mx-auto px-4">
                To add images, place them in the <code className="bg-gray-100 px-2 py-1 text-[10px]">public/lookbook/</code> folder
                <br />
                and name them <code className="bg-gray-100 px-2 py-1 text-[10px]">1.jpg</code> through <code className="bg-gray-100 px-2 py-1 text-[10px]">13.jpg</code>
              </p>
            </div>
          )}
        </div>

        {/* Personal Statement Section */}
        <div className="w-full border-t border-black">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="space-y-6 md:space-y-8 text-black">
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                I've been reflecting deeply on the shape and texture of what I want this brand to represent. Every piece I create carries hours of learning, mistakes, fixing, and beginning again. Cutting, sewing, rethinking, reshaping; every detail has been touched by my hands and my head.
              </p>
              
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                Sobriety has been the backbone of this entire journey. It has given me the clarity to see my work and myself more honestly than ever before. Design, for me, isn't just about clothes; it's about communication. It's about taking what lives inside me and translating it into something others can feel and understand. This brand is that translation.
              </p>
              
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                The path here took me across different places, traveling to learn how things are really made, watching how fabrics move, and understanding the discipline behind every part of the process. Every trip, every conversation, every late night brought me closer to the truth I'm trying to express.
              </p>
              
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                The arguments about shapes, the long debates about patterns, the obsession with direction; it was all about refining a vision. Staying devoted to quality, intention, and keeping things simple but never basic. Pieces that feel light yet considered, familiar yet still forward.
              </p>
              
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                This brand is built to be unisex and universal, made for everyone. It's about movement, clarity, and honesty. Clothes that anyone can step into and feel connected to. With every season and every collection, I plan to tell a new story shaped by growth, experience, and the shifting landscape of who I am becoming.
              </p>
              
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide">
                This moment feels like clarity. Like proof that something whole can be built from dedication and honesty.
              </p>
              
              <p className="text-sm md:text-base leading-relaxed font-light tracking-wide pt-4">
                Thank you Mo, Abdou, Ely, Rui & Pong, Jordan, and everyone who has shed light and helped me take the next step. You know who you are. The journey is only just beginning.
              </p>
              
              <div className="pt-8 md:pt-12 mt-12 md:mt-16">
                bunker
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal - Full Screen View */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/98 flex items-center justify-center"
          onClick={closeImageModal}
        >
          {/* Close Button */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all"
            aria-label="Close"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Zoom Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            className="absolute top-4 left-4 z-50 p-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? (
              <ZoomOut size={24} className="text-white" />
            ) : (
              <ZoomIn size={24} className="text-white" />
            )}
          </button>

          {/* Navigation Arrows */}
          {LOOKBOOK_IMAGES.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all"
                aria-label="Next image"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {LOOKBOOK_IMAGES.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white text-xs uppercase tracking-wider">
              {selectedImage.index + 1} / {LOOKBOOK_IMAGES.length}
            </div>
          )}

          {/* Main Image */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.altText}
              className={`max-w-full max-h-[95vh] object-contain transition-transform duration-200 ${
                isZoomed ? 'scale-150 cursor-move' : 'scale-100'
              }`}
              style={{
                transformOrigin: 'center',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
