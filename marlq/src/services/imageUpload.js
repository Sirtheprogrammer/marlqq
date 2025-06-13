const IMGBB_API_KEY = 'c3df4b0447a2f2aa50f7185e702dab30';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export const uploadImage = async (file) => {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file');
  }

  // Check file size (max 32MB)
  if (file.size > 32 * 1024 * 1024) {
    throw new Error('File too large (max 32MB)');
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // Create form data
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return {
      url: data.data.display_url,
      thumbnailUrl: data.data.thumb.url,
      deleteUrl: data.data.delete_url
    };
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};
