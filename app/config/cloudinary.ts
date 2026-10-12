// Public Cloudinary settings. These are read from NEXT_PUBLIC_ environment variables
// so they're available in the browser (see .env.example).
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MY_CLOUD_NAME',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ugc-profile-photo',
  defaultImage: process.env.NEXT_PUBLIC_CLOUDINARY_DEFAULT_IMAGE || 'avatar-pic',
} as const
