export interface Question {
  id?: number;
  content: object;
  justification?: object;
  answer: number;
  categoryId?: number;
  simulatorId?: string;
}

export interface QuestionCreate {
  id?: number;
  content: object;
  justification?: object;
  answer: number;
  options: OptionForm[];
  categoryId?: number;
  simulatorId?: string;
}

export interface Option {
  id: number;
  content: object;
}


export interface OptionForm extends Omit<Option, 'id'> {
}

export interface QuestionCreateResponse extends Pick<Question, 'id' | 'categoryId' | 'simulatorId'> {
}

export interface QuestionList extends Question {
  categoryName?: string;
}
