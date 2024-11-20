import { Request, Response } from 'express';
import { resetPasswordService } from '../services/admin.service';

const resetPasswordController = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  const result = await resetPasswordService(email, newPassword)

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

export { resetPasswordController }
