import { PrismaClient } from '@prisma/client';
import { QuestionCreate, QuestionCreateResponse, QuestionGet, QuestionList } from '../model/question';
import { ErrorMessage, InfoMessage } from '../model/messages';
import { handleErrors } from '../utils/handles';
import { PaginationResponse } from '../model/pagination';
import { calculatePagination } from '../utils/pagination.util';
import { getImageTitles, uploadImageService, deleteImagesService } from './image.service';

const prisma = new PrismaClient();

const createQuestionService = async (question: QuestionCreate): Promise<QuestionCreateResponse | ErrorMessage> => {
  try {
    const newQuestion = await prisma.question.create({
      data: {
        content: question.content,
        justification: {
          create: {
            content: question.justification
          }
        },
        options: {
          create: question.options.map((option) => ({
            content: option.content,
            isCorrect: option.isCorrect,
          })),
        },
        categoryId: question.categoryId ? Number(question.categoryId) : null,
        simulators: question.simulators && question.simulators.length > 0
          ? {connect: question.simulators.map((simulator) => ({id: simulator.id}))}
          : undefined,
      },
      include: {
        options: true,
        simulators: true,
        justification: true,
      },
    });

    if (question.simulators && question.simulators.length > 0) {
      for (const simulator of question.simulators) {
        await prisma.simulator.update({
          where: {id: simulator.id},
          data: {number_of_questions: {increment: 1}},
        });
      }
    }

    const imageTitles = [
      ...getImageTitles(question.content).map(title => ({type: 'questions', title})),
      ...getImageTitles(question.justification).map(title => ({type: 'justifications', title})),
      ...question.options.flatMap(option => getImageTitles(option.content).map(title => ({type: 'options', title})))
    ].filter(image => image.title !== null);

    await Promise.all(imageTitles.map(async ({type, title}) => {
      if (title) {
        await prisma.imagen.create({
          data: {
            name: title,
            key: `${type}/${title}`,
            entityType: type, // question, option, justification
            questionId: newQuestion.id,
          },
        });
      }
    }));

    return {
      id: newQuestion.id,
      categoryId: newQuestion.categoryId || undefined,
      simulators: newQuestion.simulators.map(sim => ({id: sim.id})),
    };
  } catch (error) {
    return handleErrors(error);
  }
};

const updateQuestionService = async (questionId: number, updatedQuestion: QuestionCreate): Promise<QuestionCreateResponse | ErrorMessage> => {
  try {

    const existingQuestion = await prisma.question.findUnique({
      where: {id: questionId},
      include: {
        options: true,
        simulators: true,
        justification: true,
        images: true,
      },
    });

    if (!existingQuestion) {
      return {error: 'Question not found', code: 404};
    }

    const updatedQuestionData = await prisma.question.update({
      where: {id: questionId},
      data: {
        content: updatedQuestion.content,
        justification: {
          update: {
            content: updatedQuestion.justification
          }
        },
        options: {
          deleteMany: {},
          create: updatedQuestion.options.map(option => ({
            content: option.content,
            isCorrect: option.isCorrect,
          })),
        },
        categoryId: updatedQuestion.categoryId ? Number(updatedQuestion.categoryId) : null,
        simulators: {
          set: updatedQuestion.simulators?.map(simulator => ({id: simulator.id})) || [],
        },
      },
      include: {
        options: true,
        simulators: true,
        justification: true,
      },
    });

    const newImageTitles = [
      ...getImageTitles(updatedQuestion.content).map(title => ({type: 'questions', title})),
      ...getImageTitles(updatedQuestion.justification).map(title => ({type: 'justifications', title})),
      ...updatedQuestion.options.flatMap(option => getImageTitles(option.content).map(title => ({
        type: 'options',
        title
      }))),
    ].filter(image => image.title !== null);

    const existingImages = await prisma.imagen.findMany({
      where: {questionId: questionId},
    });

    console.log(newImageTitles);
    console.log(existingImages);

    // const newImageKeys = new Set(newImageTitles.map(({type, title}) => `${type}/${title}`));
    // const existingImageKeys = new Set(existingImages.map(img => img.key));

    // Determinar las imágenes a eliminar y a crear
    //const imagesToDelete = existingImages.filter(img => !newImageKeys.has(img.key));

    // // Eliminar imágenes que ya no están en la solicitud
    // await Promise.all(imagesToDelete.map(async img => {
    //   await prisma.imagen.delete({where: {id: img.id}});
    //   await deleteFromS3(img.key); // Aquí se llama a la función que elimina de S3
    // }));

    return {
      id: updatedQuestionData.id,
      categoryId: updatedQuestionData.categoryId || undefined,
      simulators: updatedQuestionData.simulators.map(sim => ({id: sim.id})),
    };
  } catch (error) {
    return handleErrors(error);
  }
};

const getQuestionByIdService = async (questionsId: number): Promise<QuestionGet | ErrorMessage> => {
  try {
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionsId,
      },
      include: {
        options: true,
        category: true,
        simulators: true,
        justification: true,
      },
    });

    if (!existingQuestion) {
      return { error: 'Question not found', code: 404 };
    }

    return {
      content: existingQuestion.content as Object,
      justification: existingQuestion?.justification as Object | undefined,
      categoryId: existingQuestion.categoryId ?? undefined,
      categoryName: existingQuestion.category?.name ?? undefined,
      superCategoryId: existingQuestion.category?.superCategoryId ?? undefined,
      simulators: existingQuestion.simulators.map(sim => ({ id: sim.id })),
      options: existingQuestion.options,
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const questionListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<QuestionList> | ErrorMessage> => {
  try {
    const total = await prisma.question.count();
    const paginationInfo = calculatePagination(page, count, total);

    const questionList = await prisma.question.findMany({
      skip: (page - 1) * count,
      take: count,
      include: {
        options: true,
        category: true,
        simulators: true,
        justification: true,
      },
    });

    const data = questionList.map(question => ({
      id: question.id,
      content: question.content as Object,
      justification: question?.justification as Object | undefined,
      categoryId: question.categoryId ?? undefined,
      categoryName: question.category?.name ?? undefined,
      superCategoryId: question.category?.superCategoryId ?? undefined,
      simulators: question.simulators.map(sim => ({ id: sim.id })),
      options: question.options.map(opt => ({
        id: opt.id,
        content: opt.content as Object,
        isCorrect: opt.isCorrect
      })),
    }));

    return {
      ...paginationInfo,
      data,
    };
  } catch (error) {
    return handleErrors(error);
  }
};

export {
  createQuestionService,
  updateQuestionService,
  questionListService,
  getQuestionByIdService
};
