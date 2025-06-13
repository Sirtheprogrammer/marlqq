import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./love.css";
import "./menu.css";
import "./gallery.css";
import Menu from "./Menu";
import Gallery from "./components/Gallery";
import ChatHistory from "./components/ChatHistory";
import EmailAuth from "./components/EmailAuth";
import Profile from "./components/Profile";
import DailyStreak from "./components/DailyStreak";
import VoucherManager from "./admin/VoucherManager";
import { generateAIResponse, generateDailySparkle } from "./services/ai";
import { uploadImage } from "./services/imageUpload";
import { db, signOutUser } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  where,
  onSnapshot 
} from "firebase/firestore";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user } = useAuth();
  const [sparkle, setSparkle] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingSparkle, setLoadingSparkle] = useState(false);

  // Load chat messages from Firestore
  useEffect(() => {
    let unsubscribe = () => {};

    if (user) {
      const chatQuery = query(
        collection(db, 'chats'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc')
      );

      unsubscribe = onSnapshot(chatQuery, (snapshot) => {
        const newMessages = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const messageData = {
            id: doc.id,
            type: data.type,
            content: data.type === 'user' ? data.prompt : data.response,
            createdAt: data.createdAt?.toDate() || new Date()
          };
          if (messageData.content) {
            newMessages.push(messageData);
          }
        });
        setMessages(newMessages);
      }, (error) => {
        console.error("Error loading messages:", error);
      });
    }

    return () => unsubscribe();
  }, [user]);

  // Memoize generateSparkle to prevent unnecessary re-renders
  const generateSparkle = useCallback(async () => {
    if (loadingSparkle || !user) return;
    setLoadingSparkle(true);
    try {
      const newSparkle = await generateDailySparkle(user.uid);
      setSparkle(newSparkle);
    } catch (error) {
      console.error("Error generating sparkle:", error);
    } finally {
      setLoadingSparkle(false);
    }
  }, [user, loadingSparkle]);

  // Generate sparkle on first load
  useEffect(() => {
    if (user && !sparkle) {
      generateSparkle();
    }
  }, [user, sparkle, generateSparkle]);

  // Handle chat message submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping || !user) return;

    const userInput = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    try {
      // Add user message to Firestore first
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        type: 'user',
        prompt: userInput,
        createdAt: serverTimestamp()
      });

      // Generate AI response
      const aiResponse = await generateAIResponse(userInput, user.uid);

      // Add AI response to Firestore
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        type: 'ai',
        response: aiResponse,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Load gallery from Firestore
  useEffect(() => {
    let unsubscribe = () => {};

    const loadGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const images = snap.docs
          .filter(doc => doc.data().userId === user?.uid)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
        setGallery(images);
      } catch (error) {
        console.error("Error loading gallery:", error);
      }
    };

    if (currentPage === "gallery" && user) {
      loadGallery();
    }

    return () => unsubscribe();
  }, [currentPage, user]);

  // Load and subscribe to chat messages
  useEffect(() => {
    let unsubscribe = () => {};

    if (currentPage === "ai" && user) {
      const chatCollection = collection(db, "chats");
      const q = query(
        chatCollection,
        orderBy("createdAt", "asc")
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
        setMessages(messages);
      });
    }

    return () => unsubscribe();
  }, [currentPage, user]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentPage("home");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleUpload = async (e) => {
    if (!user) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const { url, thumbnailUrl } = await uploadImage(file);
      
      const imageDoc = {
        url,
        thumbnailUrl,
        createdAt: serverTimestamp(),
        userId: user.uid,
        comments: []
      };
      
      const docRef = await addDoc(collection(db, "gallery"), imageDoc);
      
      setGallery(prev => [{
        id: docRef.id,
        ...imageDoc,
        createdAt: new Date()
      }, ...prev]);
      
      // Clear the input
      e.target.value = '';
      
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Add URL path handling
  useEffect(() => {
    const path = window.location.pathname.substring(1); // Remove leading slash
    if (path === 'sirtheprogrammer') {
      setCurrentPage('sirtheprogrammer');
    }
  }, []);

  // Add this function to check if user is admin
  const isAdmin = () => {
    return user?.uid === "r5d8OhdgoLfJoIx43gsBpuCty82"; // Your admin UID
  };

  // Return login component if not authenticated
  if (!user) {
    return <EmailAuth />;
  }

  // Check for admin page first
  if (currentPage === 'sirtheprogrammer') {
    if (isAdmin()) {
      return (
        <div className="admin-page">
          <VoucherManager />
        </div>
      );
    } else {
      // Redirect non-admins to home
      setCurrentPage('home');
      window.history.pushState({}, '', '/');
      return null;
    }
  }

  // Regular app rendering
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100" style={{ background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" }}>
      <Menu 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onSignOut={handleSignOut}
        user={user}
      />
      <div className="w-100 d-flex flex-column align-items-center">
        {currentPage === "home" && (
          <>
            <DailyStreak />
            <div className="glass-card shadow-lg p-4 w-100" style={{ maxWidth: 700, borderRadius: 24 }}>
              <div className="text-center mb-4">
                <h1 className="mt-3 mb-1" style={{ color: "#ff69b4", fontWeight: 700, fontSize: "2.2rem" }}>
                  Welcome Home, Marqueelz 💖
                </h1>
                <p style={{ color: "#b24592", fontWeight: 500, fontSize: "1.1rem", lineHeight: "1.6" }}>
                  Your very own digital sanctuary of love, memories, and joy.<br />
                  You are treasured, valued, and absolutely extraordinary! ✨
                </p>
              </div>
              
              <div className="daily-affirmations mb-4 p-3" style={{ background: "rgba(255,255,255,0.1)", borderRadius: "16px" }}>
                <h3 style={{ color: "#ff69b4", fontWeight: 600, fontSize: "1.4rem", textAlign: "center" }}>Daily Dose of Love 💝</h3>
                <div style={{ color: "#6a0572", fontSize: "1.1rem", lineHeight: "1.8", textAlign: "center" }}>
                  Remember that:
                  <ul style={{ listStyle: "none", padding: 0, margin: "10px 0" }}>
                    <li>💫 Your strength isn't just in what you do, but in who you are</li>
                    <li>🌟 Every day you wake up is another chance to shine</li>
                    <li>🦋 Your journey is uniquely yours, and that's what makes it beautiful</li>
                    <li>🌈 You bring colors to the world just by being yourself</li>
                    <li>💪 You're stronger than you know, braver than you believe</li>
                  </ul>
                </div>
              </div>

              <div className="poem text-center mb-4" style={{ color: "#6a0572", fontStyle: "italic", fontSize: "1.1rem" }}>
                Like stars that paint the darkest night,<br />
                Your spirit shines so pure and bright.<br />
                Through every step and every mile,<br />
                Your heart has power to make life worthwhile.<br />
                Remember as each day unfolds,<br />
                You're made of magic, heart of gold ✨
              </div>

              <div className="app-features p-3 mb-4" style={{ background: "rgba(255,255,255,0.1)", borderRadius: "16px" }}>
                <h3 style={{ color: "#ff69b4", fontWeight: 600, fontSize: "1.4rem", textAlign: "center" }}>Your Personal Joy Journal 📱</h3>
                <div style={{ color: "#6a0572", fontSize: "1.1rem", lineHeight: "1.6" }}>
                  <p className="text-center mb-3">This space was created just for you! Here's what you can do:</p>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    <li className="mb-2">🎭 <strong>AI Chat:</strong> Your personal AI friend is here to chat, support, and share moments with you</li>
                    <li className="mb-2">📸 <strong>Gallery:</strong> Save and cherish your precious memories in your private photo collection</li>
                    <li className="mb-2">💝 <strong>Daily Compliments:</strong> Get a dose of love whenever you need it</li>
                    <li className="mb-2">👤 <strong>Profile:</strong> Make this space truly yours by personalizing your profile</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <button 
                  className="btn btn-lg px-4 py-2 shadow-sm" 
                  style={{ 
                    borderRadius: 20,
                    background: "linear-gradient(135deg, #ff69b4, #b24592)",
                    color: "white",
                    border: "none",
                    fontSize: "1.2rem"
                  }} 
                  onClick={generateSparkle}
                  disabled={loadingSparkle}
                >
                  {loadingSparkle ? "✨ Creating Magic..." : "✨ Click For Your Daily Sparkle ✨"}
                </button>
                <div className="mt-3" style={{ 
                  color: "#ff69b4", 
                  fontWeight: 600, 
                  minHeight: 32,
                  fontSize: "1.2rem",
                  padding: "10px",
                  background: sparkle ? "rgba(255,255,255,0.1)" : "transparent",
                  borderRadius: "16px",
                  transition: "all 0.3s ease"
                }}>
                  {sparkle}
                </div>
              </div>
            </div>
          </>
        )}

        {currentPage === "gallery" && (
          <div className="gallery-section glass-card w-100 mt-4" style={{ maxWidth: 1200 }}>
            <h2 className="text-center mb-3" style={{ color: "#b24592", fontWeight: 700 }}>📸 Gallery</h2>
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-3 gap-3">
              <input
                type="file"
                accept="image/*"
                className="form-control"
                style={{ maxWidth: 260, borderRadius: 16 }}
                onChange={handleUpload}
                disabled={uploading}
              />
              <button className="upload-btn px-4 py-2" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadError && <div className="text-danger text-center mb-2">{uploadError}</div>}
            <Gallery images={gallery} onDelete={async (imageId) => {
              try {
                await deleteDoc(doc(db, "gallery", imageId));
                setGallery(prev => prev.filter(img => img.id !== imageId));
              } catch (error) {
                console.error("Error deleting image:", error);
              }
            }} />
          </div>
        )}

        {currentPage === "ai" && (
          <div className="container">
            <ChatHistory
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSubmit={handleSendMessage}
              isTyping={isTyping}
            />
          </div>
        )}

        {currentPage === "profile" && <Profile />}  {/* Add Profile rendering */}
      </div>
      <footer className="mt-4 text-center" style={{ color: "#b24592", fontSize: "1rem", opacity: 0.7 }}>
        Made with 💖 for Marqueelz
      </footer>
    </div>
  );
}
