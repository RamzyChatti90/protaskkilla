import dayjs from 'dayjs/esm';

import { ITask, NewTask } from './task.model';

export const sampleWithRequiredData: ITask = {
  id: 9181,
  name: 'or consequently',
};

export const sampleWithPartialData: ITask = {
  id: 24321,
  name: 'ride whenever',
  description: '../fake-data/blob/hipster.txt',
};

export const sampleWithFullData: ITask = {
  id: 13396,
  name: 'where wherever',
  description: '../fake-data/blob/hipster.txt',
  createdAt: dayjs('2026-04-15T21:09'),
};

export const sampleWithNewData: NewTask = {
  name: 'expostulate',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
