// lib/utils.js
export const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }
  
  export const getFileType = (file) => {
    return file.type.split('/')[0]
  }