import {Question, QuestionCreate} from "./question";

interface CategoryQuestions {
  categoryId: number;
  numberOfQuestions: number;
}

export interface Simulator {
  id: string;
  name: string;
  duration: number;
  navigate: boolean;
  visibility: boolean;
  review: boolean;
  durationReview: number;
  number_of_questions: number;
  questions?: Question[];
}

export interface AuthSimulator extends Omit<Simulator, 'questions'> {}

export interface SimulatorChangePassword extends Pick<Simulator, 'id'>{}

export interface SimulatorWithQuestions extends Simulator {
  password?: string;
  questions: Question[];
  categoryQuestions: CategoryQuestions[];
}

export interface SimulatorRequest {
  name: string;
  password: string;
  duration: number;
  navigate: boolean;
  visibility: boolean;
  review: boolean;
  durationReview?: number;
  categoryQuestions: CategoryQuestions[];
}

export interface SimulatorResponse {
  id: string;
  name: string;
  duration: number;
  visibility: boolean;
  navigate: boolean;
  review: boolean;
  durationReview: number;
  number_of_questions: number;
  questions?: QuestionCreate[];
}

export interface SimulatorUpdate {
  id?: string;
  name: string;
  duration: number;
  navigate: boolean;
  visibility: boolean;
  review: boolean;
  durationReview: number;
  categoryQuestions?: CategoryQuestions[];
}

export interface SimulatorId {
  id: string;
}
