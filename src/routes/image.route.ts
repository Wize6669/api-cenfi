import { Router } from 'express';
import { uploadImageController } from '../controllers/image.controller';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const router = Router();

router.post('/',[upload.single('question')], uploadImageController);

export { router };
