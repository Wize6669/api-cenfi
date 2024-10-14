import {PrismaClient} from '@prisma/client';
import {Question, QuestionCreate, QuestionCreateResponse, QuestionList} from '../model/question';
import {ErrorMessage, InfoMessage} from '../model/messages';
import {handleErrors} from '../utils/handles';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';

import {config} from '../config';
import {PaginationResponse} from "../model/pagination";
import {calculatePagination} from "../utils/pagination.util";

const s3Client = new S3Client({
  region: config.get('BUCKET_REGION'),
  credentials: {
    accessKeyId: config.get('ACCESS_KEY'),
    secretAccessKey: config.get('SECRET_ACCESS')
  }
});

const prisma = new PrismaClient();

const createQuestionService = async (question: QuestionCreate): Promise<QuestionCreateResponse | ErrorMessage> => {
  try {
    const newQuestion = await prisma.question.create({
      data: {
        content: question.content,
        justification: question.justification,
        answer: Number(question.answer),
        options: {
          create: question.options.map((option) => ({
            content: option.content,
          })),
        },
        categoryId: Number(question.categoryId),
        simulatorId: question.simulatorId ?? null,
      },
      include: {
        options: true,
      },
    });

    //Si la pregunta está asociada a un simulador, actualizamos el número de preguntas
    if (question.simulatorId) {
      await prisma.simulator.update({
        where: {id: question.simulatorId},
        data: {number_of_questions: {increment: 1}}
      });
    }

    return {
      id: newQuestion.id,
      categoryId: newQuestion.categoryId || undefined,
      simulatorId: newQuestion.simulatorId || undefined
    };
  } catch (error) {

    return handleErrors(error);
  }
};

const getQuestionByIdService = async (questionsId: number): Promise<Question | ErrorMessage> => {
  try {
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionsId,
      },
      include: {
        options: true,
        category: true,
        Simulator: true,
      },
    });

    if (!existingQuestion) {
      return { error: 'Question not found', code: 404 };
    }

    return {
      id: existingQuestion.id,
      content: existingQuestion.content as object,
      justification: existingQuestion.justification as object | undefined,
      answer: existingQuestion.answer,
      categoryId: existingQuestion.categoryId ?? undefined,
      simulatorId: existingQuestion.simulatorId ?? undefined,
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const questionListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<QuestionList>| ErrorMessage> =>{
  try{
    const total = await prisma.question.count();
    const paginationInfo = calculatePagination(page, count, total)

    const questionList = await prisma.question.findMany({
      skip: (page - 1) * count,
      take: count,
      include: {
        options: true,
      },
    });

    const data: QuestionList[] = questionList.map(question => ({
      id: question.id,
      content: question.content,
      justification: question.justification,
      answer: question.answer,
      categoryId: question.categoryId,
      simulatorId: question.simulatorId,
      options: question.options,
    }));

    return {
      ...paginationInfo,
      data,
    };
  } catch (error) {
    return handleErrors(error);
  }
}

const uploadImageService = async (type: String, file: Express.Multer.File): Promise<InfoMessage | ErrorMessage> => {
  try {
    if (!type) {

      return {error: 'The type must be specified', code: 400};
    }

    const buffer = file.buffer;

    const params = {
      Bucket: config.get('BUCKET_NAME'),
      Key: `${type}/${file.originalname}`,
      Body: buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    await s3Client.send(command);

    return {
      code: 204,
    };
  } catch (error: any) {
    if ('name' in error) {
      return {error: `S3 error: ${error.message}`, code: 400};
    }

    return {error: 'An error occurred with the server', code: 500};
  }
};

export { createQuestionService, uploadImageService, questionListService, getQuestionByIdService };
