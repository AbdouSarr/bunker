import {NavLink, Await} from '@remix-run/react';
import {Suspense, useState} from 'react';
import {useAside} from '~/components/Aside';
import {Bookmark, ShoppingCart} from '~/components/icons';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';

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
  
  // Safe defaults if header is not available
  const safeHeader = header || { shop: { primaryDomain: { url: '' } } };

  // Single navigation link - optimized shopping experience
  const navLink = { title: 'READY-TO-WEAR', url: '/#products', onClick: (e: React.MouseEvent) => {
    e.preventDefault();
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#products';
    }
  }};

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-white border-t border-b border-black">
      {/* Single Row Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Navigation Link */}
        <nav className="flex items-center">
          <a
            href={navLink.url}
            onClick={navLink.onClick}
            className="text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity cursor-pointer"
          >
            {navLink.title}
          </a>
        </nav>

        {/* Center Logo - Prominent like Balenciaga */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {!logoFailed ? (
            <img
              src="/bunker-logo.png"
              alt="BUNKER"
              className="h-10 md:h-14 lg:h-20 xl:h-24 w-auto"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold uppercase tracking-wider text-black">
              BUNKER
            </span>
          )}
        </div>

        {/* Right Utility Links & Icons */}
        <nav className="flex items-center gap-6">
          <NavLink
            to="/signup"
            prefetch="intent"
            className="text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity"
          >
            SIGN UP
          </NavLink>
          <NavLink
            to="/account"
            prefetch="intent"
            className="text-xs uppercase tracking-wider font-normal text-black hover:opacity-70 transition-opacity"
          >
            <Suspense fallback="LOGIN">
              <Await resolve={isLoggedIn} errorElement="LOGIN">
                {(isLoggedIn) => (isLoggedIn ? 'ACCOUNT' : 'LOGIN')}
              </Await>
            </Suspense>
          </NavLink>
          <button
            onClick={() => open('search')}
            className="p-1 hover:opacity-70 transition-opacity text-black"
            aria-label="Saved items"
          >
            <Bookmark size={16} strokeWidth={1.5} />
          </button>
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

