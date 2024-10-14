import {Router} from 'express';
import {
  createQuestionController,
  getQuestionByIdController, listQuestionsController,
  uploadImageController
} from '../controllers/question.controller';
import multer from 'multer';
import {paginationSchema} from "../schemasJoi/pagination.schema";
import {schemaVerifierMiddleware} from "../middlewares/schemaVerifier.middleware";
import {questionSchemaParams} from "../schemasJoi/question.schema";

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const router = Router();

router.post('/', createQuestionController);
router.get('/', [schemaVerifierMiddleware({query:paginationSchema})], listQuestionsController);
router.get('/:id',[schemaVerifierMiddleware({params: questionSchemaParams})], getQuestionByIdController);
router.post('/images', [upload.single('question')], uploadImageController);

export {router};
