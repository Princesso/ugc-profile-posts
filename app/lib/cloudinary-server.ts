import 'server-only'
import { v2 as cloudinary } from 'cloudinary'
import { CLOUDINARY_CONFIG } from '../config/cloudinary'

// Server-side Cloudinary SDK, used to verify webhook signatures and call the Admin API.
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const hasApiCredentials = Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

// The moderation kinds that must all approve an asset, e.g. "aws_rek|perception_point".
// Any per-kind options after a colon (aws_rek:...) are ignored here.
export const requiredModerationKinds = (process.env.CLOUDINARY_MODERATION || 'aws_rek|perception_point')
  .split('|')
  .map(kind => kind.split(':')[0].trim())
  .filter(Boolean)

export { cloudinary }
