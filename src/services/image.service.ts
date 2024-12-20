import { ErrorMessage, InfoMessage } from '../model/messages';
import { config } from '../config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface PropsImage {
  id: number;
  key: string;
  questionId: number;
}

interface ImageData {
  name: string;
  key: string;
}

export interface SignedUrlResponse {
  name: string;
  signedUrl: string;
}

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: config.get('BUCKET_REGION'),
  credentials: {
    accessKeyId: config.get('ACCESS_KEY'),
    secretAccessKey: config.get('SECRET_ACCESS')
  }
});

const uploadImageService = async (type: String, file: Express.Multer.File): Promise<InfoMessage | ErrorMessage> => {
  try {
    if (!type) {

      return { error: 'The type must be specified', code: 400 };
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
      return { error: `S3 error: ${error.message}`, code: 400 };
    }

    return { error: 'An error occurred with the server', code: 500 };
  }
};

const deleteImagesService = async (images: PropsImage []): Promise<InfoMessage | ErrorMessage> => {
  try {
    if (!images || images.length === 0) {
      return { error: 'The images array must not be empty', code: 400 };
    }

    const ids = images.map(image => image.id);
    const keys = images.map(image => image.key);

    const deleteResult = await prisma.imagen.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    if (deleteResult.count !== ids.length) {

      return { error: 'Not all images were deleted from the database', code: 500 };
    }

    await Promise.all(keys.map(async (key) => {
      const params = {
        Bucket: config.get('BUCKET_NAME'),
        Key: key,
      };
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    }));

    return { code: 204 };
  } catch (error: any) {
    if ('name' in error) {

      return { error: `S3 error: ${error.message}`, code: 400 };
    }

    return { error: 'An error occurred with the server', code: 500 };
  }
};

function getImageTitles(doc) {
  const titles: (string | null)[] = [];

  doc.content?.forEach((item) => {
    if (item.type === 'image' && item.attrs && item.attrs.title) {
      titles.push(item.attrs.title);
    }
  });

  return titles;
}

const getImageSignedUrlsService = async (images: ImageData[]): Promise<SignedUrlResponse[] | ErrorMessage> => {
  try {
    return await Promise.all(
      images.map(async (image) => {
        const params = {
          Bucket: config.get('BUCKET_NAME'),
          Key: image.key,
        };
        const command = new GetObjectCommand(params);
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 5400 });

        return {
          name: image.name,
          signedUrl,
        };
      })
    );
  } catch (error: any) {
    return { error: 'An error occurred generating signed URLs', code: 500 };
  }
};

export { getImageTitles, uploadImageService, deleteImagesService, getImageSignedUrlsService };
