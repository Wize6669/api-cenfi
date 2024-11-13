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
    // Upload image to S3
    const uploadResult = await uploadImageService('results', input.image);
    if ('error' in uploadResult) {
      return uploadResult;
    }

    // Create result in database
    const createdResult = await prisma.result.create({
      data: {
        name: input.name,
        score: input.score,
        size: input.size,
        career: input.career,
        imageUrl: `results/${input.image.originalname}`,
      },
    });

    // Get signed URL for the uploaded image
    const signedUrlResult = await getImageSignedUrlsService([
      { name: createdResult.name, key: createdResult.imageUrl }
    ]);

    if ('error' in signedUrlResult) {
      return signedUrlResult;
    }

    // Return the created result with the signed URL
    return {
      id: createdResult.id,
      name: createdResult.name,
      score: createdResult.score,
      size: createdResult.size,
      career: createdResult.career,
      imageUrl: signedUrlResult[0].signedUrl,
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

    // If a new image is provided, upload it and delete the old one
    if (input.image) {
      const uploadResult = await uploadImageService('results', input.image);
      if ('error' in uploadResult) {
        return uploadResult;
      }

      // Delete the old image
      await deleteImagesService([{ id: existingResult.id, key: existingResult.imageUrl, questionId: 0 }]);

      imageUrl = `results/${input.image.originalname}`;
    }

    // Update result in database
    const updatedResult = await prisma.result.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        score: input.score ?? undefined,
        size: input.size ?? undefined,
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
      size: updatedResult.size,
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
      size: existingResult.size,
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
        size: true,
        score: true,
        imageUrl: true
      },
      orderBy: [
        { size: 'asc' },
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
      size: result.size,
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
