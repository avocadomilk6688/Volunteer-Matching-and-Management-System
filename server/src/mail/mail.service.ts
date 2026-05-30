import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // 👈 Imported for secure variable extraction
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  // --- Inject ConfigService directly through the class constructor dependency injection layer ---
  constructor(private readonly configService: ConfigService) {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    // Handle runtime safety checks in case your .env file is missing or formatted wrong
    if (!emailUser || !emailPass) {
      throw new Error(
        'CRITICAL ERROR: Gmail SMTP authentication parameters (EMAIL_USER/EMAIL_PASS) are missing from the configuration profile.',
      );
    }

    // Set up the secure Gmail SMTP pipeline interface
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('EMAIL_PORT') || 465,
      secure: true, // true for port 465 SSL connections
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  /**
   * Sends a transactional password reset link to ANY real recipient inbox dynamically.
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    try {
      const fromEmail = this.configService.get<string>('EMAIL_USER');

      await this.transporter.sendMail({
        from: `"VMMS Support" <${fromEmail}>`,
        to: email,
        subject: '🔒 Password Reset Request',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #E0E0E0; border-radius: 0; background-color: #ffffff; box-sizing: border-box;">
            <h2 style="color: #000000; font-size: 22px; border-bottom: 2px solid #FF8C42; padding-bottom: 12px; margin-top: 0; font-weight: 700;">
              Password Reset Request
            </h2>
            
            <p style="font-size: 16px; line-height: 1.5; color: #000000; margin: 20px 0 10px 0;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333; margin: 0 0 24px 0;">
              We received a request to reset the password for your account associated with this email address in the Volunteer Matching and Management System (VMMS).
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #333; margin: 0 0 24px 0;">
              Please click the action button below to proceed with setting up your new security credentials.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #FF8C42; color: #ffffff; padding: 12px 28px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block; font-family: 'Inter', Arial, sans-serif;">
                Reset My Password
              </a>
            </div>
            
            <p style="font-size: 13px; color: #767676; margin: 24px 0 4px 0; font-family: 'Inter', sans-serif;">
              If the button above does not work, copy and paste this URL into your browser interface:
            </p>
            <p style="font-size: 13px; color: #FF8C42; word-break: break-all; margin: 0 0 24px 0; font-weight: 500;">
              <a href="${resetLink}" style="color: #FF8C42; text-decoration: underline;">${resetLink}</a>
            </p>
            
            <hr style="border: 0; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #767676; margin: 0; line-height: 1.4;">
              If you did not make this request, you can safely disregard this notification. Your security settings remain unaffected.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Nodemailer Transmission System Failure:', error);
      throw new InternalServerErrorException(
        'Failed to process outbound system communications.',
      );
    }
  }
}
