import { Router } from 'express';
import {
  createResultController,
  deleteResultController,
  getResultByIdController,
  listResultController,
  updateResultController
} from '../controllers/result.controller';
import { schemaVerifierMiddleware } from '../middlewares/schemaVerifier.middleware';
import { resultSchemaParams, updateResultSchema } from '../schemasJoi/result.schema';
import { paginationSchema } from '../schemasJoi/pagination.schema';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.post('/', [upload.single('image')], createResultController);
router.put('/:id', [upload.single('image'), schemaVerifierMiddleware({ params: resultSchemaParams }), schemaVerifierMiddleware({ body: updateResultSchema })], updateResultController);
router.get('/:id', [schemaVerifierMiddleware({ params: resultSchemaParams })], getResultByIdController);
router.delete('/:id', [schemaVerifierMiddleware({ params: resultSchemaParams })], deleteResultController);
router.get('/', [schemaVerifierMiddleware({ query: paginationSchema })], listResultController);

export { router };

