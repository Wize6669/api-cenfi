import jwt from "jsonwebtoken";
import { config } from '../config';
import { UserAuth } from '../model/user';

const generateAccessToken = (user: UserAuth) => {
    const PUBLIC_SECRET_KEY = config.get('PUBLIC_SECRET_KEY');

    return jwt.sign(user, PUBLIC_SECRET_KEY, { expiresIn: 12600 });
}

export { generateAccessToken }