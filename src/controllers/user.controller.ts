import { Request, Response } from 'express';
import { userListService, updateUserService, deleteUserService, getUserByIdService, changePasswordService } from '../services/user.service';

const userListController = async (req: Request, res: Response) => {
  const { page, count } = req.query;
  const pageAux = Number(page)
  const countAux = Number(count)
  const result = await userListService(pageAux, countAux)

  if ('error' in result) {
    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

const updateUserController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, lastName, email, roleId } = req.body;
  const result = await updateUserService({ id, name, lastName, email, roleId })

  if ('error' in result) {
    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

const deleteUserController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteUserService(id);

  if ('error' in result) {
    return res.status(result.code).json({error: result.error});
  }

  return res.status(result.code).send('');
}

const getUserByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await getUserByIdService(id);

  if ('error' in result) {
    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

const changePasswordController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { temporaryPassword, newPassword } = req.body;
  const result = await changePasswordService(id, temporaryPassword, newPassword);

  if ('error' in result) {
    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

export { userListController, updateUserController, deleteUserController, getUserByIdController, changePasswordController }
