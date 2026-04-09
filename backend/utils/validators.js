import { z } from "zod";

const loginValidator = z.object({
  email: z.string().email().trim(),
  password: z.string().min(6).trim(),
});

const signupValidator = loginValidator.extend({
  name: z.string().min(2),
});

const validate = (Schema) => {
  return async (req, res, next) => {
      console.log(req.body);
      const validationResult = await Schema.safeParse(req.body);
      if (validationResult.success === false) {
        const errorMessages = validationResult.error.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
        }));
    
        return res.status(422).json({ errors: errorMessages });
      }
    
      return next();
  };
};

export { loginValidator, signupValidator, validate };
