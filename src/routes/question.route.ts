import { Router } from 'express';
import {
  createQuestionController,
  updateQuestionController,
  getQuestionByIdController,
  listQuestionsController,
} from '../controllers/question.controller';

import { paginationSchema } from '../schemasJoi/pagination.schema';
import { schemaVerifierMiddleware } from '../middlewares/schemaVerifier.middleware';
import { questionSchemaParams } from '../schemasJoi/question.schema';

const router = Router();

router.post('/', createQuestionController);
// router.put('/', up);
router.get('/', [schemaVerifierMiddleware({query: paginationSchema})], listQuestionsController);
router.get('/:id', [schemaVerifierMiddleware({params: questionSchemaParams})], getQuestionByIdController);

export { router };
