import { User } from "../models/schema.js";

export const getUserFromToken = async (req, res, next) => {
  try {
    const userId = res.locals.jwtData.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid Token' });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).send('User does not exist');
    }

    res.locals.user = user;

    return next();

  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
};
