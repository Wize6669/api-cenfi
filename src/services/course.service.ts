import { PrismaClient } from "@prisma/client";
import { Course} from "../model/course";
import { ErrorMessage, InfoMessage } from "../model/messages";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PaginationResponse } from "../model/pagination";
import { calculatePagination } from "../utils/pagination.util";

const prisma = new PrismaClient();

const createCourseService = async (course: Course): Promise<Course | ErrorMessage> => {
  try{
    const existingCourse = await prisma.course.findFirst({
      where: {
        name: course.name,
      },
    });
    if (existingCourse) {
      return {error: 'Course already exists', code: 409};
    }
    const newCourse = await prisma.course.create({
      data: {
        name: course.name,
        university: course.university,
        schedule: course.schedule,
        startDate: course.startDate,
        endDate: course.endDate,
        cost: course.cost,
        paymentOptions: course.paymentOptions,
        syllabus: course.syllabus,
        benefits: course.benefits,
        phone: course.phone,
        inPersonSchedules: course.inPersonSchedules,
        virtualSchedules: course.virtualSchedules,
      }
    });

    return {
      id: course.id,
      name: newCourse.name,
      university: newCourse.university,
      schedule: newCourse.schedule,
      startDate: newCourse.startDate,
      endDate: newCourse.endDate,
      cost: newCourse.cost,
      paymentOptions: newCourse.paymentOptions,
      syllabus: newCourse.syllabus,
      benefits: newCourse.benefits,
      phone: newCourse.phone,
      inPersonSchedules: newCourse.inPersonSchedules,
      virtualSchedules: newCourse.virtualSchedules,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError){
      const fieldName = error.meta?.field_name;
      return {error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400};
    }

    return {error: 'Error occurred with the server', code: 500};
  }
}

const updateCourseService = async (updateCourse: Course): Promise<Course | ErrorMessage> => {
  try {
    const existingCourse = await prisma.course.findFirst({
      where:{
        id: updateCourse.id,
      },
    });
    if(!existingCourse) {
      return {error: 'Course not found', code: 404};
    }
    const course = await prisma.course.update({
      where: {
        id: updateCourse.id,
      },
      data:{
        name: updateCourse.name,
        university: updateCourse.university,
        schedule: updateCourse.schedule,
        startDate: updateCourse.startDate,
        endDate: updateCourse.endDate,
        cost: updateCourse.cost,
        paymentOptions: updateCourse.paymentOptions,
        syllabus: updateCourse.syllabus,
        benefits: updateCourse.benefits,
        phone: updateCourse.phone,
        inPersonSchedules: updateCourse.inPersonSchedules,
        virtualSchedules: updateCourse.virtualSchedules,
      }
    });

    return {
      id: course.id,
      name: course.name,
      university: course.university,
      schedule: course.schedule,
      startDate: course.startDate,
      endDate: course.endDate,
      cost: course.cost,
      paymentOptions: course.paymentOptions,
      syllabus: course.syllabus,
      benefits: course.benefits,
      phone: course.phone,
      inPersonSchedules: course.inPersonSchedules,
      virtualSchedules: course.virtualSchedules,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }
    return {error: 'Error occurred with the server', code: 500};
  }
}

const deleteCourseService = async (courseId: string): Promise<InfoMessage|ErrorMessage> => {
  try{
    const existingCourse = await prisma.course.findFirst({
      where:{
        id: courseId,
      },
    });
    if (!existingCourse){
      return {error: 'Course not found', code: 404};
    }

    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });
    return {code: 204};
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    console.log(error)
    return {error: 'Error occurred with the server', code: 500};
  }
}

const courseListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<Course> | ErrorMessage> => {
  try{
    const total = await prisma.course.count();
    const paginationInfo = calculatePagination(page, count, total)

    const courseList = await prisma.course.findMany({
      skip: (page - 1) * count,
      take: count,
      select: {
        id: true,
        name: true,
        university: true,
        schedule: true,
        startDate: true,
        endDate: true,
        cost: true,
        paymentOptions: true,
        syllabus: true,
        benefits: true,
        phone: true,
        inPersonSchedules: true,
        virtualSchedules: true,
      },
      orderBy:[
        {name: 'asc'}
      ],
    });

    const data = courseList.map(course => ({
      id: course.id,
      name: course.name,
      university: course.university,
      schedule: course.schedule,
      startDate: course.startDate,
      endDate: course.endDate,
      cost: course.cost,
      paymentOptions: course.paymentOptions,
      syllabus: course.syllabus,
      benefits: course.benefits,
      phone: course.phone,
      inPersonSchedules: course.inPersonSchedules,
      virtualSchedules: course.virtualSchedules,
    }));

    const result: PaginationResponse<Course> = {
      ...paginationInfo,
      data,
    };

    return result;

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return {error: 'Error occurred with the server', code: 500};
  }
}

const getCourseByIdService = async (courseId: string): Promise<Course | ErrorMessage> => {
  try{
    const existingCourse = await prisma.course.findFirst({
      where:{
        id: courseId,
      },
    });

    if(!existingCourse){
      return { error: 'Course not found', code: 404 };
    }

    return {
      name: existingCourse.name,
      university: existingCourse.university,
      schedule: existingCourse.schedule,
      startDate: existingCourse.startDate,
      endDate: existingCourse.endDate,
      cost: existingCourse.cost,
      paymentOptions: existingCourse.paymentOptions,
      syllabus: existingCourse.syllabus,
      benefits: existingCourse.benefits,
      phone: existingCourse.phone,
      inPersonSchedules: existingCourse.inPersonSchedules,
      virtualSchedules: existingCourse.virtualSchedules,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return {error: 'Error occurred with the server xd', code: 500};
  }
}

export { createCourseService, updateCourseService, deleteCourseService, courseListService, getCourseByIdService }
