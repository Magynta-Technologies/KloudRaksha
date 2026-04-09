import  jwt  from "jsonwebtoken";
import { COOKIE_NAME } from "./constants.js";

export const createToken = (id, email, expiresIn) => {
    const payload = { id, email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
    });
    return token;
};


export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies[`${COOKIE_NAME}`];

    if (!token || token.trim() === "") {
      return res.status(401).json({ message: "Token Not Received" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.jwtData = decodedToken;
    return next();

  } catch (err) {

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token Expired" });
    } else {
      return res.status(401).json({ message: "Invalid Token" });
    }

  }
};


  