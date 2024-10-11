import {PrismaClient} from '@prisma/client';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import bcrypt from 'bcryptjs';
import {UpdateUser, UserAuth, UserChangePassword, UserPagination} from '../model/user';
import {PaginationResponse} from '../model/pagination';
import {ErrorMessage, InfoMessage} from '../model/messages';
import {calculatePagination} from '../utils/pagination.util';

const prisma = new PrismaClient();

const changePasswordService = async (id:string, temporaryPassword: string, newPassword: string): Promise<UserChangePassword | ErrorMessage> => {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: id,
          delete: null,
          change_password:true
        },
      });

      if(!existingUser) {

        return { error: 'User not found', code: 404 };
      }

      const isCorrectPassword = await bcrypt.compare(temporaryPassword, existingUser.password);

      if(!isCorrectPassword) {

        return {error: 'Invalid credentials', code: 400};
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const user = await prisma.user.update({
        where: {
          id: id,
        },
        data: {
          password: hashedPassword,
          change_password:false
        }
      });

    return {
        id: user.id
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
      }

      return {error: 'Error occurred with the server', code: 500};
    }
  }

  const userListService = async (page: number = 1, count: number = 5): Promise<PaginationResponse<UserPagination> | ErrorMessage> => {
    try {
      const total = await prisma.user.count();
      const paginationInfo = calculatePagination(page, count, total)

      const userList = await prisma.user.findMany({
        skip: (page - 1) * count,
        take: count,
        select: {
          id: true,
          name: true,
          last_name: true,
          email: true,
          password: false,
          delete: true,
          change_password: true,
          role: {
            select: {
              title: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
          { last_name: 'asc' },
        ],
      });

      const data = userList.map(user => ({
        id: user.id,
        name: user.name,
        lastName: user.last_name,
        email: user.email,
        delete: user.delete,
        changePassword: user.change_password,
        role: user.role.title,
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

      return {error: 'Error occurred with the server', code: 500};
    }
  }

  const updateUserService = async (updateUser: UpdateUser): Promise<UserAuth | ErrorMessage> => {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: updateUser.id,
        },
      });

      if(!existingUser) {

        return { error: 'User not found', code: 404 };
      }

      const user = await prisma.user.update({
        where: {
          id: updateUser.id,
        },
        data: {
          name: updateUser.name,
          last_name: updateUser.lastName,
          email: updateUser.email,
          roleId: updateUser.roleId
        }
      });

    return {
        id: user.id,
        name: user.name,
        lastName: user.last_name,
        email: user.email,
        roleId: user.roleId,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
      }

      return {error: 'Error occurred with the server', code: 500};
    }
  }

  const deleteUserService = async (id: string): Promise<InfoMessage | ErrorMessage> => {

  try {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: id,
        },
      });

      console.log(!existingUser)

      if(!existingUser) {

        return { error: 'User not found', code: 404 };
      }

      await prisma.user.delete({
        where: {
          id: id
        }
      });

      return {code: 204};
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
      }

      return {error: 'Error occurred with the server', code: 500};
    }
  }

  const getUserByIdService = async (id:string): Promise<UserPagination | ErrorMessage> => {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: id
        },
      });

      if(!existingUser) {

        return { error: 'User not found', code: 404 };
      }

      return {
        name: existingUser.name,
        lastName: existingUser.last_name,
        email: existingUser.email,
        delete: existingUser.delete,
        changePassword: existingUser.change_password,
        role: existingUser.roleId,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
      }

      return {error: 'Error occurred with the server', code: 500};
    }
  }

  export { changePasswordService, userListService, updateUserService, deleteUserService, getUserByIdService };
