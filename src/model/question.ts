import { SimulatorId } from './simulator';

export interface Question {
  id?: number;
  content: object;
  justification?: object;
  categoryId?: number;
  simulators?: SimulatorId[]; // Relación many-to-many con simuladores
}

export interface QuestionCreate {
  id?: number;
  content: object;
  justification?: object;
  options: OptionForm[];
  categoryId?: number;
  simulators?: SimulatorId[];  // Relación many-to-many con simuladores
}

export interface Option {
  id: number;
  content: object;
  isCorrect: boolean;
}

export interface OptionForm extends Omit<Option, 'id'> {
}

export interface QuestionCreateResponse extends Pick<Question, 'id' | 'categoryId' | 'simulators'> {
}

export interface QuestionList extends Question {
  categoryName?: string;
  superCategoryId?: number;
  options?: Option[];
}

export interface QuestionGet extends Question {
  categoryName?: string;
  superCategoryId?: number;
  options: object;
}

export interface QuestionGet extends Question {
  categoryName?: string;
  options: object;
}

export interface QuestionGet extends Question {
  categoryName?: string;
  options:object;
}
