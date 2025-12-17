export type AdminPageCategory = {
  id: number;
  code: string;
  active: boolean;
  title: string;
  titleLocale: string;
  hasLocaleTranslation: boolean;
};

export type AdminStaticPageListItem = {
  id: number;
  slug: string;
  published: boolean;
  title: string;
  titleLocale: string;
  hasLocaleTranslation: boolean;
  category: {
    id: number;
    code: string;
    title: string;
    titleLocale: string;
  };
};

export type AdminStaticPage = {
  id: number;
  slug: string;
  published: boolean;
  categoryId: number;
  title: string;
  content: string;
  translationLocale: string;
  hasLocaleTranslation: boolean;
};

