import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import logger from "../lib/logger.js";
import { type SubscriptionTier, PLAN_DETAILS } from "../config/subscription.config.js";

// Helper to get transporter (lazy initialized to ensure env vars are loaded)
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Generates an invoice PDF in memory and returns it as a Buffer.
 */
const generateInvoicePDF = (
  user: { name: string; email: string },
  planName: string,
  amountInPaise: number,
  orderId: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header Background
      doc.rect(0, 0, 612, 100).fill("#111111");

      // Header Text
      doc.fontSize(28).fillColor("#ffffff").text("MITORI", 50, 40, { continued: true }).fillColor("#ff6b00").text("X");
      doc.fontSize(12).fillColor("#a1a1aa").text("RECEIPT / INVOICE", 400, 48, { align: "right" });
      
      // Move down below header
      doc.y = 130;

      // Company Info (Left) & Invoice Info (Right)
      const topSectionY = doc.y;
      
      doc.fontSize(10).fillColor("#71717a")
        .text("FROM:", 50, topSectionY)
        .fillColor("#18181b").font("Helvetica-Bold")
        .text("Mitorix Inc.", 50, topSectionY + 15)
        .font("Helvetica").fillColor("#52525b")
        .text("ribadiyaraj18@gmail.com", 50, topSectionY + 30);
      
      doc.fontSize(10).fillColor("#71717a")
        .text("INVOICE DETAILS:", 350, topSectionY)
        .fillColor("#18181b").font("Helvetica-Bold")
        .text(`ID: ${orderId}`, 350, topSectionY + 15)
        .font("Helvetica").fillColor("#52525b")
        .text(`Date: ${new Date().toLocaleDateString()}`, 350, topSectionY + 30)
        .fillColor("#10b981").font("Helvetica-Bold") // Green paid status
        .text(`STATUS: PAID`, 350, topSectionY + 45);

      doc.moveDown(3);

      // Billed To
      const customerY = doc.y;
      doc.fontSize(10).fillColor("#71717a").font("Helvetica").text("BILLED TO:", 50, customerY);
      doc.fontSize(12).fillColor("#18181b").font("Helvetica-Bold").text(user.name, 50, customerY + 15);
      doc.fontSize(10).fillColor("#52525b").font("Helvetica").text(user.email, 50, customerY + 30);

      doc.moveDown(4);

      // Table Header (Orange background)
      const tableTop = doc.y;
      doc.rect(50, tableTop, 512, 30).fill("#ff6b00");
      
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff");
      doc.text("DESCRIPTION", 60, tableTop + 10);
      doc.text("AMOUNT", 450, tableTop + 10, { width: 100, align: "right" });
      
      // Table Row
      doc.font("Helvetica").fontSize(11).fillColor("#18181b");
      doc.text(`Mitorix ${planName} Subscription`, 60, tableTop + 45);
      doc.font("Helvetica-Bold").text(`Rs ${(amountInPaise / 100).toFixed(2)}`, 450, tableTop + 45, { width: 100, align: "right" });
      
      doc.moveTo(50, tableTop + 75).lineTo(562, tableTop + 75).strokeColor("#e4e4e7").stroke();

      // Total
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#18181b");
      doc.text("TOTAL PAID:", 300, tableTop + 95, { align: "right", width: 150 });
      doc.fillColor("#ff6b00").text(`Rs ${(amountInPaise / 100).toFixed(2)}`, 450, tableTop + 95, { width: 100, align: "right" });

      doc.moveDown(6);
      doc.font("Helvetica").fontSize(10).fillColor("#a1a1aa").text("Thank you for choosing Mitorix. If you have any questions, please contact ribadiyaraj18@gmail.com.", 50, doc.y, { align: "center", width: 512 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Sends a welcome/receipt email with a PDF invoice attached.
 */
export const sendSubscriptionReceipt = async (
  user: { name: string; email: string },
  planTier: Exclude<SubscriptionTier, "FREE">,
  orderId: string
) => {
  try {
    const plan = PLAN_DETAILS[planTier];
    const pdfBuffer = await generateInvoicePDF(user, plan.name, plan.priceInPaise, orderId);
    const transporter = getTransporter();

    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; padding: 40px 20px; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-top: 4px solid #ff6b00; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="padding: 30px; text-align: center; border-bottom: 1px solid #f4f4f5; background-color: #ffffff;">
            <h1 style="margin: 0; color: #18181b; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MITORIX<span style="color: #ff6b00;">AI</span></h1>
            <p style="margin: 5px 0 0 0; color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Welcome to ${plan.name}</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="margin-top: 0; color: #18181b;">Hi ${user.name},</h2>
            <p style="color: #555555; font-size: 16px;">Thank you for upgrading to <strong>Mitorix ${plan.name}</strong>! Your payment was successful and your account has been fully upgraded.</p>
            
            <div style="background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 25px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #ff6b00; font-size: 16px;">Your ${plan.name} Capabilities:</h3>
              <ul style="color: #27272a; font-size: 15px; padding-left: 20px; margin-bottom: 0;">
                ${plan.features.map(feature => `<li style="margin-bottom: 10px;"><strong>&#10003;</strong> ${feature}</li>`).join("")}
              </ul>
            </div>
            
            <p style="color: #555555; font-size: 15px;">A PDF receipt for your transaction is attached to this email.</p>
            <p style="color: #555555; font-size: 15px;">Ready to dive in? <a href="https://www.mitorix.site/dashboard" style="color: #ff6b00; text-decoration: none; font-weight: 600;">Go to your Dashboard &rarr;</a></p>
          </div>
          <div style="padding: 20px; text-align: center; background-color: #fafafa; border-top: 1px solid #f4f4f5;">
            <p style="margin: 0; color: #a1a1aa; font-size: 12px;">This is an automated message from Mitorix.</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Mitorix Support" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Welcome to Mitorix ${plan.name} - Receipt Attached`,
      html,
      attachments: [
        {
          filename: `mitorix-invoice-${orderId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info({ email: user.email, orderId }, "Subscription receipt email sent successfully");
  } catch (error) {
    logger.error({ err: error, email: user.email }, "Failed to send subscription receipt email");
  }
};

/**
 * Sends a contact form inquiry.
 */
export const sendContactEmail = async (
  firstName: string,
  lastName: string,
  email: string,
  message: string
) => {
  const transporter = getTransporter();
  const targetEmail = process.env.CONTACT_EMAIL_TO || process.env.SMTP_USER;

  const html = `
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
          <p style="margin: 0; color: #a1a1aa; font-size: 12px;">This is an automated message from the Mitorix Contact Form.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${firstName} ${lastName}" <${email}>`,
    replyTo: email,
    to: targetEmail,
    subject: `Mitorix Contact Inquiry from ${firstName} ${lastName}`,
    html,
  });
};
