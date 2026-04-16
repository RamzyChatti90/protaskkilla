import dayjs from 'dayjs/esm';

export interface ITask {
  id: number;
  name?: string | null;
  description?: string | null;
  createdAt?: dayjs.Dayjs | null;
}

export type NewTask = Omit<ITask, 'id'> & { id: null };
