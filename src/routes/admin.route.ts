import { Router } from 'express';
import { resetPasswordController } from '../controllers/admin.controller';
import { schemaVerifierMiddleware } from '../middlewares/schemaVerifier.middleware';
import { headerAuthorizationSchemaJWT } from '../schemasJoi/headerAuthorization.schema';

const router = Router();

router.put('/reset-password', schemaVerifierMiddleware({ headers: headerAuthorizationSchemaJWT }), resetPasswordController);

export { router };

