import {Await, Link} from '@remix-run/react';
import {Suspense, useId, useState, useCallback, useEffect} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside, useAside} from '~/components/Aside';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import {Footer} from '~/components/Footer';
import {AudioProvider, useAudio} from '~/contexts/AudioContext';
import {getSavedItems, removeItem, type SavedProduct} from '~/lib/savedItems';
import {Bookmark} from '~/components/icons';
import {AddToCartButton} from '~/components/AddToCartButton';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  return (
    <AudioProvider>
      <PageLayoutContent
        cart={cart}
        footer={footer}
        header={header}
        isLoggedIn={isLoggedIn}
        publicStoreDomain={publicStoreDomain}
      >
        {children}
      </PageLayoutContent>
    </AudioProvider>
  );
}

function PageLayoutContent({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const {audioEnabled, toggleAudio} = useAudio();
  const [showStorefront, setShowStorefront] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if we're on the homepage to show the storefront
    if (typeof window !== 'undefined') {
      setShowStorefront(window.location.pathname === '/');

      // Calculate actual header height and set CSS variable
      const updateHeaderHeight = () => {
        const header = document.querySelector('header');
        if (header) {
          const height = header.offsetHeight;
          document.documentElement.style.setProperty('--header-height', `${height}px`);
        }
      };

      // Update on mount and resize
      updateHeaderHeight();
      window.addEventListener('resize', updateHeaderHeight);

      // Also update after a short delay to ensure logo is loaded
      setTimeout(updateHeaderHeight, 100);

      return () => window.removeEventListener('resize', updateHeaderHeight);
    }
  }, []);

  // Listen for custom events from child components to control audio and storefront visibility
  useEffect(() => {
    const handleShowStorefront = () => setShowStorefront(true);
    window.addEventListener('storefrontLoaded', handleShowStorefront);
    return () => window.removeEventListener('storefrontLoaded', handleShowStorefront);
  }, []);

  const isHomepage = isClient && window.location.pathname === '/';
  const shouldShowHeaderFooter = !isHomepage || showStorefront;

  return (
    <Aside.Provider>
      {shouldShowHeaderFooter && (
        <BalenciagaHeader
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
          audioEnabled={audioEnabled}
          onToggleAudio={toggleAudio}
          showAudioControl={isClient && showStorefront && isHomepage}
          isVisible={true}
        />
      )}
      <CartAside cart={cart} />
      <SavedAside />
      <MobileNavigationAside />
      <main>{children}</main>
      {isClient && shouldShowHeaderFooter && <Footer />}
    </Aside.Provider>
  );
}

function MobileNavigationAside() {
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

  const {close} = useAside();

  const handleNavClick = (url: string) => {
    if (url.startsWith('/#')) {
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
        close();
      } else {
        window.location.href = url;
      }
    } else if (url.includes('#')) {
      const [path, hash] = url.split('#');
      if (path === window.location.pathname) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          close();
        }
      } else {
        window.location.href = url;
      }
    } else {
      close();
    }
  };

  return (
    <Aside type="mobile" heading="MENU">
      <nav className="flex flex-col gap-6 mt-4">
        {navigationMenu.map((section) => (
          <div key={section.title}>
            <Link
              to={section.url}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(section.url);
              }}
              className="text-sm uppercase tracking-wider font-medium text-black mb-3 block hover:opacity-70 transition-opacity"
            >
              {section.title}
            </Link>
            {section.items && section.items.length > 0 && (
              <div className="flex flex-col gap-2 ml-4">
                {section.items.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.url);
                    }}
                    className="text-xs uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </Aside>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Suspense fallback={<Aside type="cart" heading="SHOPPING CART"><p>Loading cart ...</p></Aside>}>
      <Await resolve={cart}>
        {(cart) => {
          const itemCount = cart?.totalQuantity ?? 0;
          const heading = itemCount === 1 ? `SHOPPING CART (${itemCount} item)` : `SHOPPING CART (${itemCount} items)`;
          return (
            <Aside type="cart" heading={heading}>
              <CartMain cart={cart} layout="aside" />
            </Aside>
          );
        }}
      </Await>
    </Suspense>
  );
}

function SavedAside() {
  const {close, open} = useAside();
  const [savedItems, setSavedItems] = useState<SavedProduct[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSavedItems(getSavedItems());

    const handleStorageChange = () => {
      setSavedItems(getSavedItems());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('savedItemsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedItemsChanged', handleStorageChange);
    };
  }, []);

  const handleRemove = (productId: string) => {
    removeItem(productId);
    setSavedItems(getSavedItems());
  };

  const handleAddToCart = () => {
    close();
    open('cart');
  };

  const itemCount = savedItems.length;
  const heading = itemCount === 1 ? `SAVED ITEMS (${itemCount} item)` : `SAVED ITEMS (${itemCount} items)`;

  return (
    <Aside type="saved" heading={heading}>
      <div className="h-full flex flex-col">
        {!isClient ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-mono">
              Loading...
            </p>
          </div>
        ) : savedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm uppercase tracking-wider text-gray-500 mb-4 font-mono">
              No saved items yet
            </p>
            <button
              onClick={close}
              className="text-xs uppercase tracking-wider text-black hover:opacity-70 transition-opacity font-mono"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0 self-stretch">
                      <Link
                        to={`/products/${item.handle}`}
                        onClick={close}
                        prefetch="intent"
                        className="block"
                      >
                        <div className="w-[80px] h-full bg-gray-50 border border-gray-200 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[8px] uppercase tracking-wider text-gray-400">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        to={`/products/${item.handle}`}
                        onClick={close}
                        prefetch="intent"
                        className="text-black hover:text-gray-600 font-medium uppercase tracking-wide block mb-2 font-mono text-sm"
                      >
                        {item.title}
                      </Link>

                      <div className="mb-2 font-mono text-sm">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: item.currencyCode,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(parseFloat(item.price))}
                      </div>

                      <div className="mt-auto space-y-2">
                        {item.variantId && (
                          <AddToCartButton
                            onClick={handleAddToCart}
                            lines={[
                              {
                                merchandiseId: item.variantId,
                                quantity: 1,
                              },
                            ]}
                            className="w-full px-4 py-2 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors font-mono"
                          >
                            Add to Cart
                          </AddToCartButton>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-xs uppercase tracking-wider text-gray-500 hover:text-black font-mono"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
