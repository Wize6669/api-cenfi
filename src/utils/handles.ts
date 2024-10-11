import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const handleErrors = (error: any) => {
  if (error instanceof PrismaClientKnownRequestError) {
    let fieldName: string = '';
    let message: string = '';

    if (error.code === 'P2003') {
      fieldName = error.meta?.field_name as string || 'campo desconocido';
      message = 'No puede estar vacío o nulo';

      return {error: `Prisma: Campo: ${fieldName} - Mensaje: ${message}`, code: 400};
    }

    fieldName = error.meta?.target as string || 'campo desconocido';
    message = error.message || 'Mensaje de error desconocido';

    return {error: `Prisma: Campo: ${fieldName} - Mensaje: ${message}`, code: 400};
  }
  return {error: 'Ocurrió un error en el servidor', code: 500};
};

export { handleErrors };
