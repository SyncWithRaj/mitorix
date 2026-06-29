import type { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
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

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const targetEmail = process.env.CONTACT_EMAIL_TO || process.env.SMTP_USER;

    // Send the email
    await transporter.sendMail({
      from: `"${firstName} ${lastName}" <${email}>`, // sender address (could be overwritten by SMTP provider, but sets Reply-To nicely)
      replyTo: email,
      to: targetEmail, 
      subject: `MitorixAI Contact Inquiry from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; padding: 40px 20px; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-top: 4px solid #ff6b00; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f4f4f5; background-color: #ffffff;">
              <h1 style="margin: 0; color: #18181b; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MITORIX<span style="color: #ff6b00;">AI</span></h1>
              <p style="margin: 5px 0 0 0; color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">New Support Inquiry</p>
            </div>
            <div style="padding: 40px 30px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; width: 100px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Name</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #18181b; font-weight: 600; font-size: 16px;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; width: 100px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Email</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; color: #ff6b00; font-weight: 600; font-size: 16px;"><a href="mailto:${email}" style="color: #ff6b00; text-decoration: none;">${email}</a></td>
                </tr>
              </table>
              
              <div style="background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 25px;">
                <p style="margin: 0 0 15px 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Message Content</p>
                <div style="color: #27272a; font-size: 15px; white-space: pre-wrap; margin: 0;">${message}</div>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #fafafa; border-top: 1px solid #f4f4f5;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">This is an automated message from the MitorixAI Contact Form.</p>
            </div>
          </div>
        </div>
      `,
    });

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
