import dayjs from 'dayjs/esm';

import { IComment, NewComment } from './comment.model';

export const sampleWithRequiredData: IComment = {
  id: 20452,
  name: 'and better',
};

export const sampleWithPartialData: IComment = {
  id: 19140,
  name: 'yum',
  description: '../fake-data/blob/hipster.txt',
  createdAt: dayjs('2026-04-15T22:27'),
};

export const sampleWithFullData: IComment = {
  id: 28427,
  name: 'testing ugh',
  description: '../fake-data/blob/hipster.txt',
  createdAt: dayjs('2026-04-16T03:04'),
};

export const sampleWithNewData: NewComment = {
  name: 'metabolise pish jubilant',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
