import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  getDocs, 
  where,
  onSnapshot 
} from 'firebase/firestore';

const API_KEY = "AIzaSyATXGCgwQ754fAkpOk2TaQRPq3kL01TSNw";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const basePersonality = `You are Marqueelz's loving AI companion. Your purpose is to:
1. Be sweet, caring, and supportive 💖
2. Remember past conversations to provide personalized support
3. Use cute emojis and maintain a warm, friendly tone
4. Help celebrate achievements and encourage daily login streaks
5. Keep responses concise but meaningful

Remember: You're not just an AI, you're a friend who cares about Marqueelz's happiness and well-being! 🌟`;

// Initialize Firestore references
const chatCollection = collection(db, 'chats');

const getRecentHistory = async (userId, limit = 5) => {
  try {
    const q = query(
      chatCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
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

export const generateAIResponse = async (prompt, userId = 'default') => {
  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    // Validate inputs
    if (!prompt?.trim()) {
      throw new Error("Please enter a message");
    }

    // Get recent conversation history
    const recentHistory = await getRecentHistory(userId);
    
    // Format conversation context
    const conversationContext = recentHistory
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Save user message
    const messageDoc = {
      userId,
      prompt,
      type: 'user',
      createdAt: serverTimestamp()
    };
    
    await addDoc(chatCollection, messageDoc);

    // Prepare API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Make API request with conversation context
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${basePersonality}\n\nPrevious conversation:\n${conversationContext}\n\nUser: ${prompt}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
          topP: 0.8,
          topK: 40
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid AI response format');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Save AI response to Firestore
    await addDoc(chatCollection, {
      userId,
      response: aiResponse,
      type: 'ai',
      createdAt: serverTimestamp()
    });

    return aiResponse;

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again! 💝');
    }
    
    if (error.message.includes('Authentication')) {
      throw new Error('Please log in to continue chatting! 💕');
    }
    
    throw new Error('Sorry, I had trouble responding. Please try again! 💝');
  }
};

// Get chat history from Firebase with real-time updates
export const getChatHistory = (userId = 'default', callback) => {
  if (!userId) return () => {};

  const q = query(
    chatCollection,
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .filter(doc => doc.data().userId === userId)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
    callback(messages);
  }, (error) => {
    console.error('Chat history error:', error);
    if (error.code === 'permission-denied') {
      callback([]);
    }
  });
};
