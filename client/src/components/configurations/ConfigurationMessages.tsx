import type { ConfigurationMessage } from '../../types/api';

interface ConfigurationMessagesProps {
  messages: ConfigurationMessage[];
  isLoading?: boolean;
}

function DotsAvatar() {
  return <div className="assistant-dot">··</div>;
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function ConfigurationMessages({ messages, isLoading }: ConfigurationMessagesProps) {

  return (
    <div className="panel chat-card">
      <div className="panel-body">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-4">
          <h2 className="panel-title mb-0">Chat History</h2>
        </div>

        <div className="chat-history">
          {isLoading && <div className="text-muted">Loading messages...</div>}
          {messages.map((message) => {
            const isUser = message.messageOrigin === 'user';
            return (
              <div key={message.id} className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
                {!isUser && <DotsAvatar />}
                <div>
                  <div className="chat-bubble">{message.content}</div>
                  <div className="chat-date">{formatDate(message.createdDate)}</div>
                </div>
              </div>
            );
          })}

          {!isLoading && messages.length === 0 && <div className="text-muted">No messages loaded for this configuration.</div>}
        </div>
      </div>
    </div>
  );
}
