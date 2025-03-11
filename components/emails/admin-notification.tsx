import * as React from 'react';

interface AdminNotificationProps {
  firstName: string;
  lastName?: string;
  email: string;
  signupDate: string;
}

export const AdminNotification: React.FC<Readonly<AdminNotificationProps>> = ({
  firstName,
  lastName,
  email,
  signupDate,
}) => (
  <div style={{
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  }}>
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
        New User Registration
      </h1>
      
      <div style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        <p><strong>Date:</strong> {signupDate}</p>
        <p><strong>Name:</strong> {firstName} {lastName || ''}</p>
        <p><strong>Email:</strong> {email}</p>
      </div>
      
      <hr style={{ 
        border: 'none',
        borderTop: '1px solid #e5e7eb',
        margin: '16px 0',
      }} />
      
      <p style={{ 
        fontSize: '14px',
        color: '#6b7280',
      }}>
        This is an automated notification from the Franko Platform.
      </p>
    </div>
  </div>
); 