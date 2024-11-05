export interface Result {
  id: number;
  name: string;
  score: number;
  career: string;
  size: number;
  imageUrl: string;
}

export interface CreateResultInput {
  name: string;
  score: number;
  size: number;
  career: string;
  image: Express.Multer.File;
}

export interface UpdateResultInput {
  name?: string;
  score?: number;
  size?: number;
  career?: string;
  image?: Express.Multer.File;
}

export interface ResultList extends Omit<Result, 'id'> {}
