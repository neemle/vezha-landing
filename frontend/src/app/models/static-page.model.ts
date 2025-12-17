export type PublicStaticPage = {
  slug: string;
  title: string;
  content: string;
  locale: string;
};

export type FooterLinkPage = {
  slug: string;
  title: string;
  titleLocale: string;
};

export type FooterLinkCategory = {
  code: string;
  title: string;
  titleLocale: string;
  pages: FooterLinkPage[];
};

export type FooterLinksResponse = {
  locale: string;
  categories: FooterLinkCategory[];
};

