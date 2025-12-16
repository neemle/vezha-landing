export type Lead = {
  id: number;
  name?: string | null;
  email: string;
  phone?: string | null;
  message?: string | null;
  lang?: string | null;
  bad: boolean;
  createdAt: string;
  exportedAt?: string | null;
};
