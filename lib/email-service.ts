import { Resend } from 'resend';
import { EmailTemplate } from '@/components/emails/welcome-email'; // Adjusted path assuming components are at root/components
import { AdminNotification } from '@/components/emails/admin-notification'; // Adjusted path
import { ResponseNotification } from '@/components/emails/response-received'; // Adjusted path
import { ResponseSummary } from '@/components/emails/response-summary'; // Enhanced notification template
import { FeedbackEmail } from '@/components/emails/feedback-email'; // Adjusted path

// Check if RESEND_API_KEY is set
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set.');
}
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send welcome email
export async function sendWelcomeEmail(to: string, firstName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fletcher from Franko <welcome@franko.ai>', // Using verified domain
      to: [to],
      subject: 'Welcome to Franko!',
      react: EmailTemplate({ firstName }),
      replyTo: 'fletcher@franko.ai',
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending welcome email:', error);
    return { success: false, error };
  }
}

// Function to send admin notification when a new user signs up
export async function sendAdminNotification(firstName: string, lastName: string | undefined, email: string) {
  try {
    const signupDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const { data, error } = await resend.emails.send({
      from: 'Franko Platform <notifications@franko.ai>', // Using verified domain
      to: ['fletcher@franko.ai'], // Consider making this configurable via env vars
      subject: 'NEW USER',
      react: AdminNotification({
        firstName,
        lastName,
        email,
        signupDate
      }),
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error };
    }

    console.log('Admin notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending admin notification:', error);
    return { success: false, error };
  }
}

// Function to send notification when a new chat response is received
export async function sendResponseNotification(
  to: string,
  firstName: string,
  conversationTitle?: string,
  conversationId?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Franko <notifications@franko.ai>',
      to: [to],
      subject: conversationTitle
        ? `New Response for "${conversationTitle}"`
        : 'New Response Received',
      react: ResponseNotification({
        firstName,
        conversationTitle,
        conversationId,
      }),
    });

    if (error) {
      console.error('Error sending response notification:', error);
      return { success: false, error };
    }

    console.log('Response notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending response notification:', error);
    return { success: false, error };
  }
}

// Function to send enhanced response notification with summary and transcript
export async function sendEnhancedResponseNotification(
  to: string,
  firstName: string,
  conversationTitle?: string,
  conversationId?: string,
  transcript_summary?: string,
  cleanTranscript?: string,
  intervieweeFirstName?: string,
  totalInterviewMinutes?: number,
  agentType?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Franko <notifications@franko.ai>',
      to: [to],
      subject: conversationTitle
        ? `New Response for "${conversationTitle}"`
        : 'New Response Received',
      react: ResponseSummary({
        firstName,
        conversationTitle,
        conversationId,
        transcript_summary,
        cleanTranscript,
        intervieweeFirstName,
        totalInterviewMinutes,
        agentType,
      }),
    });

    if (error) {
      console.error('Error sending enhanced response notification:', error);
      return { success: false, error };
    }

    console.log('Enhanced response notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending enhanced response notification:', error);
    return { success: false, error };
  }
}

// Function to send feedback email
export async function sendFeedbackEmail(
  message: string,
  reaction: string | null,
  userEmail?: string,
  userName?: string
) {
  try {
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const { data, error } = await resend.emails.send({
      from: 'Franko Feedback <feedback@franko.ai>',
      to: ['fletcher@franko.ai'], // Consider making this configurable
      replyTo: userEmail ? userEmail : undefined,
      subject: `Franko Feedback: ${reaction || 'New'} Feedback Received`,
      react: FeedbackEmail({
        message,
        reaction,
        userEmail,
        userName,
        timestamp,
      }),
    });

    if (error) {
      console.error('Error sending feedback email:', error);
      return { success: false, error };
    }

    console.log('Feedback email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending feedback email:', error);
    return { success: false, error };
  }
}
