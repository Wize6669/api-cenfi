import {Request, Response} from 'express';
import {
  courseListService,
  createCourseService,
  deleteCourseService,
  getCourseByIdService,
  updateCourseService
} from "../services/course.service";

const createCourseController = async (req: Request, res: Response) => {
  const {name, university, schedule, startDate, endDate, cost, paymentOptions, syllabus, benefits, phone, inPersonSchedules, virtualSchedules} = req.body;
  const result = await createCourseService({name, university, schedule, startDate, endDate, cost, paymentOptions, syllabus, benefits, phone, inPersonSchedules, virtualSchedules})

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(201).json({message: 'Course created successfully.'});
}

const updateCourseController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {name, university, schedule, startDate, endDate, cost, paymentOptions, syllabus, benefits, phone, inPersonSchedules, virtualSchedules} = req.body;

  const result = await updateCourseService({id, name, university, schedule, startDate, endDate, cost, paymentOptions, syllabus, benefits, phone, inPersonSchedules, virtualSchedules});
  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json({message: 'Course updated successfully.'});
}

const deleteCourseController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteCourseService(id);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(result.code).json(result);
}

const listCourseController = async (req: Request, res: Response) => {
  const { page, count } = req.query;
  const pageAux = Number(page);
  const countAux = Number(count);
  const result = await courseListService(pageAux, countAux);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

const getCourseController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await getCourseByIdService(id);

  if ('error' in result) {

    return res.status(result.code).json({error: result.error});
  }

  res.status(200).json(result);
}

export {createCourseController, updateCourseController, deleteCourseController, listCourseController, getCourseController}
