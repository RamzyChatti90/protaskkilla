import dayjs from 'dayjs/esm';

export interface IComment {
  id: number;
  name?: string | null;
  description?: string | null;
  createdAt?: dayjs.Dayjs | null;
}

export type NewComment = Omit<IComment, 'id'> & { id: null };
