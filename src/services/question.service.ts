import { PrismaClient } from '@prisma/client';
import { QuestionCreate, QuestionCreateResponse } from '../model/question';
import { ErrorMessage, InfoMessage } from '../model/messages';
import { handleErrors } from '../utils/handles';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { config } from '../config';

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

const uploadImageService = async (type: String, file: Express.Multer.File): Promise<InfoMessage | ErrorMessage> => {
  try {
    if (!type) {

      return {error: 'The type must be specified', code: 400};
    }

    const buffer = file.buffer;

    const params = {
      Bucket: config.get('BUCKET_NAME'),
      Key: `as/${type}/${file.originalname}`,
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

export { createQuestionService, uploadImageService };
