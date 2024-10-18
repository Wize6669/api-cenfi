import { Request, Response } from 'express';
import {
  createQuestionService,
  getQuestionByIdService,
  questionListService,
  uploadImageService
} from '../services/question.service';

const createQuestionController = async (req: Request, res: Response) => {
  const {categoryId, question, justification, options} = req.body;

  const result = await createQuestionService({
    content: question,
    justification,
    options,
    categoryId,
  });

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(201).json({message: 'Category created successfully.'});
};

const getQuestionByIdController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);

  const result = await getQuestionByIdService(numericId);
  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }
  res.status(200).json(result);
}


const listQuestionsController = async (req: Request, res: Response) => {
  const {page, count} = req.query;
  const pageAux = Number(page);
  const countAux = Number(count);
  const result = await questionListService(pageAux, countAux);
  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }
  res.status(200).json(result);
}


const uploadImageController = async (req: Request, res: Response) => {

  const {type} = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({message: 'No file uploaded'});
  }

  const result = await uploadImageService(type, file);

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(result.code).json(result);
};

export { createQuestionController, uploadImageController, listQuestionsController, getQuestionByIdController };
