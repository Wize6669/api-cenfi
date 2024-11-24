import { PrismaClient } from '@prisma/client';
import { QuestionCreate, QuestionCreateResponse, QuestionGet, QuestionList } from '../model/question';
import { ErrorMessage, InfoMessage } from '../model/messages';
import { handleErrors } from '../utils/handles';
import { PaginationResponse } from '../model/pagination';
import { calculatePagination } from '../utils/pagination.util';
import { getImageTitles, deleteImagesService, getImageSignedUrlsService, SignedUrlResponse } from './image.service';

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

const updateQuestionService = async (questionId: number, updatedQuestion: QuestionCreate): Promise<QuestionCreateResponse | ErrorMessage> => {
  try {
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        simulators: true,
        justification: true,
        images: true,
      },
    });

    if (!existingQuestion) {
      return { error: 'Question not found', code: 404 };
    }

    // Mantener las asociaciones existentes con simuladores
    const existingSimulatorIds = existingQuestion.simulators.map(sim => sim.id);
    const updatedSimulatorIds = updatedQuestion.simulators?.map(sim => sim.id) || [];

    // Combinar los IDs de simuladores existentes y actualizados
    const combinedSimulatorIds = [...new Set([...existingSimulatorIds, ...updatedSimulatorIds])];

    const updatedQuestionData = await prisma.question.update({
      where: { id: questionId },
      data: {
        content: updatedQuestion.content,
        justification: {
          upsert: {
            create: { content: updatedQuestion.justification },
            update: { content: updatedQuestion.justification },
          },
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
          set: combinedSimulatorIds.map(id => ({ id })),
        },
      },
      include: {
        options: true,
        simulators: true,
        justification: true,
      },
    });

    const newImageTitles = [
      ...getImageTitles(updatedQuestion.content).map(title => ({ type: 'questions', title })),
      ...getImageTitles(updatedQuestion.justification).map(title => ({ type: 'justifications', title })),
      ...updatedQuestion.options.flatMap(option => getImageTitles(option.content).map(title => ({
        type: 'options',
        title
      }))),
    ].filter(image => image.title !== null);

    const existingImages = (await prisma.imagen.findMany({
      where: { questionId: questionId },
      select: {
        id: true,
        entityType: true,
        name: true,
        key: true,
        questionId: true
      },
    })).map(image => ({
      id: image.id,
      type: image.entityType,
      name: image.name,
      key: image.key,
      questionId: image.questionId
    }));

    const newSet = new Set(newImageTitles.map(img => `${img.type}/${img.title}`));

    const imagesToDelete = existingImages
      .filter(img => !newSet.has(`${img.type}/${img.name}`))
      .map(({ id, key, questionId }) => ({ id, key, questionId }));

    await deleteImagesService(imagesToDelete);

    return {
      id: updatedQuestionData.id,
      categoryId: updatedQuestionData.categoryId || undefined,
      simulators: updatedQuestionData.simulators.map(sim => ({ id: sim.id })),
    };
  } catch (error) {

    return handleErrors(error);
  }
};

const deleteQuestionService = async (questionId: number): Promise<InfoMessage | ErrorMessage> => {
  try {
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        justification: true,
        options: true,
        images: true,
        simulators: true,
      },
    });

    if (!existingQuestion) {
      return { error: 'Question not found', code: 404 };
    }

    const imagesToDelete = existingQuestion.images.map((image) => ({
      id: image.id,
      key: image.key,
      questionId: questionId,
    }));

    if (imagesToDelete.length > 0) {
      const deleteImagesResult = await deleteImagesService(imagesToDelete);
      if ('error' in deleteImagesResult) {
        return deleteImagesResult;
      }
    }

    // Eliminar opciones y justificación
    await prisma.option.deleteMany({ where: { questionId } });
    if (existingQuestion.justification) {
      await prisma.justification.delete({ where: { id: existingQuestion.justification.id } });
    }

    // Actualizar el contador de preguntas en los simuladores asociados
    for (const simulator of existingQuestion.simulators) {
      await prisma.simulator.update({
        where: { id: simulator.id },
        data: { number_of_questions: { decrement: 1 } },
      });
    }

    // Eliminar la pregunta
    await prisma.question.delete({ where: { id: questionId } });

    return { code: 204 };
  } catch (error) {
    return handleErrors(error);
  }
};

const getQuestionByIdService = async (questionId: number): Promise<QuestionGet | ErrorMessage> => {
  try {
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
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

    const existingImages = await prisma.imagen.findMany({
      where: { questionId: questionId },
      select: {
        name: true,
        key: true,
      },
    });

    const imageSignedUrls = await getImageSignedUrlsService(existingImages);

    if ('error' in imageSignedUrls) {
      return { error: imageSignedUrls.error, code: imageSignedUrls.code };
    }

    // Reemplazar los src en el contenido, justification y options con las URLs firmadas
    const updatedContent = existingQuestion.content ? replaceImageSrcWithSignedUrls(existingQuestion.content, imageSignedUrls) : existingQuestion.content;
    const updatedJustification = existingQuestion?.justification?.content ? replaceImageSrcWithSignedUrls(existingQuestion.justification.content, imageSignedUrls) : existingQuestion?.justification?.content;

    const updatedOptions = existingQuestion.options.map(option => ({
      ...option,
      content: replaceImageSrcWithSignedUrls(option.content, imageSignedUrls),
    }));

    // Estructurar la respuesta con las imágenes firmadas y otros detalles
    return {
      content: updatedContent,
      justification: {
        content: updatedJustification
      },
      categoryId: existingQuestion.categoryId ?? undefined,
      categoryName: existingQuestion.category?.name ?? undefined,
      superCategoryId: existingQuestion.category?.superCategoryId ?? undefined,
      simulators: existingQuestion.simulators.map(sim => ({ id: sim.id })),
      options: updatedOptions,
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const replaceImageSrcWithSignedUrls = (docContent: any, imageSignedUrls: SignedUrlResponse[]): any => {
  if (!docContent || !docContent.content || !Array.isArray(docContent.content)) {

    return { error: 'docContent no tiene la estructura esperada', code: 400 };
  }

  const signedUrlsMap = Object.fromEntries(imageSignedUrls.map(img => [img.name, img.signedUrl]));

  // Reemplazar el src de las imágenes en el contenido
  const updatedContent = docContent.content.map((node: any) => {
    if (node && node.type === 'image' && node.attrs && node.attrs.title && signedUrlsMap[node.attrs.title]) {
      return {
        ...node,
        attrs: {
          ...node.attrs,
          src: signedUrlsMap[node.attrs.title],
        },
      };
    }
    return node;
  });

  return {
    ...docContent,
    content: updatedContent,
  };
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
  deleteQuestionService,
  questionListService,
  getQuestionByIdService,
  replaceImageSrcWithSignedUrls
};
