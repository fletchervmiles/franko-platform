import * as React from 'react';

interface ResponseSummaryProps {
  firstName: string;
  conversationTitle?: string;
  conversationId?: string;
  transcript_summary?: string;
  cleanTranscript?: string;
  intervieweeFirstName?: string;
  totalInterviewMinutes?: number;
  agentType?: string;
  unsubscribeUrl?: string;
}

export const ResponseSummary: React.FC<Readonly<ResponseSummaryProps>> = ({
  firstName,
  conversationTitle,
  conversationId,
  transcript_summary,
  cleanTranscript,
  intervieweeFirstName,
  totalInterviewMinutes,
  agentType,
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
        New Response Received
      </h1>
      
      <p style={{ margin: '14px 0' }}>
        Hey {firstName},
      </p>
      
      <p style={{ margin: '14px 0' }}>
        Great news! You've received a new response {conversationTitle ? `for "${conversationTitle}"` : 'from your chat modal'}.
        {intervieweeFirstName && ` ${intervieweeFirstName} just completed their conversation`}
        {totalInterviewMinutes && ` in ${totalInterviewMinutes} minutes`}.
      </p>

      {/* Summary Section */}
      {transcript_summary && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          padding: '16px',
          margin: '20px 0',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            color: '#495057',
          }}>
            Conversation Summary
          </h3>
          <p style={{
            margin: '0',
            lineHeight: '1.5',
            color: '#6c757d',
          }}>
            {transcript_summary}
          </p>
        </div>
      )}

      {/* Transcript Section */}
      {cleanTranscript && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          padding: '16px',
          margin: '20px 0',
          maxHeight: '300px',
          overflow: 'auto',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            color: '#495057',
          }}>
            Full Conversation
          </h3>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.4',
            color: '#6c757d',
            whiteSpace: 'pre-wrap',
            borderLeft: '3px solid #e9ecef',
            paddingLeft: '12px',
          }}>
            {cleanTranscript}
          </div>
        </div>
      )}
      
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
      }}>
        <a 
          href={conversationId 
            ? `https://franko.ai/responses`
            : 'https://franko.ai/responses'}
          style={{
            background: '#E4F222',
            color: '#1C1617',
            padding: '12px 24px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
            transition: 'all 0.2s ease',
          }}
        >
          View All Responses
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
        You're receiving this email because you've enabled response notifications for this chat modal.
        You can update your preferences in the modal settings.
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