import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

const MediaUpload = ({ onUpload, maxFileSize = 5242880 }) => { // 5MB default
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxFileSize) {
      toast.error(`File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
      return false;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type');
      return false;
    }

    return true;
  };

  const handleFileChange = async (e) => {
    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const validFiles = files.filter(validateFile);
      
      if (validFiles.length === 0) {
        return;
      }

      const uploads = validFiles.map(file => ({
        originalFile: file,
        type: file.type,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file)
      }));

      onUpload(uploads);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        id="media-upload"
        multiple
      />
      <label 
        htmlFor="media-upload" 
        className="cursor-pointer text-gray-400 hover:text-gray-300 transition-colors"
        title="Upload media"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </label>
    </div>
  );
};

export default MediaUpload;