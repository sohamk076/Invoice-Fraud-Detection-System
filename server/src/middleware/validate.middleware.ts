import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: errorMessages,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Invalid request payload.',
      });
    }
  };
};
