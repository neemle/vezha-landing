/* eslint-disable max-len */
export type LandingContentPayload = {
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
  seo: { title: string; description: string };
};

export const DEFAULT_CONTENT: Record<string, LandingContentPayload> = {
  en: {
    locale: 'en',
    hero: {
      title: '24/7 Server Monitoring from $5/month',
      subtitle:
        'VEZHA 360 automatically detects early symptoms of failures and attacks to prevent business downtime.',
      priceNote: 'Automated 360° monitoring for Bitrix24 and critical servers.',
      badge: 'Always-on protection',
      bullets: [
        'Early warning for DoS/DDoS, CPU spikes, and frozen queues',
        'Disk, SSL, and database health before outages hit clients',
        'Instant alerts to Telegram or Email',
      ],
      primaryCta: 'Leave a request',
      telegramLabel: 'Contact via Telegram',
      emailLabel: 'Email us',
      telegramUrl: 'https://t.me/vezha360',
      email: 'support@vezha360.com',
    },
    painPoints: [
      {
        title: 'Overload & crash',
        description:
          'Server overload causes a crash. Attackers install miners or backdoors, stealing your data.',
        icon: 'alert',
      },
      {
        title: 'Errors & frozen queues',
        description:
          'Clients see 502/504/500 errors. Queues freeze, telephony and webhooks stop. Bitrix24 looks "glitchy".',
        icon: 'chain',
      },
      {
        title: 'Full disk → data loss',
        description:
          'A full disk breaks the server. It may not reboot. Deals, leads, and tasks can disappear permanently.',
        icon: 'disk',
      },
      {
        title: 'SSL expired',
        description:
          'The SSL certificate expires unnoticed. Clients see "Unsafe connection", and your site stops opening.',
        icon: 'lock',
      },
      {
        title: 'Unexplained slowness',
        description:
          'The system slows down for no visible reason, queries hang, and deals are not created.',
        icon: 'clock',
      },
    ],
    features: [
      {
        title: 'Early DoS/DDoS detection',
        description: 'Detects early symptoms of DoS/DDoS attacks to react before the site goes down.',
        icon: 'shield',
      },
      {
        title: 'Performance & peak load monitoring',
        description: 'Monitors CPU, RAM, Disk, and Network to detect overloads and anomalies.',
        icon: 'pulse',
      },
      {
        title: 'Disk space alerts',
        description: 'Sends alerts before the disk fills up completely, preventing crashes and data loss.',
        icon: 'disk',
      },
      {
        title: 'Database health',
        description: 'Tracks database health and warns of conditions that may lead to corruption or failure.',
        icon: 'db',
      },
      {
        title: 'SSL/TLS expiry alerts',
        description: 'Alerts you before SSL certificates expire, so clients never see "unsafe" warnings.',
        icon: 'lock',
      },
      {
        title: 'Easy setup & 360° dashboard',
        description: 'Simple onboarding and a unified dashboard that shows the full 360° picture.',
        icon: 'dashboard',
      },
      {
        title: 'Instant Telegram & Email alerts',
        description: 'Instant reactions via Telegram and Email so you can act before clients feel the impact.',
        icon: 'bell',
      },
    ],
    comparison: {
      highlight: 'Choose what is more beneficial: $20/hour vs $5/month.',
      sysadmin: {
        title: 'Sysadmin',
        description: 'From $20/hour. Human, reactive support. Not watching 24/7.',
        price: '$20/hour',
      },
      vezha: {
        title: 'VEZHA 360',
        description: 'From $5/month. Automated, proactive 24/7 monitoring of your infrastructure.',
        price: '$5/month',
        badge: 'Best value',
      },
    },
    metrics: {
      note: 'Always on duty, even at night and on holidays.',
      stats: [
        { label: 'Average reaction time', value: '200 ms' },
        { label: 'Subsystems watched', value: 'CPU · RAM · Network · Disk' },
        { label: 'Alerts', value: 'Telegram + Email' },
      ],
    },
    howItWorks: [
      { title: 'Connect your server', description: 'Add your endpoint or Bitrix24 host to VEZHA 360.' },
      { title: 'Configure parameters', description: 'Choose CPU, memory, network, disk, SSL, DB checks.' },
      { title: 'Receive instant alerts', description: 'Stay ahead with Telegram and Email notifications.' },
      { title: 'Prevent downtime', description: 'React before clients notice. Protect revenue and reputation.' },
    ],
    contact: {
      title: 'Ready for 360° protection?',
      subtitle: 'Leave a request and we’ll help you set up monitoring for your servers.',
      thankYou: 'Thank you! We received your request and will reply shortly.',
      telegramLabel: 'Write in Telegram',
      telegramUrl: 'https://t.me/vezha360',
      emailLabel: 'Email us',
      email: 'support@vezha360.com',
      form: {
        nameLabel: 'Name',
        emailLabel: 'Email',
        phoneLabel: 'Phone',
        messageLabel: 'Describe your infrastructure / Bitrix24 setup',
        submitLabel: 'Send request',
        errors: {
          requiredEmail: 'Email is required',
          invalidEmail: 'Enter a valid email',
        },
      },
    },
    seo: {
      title: 'VEZHA 360 - 24/7 server monitoring from $5/month',
      description:
        'VEZHA 360 keeps your servers and Bitrix24 stable with proactive monitoring, early DDoS detection, and instant Telegram/Email alerts.',
    },
  },
  ua: {
    locale: 'ua',
    hero: {
      title: 'Моніторинг серверів 24/7 від $5/місяць',
      subtitle:
        'План «Вежа 360» автоматично виявляє ранні симптоми збоїв та атак, щоб запобігти зупинці бізнесу.',
      priceNote: 'Автоматизований 360° моніторинг Bitrix24 та критичних сервісів.',
      badge: 'Завжди на варті',
      bullets: [
        'Раннє сповіщення про DoS/DDoS, піки CPU та завислі черги',
        'Диск, SSL та база даних під контролем до відмов',
        'Миттєві сповіщення у Telegram або Email',
      ],
      primaryCta: 'Залишити заявку',
      telegramLabel: 'Зв’язок у Telegram',
      emailLabel: 'Написати на Email',
      telegramUrl: 'https://t.me/vezha360',
      email: 'support@vezha360.com',
    },
    painPoints: [
      {
        title: 'Перевантаження та падіння',
        description: 'Перевантаження призводить до падіння сервера. Зловмисники ставлять майнери або бекдори.',
        icon: 'alert',
      },
      {
        title: 'Помилки та завислі черги',
        description:
          'Клієнти бачать 502/504/500. Черги зависають, телефонія та вебхуки не працюють. Bitrix24 здається «глючним».',
        icon: 'chain',
      },
      {
        title: 'Переповнений диск = втрата даних',
        description:
          'Переповнений диск ламає сервер. Він може не запуститися знову. Угоди, ліди та задачі зникають.',
        icon: 'disk',
      },
      {
        title: 'Прострочений SSL',
        description: 'Термін дії SSL закінчується непомітно. Клієнти бачать «Небезпечне з’єднання», сайт не відкривається.',
        icon: 'lock',
      },
      {
        title: 'Незрозуміле гальмування',
        description: 'Система повільна без явної причини: запити висять, угоди не створюються.',
        icon: 'clock',
      },
    ],
    features: [
      {
        title: 'Раннє виявлення DoS/DDoS атак',
        description: 'Виявляє ранні симптоми DoS/DDoS, щоб відреагувати до падіння сайту.',
        icon: 'shield',
      },
      {
        title: 'Моніторинг продуктивності та піків',
        description: 'Контролює CPU, пам’ять, диск та мережу, виявляючи пікові перевантаження та аномалії.',
        icon: 'pulse',
      },
      {
        title: 'Оповіщення про заповнення диска',
        description: 'Надсилає попередження до повного заповнення диска, запобігаючи збоям та втраті даних.',
        icon: 'disk',
      },
      {
        title: 'Стан бази даних',
        description: 'Контролює базу даних та попереджає про умови, що можуть призвести до пошкодження або збою.',
        icon: 'db',
      },
      {
        title: 'Попередження про закінчення SSL',
        description: 'Завчасно попереджає про завершення SSL, щоб клієнти не бачили «небезпечне» з’єднання.',
        icon: 'lock',
      },
      {
        title: 'Просте підключення та 360° дашборд',
        description: 'Єдина панель дає повну 360° картину стану серверів.',
        icon: 'dashboard',
      },
      {
        title: 'Миттєві сповіщення',
        description: 'Telegram та Email, щоб ви реагували ще до того, як клієнти відчують проблему.',
        icon: 'bell',
      },
    ],
    comparison: {
      highlight: 'Обирайте, що вигідніше: 20$/год проти 5$/місяць.',
      sysadmin: {
        title: 'Системний адміністратор',
        description: 'Від 20$/год. Людська, реактивна підтримка. Не стежить 24/7.',
        price: '20$/год',
      },
      vezha: {
        title: 'Вежа 360',
        description: 'Від 5$/місяць. Автоматизований, проактивний 24/7-моніторинг вашої інфраструктури.',
        price: '5$/місяць',
        badge: 'Краща вигода',
      },
    },
    metrics: {
      note: 'Завжди на варті, навіть вночі та у свята.',
      stats: [
        { label: 'Середній час реакції', value: '200 мс' },
        { label: 'Що моніторимо', value: 'CPU · Пам’ять · Мережа · Диск' },
        { label: 'Канали сповіщень', value: 'Telegram + Email' },
      ],
    },
    howItWorks: [
      { title: 'Підключіть сервер', description: 'Додайте свій сервер або Bitrix24 хост у Вежа 360.' },
      { title: 'Налаштуйте параметри', description: 'CPU, пам’ять, мережа, диск, SSL, база даних.' },
      { title: 'Отримуйте сповіщення', description: 'Telegram та Email сповіщають до інциденту.' },
      { title: 'Запобігайте простоям', description: 'Реагуйте до того, як клієнти побачать проблему.' },
    ],
    contact: {
      title: 'Готові до захисту на 360°?',
      subtitle: 'Залиште заявку, і ми допоможемо налаштувати моніторинг ваших серверів.',
      thankYou: 'Дякуємо! Ми отримали заявку та відповімо найближчим часом.',
      telegramLabel: 'Написати в Telegram',
      telegramUrl: 'https://t.me/vezha360',
      emailLabel: 'Написати на Email',
      email: 'support@vezha360.com',
      form: {
        nameLabel: "Ім'я",
        emailLabel: 'Email',
        phoneLabel: 'Телефон',
        messageLabel: 'Опишіть свою інфраструктуру / Bitrix24',
        submitLabel: 'Надіслати заявку',
        errors: {
          requiredEmail: 'Потрібен email',
          invalidEmail: 'Вкажіть коректний email',
        },
      },
    },
    seo: {
      title: 'Вежа 360 - моніторинг серверів 24/7 від $5/місяць',
      description:
        'Вежа 360 забезпечує стабільність серверів та Bitrix24: проактивний моніторинг, раннє виявлення DDoS та миттєві сповіщення.',
    },
  },
};
