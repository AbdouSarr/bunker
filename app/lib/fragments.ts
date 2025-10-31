// Define the TypeScript type for the Product3DData fragment
export type Product3DDataFragment = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  descriptionHtml: string;
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      price: {
        amount: string;
        currencyCode: string;
      };
      availableForSale: boolean;
    }>;
  };
  mdx_model: {
    reference: {
      url?: {value: string};
      scale?: {value:string};
      position?: {value: string};
      rotation?: {value: string};
    } | null;
  } | null;
};

// Existing Money fragment
export const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
` as const;

// Common metaobject fragment for reusability
const METAOBJECT_3D_REFERENCE_FRAGMENT = `#graphql
  fragment Metaobject3DFields on Metaobject {
    url: field(key: "url") { value }
    scale: field(key: "scale") { value }
    position: field(key: "position") { value }
    rotation: field(key: "rotation") { value }
  }

  fragment Product3DDataMetafield on Product {
    mdx_model: metafield(namespace: "custom", key: "mdx_model") {
      reference {
        ... on Metaobject {
          ...Metaobject3DFields
        }
      }
    }
  }
`;

// Defines the cart line data, assuming other fragments are present in the query.
export const CART_LINE_FRAGMENT = `#graphql
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
          ...Product3DDataMetafield
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

// This is the single, valid query document for the cart.
// It combines all necessary fragments without duplicates.
export const CART_QUERY_FRAGMENT = `#graphql
  ${MONEY_FRAGMENT}
  ${METAOBJECT_3D_REFERENCE_FRAGMENT}
  ${CART_LINE_FRAGMENT}

  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      lastCharacters
      amountUsed {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

// Menu fragments remain unchanged
export const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

export const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;