// backend/middleware/validationMiddleware.js
import { validationResult } from "express-validator";

export const validateRequest = (validationRules) => {
  return async (req, res, next) => {
    // Validate each field based on the rules
    for (const [field, rules] of Object.entries(validationRules)) {
      if (rules.isRequired && !req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }

      if (rules.isNumeric && isNaN(Number(req.body[field]))) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a number`,
        });
      }

      if (rules.maxLength && req.body[field]?.length > rules.maxLength) {
        return res.status(400).json({
          success: false,
          message: `${field} must be less than ${rules.maxLength} characters`,
        });
      }
    }

    next();
  };
};

export default validateRequest;
