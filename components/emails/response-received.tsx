import * as React from 'react';

interface ResponseNotificationProps {
  firstName: string;
  conversationTitle?: string;
  conversationId?: string;
}

export const ResponseNotification: React.FC<Readonly<ResponseNotificationProps>> = ({
  firstName,
  conversationTitle,
  conversationId,
}) => (
  <div style={{
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  }}>
    <div style={{
      textAlign: 'center',
      marginBottom: '24px',
    }}>
      <h2 style={{ color: '#4F46E5', margin: '0' }}>Franko</h2>
    </div>
    
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <h1 style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        marginTop: '0',
        marginBottom: '16px',
        color: '#111'
      }}>
        New Response Received
      </h1>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        Hey {firstName},
      </p>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        Good news! You've received a new response {conversationTitle ? `for "${conversationTitle}"` : 'to your conversation'}.
      </p>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        This response has been added to your knowledge base and is ready for you to analyze.
      </p>
      
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
      }}>
        <a 
          href={conversationId 
            ? `https://franko.ai/conversations/${conversationId}` 
            : 'https://franko.ai/dashboard'}
          style={{
            backgroundColor: '#4F46E5',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          View Response
        </a>
      </div>
    </div>
    
    <div style={{
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '14px',
      marginTop: '24px',
    }}>
      <p>
        You're receiving this email because you've enabled response notifications.
        You can update your preferences in the conversation settings.
      </p>
      <p>
        © {new Date().getFullYear()} Franko AI. All rights reserved.
      </p>
    </div>
  </div>
); 