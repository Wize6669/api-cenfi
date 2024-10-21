import {Router} from "express";
import {signInSimulatorController} from "../controllers/authSimulator.controller";

const router = Router();

router.post('/sign-in-simulator', signInSimulatorController)

export { router };
