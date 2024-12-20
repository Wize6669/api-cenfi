import { PrismaClient, Prisma } from '@prisma/client';
import { Category, CategoryList } from '../model/category';
import { ErrorMessage, InfoMessage } from '../model/messages';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PaginationResponse } from '../model/pagination';
import { calculatePagination } from '../utils/pagination.util';

const prisma = new PrismaClient();

const createCategoryService = async (category: Category): Promise<Category | ErrorMessage> => {
  try {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name
      },
    });
    if (existingCategory) {

      return { error: 'Category already exists', code: 409 };
    }

    const newCategory = await prisma.category.create({
      data: {
        name: category.name,
        superCategoryId: category.superCategoryId
      }
    });

    return {
      id: category.id,
      name: newCategory.name,
      superCategoryId: newCategory.superCategoryId
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return { error: 'Error occurred with the server', code: 500 };
  }
};

const updateCategoryService = async (updateCategory: Category): Promise<Category | ErrorMessage> => {
  try {
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: updateCategory.id,
      },
    });
    if (!existingCategory) {
      return { error: 'Category not found', code: 404 };
    }

    const category = await prisma.category.update({
      where: {
        id: updateCategory.id,
      },
      data: {
        name: updateCategory.name,
        superCategoryId: updateCategory.superCategoryId
      }
    });

    return {
      id: category.id,
      name: category.name,
      superCategoryId: category.superCategoryId
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return { error: 'Error occurred with the server', code: 500 };
  }
};

const deleteCategoryService = async (categoryId: number): Promise<InfoMessage | ErrorMessage> => {
  try {
    const existingCategory = await prisma.category.findFirst({
      where: { id: categoryId },
      include: { superCategory: true }
    });

    if (!existingCategory) {

      return { error: 'Category not found', code: 404 };
    }

    await prisma.$transaction(async (tx) => {
      // Obtener o crear la categoría "Sin categoría"
      const uncategorizedCategory = await getOrCreateUncategorizedCategory(tx);

      // Actualizar preguntas asociadas
      await tx.question.updateMany({
        where: { categoryId },
        data: { categoryId: uncategorizedCategory.id },
      });

      // Manejar subcategorías
      await handleSubcategories(tx, categoryId, uncategorizedCategory.id);

      // Eliminar la categoría
      await tx.category.delete({
        where: { id: categoryId },
      });
    });

    return { code: 204 };

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;
      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return { error: 'Error occurred with the server', code: 500 };
  }
};


const categoryListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<CategoryList> | ErrorMessage> => {
  try {
    const total = await prisma.category.count();
    const paginationInfo = calculatePagination(page, count, total);

    const categoryList = await prisma.category.findMany({
      skip: (page - 1) * count,
      take: count,
      select: {
        id: true,
        name: true,
        superCategoryId: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    const data = categoryList.map(category => ({
      id: category.id,
      name: category.name,
      superCategoryId: category.superCategoryId,
      questionCount: category._count.questions
    }));

    return {
      ...paginationInfo,
      data,
    };

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return { error: 'Error occurred with the server', code: 500 };
  }
};

const getCategoryByIdService = async (categoryId: number): Promise<CategoryList | ErrorMessage> => {
  try {
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
      },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!existingCategory) {
      return { error: 'Category not found', code: 404 };
    }

    return {
      name: existingCategory.name,
      superCategoryId: existingCategory.superCategoryId,
      questionCount: existingCategory._count.questions
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return { error: 'Error occurred with the server xd', code: 500 };
  }
};

async function getOrCreateUncategorizedCategory(tx: Prisma.TransactionClient) {
  const uncategorizedName = 'Sin categoría';

  // Primero, intentamos encontrar la categoría existente
  let uncategorizedCategory = await tx.category.findFirst({
    where: { name: uncategorizedName }
  });

  // Si no existe, la creamos
  if (!uncategorizedCategory) {
    uncategorizedCategory = await tx.category.create({
      data: {
        name: uncategorizedName,
        superCategoryId: 3,
      },
    });
  }

  return uncategorizedCategory;
}

async function handleSubcategories(tx: Prisma.TransactionClient, categoryId: number, uncategorizedCategoryId: number) {
  const subcategories = await tx.category.findMany({
    where: { superCategoryId: categoryId },
  });

  for (const subcategory of subcategories) {
    await tx.category.update({
      where: { id: subcategory.id },
      data: { superCategoryId: uncategorizedCategoryId },
    });
  }
}

export {
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  categoryListService,
  getCategoryByIdService
};
