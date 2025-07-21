// Re-implemented to match refined template
import * as React from "react";

/* -------------------------------------------------------------------------- */
/*                                TYPE DEFS                                   */
/* -------------------------------------------------------------------------- */

export interface StoryArcItem {
  label: string;
  insight: string;
  quote: string;
  signal: string;
}

export interface FeedbackData {
  execSummary: string;
  storyArc: StoryArcItem[];
  sentiment?: {
    value: string;
    snippet: string;
  };
  featureSignals?: string[] | null;
  evaluation: {
    strength: string;
    comment: string;
  };
}

export interface ConversationDetails {
  firstName: string;
  conversationTitle: string;
  conversationId?: string;
  intervieweeFirstName: string;
  totalInterviewMinutes?: number;
  agentType?: string;
}

export interface DesignProps {
  data: FeedbackData;
  details: ConversationDetails;
  unsubscribeUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                              HELPER STYLES                                 */
/* -------------------------------------------------------------------------- */

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 600,
  margin: "0 auto",
  border: "2px solid #e2e8f0",
  borderRadius: 8,
  overflow: "hidden",
  backgroundColor: "#ffffff",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  color: "#0c0a08",
  lineHeight: 1.5,
  fontSize: 14,
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 24,
  borderBottom: "4px solid #E4F222",
};

const contentStyle: React.CSSProperties = { padding: 24 };

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#64748b",
  margin: "0 0 8px 0",
  letterSpacing: "0.05em",
};

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export const ResponseSummary: React.FC<Readonly<DesignProps>> = ({
  data,
  details,
  unsubscribeUrl = "https://example.com/unsubscribe",
}) => (update
  <div style={cardStyle}>
    {/* Header */}
    <div style={headerStyle}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>{
        details.conversationTitle
      }</h1>
      <p style={{ margin: "4px 0 0 0", color: "#475569" }}>
        Summary of conversation with {details.intervieweeFirstName}
      </p>
    </div>

    {/* Content */}
    <div style={contentStyle}>
      {/* Executive Summary */}
      <section
        style={{
          backgroundColor: "#f1f5f9",
          padding: 16,
          borderRadius: 6,
          marginBottom: 24,
        }}
      >
        <h3 style={sectionTitleStyle}>Executive Summary</h3>
        <p style={{ margin: 0, color: "#1e293b" }}>{data.execSummary}</p>
      </section>

      {/* Story Arc */}
      {data.storyArc && data.storyArc.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Story Arc</h3>
          {data.storyArc.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: index === data.storyArc.length - 1 ? 0 : 16,
              }}
            >
              {/* Arrow (simple HTML entity for email safety) */}
              <span style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>➜</span>

              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  {item.label}
                </h4>
                <p style={{ margin: "4px 0 8px 0", color: "#475569" }}>{item.insight}</p>
                {item.quote && (
                  <blockquote
                    style={{
                      borderLeft: "2px solid #cbd5e1",
                      margin: 0,
                      paddingLeft: 12,
                      fontStyle: "italic",
                      color: "#64748b",
                    }}
                  >
                    "{item.quote}"
                  </blockquote>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Evaluation */}
      <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 24, marginBottom: 24 }}>
        <h3 style={sectionTitleStyle}>Evaluation</h3>
        <p
          style={{
            backgroundColor: "#f1f5f9",
            padding: 12,
            borderRadius: 6,
            margin: 0,
            color: "#475569",
          }}
        >
          {data.evaluation.comment}
        </p>
      </section>

      {/* Buttons */}
      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          paddingTop: 24,
          textAlign: "center",
        }}
      >
        <a
          href={details.conversationId ? `https://franko.ai/responses` : "#"}
          style={{
            display: "inline-block",
            backgroundColor: "#E4F222",
            color: "#0c0a08",
            padding: "12px 24px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          View All Responses
        </a>
        <div>
          <a
            href={unsubscribeUrl}
            style={{ color: "#64748b", fontSize: 14, textDecoration: "underline" }}
          >
            Unsubscribe from Responses
          </a>
        </div>
      </div>
    </div>
  </div>
); 