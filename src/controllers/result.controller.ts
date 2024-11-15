import { Request, Response } from 'express';
import {
  createResultService,
  deleteResultService,
  getResultByIdService,
  resultListService,
  updateResultService
} from '../services/result.service';

const createResultController = async (req: Request, res: Response) => {
  const { name, score, order, career } = req.body;
  const image = req.file;

  if (!image) {
    return res.status(400).json({ message: 'No se ha proporcionado una imagen' });
  }

  const result = await createResultService({
    name,
    score: parseFloat(score),
    order: parseInt(order),
    career,
    image,
  });

  if ('error' in result) {
    return res.status(result.code).json({ message: result.error });
  }

  res.status(201).json({ message: 'Resultado creado exitosamente', result });
};

const updateResultController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, score, order, career } = req.body;
  const image = req.file;

  const result = await updateResultService(parseInt(id), {
    name,
    score: score ? parseFloat(score) : undefined,
    order: order ? parseInt(order) : undefined,
    career,
    image,
  });

  if ('error' in result) {
    return res.status(result.code).json({ message: result.error });
  }

  res.status(200).json({ message: 'Resultado actualizado exitosamente', result });
};

const listResultController = async (req: Request, res: Response) => {
  const {page, count} = req.query;
  const pageAux = Number(page);
  const countAux = Number(count);

  const result = await resultListService(pageAux, countAux);
  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  return res.status(200).json(result);
}

const getResultByIdController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);
  const result = await getResultByIdService(numericId);

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(200).json(result);
}

const deleteResultController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);
  const result = await deleteResultService(numericId);

  if ('error' in result) {

    return res.status(result.code).json({message: result.error});
  }

  return res.status(result.code).send('');
}

export {
  createResultController, updateResultController, listResultController, getResultByIdController, deleteResultController
}
