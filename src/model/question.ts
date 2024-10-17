import {SimulatorId} from "./simulator";

export interface Question {
  id?: number;
  content: object;
  justification?: object;
  answer: number;
  categoryId?: number;
  simulators?: SimulatorId[]; // Relación many-to-many con simuladores
}


export interface QuestionCreate {
  id?: number;
  content: object;
  justification?: object;
  answer: number;
  options: OptionForm[];
  categoryId?: number;
  simulators?: SimulatorId[];  // Relación many-to-many con simuladores
}


export interface Option {
  id: number;
  content: object;
}


export interface OptionForm extends Omit<Option, 'id'> {
}

export interface QuestionCreateResponse extends Pick<Question, 'id' | 'categoryId' | 'simulators'> {
}

export interface QuestionList extends Question {
  categoryName?: string;
}
