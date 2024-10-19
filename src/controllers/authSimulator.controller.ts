import { Request, Response } from 'express';

const signInSimulatorController = async (req: Request, res: Response) => {
  const { simulatorId, password } = req.body;

  const result = await signInSimulatorController(simulatorId, password);

  if('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  res.status(200).json(result);
}
