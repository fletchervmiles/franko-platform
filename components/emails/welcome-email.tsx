import * as React from 'react';

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div style={{
    fontFamily: 'sans-serif',
    color: '#333',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontSize: '14px',
    lineHeight: '21px',
    textAlign: 'left',
  }}>
    <div style={{
      marginBottom: '20px',
    }}>
      <p style={{ margin: '14px 0' }}>
        Hey {firstName},
      </p>
      
      <p style={{ margin: '14px 0' }}>
        My name is Fletcher - I'm the founder of Franko.
      </p>
      
      <p style={{ margin: '14px 0' }}>
        Franko enables 100s of quick customer conversations, creating a unique knowledge base of what your users really think. Then, just chat with that data to instantly understand your customers—like ChatGPT if it'd gone and interviewed a bunch of your users first.
      </p>
      
      <p style={{ margin: '14px 0' }}>
        Here's how to get started:
      </p>
      
      <ol style={{ 
        margin: '14px 0',
        paddingLeft: '20px',
      }}>
        <li>Complete Context Setup—helps your AI agent understand your business.</li>
        <li>Create a Conversation—sets clear instructions for your AI agent about what you want to learn.</li>
        <li>Test it Out—use the link in "Share" tab to have a chit-chat and see Franko in action.</li>
      </ol>
      
      <p style={{ 
        margin: '14px 0',
        fontWeight: 'bold',
      }}>
        p.s. hit "reply" and let me know how you're planning to use Franko—I'd love to hear from you!
      </p>
      
      <p style={{ margin: '14px 0' }}>
        Best,<br />
        Fletcher
      </p>
    </div>
  </div>
);