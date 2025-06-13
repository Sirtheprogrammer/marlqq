import React, { useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import './ChatHistory.css';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return {
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
};

const MessageBubble = ({ message, time }) => (
  <div className={`message-bubble ${message.type}`}>
    <div className="message-content">
      <p>{message.content}</p>
      <span className="timestamp">{time}</span>
    </div>
  </div>
);

const TypingIndicator = () => (
  <div className="message-bubble ai">
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);

const LoadingMessages = () => (
  <div className="messages-loading">
    <div className="loading-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <p>Loading messages...</p>
  </div>
);

export default function ChatHistory({ 
  messages, 
  onSubmit, 
  inputValue, 
  setInputValue, 
  isTyping,
  isLoading = false 
}) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isTyping, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages" ref={chatContainerRef}>
        {isLoading ? (
          <LoadingMessages />
        ) : (
          <>
            {messages.map((message, idx) => {
              const { time } = formatDate(message.createdAt);
              const showDate = idx === 0 || 
                formatDate(messages[idx - 1]?.createdAt).date !== formatDate(message.createdAt).date;
              
              return (
                <div key={message.id || idx} className="message-group">
                  {showDate && (
                    <div className="date-divider">
                      <span>{formatDate(message.createdAt).date}</span>
                    </div>
                  )}
                  <MessageBubble message={message} time={time} />
                </div>
              );
            })}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isTyping || isLoading}
          className="chat-input"
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!inputValue.trim() || isTyping || isLoading}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
