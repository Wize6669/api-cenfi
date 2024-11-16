import { PrismaClient } from '@prisma/client';
import { uploadImageService, getImageSignedUrlsService, deleteImagesService } from './image.service';
import { ErrorMessage, InfoMessage} from '../model/messages';
import { Result, CreateResultInput, UpdateResultInput } from '../model/result';
import { handleErrors } from '../utils/handles';
import { PaginationResponse } from "../model/pagination";
import { calculatePagination } from "../utils/pagination.util";
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {config} from "../config";

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: config.get('BUCKET_REGION'),
  credentials: {
    accessKeyId: config.get('ACCESS_KEY'),
    secretAccessKey: config.get('SECRET_ACCESS')
  }
});

const createResultService = async (input: CreateResultInput): Promise<Result | ErrorMessage> => {
  try {
    // Generar nombre único para la imagen
    const timestamp = new Date().toISOString(); // Genera formato: 2024-11-13T04:35:14.000Z
    input.image.originalname.split('.').pop();
    const uniqueImageName = `${timestamp}-${input.image.originalname}`; // Combina timestamp con nombre original

    // Crear una copia del archivo con el nuevo nombre
    const imageWithNewName = {
      ...input.image,
      originalname: uniqueImageName
    };

    // Subir la imagen con el nuevo nombre
    const uploadResult = await uploadImageService('results', imageWithNewName);
    if ('error' in uploadResult) {
      return uploadResult;
    }

    // Create result in database
    const createdResult = await prisma.result.create({
      data: {
        name: input.name,
        score: input.score,
        order: input.order,
        career: input.career,
        imageUrl: `results/${uniqueImageName}`,
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
        order: input.order ?? undefined,
        career: input.career ?? undefined,
        imageUrl: imageUrl,
      },
    });

    // Return the updated result with the signed URL
    return {
      id: updatedResult.id,
      name: updatedResult.name,
      score: updatedResult.score,
      order: updatedResult.order,
      career: updatedResult.career,
      imageUrl: updatedResult.imageUrl,
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

    // Verificar que existe imageUrl
    if (!existingResult.imageUrl) {
      return { error: 'Image URL not found', code: 404 };
    }

    // Obtener URL firmada para la imagen
    const signedUrlResult = await getImageSignedUrlsService([
      {
        key: existingResult.imageUrl,  // Solo pasamos el key/imageUrl
        name: existingResult.imageUrl.split('/').pop() || '' // Extraemos el nombre del archivo de la URL
      }
    ]);

    // Log para debugging
    console.log('Existing Result:', existingResult);
    console.log('Signed URL Result:', signedUrlResult);

    if ('error' in signedUrlResult) {
      console.error('Error getting signed URL:', signedUrlResult.error);
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
    console.error('Get Result Error:', error);
    return handleErrors(error);
  }
}


const deleteResultService = async (resultId: number): Promise<InfoMessage | ErrorMessage> => {
  try {
    const existingResult = await prisma.result.findFirst({
      where: {
        id: resultId,
      },
      select: {
        id: true,
        imageUrl: true
      }
    });

    if (!existingResult) {
      return { error: 'Result not found', code: 404 };
    }

    console.log('URL de la imagen:', existingResult.imageUrl); // Log 1

    if (existingResult.imageUrl) {
      const imageKey = existingResult.imageUrl;
      console.log('Key extraído:', imageKey); // Log 2

      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: config.get('BUCKET_NAME'),
          Key: imageKey
        });
        console.log('Comando de borrado:', deleteCommand); // Log 3

        const response = await s3Client.send(deleteCommand);
        console.log('Respuesta de S3:', response); // Log 4
      } catch (s3Error) {
        console.error('Error detallado de S3:', JSON.stringify(s3Error, null, 2)); // Log detallado del error
      }
    }

    await prisma.result.delete({
      where: {
        id: resultId,
      },
    });

    return {code: 204};
  } catch (error) {
    console.error('Error general:', error); // Log 5
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
