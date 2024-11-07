import {Prisma, PrismaClient} from "@prisma/client";
import {
  SimulatorChangePassword,
  SimulatorRequest,
  SimulatorResponse,
  SimulatorUpdate,
  SimulatorWithQuestions
} from "../model/simulator";
import {ErrorMessage, InfoMessage} from "../model/messages";
import bcrypt from "bcryptjs";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {PaginationResponse} from "../model/pagination";
import {calculatePagination} from "../utils/pagination.util";
import {Question, QuestionCreate} from "../model/question";
import {handleErrors} from "../utils/handles";

const prisma = new PrismaClient();

const createSimulatorService = async (
  simulatorData: SimulatorRequest
): Promise<SimulatorResponse | ErrorMessage> => {
  try {
    // Verificar si existe un simulador con el mismo nombre
    const existingSimulator = await prisma.simulator.findFirst({
      where: {
        name: simulatorData.name
      },
    });

    if (existingSimulator) {
      return { error: 'Simulator already exists', code: 409 };
    }

    // Validar cantidad de preguntas por categoría
    for (const categoryQuestion of simulatorData.categoryQuestions) {
      // Obtener el total de preguntas disponibles para esta categoría
      const [{ count }] = await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*) as count
        FROM "Question"
        WHERE "categoryId" = ${categoryQuestion.categoryId}
      `;

      if (count < categoryQuestion.numberOfQuestions) {
        return {
          error: `La categoría tiene ${count} preguntas disponibles, pero se están solicitando ${categoryQuestion.numberOfQuestions} preguntas`,
          code: 400
        };
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(simulatorData.password, 10);

    // Seleccionar preguntas aleatorias para cada categoría usando SQL nativo
    let selectedQuestionIds: number[] = [];

    for (const categoryQuestion of simulatorData.categoryQuestions) {
      // Cosulta SQL
      const randomQuestions = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id
        FROM "Question"
        WHERE "categoryId" = ${categoryQuestion.categoryId}
          ${selectedQuestionIds.length > 0 ? Prisma.sql`AND id NOT IN (${Prisma.join(selectedQuestionIds)})` : Prisma.sql``}
        ORDER BY RANDOM()
          LIMIT ${categoryQuestion.numberOfQuestions}
      `;

      selectedQuestionIds = [...selectedQuestionIds, ...randomQuestions.map(q => q.id)];
    }

    // Crear el simulador y conectar con las preguntas seleccionadas
    const newSimulator = await prisma.simulator.create({
      data: {
        name: simulatorData.name,
        password: hashedPassword,
        duration: simulatorData.duration,
        visibility: simulatorData.visibility,
        navigate: simulatorData.navigate,
        review: simulatorData.review,
        durationReview: simulatorData.durationReview,
        number_of_questions: selectedQuestionIds.length,
        questions: {
          connect: selectedQuestionIds.map(id => ({ id }))
        }
      },
      include: {
        questions: {
          include: {
            options: true,
            justification: true,
          }
        }
      }
    });

    // Formatear la respuesta según la interfaz QuestionCreate
    const formattedQuestions: QuestionCreate[] = newSimulator.questions.map(question => ({
      id: question.id,
      content: question.content as Object,
      justification: question.justification as Object,
      options: question.options.map(opt => ({
        id: opt.id,
        content: opt.content as Object,
        isCorrect: opt.isCorrect
      })),
      categoryId: question.categoryId ?? undefined,
      simulators: [{ id: newSimulator.id }]
    }));

    return {
      id: newSimulator.id,
      name: newSimulator.name,
      duration: newSimulator.duration,
      visibility: newSimulator.visibility,
      navigate: newSimulator.navigate,
      review: newSimulator.review,
      durationReview: newSimulator.durationReview,
      number_of_questions: newSimulator.number_of_questions,
      questions: formattedQuestions
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const updateSimulatorService = async (
  updateSimulator: SimulatorUpdate
): Promise<SimulatorResponse | ErrorMessage> => {
  try {
    const existingSimulator = await prisma.simulator.findFirst({
      where: {
        id: updateSimulator.id,
      },
      include: {
        questions: true
      }
    });

    if (!existingSimulator) {
      return { error: 'Simulator not found', code: 404 };
    }

    // Validar cantidad de preguntas por categoría si hay actualización de preguntas
    if (updateSimulator.categoryQuestions && updateSimulator.categoryQuestions.length > 0) {
      for (const categoryQuestion of updateSimulator.categoryQuestions) {
        // Obtener el total de preguntas disponibles para esta categoría
        const [{ count }] = await prisma.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count
          FROM "Question"
          WHERE "categoryId" = ${categoryQuestion.categoryId}
        `;

        if (count < categoryQuestion.numberOfQuestions) {
          return {
            error: `La categoría tiene ${count} preguntas disponibles, pero se están solicitando ${categoryQuestion.numberOfQuestions} preguntas`,
            code: 400
          };
        }
      }
    }

    let selectedQuestionIds: number[] = [];

    // Si hay nuevas categorías de preguntas para actualizar
    if (updateSimulator.categoryQuestions && updateSimulator.categoryQuestions.length > 0) {
      for (const categoryQuestion of updateSimulator.categoryQuestions) {
        // Usar SQL nativo para seleccionar preguntas aleatorias
        const randomQuestions = await prisma.$queryRaw<{ id: number }[]>`
          SELECT id
          FROM "Question"
          WHERE "categoryId" = ${categoryQuestion.categoryId}
            ${selectedQuestionIds.length > 0 ?
              Prisma.sql`AND id NOT IN (${Prisma.join(selectedQuestionIds)})` :
              Prisma.sql``}
          ORDER BY RANDOM()
            LIMIT ${categoryQuestion.numberOfQuestions}
        `;

        selectedQuestionIds = [...selectedQuestionIds, ...randomQuestions.map(q => q.id)];
      }
    }

    // Actualizar el simulador
    const updatedSimulator = await prisma.simulator.update({
      where: {
        id: updateSimulator.id,
      },
      data: {
        name: updateSimulator.name,
        duration: updateSimulator.duration,
        navigate: updateSimulator.navigate,
        visibility: updateSimulator.visibility,
        review: updateSimulator.review,
        durationReview: updateSimulator.durationReview,
        number_of_questions: selectedQuestionIds.length || existingSimulator.questions.length,
        questions: selectedQuestionIds.length > 0 ? {
          set: [],
          connect: selectedQuestionIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        questions: {
          include: {
            options: true,
            justification: true,
          }
        }
      }
    });

    // Formatear la respuesta según la interfaz QuestionCreate
    const formattedQuestions: QuestionCreate[] = updatedSimulator.questions.map(question => ({
      id: question.id,
      content: question.content as Object,
      justification: question?.justification || undefined,
      options: question.options.map(opt => ({
        id: opt.id,
        content: opt.content as Object,
        isCorrect: opt.isCorrect
      })),
      categoryId: question.categoryId ?? undefined,
      simulators: [{ id: updatedSimulator.id }]
    }));

    return {
      id: updatedSimulator.id,
      name: updatedSimulator.name,
      duration: updatedSimulator.duration,
      visibility: updatedSimulator.visibility,
      navigate: updatedSimulator.navigate,
      review: updatedSimulator.review,
      durationReview: updatedSimulator.durationReview,
      number_of_questions: updatedSimulator.number_of_questions,
      questions: formattedQuestions
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const simulatorListService = async (
  page: number = 1,
  count: number = 5
): Promise<PaginationResponse<SimulatorResponse> | ErrorMessage> => {
  try {
    const total = await prisma.simulator.count();
    const paginationInfo = calculatePagination(page, count, total)

    const simulatorList = await prisma.simulator.findMany({
      skip: (page - 1) * count,
      take: count,
      include: {
        questions: {
          include: {
            options: true,
            category: true,
            justification: true,
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ],
    });

    // Formateamos la lista de simuladores
    const data = simulatorList.map(simulator => {
      // Formateamos las preguntas según la interfaz QuestionCreate
      const formattedQuestions: QuestionCreate[] = simulator.questions.map(question => ({
        id: question.id,
        content: question.content as Object,
        justification: question.justification as Object,
        options: question.options.map(opt => ({
          id: opt.id,
          content: opt.content as Object,
          isCorrect: opt.isCorrect
        })),
        categoryId: question.categoryId ?? undefined,
        simulators: [{ id: simulator.id }]
      }));

      // Retornamos el simulador formateado
      return {
        id: simulator.id,
        name: simulator.name,
        duration: simulator.duration,
        navigate: simulator.navigate,
        visibility: simulator.visibility,
        review: simulator.review,
        durationReview: simulator.durationReview,
        number_of_questions: simulator.number_of_questions,
        questions: formattedQuestions
      };
    });

    return {
      ...paginationInfo,
      data,
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const getSimulatorByIdService = async (
  simulatorId: string
): Promise<SimulatorWithQuestions | ErrorMessage> => {
  try {
    const existingSimulator = await prisma.simulator.findFirst({
      where: {
        id: simulatorId
      },
      include: {
        questions: {
          include: {
            category: {
              include: {
                superCategory: true
              }
            },
            options: true,
            justification: true,
          }
        }
      }
    });

    if (!existingSimulator) {
      return { error: 'Simulator not found', code: 404 };
    }

    // Formateamos las preguntas según la interfaz Question
    const formattedQuestions: Question[] = existingSimulator.questions.map(question => ({
      id: question.id,
      content: question.content as Object,
      justification: question.justification as Object || undefined,
      categoryId: question.categoryId ?? undefined,
      category: question.category ? {
        id: question.category.id,
        name: question.category.name,
        superCategoryId: question.category.superCategoryId,
        superCategory: question.category.superCategory ? {
          id: question.category.superCategory.id,
          name: question.category.superCategory.name
        } : undefined
      } : undefined,
      options: question.options.map(option => ({
        id: option.id,
        content: option.content,
        isCorrect: option.isCorrect,
        questionId: option.questionId
      }))
    }));

    // Calculamos categoryQuestions
    const categoryQuestions = formattedQuestions.reduce((acc, question) => {
      if (question.categoryId) {
        acc[question.categoryId] = (acc[question.categoryId] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    // Transformamos el objeto en un array de CategoryQuestions
    const categoryQuestionsArray = Object.entries(categoryQuestions).map(([categoryId, numberOfQuestions]) => ({
      categoryId: parseInt(categoryId), // Convertimos el categoryId a número si es necesario
      numberOfQuestions
    }));

    // Retornamos el simulador con el formato correcto
    return {
      id: existingSimulator.id,
      name: existingSimulator.name,
      password: existingSimulator.password,
      duration: existingSimulator.duration,
      navigate: existingSimulator.navigate,
      visibility: existingSimulator.visibility,
      review: existingSimulator.review,
      durationReview: existingSimulator.durationReview,
      number_of_questions: existingSimulator.number_of_questions,
      questions: formattedQuestions,
      categoryQuestions: categoryQuestionsArray
    };

  } catch (error) {
    return handleErrors(error);
  }
};

const deleteSimulatorService = async (simulatorId: string): Promise<InfoMessage | ErrorMessage> => {
  try {
    const existingSimulator = await prisma.simulator.findFirst({
      where: {
        id: simulatorId,
      },
    });

    if (!existingSimulator) {
      return {error: 'Simulator not found', code: 404};
    }

    await prisma.simulator.delete({
      where: {
        id: simulatorId,
      }
    });

    return {code: 204};
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;
      return {error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400};
    }
    return {error: 'Error occurred with the server', code: 500};
  }
}

const resetSimulatorPasswordService = async (id:string, newPassword: string): Promise<SimulatorChangePassword | ErrorMessage> => {
  try {
    const existingSimulator = await prisma.simulator.findFirst({
      where: {
        id: id,
      },
    });

    if(!existingSimulator) {
      return { error: 'Simulator not found', code: 404 };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const simulator = await prisma.simulator.update({
      where: {
        id: id
      },
      data: {
        password: hashedPassword,
      }
    });

    return {
      id: simulator.id
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const fieldName = error.meta?.field_name;

      return { error: `Prisma\n Field name: ${fieldName} - Message: ${error.message}`, code: 400 };
    }
    console.log(error);
    return {error: 'Error occurred with the server', code: 500};

  }
}

export {
  createSimulatorService,
  deleteSimulatorService,
  updateSimulatorService,
  simulatorListService,
  getSimulatorByIdService,
  resetSimulatorPasswordService
}
