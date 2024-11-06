import { Router } from 'express';
import {
  createResultController, deleteResultController,
  getResultByIdController, listResultController,
  updateResultController
} from "../controllers/result.controller";
import {schemaVerifierMiddleware} from "../middlewares/schemaVerifier.middleware";
import {createResultSchema, resultSchemaParams, updateResultSchema} from "../schemasJoi/result.schema";
import {paginationSchema} from "../schemasJoi/pagination.schema";

const router = Router();

router.post('/',[schemaVerifierMiddleware({body: createResultSchema})], createResultController);
router.put('/:id', [schemaVerifierMiddleware({params: resultSchemaParams}), schemaVerifierMiddleware({body: updateResultSchema})], updateResultController);
router.get('/:id', [schemaVerifierMiddleware({params: resultSchemaParams})], getResultByIdController)
router.delete('/:id', [schemaVerifierMiddleware({params: resultSchemaParams})], deleteResultController);
router.get('/', [schemaVerifierMiddleware({query: paginationSchema})], listResultController);

export { router };

