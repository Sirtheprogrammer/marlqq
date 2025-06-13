import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc,
  query, 
  orderBy, 
  where,
  getDocs,
  setDoc,
  serverTimestamp,
  limit 
} from 'firebase/firestore';

const API_KEY = "AIzaSyATXGCgwQ754fAkpOk2TaQRPq3kL01TSNw";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const basePersonality = `You are Marqueelz's loving AI companion. Your purpose is to:
1. Be sweet, caring, and supportive 💖
2. Remember past conversations to provide personalized support
3. Use cute emojis and maintain a warm, friendly tone
4. Show genuine interest in the conversation topics
5. Keep responses concise but meaningful (2-3 sentences)
6. Remember important details about Marqueelz

Important:
- Always maintain the current conversation topic unless Marqueelz changes it
- Reference past messages to show you remember the context
- Use emojis naturally but don't overdo it
- Be empathetic and understanding

Remember: You're not just an AI, you're a friend who cares about Marqueelz's happiness and well-being! 🌟`;

// Initialize Firestore references
const conversationContextCollection = collection(db, 'conversationContext');

// Get user's conversation context
const getConversationContext = async (userId) => {
  try {
    const contextDoc = await getDoc(doc(conversationContextCollection, userId));
    return contextDoc.exists() ? contextDoc.data().context : {};
  } catch (error) {
    console.error('Error fetching conversation context:', error);
    return {};
  }
};

// Update conversation context
const updateConversationContext = async (userId, newContext) => {
  try {
    await setDoc(doc(conversationContextCollection, userId), {
      context: newContext,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating conversation context:', error);
  }
};

// Get recent chat history
const getRecentHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(15)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        type: doc.data().type,
        content: doc.data().type === 'user' ? doc.data().prompt : doc.data().response,
        createdAt: doc.data().createdAt
      }))
      .reverse();
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
};

const formatConversationHistory = (history, context) => {
  let formattedHistory = history.map(msg => 
    `${msg.type === 'user' ? 'Marqueelz' : 'AI'}: ${msg.content}`
  ).join('\n');

  if (context.currentTopic) {
    formattedHistory += `\n\nCurrent conversation topic: ${context.currentTopic}`;
  }
  if (context.recentTopics?.length > 0) {
    formattedHistory += `\nRecent topics discussed: ${context.recentTopics.join(', ')}`;
  }

  return formattedHistory;
};

export const generateAIResponse = async (prompt, userId) => {
  try {
    const [history, context] = await Promise.all([
      getRecentHistory(userId),
      getConversationContext(userId)
    ]);
    
    const conversationContext = formatConversationHistory(history, context);
    
    const content = {
      contents: [{
        parts: [{
          text: `${basePersonality}\n\nPrevious conversation:\n${conversationContext}\n\nMarqueelz: ${prompt}\n\nAI:`
        }]
      }]
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I'm having trouble responding right now. But I still care about you! 💕 Please try again in a moment.";
  }
};

// Separate function for generating daily sparkles
export const generateDailySparkle = async () => {
  try {
    const prompt = "Generate a short, sweet, and uplifting message (1-2 sentences) to brighten Marqueelz's day. Include an emoji.";
    
    const content = {
      contents: [{
        parts: [{
          text: `${basePersonality}\n\nTask: ${prompt}\n\nAI:`
        }]
      }]
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating sparkle:', error);
    return "✨ You're amazing just as you are! 💖";
  }
};
