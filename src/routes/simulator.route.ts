import { Router } from 'express';
import {schemaVerifierMiddleware} from "../middlewares/schemaVerifier.middleware";
import {
  createSimulatorSchema,
  simulatorSchemaParams,
  updateSimulatorSchema
} from "../schemasJoi/simulator.schema";
import {
  createSimulatorController, deleteSimulatorController,
  getSimulatorByIdController,
  simulatorListController, updateSimulatorController
} from "../controllers/simulator.controller";
import {paginationSchema} from "../schemasJoi/pagination.schema";

const router = Router();

router.get('/', [schemaVerifierMiddleware({query: paginationSchema})], simulatorListController);
router.get('/:id', [schemaVerifierMiddleware({params: simulatorSchemaParams})],getSimulatorByIdController);
router.post('/', [schemaVerifierMiddleware({body: createSimulatorSchema})],createSimulatorController);
router.post('/:id', [schemaVerifierMiddleware({params: simulatorSchemaParams}), schemaVerifierMiddleware({body: updateSimulatorSchema})], updateSimulatorController);
router.delete('/:id', [schemaVerifierMiddleware({params: simulatorSchemaParams})], deleteSimulatorController);

export { router };
