import {Request, Response} from 'express';
import {
  createSimulatorService,
  deleteSimulatorService,
  getSimulatorByIdService, resetSimulatorPasswordService, simulatorListService,
  updateSimulatorService
} from "../services/simulator.service";

const createSimulatorController = async (req: Request, res: Response) => {
  const {name, password, duration, navigate, review, durationReview, visibility, categoryQuestions} = req.body;
  const result = await createSimulatorService({
    name,
    password,
    duration,
    navigate,
    review,
    durationReview,
    visibility,
    categoryQuestions: categoryQuestions || []
  })

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }
  res.status(201).json({message: 'Simulator created successfully'});
}

const updateSimulatorController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, duration, navigate, review, durationReview,visibility, categoryQuestions } = req.body;
  const result = await updateSimulatorService({
    id,
    name,
    duration,
    navigate,
    review,
    visibility,
    durationReview,
    categoryQuestions: categoryQuestions || undefined
  })

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }
  res.status(201).json(result);
}

const deleteSimulatorController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteSimulatorService(id);

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(result.code).json(result);
}

const getSimulatorByIdController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const result = await getSimulatorByIdService(id);

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(200).json(result);
}

const simulatorListController = async (req: Request, res: Response) => {
  const {page, count} = req.query;
  const pageAux = Number(page)
  const countAux = Number(count)
  const result = await simulatorListService(pageAux, countAux);

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(200).json(result);
}

const resetSimulatorPasswordController = async (req: Request, res: Response) => {
  const { id, newPassword } = req.body;

  const result = await resetSimulatorPasswordService(id, newPassword);

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(200).json(result);
}

export {
  createSimulatorController,
  deleteSimulatorController,
  simulatorListController,
  updateSimulatorController,
  getSimulatorByIdController,
  resetSimulatorPasswordController
};
