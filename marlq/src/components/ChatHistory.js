import React, { useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import './ChatHistory.css';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return {
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
};

export default function ChatHistory({ messages, onSendMessage, inputValue, setInputValue, isTyping }) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const renderMessageGroup = (message, idx) => {
    const { time, date } = formatDate(message.createdAt);
    const showDate = idx === 0 || 
      formatDate(messages[idx - 1]?.createdAt).date !== date;

    return (
      <div key={message.id || idx} className="message-group">
        {showDate && (
          <div className="date-divider">
            <span>{date}</span>
          </div>
        )}
        <div className={`message-bubble ${message.type}`}>
          <div className="message-content">
            <p>{message.type === 'user' ? message.prompt : message.response}</p>
            <span className="timestamp">{time}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container glass-card">
      <div className="chat-header">
        <h2>💭 Chat with Marqueelz AI</h2>
      </div>
      
      <div className="messages-container" ref={chatContainerRef}>
        {messages.map((message, idx) => renderMessageGroup(message, idx))}
        {isTyping && (
          <div className="message-group">
            <div className="message-bubble ai">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          placeholder="Send a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="chat-input"
          disabled={isTyping}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={isTyping || !inputValue.trim()}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}
