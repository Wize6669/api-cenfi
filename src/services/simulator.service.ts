import {PrismaClient} from "@prisma/client";
import {
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

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(simulatorData.password, 10);

    // Seleccionar preguntas aleatorias para cada categoría
    let selectedQuestionIds: number[] = [];

    for (const categoryQuestion of simulatorData.categoryQuestions) {
      const questions = await prisma.question.findMany({
        where: {
          categoryId: categoryQuestion.categoryId,
          id: {
            notIn: selectedQuestionIds
          }
        },
        take: categoryQuestion.numberOfQuestions,
        orderBy: {
          id: 'asc'
        },
        select: {
          id: true
        }
      });

      selectedQuestionIds = [...selectedQuestionIds, ...questions.map(q => q.id)];
    }

    // Crear el simulador y conectar con las preguntas existentes
    const newSimulator = await prisma.simulator.create({
      data: {
        name: simulatorData.name,
        password: hashedPassword,
        duration: simulatorData.duration,
        visibility: simulatorData.visibility,
        navigate: simulatorData.navigate,
        review: simulatorData.review,
        number_of_questions: selectedQuestionIds.length,
        questions: {
          connect: selectedQuestionIds.map(id => ({ id }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    // Formatear la respuesta según la interfaz QuestionCreate
    const formattedQuestions: QuestionCreate[] = newSimulator.questions.map(question => ({
      id: question.id,
      content: question.content as Object,
      justification: question.justification as Object,
      answer: question.answer,
      options: question.options.map(opt => ({
        id: opt.id,
        content: opt.content as Object,
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

    const hashedPassword = updateSimulator.password
      ? await bcrypt.hash(updateSimulator.password, 10)
      : existingSimulator.password;

    let selectedQuestions: { id: number }[] = [];

    // Si hay nuevas categorías de preguntas para actualizar
    if (updateSimulator.categoryQuestions && updateSimulator.categoryQuestions.length > 0) {
      for (const categoryQuestion of updateSimulator.categoryQuestions) {
        const questions = await prisma.question.findMany({
          where: {
            categoryId: categoryQuestion.categoryId,
            id: {
              notIn: selectedQuestions.map(q => q.id)
            }
          },
          select: {
            id: true
          },
          take: categoryQuestion.numberOfQuestions,
        });

        selectedQuestions = [...selectedQuestions, ...questions];
      }
    }

    // Actualizar el simulador con la inclusión de las preguntas y opciones
    const updatedSimulator = await prisma.simulator.update({
      where: {
        id: updateSimulator.id,
      },
      data: {
        name: updateSimulator.name,
        password: hashedPassword,
        duration: updateSimulator.duration,
        navigate: updateSimulator.navigate,
        visibility: updateSimulator.visibility,
        review: updateSimulator.review,
        number_of_questions: selectedQuestions.length || existingSimulator.questions.length,
        questions: selectedQuestions.length > 0 ? {
          set: [], // Primero desconectamos todas las preguntas existentes
          connect: selectedQuestions // Conectamos las nuevas preguntas
        } : undefined
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    // Formatear la respuesta según la interfaz QuestionCreate
    const formattedQuestions: QuestionCreate[] = updatedSimulator.questions.map(question => ({
      id: question.id,
      content: question.content as Object,
      justification: question.justification as Object,
      answer: question.answer,
      options: question.options.map(opt => ({
        id: opt.id,
        content: opt.content as Object,
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
            category: true
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
        answer: question.answer,
        options: question.options.map(opt => ({
          id: opt.id,
          content: opt.content as Object,
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
            category: true,
            options: true
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
      answer: question.answer,
      categoryId: question.categoryId ?? undefined,
      category: question.category ? {
        id: question.category.id,
        name: question.category.name,
      } : undefined,
      options: question.options.map(option => ({
        id: option.id,
        content: option.content,
        questionId: option.questionId
      }))
    }));

    // Retornamos el simulador con el formato correcto
    return {
      id: existingSimulator.id,
      name: existingSimulator.name,
      duration: existingSimulator.duration,
      navigate: existingSimulator.navigate,
      visibility: existingSimulator.visibility,
      review: existingSimulator.review,
      number_of_questions: existingSimulator.number_of_questions,
      questions: formattedQuestions
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

export {
    createSimulatorService,
    deleteSimulatorService,
    updateSimulatorService,
    simulatorListService,
    getSimulatorByIdService
}
