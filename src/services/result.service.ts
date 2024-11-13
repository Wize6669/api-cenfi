import { PrismaClient } from '@prisma/client';
import { uploadImageService, getImageSignedUrlsService, deleteImagesService } from './image.service';
import { ErrorMessage, InfoMessage} from '../model/messages';
import { Result, CreateResultInput, UpdateResultInput } from '../model/result';
import { handleErrors } from '../utils/handles';
import { PaginationResponse } from "../model/pagination";
import { calculatePagination } from "../utils/pagination.util";

const prisma = new PrismaClient();

const createResultService = async (input: CreateResultInput): Promise<Result | ErrorMessage> => {
  try {
    // Create result in database
    const createdResult = await prisma.result.create({
      data: {
        name: input.name,
        score: input.score,
        order: input.order,
        career: input.career,
        imageUrl: input.image,
      },
    });

    // Return the created result with the signed URL
    return {
      id: createdResult.id,
      name: createdResult.name,
      score: createdResult.score,
      order: createdResult.order,
      career: createdResult.career,
      imageUrl: createdResult.imageUrl,
    };
  } catch (error) {
    return handleErrors(error);
  }
}

const updateResultService = async (id: number, input: UpdateResultInput): Promise<Result | ErrorMessage> => {
  try {
    // Get the existing result
    const existingResult = await prisma.result.findUnique({ where: { id } });
    if (!existingResult) {
      return { error: 'Resultado no encontrado', code: 404 };
    }

    let imageUrl = existingResult.imageUrl;

    // Update result in database
    const updatedResult = await prisma.result.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        score: input.score ?? undefined,
        order: input.order ?? undefined,
        career: input.career ?? undefined,
        imageUrl: imageUrl,
      },
    });

    // Get signed URL for the image
    const signedUrlResult = await getImageSignedUrlsService([
      { name: updatedResult.name, key: updatedResult.imageUrl }
    ]);

    if ('error' in signedUrlResult) {
      return signedUrlResult;
    }

    // Return the updated result with the signed URL
    return {
      id: updatedResult.id,
      name: updatedResult.name,
      score: updatedResult.score,
      order: updatedResult.order,
      career: updatedResult.career,
      imageUrl: signedUrlResult[0].signedUrl,
    };
  } catch (error) {
    return handleErrors(error);
  }
}

const getResultByIdService = async (resultId: number): Promise<Result | ErrorMessage> => {
  try {
    const existingResult = await prisma.result.findUnique({
      where: {
        id: resultId,
      },
    });

    if (!existingResult) {
      return { error: 'Result not found', code: 404 };
    }

    // Obtener URL firmada para la imagen
    const signedUrlResult = await getImageSignedUrlsService([
      { name: existingResult.name, key: existingResult.imageUrl }
    ]);

    if ('error' in signedUrlResult) {
      return signedUrlResult;
    }

    return {
      id: existingResult.id,
      name: existingResult.name,
      score: existingResult.score,
      order: existingResult.order,
      career: existingResult.career,
      imageUrl: signedUrlResult[0].signedUrl,
    };
  } catch (error) {
    return handleErrors(error);
  }
}


const deleteResultService = async (resultId: number): Promise<InfoMessage | ErrorMessage> => {
  try {
    const existingResult = await prisma.result.findFirst({
      where: {
        id: resultId,
      },
    });

    if (!existingResult) {
      return { error: 'Result not found', code: 404 };
    }

    await prisma.result.delete({
      where: {
        id: resultId,
      },
    });

    return {code: 204};
  } catch (error) {
    return handleErrors(error);
  }
}

const resultListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<Result> | ErrorMessage> => {
  try {
    const total = await prisma.result.count();
    const paginationInfo = calculatePagination(page, count, total)

    const resultList = await prisma.result.findMany({
      skip: (page - 1) * count,
      take: count,
      select: {
        id: true,
        name: true,
        career: true,
        order: true,
        score: true,
        imageUrl: true
      },
      orderBy: [
        { order: 'asc' },
        { score: 'asc' },
        { career: 'asc' },
        { name: 'asc' }
      ],
    });

    // Obtener URLs firmadas para todas las imágenes
    const imageSignedUrls = await getImageSignedUrlsService(
      resultList.map(result => ({ name: result.name, key: result.imageUrl }))
    );

    if ('error' in imageSignedUrls) {
      return imageSignedUrls;
    }

    const data = resultList.map((result, index) => ({
      id: result.id,
      name: result.name,
      score: result.score,
      order: result.order,
      career: result.career,
      imageUrl: imageSignedUrls[index].signedUrl,
    }));

    return {
      ...paginationInfo,
      data,
    };
  } catch (error) {
    return handleErrors(error);
  }
}

export {createResultService, updateResultService, deleteResultService, getResultByIdService, resultListService}
