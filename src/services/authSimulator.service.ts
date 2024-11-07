import {PrismaClient} from "@prisma/client";
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {AuthSimulator} from "../model/simulator";
import {ErrorMessage} from "../model/messages";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const singInSimulatorService = async (simulatorId: string, password: string): Promise<AuthSimulator| ErrorMessage> => {
  try {
    const simulator = await prisma.simulator.findFirst({
      where: {
        id: simulatorId,
        visibility: true,
      }
    });

    if (!simulator) {
      return { error: 'Simulator not found', code: 404 };
    }

    if (!simulator.visibility) {
      return { error: 'Simulator is not available', code: 403 };
    }

    const isCorrectPassword = await bcrypt.compare(password, simulator.password);

    if (!isCorrectPassword) {
      return { error: 'Invalid password', code: 400 };
    }

    return {
      id: simulator.id,
      name: simulator.name,
      duration: simulator.duration,
      navigate: simulator.navigate,
      visibility: simulator.visibility,
      review: simulator.review,
      durationReview: simulator.durationReview,
      number_of_questions: simulator.number_of_questions,
    };

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      return {error: `Prisma: ${error.meta} - ${error.message}`, code: 400}
    }
    return {error: 'Error occurred with the server', code: 500
    };
  }
}

export { singInSimulatorService }
