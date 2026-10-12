import { CloudinaryImage } from '@cloudinary/url-gen'
import { auto, pad } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'
import { AutoFocus } from '@cloudinary/url-gen/qualifiers/autoFocus'
import { face } from '@cloudinary/url-gen/qualifiers/focusOn'
import { max, byRadius } from '@cloudinary/url-gen/actions/roundCorners'
import { outline, enhance, generativeRestore, upscale } from '@cloudinary/url-gen/actions/effect'
import { predominant } from '@cloudinary/url-gen/qualifiers/background'
import { dpr } from '@cloudinary/url-gen/actions/delivery'
import cld from './cld'
import { CLOUDINARY_CONFIG } from '../config/cloudinary'

// Avatar variants generated from a single uploaded profile picture.
// Each one has a fixed display size and aspect ratio. Circular variants use r_max.
export const AVATAR_VARIANTS = {
  profile: { width: 300, aspectRatio: '1:1', circle: true, outlineColor: undefined },
  post: { width: 75, aspectRatio: '1:1', circle: true, outlineColor: 'pink' },
  nav: { width: 32, aspectRatio: '1:1', circle: true, outlineColor: 'white' },
  square: { width: 300, aspectRatio: '1:1', circle: false, outlineColor: undefined },
  portrait: { width: 240, aspectRatio: '4:5', circle: false, outlineColor: undefined },
} as const

export type AvatarVariant = keyof typeof AVATAR_VARIANTS

export interface AvatarSource {
  publicId?: string
  poorQuality?: boolean
  // True when the user cropped the image in the Upload widget, which stores custom coordinates.
  cropped?: boolean
}

// Returns the pixel height of a variant, derived from its width and aspect ratio.
export function avatarHeight(variant: AvatarVariant) {
  const { width, aspectRatio } = AVATAR_VARIANTS[variant]
  const [w, h] = aspectRatio.split(':').map(Number)
  return Math.round((width * h) / w)
}

// Builds the delivery URL for a profile picture variant.
export function avatarImage({ publicId, poorQuality, cropped }: AvatarSource, variant: AvatarVariant): CloudinaryImage {
  const { width, aspectRatio, circle, outlineColor } = AVATAR_VARIANTS[variant]
  const img = cld.image(publicId || CLOUDINARY_CONFIG.defaultImage)

  // Respect the user's manual crop from the Upload widget (c_crop,g_custom).
  if (publicId && cropped) {
    img.addTransformation('c_crop,g_custom')
  }

  // Restore and upscale low-quality uploads before resizing.
  if (publicId && poorQuality) {
    img.effect(enhance()).effect(generativeRestore()).effect(upscale())
  }

  // c_auto with g_auto:face keeps the face in frame, falling back to the most interesting region.
  img.resize(
    auto()
      .width(width)
      .aspectRatio(aspectRatio)
      .gravity(autoGravity().autoFocus(AutoFocus.focusOn(face())))
  )

  if (circle) {
    img.roundCorners(max())
  }
  if (outlineColor) {
    img.effect(outline().color(outlineColor))
  }

  // Small fixed-size avatars are requested at 2x so they stay sharp on high-density screens.
  if (width <= 100) {
    img.delivery(dpr(2))
  }

  return img.format('auto').quality('auto')
}

// Builds the delivery URL for a post image. The whole image is shown in a 3:2 frame, padded with
// its predominant color. The responsive() plugin in AdvancedImage then picks the width to request.
export function postImage(publicId: string): CloudinaryImage {
  return cld
    .image(publicId)
    .resize(pad().width(600).aspectRatio('3:2').background(predominant()))
    .roundCorners(byRadius(8))
    .format('auto')
    .quality('auto')
}
