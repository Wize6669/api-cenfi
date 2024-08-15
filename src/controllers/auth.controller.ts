import { Request, Response } from 'express';
import { signUpService, signInService } from '../services/auth.service';
import { generateAccessToken } from '../utils/generateJWT.util';

const signUpController = async (req: Request, res: Response) => {
  const { name, lastName, email, password, roleId } = req.body;
  const result = await signUpService({ name, lastName, email, password, roleId })

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }
  res.status(201).json({message: 'User created successfully'});
}

const signInController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await signInService(email, password)

  if ('error' in result) {
    return res.status(result.code).json({message: result.error});
  }

  const token = generateAccessToken(result)

  res.status(200).json({...result, token});
}

export { signUpController, signInController }
