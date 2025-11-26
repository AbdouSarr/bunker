import {json, type LoaderFunctionArgs} from '@netlify/remix-runtime';
import {type MetaFunction, useRouteLoaderData} from '@remix-run/react';
import {BalenciagaHeader} from '~/components/BalenciagaHeader';
import type {RootLoader} from '~/root';

export const meta: MetaFunction = () => {
  return [{title: 'Bunker Studio | About'}];
};

export async function loader({}: LoaderFunctionArgs) {
  return json({});
}

export default function About() {
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

      {/* About Page Content */}
      <div className="pt-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Page Title */}
          <h1 className="text-4xl md:text-5xl font-normal uppercase tracking-wider text-black mb-12 text-center">
            ABOUT BUNKER
          </h1>

          {/* Main Content Sections */}
          <div className="space-y-16">
            {/* Our Story Section */}
            <section id="our-story">
              <h2 className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black mb-6">
                Our Story
              </h2>
              <div className="text-sm md:text-base uppercase tracking-wider text-black leading-relaxed space-y-4">
                <p>
                  BUNKER REPRESENTS A NEW ERA OF REFINED, HIGH-PERFORMANCE RESORT WEAR. 
                  CRAFTED WITH PRECISION FROM PREMIUM MATERIALS, EACH PIECE EMBODIES 
                  UNDERSTATED LUXURY AND VERSATILITY.
                </p>
                <p>
                  OUR DESIGN PHILOSOPHY CENTERS ON MINIMALIST AESTHETICS MEETING FUNCTIONAL 
                  EXCELLENCE. WE BELIEVE IN CREATING GARMENTS THAT SEAMLESSLY TRANSITION 
                  FROM RESORT LOUNGES TO EVENING ELEGANCE, ENSURING ALL-DAY COMFORT WITH 
                  A TOUCH OF HIGH-FASHION FLAIR.
                </p>
                <p>
                  EACH COLLECTION IS PRODUCED IN LIMITED QUANTITIES, EXCLUSIVELY FOR THE 
                  DISCERNING CUSTOMER WHO VALUES QUALITY, CRAFTSMANSHIP, AND TIMELESS DESIGN.
                </p>
              </div>
            </section>

            {/* Sustainability Section */}
            <section id="sustainability">
              <h2 className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black mb-6">
                Sustainability
              </h2>
              <div className="text-sm md:text-base uppercase tracking-wider text-black leading-relaxed space-y-4">
                <p>
                  SUSTAINABILITY AND INNOVATION ARE INTEGRAL TO OUR BRAND VALUES AND CREATIVE 
                  VISION. WE ARE COMMITTED TO CONCRETE ACTIONS WITH QUANTIFIED OBJECTIVES TO 
                  GUIDE OUR JOURNEY TOWARDS A LOWER ENVIRONMENTAL AND SOCIAL IMPACT.
                </p>
                <p>
                  OUR WORK IS BACKED BY FIGURES, PROGRESS REPORTS, AND KEY PERFORMANCE 
                  INDICATORS THAT HELP US DEVELOP OUR ROADMAP, DECISIONS, AND ACTIONS IN OUR 
                  OFFICES, STORES, AND SUPPLY CHAINS.
                </p>
                <p>
                  WE SOURCE PREMIUM MATERIALS FROM RESPONSIBLE SUPPLIERS AND IMPLEMENT 
                  SUSTAINABLE MANUFACTURING PRACTICES THROUGHOUT OUR PRODUCTION PROCESS.
                </p>
              </div>
            </section>

            {/* Craftsmanship Section */}
            <section>
              <h2 className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black mb-6">
                Craftsmanship
              </h2>
              <div className="text-sm md:text-base uppercase tracking-wider text-black leading-relaxed space-y-4">
                <p>
                  EVERY BUNKER PIECE IS METICULOUSLY CRAFTED WITH ATTENTION TO DETAIL. WE 
                  UTILIZE PREMIUM JAPANESE COTTONS, TECHNICAL FABRICS, AND INNOVATIVE 
                  CONSTRUCTION TECHNIQUES TO ENSURE DURABILITY AND COMFORT.
                </p>
                <p>
                  OUR GARMENTS FEATURE BREATHABLE, MOISTURE-WICKING LININGS, PRECISION 
                  TAILORING, AND THOUGHTFUL DESIGN ELEMENTS THAT ELEVATE EACH PIECE FROM 
                  SIMPLE CLOTHING TO REFINED FASHION STATEMENTS.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <h2 className="text-2xl md:text-3xl font-normal uppercase tracking-wider text-black mb-6">
                Contact
              </h2>
              <div className="text-sm md:text-base uppercase tracking-wider text-black leading-relaxed space-y-4">
                <p>
                  FOR INQUIRIES, CUSTOMER SERVICE, OR COLLABORATION OPPORTUNITIES, PLEASE 
                  REACH OUT TO US.
                </p>
                <div className="space-y-2">
                  <p>
                    <strong>EMAIL:</strong> INFO@BUNKERSTUDIO.COM
                  </p>
                  <p>
                    <strong>CUSTOMER SERVICE:</strong> AVAILABLE MON-FRI 9AM - 9PM ET
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

