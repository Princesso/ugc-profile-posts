'use client'

import { AdvancedImage } from '@cloudinary/react'
import { useUser } from '../context/UserContext'
import { AVATAR_VARIANTS, avatarHeight, avatarImage } from './transformations'

// The small circular avatar shown in the navigation bar.
export default function NavAvatar() {
  const { profilePublicId, profileIsPoorQuality, profileIsCropped } = useUser()

  return (
    <AdvancedImage
      cldImg={avatarImage(
        { publicId: profilePublicId, poorQuality: profileIsPoorQuality, cropped: profileIsCropped },
        'nav'
      )}
      width={AVATAR_VARIANTS.nav.width}
      height={avatarHeight('nav')}
      alt="Your avatar"
    />
  )
}
