import * as React from 'react';

interface FeedbackEmailProps {
  message: string;
  reaction: string | null;
  userEmail?: string;
  userName?: string;
  timestamp: string;
}

export const FeedbackEmail: React.FC<Readonly<FeedbackEmailProps>> = ({
  message,
  reaction,
  userEmail,
  userName,
  timestamp,
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
      <h2 style={{ color: '#4F46E5', margin: '0' }}>Franko Feedback</h2>
    </div>
    
    <div style={{
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
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
      
      <div style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        <p><strong>Time:</strong> {timestamp}</p>
        {userName && <p><strong>User:</strong> {userName}</p>}
        {userEmail && <p><strong>Email:</strong> {userEmail}</p>}
        <p><strong>Sentiment:</strong> {reaction || 'Not specified'}</p>
      </div>
      
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '16px',
        marginTop: '16px',
      }}>
        <h2 style={{
          fontSize: '18px',
          margin: '0 0 12px 0',
        }}>
          Message:
        </h2>
        <p style={{
          margin: '0',
          whiteSpace: 'pre-wrap',
          fontSize: '16px',
        }}>
          {message}
        </p>
      </div>
    </div>
    
    <div style={{
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '14px',
      marginTop: '24px',
    }}>
      <p>
        This is an automated message. You can reply directly to the user if their email is provided.
      </p>
    </div>
  </div>
); 