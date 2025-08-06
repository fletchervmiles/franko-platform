import * as React from 'react';

interface ResponseNotificationProps {
  firstName: string;
  conversationTitle?: string;
  conversationId?: string;
  unsubscribeUrl?: string;
}

export const ResponseNotification: React.FC<Readonly<ResponseNotificationProps>> = ({
  firstName,
  conversationTitle,
  conversationId,
  unsubscribeUrl = 'https://example.com/unsubscribe',
}) => (
  <div style={{
    fontFamily: 'sans-serif',
    color: '#333',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontSize: '14px',
    lineHeight: '21px',
  }}>    
    <div style={{
      marginBottom: '20px',
    }}>
      <h1 style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        marginTop: '0',
        marginBottom: '16px',
        color: '#111'
      }}>
        New Feedback Received
      </h1>
      
      <p style={{ margin: '14px 0' }}>
        Hey {firstName},
      </p>
      
      <p style={{ margin: '14px 0' }}>
        Good news! You've received new feedback from a user.
      </p>
      
      <p style={{ margin: '14px 0' }}>
        This response has been added to your account and is ready for you to review.
      </p>
      
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
      }}>
        <a 
          href={conversationId 
            ? `https://franko.ai/conversations/${conversationId}?tab=responses`
            : 'https://franko.ai/dashboard'}
          style={{
            background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
            transition: 'all 0.2s ease',
          }}
        >
          View Feedback
        </a>
      </div>
    </div>
    
    <div style={{
      color: '#6b7280',
      fontSize: '12px',
      marginTop: '20px',
      borderTop: '1px solid #eee',
      paddingTop: '10px',
    }}>
      <p>
        You're receiving this email because you've enabled feedback notifications.
        You can update your preferences in the conversation settings.
      </p>
      <p>© {new Date().getFullYear()} Franko AI. All rights reserved.</p>
      <p>
        <a href={unsubscribeUrl} style={{ color: '#6b7280', textDecoration: 'underline' }}>
          Unsubscribe
        </a>
      </p>
    </div>
  </div>
); 