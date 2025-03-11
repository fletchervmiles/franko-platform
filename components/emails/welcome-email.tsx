import * as React from 'react';

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
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
      {/* Replace with your logo */}
      <h2 style={{ color: '#4F46E5', margin: '0' }}>Franko</h2>
    </div>
    
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
    }}>
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
        I'm Fletcher, thanks for signing up!
      </p>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        Franko enables 100s of quick customer conversations, creating a unique knowledge base of what your users really think. Then, just chat with that data to instantly understand your customers—like ChatGPT if it'd gone and interviewed a bunch of your users first.
      </p>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        Here's how to get started:
      </p>
      
      <ol style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
        paddingLeft: '24px',
      }}>
        <li>Complete Context Setup—helps your AI agent understand your business.</li>
        <li>Create a Conversation—sets clear instructions for your AI agent about what you want to learn.</li>
        <li>Test it Out—use the link in "Share" tab to have a chit-chat and see Franko in action.</li>
      </ol>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
        fontWeight: 'bold',
      }}>
        P.s. hit "reply" and let me know how you're planning to use Franko—I'd love to hear from you!
      </p>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '24px',
        margin: '16px 0',
      }}>
        Best,<br />
        Fletcher
      </p>
    </div>
    
    <div style={{
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '14px',
      marginTop: '24px',
    }}>
      <p>
        © {new Date().getFullYear()} Franko AI. All rights reserved.
      </p>
    </div>
  </div>
);