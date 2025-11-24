import {NavLink, Await} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import {useAside} from '~/components/Aside';
import {Bookmark, ShoppingCart, ChevronDown} from '~/components/icons';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {getSavedItems} from '~/lib/savedItems';

interface BalenciagaHeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

export function BalenciagaHeader({
  header,
  cart,
  isLoggedIn,
  publicStoreDomain,
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
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-white border-t border-b border-black">
      {/* Single Row Navigation Bar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 relative">
        {/* Left Navigation Menu - Balenciaga Style with Text Dropdown */}
        <nav className="flex items-center gap-4 md:gap-6 flex-shrink-0 relative z-50">
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
                className="flex items-center gap-1 text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
              >
                {item.title}
                {item.items && item.items.length > 0 && (
                  <ChevronDown size={12} className="opacity-70" />
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

        {/* Center Logo - 2x Larger, clearly visible - Clickable to home */}
        <NavLink
          to="/"
          prefetch="intent"
          className="absolute left-1/2 -translate-x-1/2 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
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
        </NavLink>

        {/* Right Utility Links & Icons - Compact on mobile */}
        <nav className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          {/* Sign Up Link - Visible on all devices */}
          <NavLink
            to="/signup"
            prefetch="intent"
            className="text-[10px] md:text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            SIGN UP
          </NavLink>
          {/* Login/Account Link - Visible on all devices */}
          <NavLink
            to="/account"
            prefetch="intent"
            className="text-[10px] md:text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            <Suspense fallback="LOGIN">
              <Await resolve={isLoggedIn} errorElement="LOGIN">
                {(isLoggedIn) => (isLoggedIn ? 'ACCOUNT' : 'LOGIN')}
              </Await>
            </Suspense>
          </NavLink>
          <NavLink
            to="/saved"
            prefetch="intent"
            className="p-1 hover:opacity-70 transition-opacity text-black relative"
            aria-label="Saved items"
          >
            <Bookmark size={16} strokeWidth={1.5} />
            {isClient && savedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </NavLink>
          <button
            onClick={() => open('cart')}
            className="p-1 hover:opacity-70 transition-opacity relative text-black"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={16} strokeWidth={1.5} />
            <Suspense fallback={null}>
              <Await resolve={cart}>
                {(cart) => {
                  if (cart && cart.totalQuantity > 0) {
                    return (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
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
    </header>
  );
}

