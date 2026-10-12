// Creates (or updates) the upload preset used by the app and uploads the default avatar.
// Usage: npm run setup   (reads .env.local)
import { v2 as cloudinary } from 'cloudinary'

const {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloudName,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: presetName = 'ugc-profile-photo',
  NEXT_PUBLIC_CLOUDINARY_DEFAULT_IMAGE: defaultImage = 'avatar-pic',
  CLOUDINARY_API_KEY: apiKey,
  CLOUDINARY_API_SECRET: apiSecret,
  CLOUDINARY_MODERATION: moderation = 'aws_rek|perception_point',
  APP_URL: appUrl,
} = process.env

const missing = Object.entries({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloudName,
  CLOUDINARY_API_KEY: apiKey,
  CLOUDINARY_API_SECRET: apiSecret,
  APP_URL: appUrl,
}).filter(([, value]) => !value).map(([name]) => name)

if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. See .env.example.`)
  process.exit(1)
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })

const notificationUrl = new URL('/api/moderate', appUrl).toString()

const presetOptions = {
  unsigned: true,
  // Auto-generate unguessable public IDs and ignore any public ID sent by the client.
  unique_filename: true,
  use_filename: false,
  disallow_public_id: true,
  // Accept images only, cap their size, and strip embedded metadata (such as GPS location).
  allowed_formats: 'jpg,jpeg,png,webp,avif,heic,gif',
  transformation: 'c_limit,h_1000,w_1000/fl_force_strip',
  // AI moderation chain: explicit content detection, then malware detection.
  moderation,
  notification_url: notificationUrl,
  // Tag blurry uploads so the app can restore and upscale them on delivery.
  quality_analysis: true,
  eval: "if (resource_info.quality_analysis.focus < 0.7) { upload_options['tags'] = 'poor_quality' }",
}

async function upsertPreset() {
  try {
    await cloudinary.api.upload_preset(presetName)
    await cloudinary.api.update_upload_preset(presetName, presetOptions)
    console.log(`Updated upload preset "${presetName}"`)
  } catch (error) {
    if (error?.error?.http_code !== 404) throw error
    await cloudinary.api.create_upload_preset({ name: presetName, ...presetOptions })
    console.log(`Created upload preset "${presetName}"`)
  }
  console.log(`  moderation:       ${moderation}`)
  console.log(`  notification_url: ${notificationUrl}`)
}

async function uploadDefaultAvatar() {
  const result = await cloudinary.uploader.upload(
    'https://res.cloudinary.com/cld-demo-ugc/image/upload/v1729679379/avatar-pic.jpg',
    { public_id: defaultImage, overwrite: false }
  )
  console.log(`Default avatar available as "${result.public_id}"`)
}

try {
  await upsertPreset()
  await uploadDefaultAvatar()
  console.log('Cloudinary setup complete.')
} catch (error) {
  console.error('Cloudinary setup failed:', error?.error?.message || error)
  process.exit(1)
}
