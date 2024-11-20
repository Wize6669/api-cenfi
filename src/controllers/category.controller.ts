import {Request, Response} from 'express';
import {
  createCategoryService,
  categoryListService,
  updateCategoryService,
  getCategoryByIdService,
  deleteCategoryService
} from "../services/category.service";

const createCategoryController = async (req: Request, res: Response) => {
  const {name, superCategoryId} = req.body;
  const result = await createCategoryService({name, superCategoryId})

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }
  res.status(201).json({error: 'Category created successfully.'});
}

const updateCategoryController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const {name, superCategoryId} = req.body;
  const numericId = parseInt(id, 10);

  const result = await updateCategoryService({id: numericId, name, superCategoryId})
  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

const deleteCategoryController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);

  const result = await deleteCategoryService(numericId);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(result.code).json(result);
}

const listCategoryController = async (req: Request, res: Response) => {
  const {page, count} = req.query;
  const pageAux = Number(page);
  const countAux = Number(count);
  const result = await categoryListService(pageAux, countAux);
  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

const getCategoryByIdController = async (req: Request, res: Response) => {
  const {id} = req.params;
  const numericId = parseInt(id, 10);

  const result = await getCategoryByIdService(numericId);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

export { createCategoryController, updateCategoryController, deleteCategoryController, listCategoryController, getCategoryByIdController};
