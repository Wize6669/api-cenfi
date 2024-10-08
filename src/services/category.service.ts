import {PrismaClient} from "@prisma/client";
import {Category} from "../model/category";
import {ErrorMessage, InfoMessage} from "../model/messages";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {PaginationResponse} from "../model/pagination";
import {calculatePagination} from "../utils/pagination.util";

const prisma = new PrismaClient();

const createCategoryService = async (category: Category): Promise<Category | ErrorMessage> => {
  try {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name
      },
    });
    if (existingCategory) {
      return {error: 'Category already exists', code: 409};
    }

    const newCategory = await prisma.category.create({
      data: {
        name: category.name,
      }
    });

    return {
      id: category.id,
      name: newCategory.name,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return {error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400};
    }

    return {error: 'Error occurred with the server', code: 500};
  }
}

const updateCategoryService = async (updateCategory: Category): Promise<Category | ErrorMessage> => {
  try{
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: updateCategory.id,
      },
    });
    if (!existingCategory) {
      return {error: 'Category not found', code: 404};
    }

    const category = await prisma.category.update({
      where: {
        id: updateCategory.id,
      },
      data:{
        name: updateCategory.name,
      }
    });

    return {
      id: category.id,
      name: category.name,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    console.log(error)
    return {error: 'Error occurred with the server', code: 500};
  }
}

const deleteCategoryService = async (categoryId: number): Promise<InfoMessage | ErrorMessage> => {
  try{
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
      },
    });
    if(!existingCategory) {
      return {error: 'Category not found', code: 404};
    }

    console.log(`Category found. Deleting category with ID: ${categoryId}`);
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    console.log(`Category with ID: ${categoryId} deleted successfully`);
    return {code: 204};

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    console.log(error)
    return {error: 'Error occurred with the server', code: 500};
  }
}

const categoryListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<Category> | ErrorMessage> => {
  try{
    const total = await prisma.category.count();
    const paginationInfo = calculatePagination(page, count, total)

    const categoryList = await prisma.category.findMany({
      skip: (page - 1) * count,
      take: count,
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    const data = categoryList.map(category => ({
      id: category.id,
      name: category.name,
    }));

    const result: PaginationResponse<Category> = {
      ...paginationInfo,
      data,
    };

    return result;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return {error: 'Error occurred with the server', code: 500};
  }
}

const getCategoryByIdService = async (categoryId: number): Promise<Category | ErrorMessage> => {
  try{
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
      },
    });

    if(!existingCategory) {
      return { error: 'Category not found', code: 404 };
    }

    return {
      name: existingCategory.name,
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }

    return {error: 'Error occurred with the server xd', code: 500};
  }
}

export { createCategoryService, updateCategoryService, deleteCategoryService, categoryListService, getCategoryByIdService}
