export type LandingContent = {
  active?: boolean;
  locale: string;
  hero: {
    title: string;
    subtitle: string;
    priceNote: string;
    badge: string;
    bullets: string[];
    primaryCta: string;
    telegramLabel: string;
    emailLabel: string;
    telegramUrl: string;
    email: string;
  };
  painPoints: Array<{ title: string; description: string; icon: string }>;
  features: Array<{ title: string; description: string; icon: string }>;
  comparison: {
    highlight: string;
    sysadmin: { title: string; description: string; price: string };
    vezha: { title: string; description: string; price: string; badge: string };
  };
  metrics: {
    note: string;
    stats: Array<{ label: string; value: string }>;
  };
  howItWorks: Array<{ title: string; description: string }>;
  contact: {
    title: string;
    subtitle: string;
    thankYou: string;
    telegramLabel: string;
    telegramUrl: string;
    emailLabel: string;
    email: string;
    form: {
      nameLabel: string;
      emailLabel: string;
      phoneLabel: string;
      messageLabel: string;
      submitLabel: string;
      errors: {
        requiredEmail: string;
        invalidEmail: string;
      };
    };
  };
  seo: {
    title: string;
    description: string;
  };
};
