import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  };
// Note: wrap in asyncHandler at the route level so Zod errors hit errorHandler
