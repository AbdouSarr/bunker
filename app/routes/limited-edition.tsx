import {type MetaFunction} from '@remix-run/react';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';
import {useRouteLoaderData} from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [{title: 'Bunker Studio | Limited Edition'}];
};

export default function LimitedEdition() {
  const rootData = useRouteLoaderData<RootLoader>('root');

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

      {/* Limited Edition Page Content */}
      <div className="pt-20">
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-normal uppercase tracking-wider text-black mb-12">
              Limited Edition
            </h1>
            
            <div className="text-base md:text-lg uppercase tracking-wider text-black leading-relaxed space-y-6">
              <p>
                LIMITED EDITION BUNKER PIECES ARE ONE-OF-ONE DESIGNS CREATED FOR OUR 
                SPECIALIZED BUNKER CLIENTELE OR HAND-SELECTED INDIVIDUALS OF THE BRAND'S 
                CHOOSING WHO ALIGN WITH OUR ETHOS.
              </p>
              <p>
                LIMITED PRODUCTION ENSURES EXCLUSIVITY AND UNIQUENESS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

