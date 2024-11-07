import { Router } from 'express';
import {schemaVerifierMiddleware} from "../middlewares/schemaVerifier.middleware";
import {courseSchemaCreateUpdate, courseSchemaParams} from "../schemasJoi/course.schema";
import {
  createCourseController,
  deleteCourseController,
  getCourseController,
  listCourseController,
  updateCourseController
} from "../controllers/course.controller";
import {paginationSchema} from "../schemasJoi/pagination.schema";

const router = Router();

router.post('/', [schemaVerifierMiddleware({body: courseSchemaCreateUpdate})], createCourseController);
router.get('/', [schemaVerifierMiddleware({query: paginationSchema})], listCourseController);
router.get('/:id', [schemaVerifierMiddleware({params:courseSchemaParams})], getCourseController);
router.post('/:id', [schemaVerifierMiddleware({params:courseSchemaParams}), schemaVerifierMiddleware({body: courseSchemaCreateUpdate})], updateCourseController);
router.delete('/:id', [schemaVerifierMiddleware({params:courseSchemaParams})], deleteCourseController);

export { router };
