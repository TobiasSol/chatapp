// components/MediaUpload.js
import { useState } from 'react';

const MediaUpload = ({ onUpload }) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0]; // 'image', 'audio', etc.
    const fileUrl = URL.createObjectURL(file);

    setPreview({ url: fileUrl, type: fileType });
    onUpload(fileUrl, file.type);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*,audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        id="media-upload"
      />
      <label htmlFor="media-upload" className="cursor-pointer text-gray-400 hover:text-gray-300">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </label>

      {preview && (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
          {preview.type === 'image' && (
            <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
          )}
          {preview.type === 'audio' && (
            <audio src={preview.url} controls className="w-full h-full" />
          )}
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;