import type { Request, Response, NextFunction } from "express";
import { sendContactEmail } from "../services/email.service.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";

export const submitContactForm = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { firstName, lastName, email, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      throw new AppError("Please provide all required fields.", 400);
    }

    await sendContactEmail(firstName, lastName, email, message);

    logger.info({ email, name: `${firstName} ${lastName}` }, "Contact form submitted successfully");

    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    logger.error("Error sending contact email:", error);
    // Return a 500 error if nodemailer fails
    next(new AppError("Failed to send message. Please check email configuration.", 500));
  }
};
