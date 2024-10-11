import { Request, Response } from 'express';
import { createQuestionService, uploadImageService } from '../services/question.service';

const createQuestionController = async (req: Request, res: Response) => {
  const {categoryId, answer, question, justification, options} = req.body;

  const result = await createQuestionService({
    content: question,
    justification,
    options,
    categoryId,
    answer
  });

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(201).json({message: 'Category created successfully.'});
};

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

export { createQuestionController, uploadImageController };
