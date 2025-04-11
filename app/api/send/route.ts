import { EmailTemplate } from '../../../components/emails/welcome-email';
import { AdminNotification } from '../../../components/emails/admin-notification';
import { ResponseNotification } from '../../../components/emails/response-received';
import { FeedbackEmail } from '../../../components/emails/feedback-email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send welcome email
async function sendWelcomeEmail(to: string, firstName: string) {
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

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending welcome email:', error);
    return { success: false, error };
  }
}

// Function to send admin notification when a new user signs up
async function sendAdminNotification(firstName: string, lastName: string | undefined, email: string) {
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
      to: ['fletcher@franko.ai'],
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

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending admin notification:', error);
    return { success: false, error };
  }
}

// Function to send notification when a new chat response is received
async function sendResponseNotification(
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

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending response notification:', error);
    return { success: false, error };
  }
}

// Function to send feedback email
async function sendFeedbackEmail(
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
      to: ['fletcher@franko.ai'],
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

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending feedback email:', error);
    return { success: false, error };
  }
}

// API route for sending emails through HTTP requests
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = 'welcome' } = body;

    // Switch based on email type to validate required fields
    switch (type) {
      case 'welcome': {
        const { to, firstName } = body;
        if (!to || !firstName) {
          return Response.json(
            { error: 'Missing required fields for welcome email' },
            { status: 400 }
          );
        }
        
        const result = await sendWelcomeEmail(to, firstName);
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }
        
        return Response.json(result.data);
      }
      
      case 'admin-notification': {
        const { firstName, email, lastName } = body;
        if (!firstName || !email) {
          return Response.json(
            { error: 'Missing required fields for admin notification' },
            { status: 400 }
          );
        }
        
        const result = await sendAdminNotification(firstName, lastName, email);
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }
        
        return Response.json(result.data);
      }
      
      case 'response-notification': {
        const { to, firstName, conversationTitle, conversationId } = body;
        if (!to || !firstName) {
          return Response.json(
            { error: 'Missing required fields for response notification' },
            { status: 400 }
          );
        }
        
        const result = await sendResponseNotification(to, firstName, conversationTitle, conversationId);
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }
        
        return Response.json(result.data);
      }
      
      case 'feedback': {
        const { message, reaction, userEmail, userName } = body;
        if (!message) {
          return Response.json(
            { error: 'Feedback message is required' },
            { status: 400 }
          );
        }
        
        const result = await sendFeedbackEmail(message, reaction, userEmail, userName);
        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }
        
        return Response.json(result.data);
      }
      
      default:
        return Response.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}