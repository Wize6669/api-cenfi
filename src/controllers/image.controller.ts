import { Request, Response } from 'express';
import { uploadImageService } from '../services/image.service';

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

export {
  uploadImageController,
};
