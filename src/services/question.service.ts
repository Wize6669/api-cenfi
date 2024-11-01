import {PrismaClient} from '@prisma/client';
import { QuestionCreate, QuestionCreateResponse, QuestionGet, QuestionList } from '../model/question';
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
          ? { connect: question.simulators.map((simulator) => ({ id: simulator.id })) }
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
          where: { id: simulator.id },
          data: { number_of_questions: { increment: 1 } },
        });
      }
    }

    const imageTitles = [
      ...getImageTitles(question.content).map(title => ({ type: 'questions', title })),
      ...getImageTitles(question.justification).map(title => ({ type: 'justifications', title })),
      ...question.options.flatMap(option => getImageTitles(option.content).map(title => ({ type: 'options', title })))
    ].filter(image => image.title !== null);

    await Promise.all(imageTitles.map(async ({ type, title }) => {
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
      simulators: newQuestion.simulators.map(sim => ({ id: sim.id })),
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
      simulators: existingQuestion.simulators.map(sim => ({ id: sim.id })),
      options: existingQuestion.options,
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

interface ImageAttrs {
  id: string | null;
  alt: string | null;
  src: string;
  name: string | null;
  class: string | null;
  ismap: string | null;
  sizes: string | null;
  style: string;
  title: string | null;
  width: string | null;
  height: string | null;
  srcset: string | null;
  usemap: string | null;
  loading: string | null;
  decoding: string | null;
  longdesc: string | null;
  tabindex: string | null;
  draggable: boolean;
  'aria-label': string | null;
  crossorigin: string | null;
  referrerpolicy: string | null;
  'aria-labelledby': string | null;
  'aria-describedby': string | null;
}

interface ImageNode {
  type: 'image';
  attrs: ImageAttrs;
}

interface ParagraphNode {
  type: 'paragraph';
  attrs: {
    textAlign: string;
  };
  content: Array<{ text: string; type: 'text' }>;
}

interface Document {
  type: 'doc';
  content: (ImageNode | ParagraphNode)[];
}


function getImageTitles(doc) {
  const titles: (string | null)[] = [];

  doc.content.forEach((item) => {
    if (item.type === 'image' && item.attrs && item.attrs.title) {
      titles.push(item.attrs.title);
    }
  });

  return titles;
}

export { createQuestionService, uploadImageService, questionListService, getQuestionByIdService };
