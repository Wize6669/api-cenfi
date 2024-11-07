import { Request, Response } from 'express';
import {singInSimulatorService} from "../services/authSimulator.service";
import {generateAccessToken} from "../utils/generateJWT.util";

const signInSimulatorController = async (req: Request, res: Response) => {
  const { simulatorId, password } = req.body;

  const result = await singInSimulatorService(simulatorId, password);

  if('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  const token = generateAccessToken(result);

  res.status(200).json({...result, token});
}

export { signInSimulatorController }
