
import { createClient } from '@supabase/supabase-js';

// Retrieve env vars from your Vite setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const emailService = {
  /**
   * Sends an email using the Supabase Edge Function 'send-email'.
   */
  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload
      });

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      console.error('Email Service Error:', err);
      return { success: false, error: err.message || 'Failed to send email' };
    }
  },

  /**
   * Helper specifically for sending M-Pesa Order Confirmations
   */
  async sendOrderConfirmation(userEmail: string, orderDetails: any) {
    const subject = `Order Confirmation #${orderDetails.id}`;
    const html = `
      <h1>Thank you for your order!</h1>
      <p>We confirm that we have received your payment of KES ${orderDetails.amount}</p>
      <p><b>Item:</b> ${orderDetails.item}</p>
      <br/>
      <p>Regards,<br/>Khalwale IP Team</p>
    `;
    const text = `Thank you for your order! We received KES ${orderDetails.amount} for ${orderDetails.item}. Regards, Khalwale IP Team`;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text
    });
  }
};

/**
 * Specifically for sending the Attorney Brief / Analysis Results
 * This calls the 'send-brief' Edge Function
 */
export async function sendEmailBrief(email: string, name: string, caseId: string, brief: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-brief', {
      body: { email, name, caseId, brief }
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('sendEmailBrief Error:', err);
    return false;
  }
}
