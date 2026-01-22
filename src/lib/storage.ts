export const uploadFile = async (file: File, onProgress?: (progress: number) => void, path = '/') => {
  const sanitizedPath = path.replace(/^\/+/, '');

  // Sanitize file name (remove spaces, keep Unicode, avoid encodeURIComponent)
  const safeFileName = file.name.replace(/\s+/g, '_');

  // Step 1: Request a pre-signed URL
  const response = await fetch('https://api.srinivasiasacademy.in/api/s3/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: safeFileName,
      fileType: file.type,
      path: sanitizedPath,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get a pre-signed upload URL from the server.');
  }

  const { uploadUrl, fileUrl } = await response.json();

  // Step 2: Upload using the pre-signed URL
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    // These headers depend on your specific S3/CORS config, keeping them as you provided:
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.setRequestHeader('Access-Control-Allow-Methods', 'PUT');
    xhr.setRequestHeader('Access-Control-Allow-Headers', 'Content-Type');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        onProgress(percentCompleted);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // Resolve with the final public URL
        resolve(fileUrl);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.send(file);
  });
};

export const validateFile = (file: File, options: {
  maxSize?: number; // in MB
  allowedTypes?: string[];
}) => {
  const { maxSize = 10, allowedTypes } = options;

  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    throw new Error(`File size must be less than ${maxSize}MB`);
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return true;
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};