import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import Modal from 'react-modal';
import { 
  TrashIcon, 
  ArrowDownTrayIcon as DownloadIcon, 
  XMarkIcon as XIcon, 
  ChatBubbleOvalLeftIcon as ChatIcon 
} from '@heroicons/react/24/outline';
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";

Modal.setAppElement('#root');

const breakpointColumns = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1
};

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '15px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    border: 'none'
  }
};

export default function Gallery({ images, onDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState('');

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'marqueelz-memory.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedImage) return;

    try {
      await updateDoc(doc(db, "gallery", selectedImage.id), {
        comments: arrayUnion({
          text: comment,
          timestamp: Timestamp.now()
        })
      });

      setSelectedImage({
        ...selectedImage,
        comments: [...(selectedImage.comments || []), {
          text: comment,
          timestamp: Timestamp.now()
        }]
      });
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="gallery-grid"
        columnClassName="gallery-grid-column"
      >
        {images.map((image, idx) => (
          <div key={image.id || idx} className="gallery-item">
            <div className="gallery-image-container">
              <img
                src={image.url}
                alt={`Memory ${idx + 1}`}
                className="gallery-img"
                onClick={() => setSelectedImage(image)}
              />
              <div className="gallery-overlay">
                <button
                  className="gallery-btn"
                  onClick={() => handleDownload(image.url)}
                  title="Download"
                >
                  <DownloadIcon className="gallery-icon" />
                </button>
                <button
                  className="gallery-btn"
                  onClick={() => onDelete(image.id)}
                  title="Delete"
                >
                  <TrashIcon className="gallery-icon" />
                </button>
                <button
                  className="gallery-btn"
                  onClick={() => setSelectedImage(image)}
                  title="View & Comment"
                >
                  <ChatIcon className="gallery-icon" />
                </button>
              </div>
            </div>
            {image.comments && image.comments.length > 0 && (
              <div className="comment-count">
                <ChatIcon className="comment-icon" />
                {image.comments.length}
              </div>
            )}
          </div>
        ))}
      </Masonry>

      <Modal
        isOpen={!!selectedImage}
        onRequestClose={() => setSelectedImage(null)}
        style={modalStyles}
        contentLabel="Image View"
      >
        {selectedImage && (
          <div className="modal-content">
            <button
              className="modal-close-btn"
              onClick={() => setSelectedImage(null)}
            >
              <XIcon className="modal-close-icon" />
            </button>
            <img
              src={selectedImage.url}
              alt="Full size"
              className="modal-image"
            />
            <div className="comments-section">
              <h3>Comments</h3>
              <div className="comments-list">
                {selectedImage.comments?.map((comment, idx) => (
                  <div key={idx} className="comment">
                    <p>{comment.text}</p>
                    <small>
                      {comment.timestamp?.toDate().toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
              <div className="comment-input">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="form-control"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddComment}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
