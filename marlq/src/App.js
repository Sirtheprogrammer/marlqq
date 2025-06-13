import React, { useState, useEffect } from "react";
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
import { generateAIResponse } from "./services/ai";
import { uploadImage } from "./services/imageUpload";
import { db, signOutUser } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import VoucherManager from "./admin/VoucherManager";

const compliments = [
  "You're a walking piece of sunshine ☀️",
  "Your presence is a hug to the soul 🤗",
  "You're magic in human form ✨",
  "You light up rooms without even trying 🌟",
  "Even rainbows envy your glow 🌈",
  "Your smile could light up the darkest night 🌙",
  "You make the world better just by being in it 🌍",
  "You're stronger than you know, braver than you think 💪",
  "Your heart is pure gold, precious and rare 💝",
  "You're a masterpiece, perfectly crafted ⭐",
  "Your kindness changes lives every day 🎭",
  "You inspire others just by being yourself 🦋",
  "Your spirit is unbreakable, your soul is beautiful 💫",
  "Every day with you is a gift to the world 🎁",
  "You deserve all the love and happiness 💖"
];

export default function App() {
  const { user } = useAuth();
  const [compliment, setCompliment] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [currentPage, setCurrentPage] = useState("home");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingSparkle, setLoadingSparkle] = useState(false);

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
  }, [currentPage, user, db]);

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

  const handleSendMessage = async (message) => {
    if (!user || !message.trim()) return;
    
    setIsTyping(true);
    try {
      await generateAIResponse(message, user.uid);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCompliment = async () => {
    setLoadingSparkle(true);
    try {
      const response = await generateAIResponse(
        "Generate a short, loving, personal compliment or words of encouragement (max 2 sentences). Be creative and heartfelt. Use emojis.", 
        user.uid
      );
      setCompliment(response);
    } catch (error) {
      setCompliment("You're absolutely amazing! ✨");
      console.error('Error generating sparkle:', error);
    } finally {
      setLoadingSparkle(false);
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
    return user?.uid === "r5d8OhdgoLfJoIx43gsBpuCcty82"; // Your admin UID
  };

  // Return login component if not authenticated
  if (!user) {
    return <EmailAuth />;
  }

  // Check for admin page first
  if (currentPage === 'sirtheprogrammer') {
    if (isAdmin()) {
      return <VoucherManager />;
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
                  onClick={handleCompliment}
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
                  background: compliment ? "rgba(255,255,255,0.1)" : "transparent",
                  borderRadius: "16px",
                  transition: "all 0.3s ease"
                }}>
                  {compliment}
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
          <ChatHistory 
            messages={messages}
            onSendMessage={handleSendMessage}
            inputValue={inputValue}
            setInputValue={setInputValue}
            isTyping={isTyping}
          />
        )}

        {currentPage === "profile" && <Profile />}  {/* Add Profile rendering */}
      </div>
      <footer className="mt-4 text-center" style={{ color: "#b24592", fontSize: "1rem", opacity: 0.7 }}>
        Made with 💖 for Marqueelz
      </footer>
    </div>
  );
}
