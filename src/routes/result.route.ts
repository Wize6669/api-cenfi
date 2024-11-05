import { Router } from 'express';
import {
  createResultController, deleteResultController,
  getResultByIdController, listResultController,
  updateResultController
} from "../controllers/result.controller";
import {schemaVerifierMiddleware} from "../middlewares/schemaVerifier.middleware";
import {createResultSchema, resultSchemaParams, updateResultSchema} from "../schemasJoi/result.schema";

const router = Router();

router.post('/',[schemaVerifierMiddleware({body: createResultSchema})], createResultController);
router.put('/:id', [schemaVerifierMiddleware({params: resultSchemaParams}), schemaVerifierMiddleware({body: updateResultSchema})], updateResultController);
router.get('/:id', [schemaVerifierMiddleware({params: resultSchemaParams})], getResultByIdController)
router.get('/:id', [schemaVerifierMiddleware({params: resultSchemaParams})], deleteResultController);
router.get('/', [schemaVerifierMiddleware({query: resultSchemaParams})], listResultController);

export { router };

