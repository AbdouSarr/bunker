import {NavLink, Await} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import {useAside} from '~/components/Aside';
import {Bookmark, ShoppingCart, ChevronDown, Volume2, VolumeX, Menu} from '~/components/icons';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {getSavedItems} from '~/lib/savedItems';

interface BalenciagaHeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  showAudioControl?: boolean;
  isVisible?: boolean;
}

export function BalenciagaHeader({
  header,
  cart,
  isLoggedIn,
  publicStoreDomain,
  audioEnabled = false,
  onToggleAudio,
  showAudioControl = false,
  isVisible = true,
}: BalenciagaHeaderProps) {
  const {open} = useAside();
  const [logoFailed, setLogoFailed] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setSavedCount(getSavedItems().length);
    
    // Update count when storage changes
    const handleStorageChange = () => {
      setSavedCount(getSavedItems().length);
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events for same-tab updates
    window.addEventListener('savedItemsChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedItemsChanged', handleStorageChange);
    };
  }, []);
  
  // Safe defaults if header is not available
  const safeHeader = header || { shop: { primaryDomain: { url: '' } } };

  // Navigation menu structure similar to Balenciaga
  const navigationMenu = [
    {
      title: 'READY-TO-WEAR',
      url: '/#products',
      items: [
        { title: 'View All', url: '/#products' },
        { title: 'Coats & Jackets', url: '/#products' },
        { title: 'Tops & Shirts', url: '/#products' },
        { title: 'Pants', url: '/#products' },
      ],
    },
    {
      title: 'COLLECTIONS',
      url: '/#products',
      items: [
        { title: 'Spring 26', url: '/#products' },
        { title: 'Winter 25', url: '/#products' },
        { title: 'Limited Edition', url: '/limited-edition' },
      ],
    },
    {
      title: 'ABOUT',
      url: '/about',
      items: [
        { title: 'Our Story', url: '/about#our-story' },
        { title: 'Sustainability', url: '/about#sustainability' },
        { title: 'Contact', url: '/contact' },
      ],
    },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[9999] bg-white border-t border-b border-black transition-all duration-500 ease-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Three Column Flexbox Layout */}
      <div className="flex items-center max-h-[40px] px-2 md:px-6 py-2 md:py-4">
        {/* Left Section: Menu button (mobile) or Navigation (desktop) */}
        <div className="flex-1 flex items-center min-w-0">
          {/* Mobile Menu Button - Only visible on mobile */}
          <button
            onClick={() => open('mobile')}
            className="md:hidden p-1 hover:opacity-70 transition-opacity text-black"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          {/* Left Navigation Menu - Hidden on mobile, visible on desktop */}
          <nav className="hidden md:flex items-center gap-1.5 md:gap-6 flex-shrink-0">
          {navigationMenu.map((item) => (
            <div
              key={item.title}
              className="relative"
              onMouseEnter={() => setHoveredNav(item.title)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <a
                href={item.url}
                onClick={(e) => {
                  if (item.url.startsWith('/#')) {
                    e.preventDefault();
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = item.url;
                    }
                  }
                }}
                className="flex items-center gap-0.5 md:gap-1 text-[9px] md:text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
              >
                {item.title}
                {item.items && item.items.length > 0 && (
                  <ChevronDown size={10} className="opacity-70 md:w-3 md:h-3" />
                )}
              </a>
              
              {/* Dropdown Menu - Text-based with no gap to prevent disappearing */}
              {item.items && item.items.length > 0 && hoveredNav === item.title && (
                <div 
                  className="absolute top-full left-0 pt-0.5 z-[100]"
                  onMouseEnter={() => setHoveredNav(item.title)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <div className="bg-white border border-black shadow-lg min-w-[200px]">
                    <div className="py-2">
                      {item.items.map((subItem, index) => (
                        <a
                          key={index}
                          href={subItem.url}
                          onClick={(e) => {
                            if (subItem.url.startsWith('/#')) {
                              e.preventDefault();
                              const productsSection = document.getElementById('products');
                              if (productsSection) {
                                productsSection.scrollIntoView({ behavior: 'smooth' });
                              } else {
                                window.location.href = subItem.url;
                              }
                            } else if (subItem.url.includes('#')) {
                              // Handle anchor links (e.g., /about#our-story)
                              e.preventDefault();
                              const [path, hash] = subItem.url.split('#');
                              if (path === window.location.pathname) {
                                // Same page, just scroll to anchor
                                const element = document.getElementById(hash);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth' });
                                }
                              } else {
                                // Different page, navigate then scroll
                                window.location.href = subItem.url;
                              }
                            }
                            setHoveredNav(null);
                          }}
                          className="block px-4 py-2 text-xs uppercase tracking-wider text-black hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          {subItem.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          </nav>
        </div>

        {/* Center Section: Logo */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <NavLink
            to="/"
            prefetch="intent"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            {!logoFailed ? (
              <img
                src="/bunker-logo.png"
                alt="BUNKER"
                className="h-32 md:h-48 lg:h-56 xl:h-64 w-auto object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold uppercase tracking-wider text-black leading-none">
                BUNKER
              </span>
            )}
          </NavLink>
        </div>

        {/* Right Section: Utility Links & Icons */}
        <div className="flex-1 flex items-center justify-end min-w-0">
          <nav className="flex items-center gap-1 md:gap-6 flex-shrink-0">
          {/* Audio Control - Only shown on homepage */}
          {showAudioControl && onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className="p-0.5 md:p-1 hover:opacity-70 transition-opacity text-black"
              aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {audioEnabled ? (
                <Volume2 size={14} strokeWidth={1.5} className="md:w-4 md:h-4" />
              ) : (
                <VolumeX size={14} strokeWidth={1.5} className="md:w-4 md:h-4" />
              )}
            </button>
          )}
          <button
            onClick={() => open('saved')}
            className="p-0.5 md:p-1 hover:opacity-70 transition-opacity text-black relative"
            aria-label="Saved items"
          >
            <Bookmark size={14} strokeWidth={1.5} className="md:w-4 md:h-4" />
            {isClient && savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-black text-white text-[8px] md:text-[10px] w-3 h-3 md:w-4 md:h-4 rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => open('cart')}
            className="p-0.5 md:p-1 hover:opacity-70 transition-opacity relative text-black"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={14} strokeWidth={1.5} className="md:w-4 md:h-4" />
            <Suspense fallback={null}>
              <Await resolve={cart}>
                {(cart) => {
                  if (cart && cart.totalQuantity > 0) {
                    return (
                      <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-black text-white text-[8px] md:text-[10px] w-3 h-3 md:w-4 md:h-4 rounded-full flex items-center justify-center">
                        {cart.totalQuantity}
                      </span>
                    );
                  }
                  return null;
                }}
              </Await>
            </Suspense>
          </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

