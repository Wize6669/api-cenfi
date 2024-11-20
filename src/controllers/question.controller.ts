import { Request, Response } from 'express';
import {
  createQuestionService,
  updateQuestionService,
  getQuestionByIdService,
  questionListService, deleteQuestionService,
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

    return res.status(result.code).json({error: result.error});
  }

  res.status(201).json({message: 'Category created successfully.'});
};

const updateQuestionController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id);
  const {categoryId, question, justification, options} = req.body;

  const result = await updateQuestionService(numericId, {
    content: question,
    justification,
    options,
    categoryId,
  });

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json({message: 'Category updated successfully.'});
};

const deleteQuestionController = async (req: Request, res: Response)  => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);
  const result = await deleteQuestionService(numericId);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  return res.status(result.code).send('');
}

const getQuestionByIdController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);
  const result = await getQuestionByIdService(numericId);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
};

const listQuestionsController = async (req: Request, res: Response) => {
  const {page, count} = req.query;
  const pageAux = Number(page);
  const countAux = Number(count);
  const result = await questionListService(pageAux, countAux);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  return res.status(200).json(result);
};

export {
  createQuestionController,
  updateQuestionController,
  deleteQuestionController,
  listQuestionsController,
  getQuestionByIdController
};
