import dayjs from 'dayjs/esm';

import { ICategory, NewCategory } from './category.model';

export const sampleWithRequiredData: ICategory = {
  id: 8109,
  name: 'midst croon cautiously',
};

export const sampleWithPartialData: ICategory = {
  id: 7001,
  name: 'mmm summarise far',
  description: '../fake-data/blob/hipster.txt',
  createdAt: dayjs('2026-04-16T05:19'),
};

export const sampleWithFullData: ICategory = {
  id: 28780,
  name: 'ouch',
  description: '../fake-data/blob/hipster.txt',
  createdAt: dayjs('2026-04-15T19:14'),
};

export const sampleWithNewData: NewCategory = {
  name: 'where pfft regularly',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
