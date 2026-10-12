import { NextResponse } from 'next/server'
import { cloudinary, hasApiCredentials, requiredModerationKinds } from '../../lib/cloudinary-server'

interface ModerationResult {
  status: 'pending' | 'approved' | 'rejected'
  message: string
  publicId?: string
  poorQuality?: boolean
  approvedKinds: string[]
}

// Moderation results are kept in memory until the frontend collects them. Storing the map on
// globalThis keeps it alive across hot reloads in development. In a multi-instance deployment
// (for example, serverless functions), replace this with a shared store such as Redis or a database.
const globalStore = globalThis as unknown as { moderationResults?: Map<string, ModerationResult> }
const moderationResults = (globalStore.moderationResults ??= new Map<string, ModerationResult>())

const REJECTION_MESSAGES: Record<string, string> = {
  aws_rek: 'Your image was rejected due to unsuitable content',
  perception_point: 'Your image was rejected due to potential malware',
}

// Build a user-facing rejection message, including the top AI moderation label when there is one.
function rejectionMessage(kind: string, response: any) {
  const base = REJECTION_MESSAGES[kind] || 'Your image was rejected by moderation'
  const label = response?.moderation_labels?.[0]
  const labelName = label?.name || label?.parent_name
  return labelName ? `${base} (${labelName})` : base
}

// Read the asset's tags to find out whether the upload preset's eval flagged it as poor quality.
async function isPoorQuality(publicId: string) {
  if (!hasApiCredentials) return false
  try {
    const resource = await cloudinary.api.resource(publicId)
    return Array.isArray(resource.tags) && resource.tags.includes('poor_quality')
  } catch (error) {
    console.error('Could not read asset tags:', error)
    return false
  }
}

// Remove a rejected asset so it can never be delivered, and purge it from the CDN.
async function deleteRejectedAsset(publicId: string) {
  if (!hasApiCredentials) return
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true })
  } catch (error) {
    console.error('Could not delete rejected asset:', error)
  }
}

// Cloudinary signs every notification with your API secret. Reject anything that isn't signed.
function isValidSignature(body: string, request: Request) {
  if (!hasApiCredentials) {
    console.warn('CLOUDINARY_API_SECRET is not set: skipping webhook signature verification')
    return true
  }
  const timestamp = Number(request.headers.get('x-cld-timestamp'))
  const signature = request.headers.get('x-cld-signature')
  if (!timestamp || !signature) return false
  return cloudinary.utils.verifyNotificationSignature(body, timestamp, signature)
}

// This endpoint catches the webhooks Cloudinary sends during the upload lifecycle.
// Each moderation kind in the chain (e.g. aws_rek, then perception_point) sends its own
// notification, and a moderation_summary is sent once the whole chain has finished.
export async function POST(request: Request) {
  const body = await request.text()

  if (!isValidSignature(body, request)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const data = JSON.parse(body)

  if (data.notification_type !== 'moderation' && data.notification_type !== 'moderation_summary') {
    // Other notifications (such as the upload notification) aren't needed by this app.
    return NextResponse.json({ success: true })
  }

  const { moderation_status, moderation_kind, moderation_response, asset_id, public_id } = data
  const result: ModerationResult = moderationResults.get(asset_id) || {
    status: 'pending',
    message: '',
    approvedKinds: [],
  }

  // A rejection is final, so ignore anything that arrives afterwards.
  if (result.status === 'rejected') {
    return NextResponse.json({ success: true })
  }

  if (moderation_status === 'rejected') {
    result.status = 'rejected'
    result.message = rejectionMessage(moderation_kind, moderation_response)
    await deleteRejectedAsset(public_id)
  } else if (moderation_status === 'approved') {
    if (moderation_kind && !result.approvedKinds.includes(moderation_kind)) {
      result.approvedKinds.push(moderation_kind)
    }
    const allKindsApproved = requiredModerationKinds.every(kind => result.approvedKinds.includes(kind))

    if (result.status === 'pending' && (data.notification_type === 'moderation_summary' || allKindsApproved)) {
      result.status = 'approved'
      result.message = 'Image approved'
      result.publicId = public_id
      result.poorQuality = await isPoorQuality(public_id)
    }
  }

  moderationResults.set(asset_id, result)
  return NextResponse.json({ success: true })
}

// The frontend polls this endpoint to find out the moderation result for an uploaded asset.
export async function GET(request: Request) {
  const assetId = new URL(request.url).searchParams.get('asset_id')
  if (!assetId) {
    return NextResponse.json({ error: 'asset_id is required' }, { status: 400 })
  }

  const moderationResult = moderationResults.get(assetId)

  if (!moderationResult || moderationResult.status === 'pending') {
    return NextResponse.json({ status: 'pending', message: 'Moderation in progress' })
  }

  // Clear the result from our temporary storage
  moderationResults.delete(assetId)

  if (moderationResult.status === 'approved') {
    return NextResponse.json({
      status: 'approved',
      poorQuality: moderationResult.poorQuality,
      publicId: moderationResult.publicId,
    })
  }

  return NextResponse.json({
    status: 'rejected',
    message: moderationResult.message,
  })
}
