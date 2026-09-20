import { IUser } from '../models/user.model.js';

declare global {
  namespace Express {
    // Merge with Passport's Express.User
    interface User extends IUser {}

    interface Request {
      user?: IUser;
      requestId?: string;
    }
  }
}
