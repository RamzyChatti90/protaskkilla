import dayjs from 'dayjs/esm';

export interface ICategory {
  id: number;
  name?: string | null;
  description?: string | null;
  createdAt?: dayjs.Dayjs | null;
}

export type NewCategory = Omit<ICategory, 'id'> & { id: null };
