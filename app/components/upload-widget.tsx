'use client'

import { useState, useEffect, useCallback } from 'react'
import { CloudinaryWidget } from '../types'
import { CLOUDINARY_CONFIG } from '../config/cloudinary'

export interface UploadResult {
  publicId: string
  poorQuality: boolean
  // True when the user cropped the image in the widget
  cropped: boolean
}

interface UploadWidgetProps {
  onUploadSuccess: (result: UploadResult) => void
  onUploadError: (error: string) => void
  setLoading: (loading: boolean) => void
  buttonText: string
  onClick: (e: React.MouseEvent) => void
  // When set, the widget shows an interactive cropping step locked to this aspect ratio (width / height).
  croppingAspectRatio?: number
  // Optional classes for the button. Defaults to the primary button style.
  className?: string
}

// The Upload widget component
export default function UploadWidget({ onUploadSuccess, onUploadError, setLoading, buttonText, onClick, croppingAspectRatio, className = 'btn-primary' }: UploadWidgetProps) {
  const [uploadWidget, setUploadWidget] = useState<CloudinaryWidget | null>(null)

  // Check if the moderation result for the uploaded asset has been received at the moderate endpoint.
  // This check times out after a minute.
  const checkModeration = useCallback(async (info: any, startTime: number) => {
    if (Date.now() - startTime > 60000) {
      onUploadError('Moderation check timed out. Please try again.')
      return
    }

    // Once a second, check if the moderation result has been received at the moderate endpoint.
    try {
      const response = await fetch(`/api/moderate?asset_id=${encodeURIComponent(info.asset_id)}`)
      const data = await response.json()
      if (data.status === 'approved') {
        onUploadSuccess({
          publicId: data.publicId,
          poorQuality: Boolean(data.poorQuality),
          cropped: Boolean(info.coordinates?.custom),
        })
      } else if (data.status === 'rejected') {
        onUploadError(data.message)
      } else {
        // If still pending, check again after a delay
        setTimeout(() => checkModeration(info, startTime), 1000)
      }
    } catch (error) {
      console.error('Error checking moderation status:', error)
      onUploadError('An error occurred while processing your image.')
    }
  }, [onUploadSuccess, onUploadError])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.cloudinary) return

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        clientAllowedFormats: ['image'],
        maxImageFileSize: 10_000_000,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxFiles: 1,
        // Interactive cropping stores the selected area as custom coordinates on the asset.
        cropping: Boolean(croppingAspectRatio),
        croppingAspectRatio,
        croppingCoordinatesMode: 'custom',
        croppingShowDimensions: true,
        showSkipCropButton: true,
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Upload error:', error)
          onUploadError(`Upload failed: ${error.statusText || 'Unknown error'}`)
          return
        }

        if (result && result.event === 'success') {
          onUploadError('')
          setLoading(true)
          checkModeration(result.info, Date.now())
        } else if (result && result.event === 'close') {
          if (!result.info) {
            onUploadError('Upload cancelled or failed. Please try again.')
          }
        }
      }
    )
    setUploadWidget(widget)

    return () => widget.destroy()
  }, [checkModeration, onUploadError, setLoading, croppingAspectRatio])

  const openUploadWidget = (e: React.MouseEvent) => {
    onClick(e)
    if (uploadWidget) {
      uploadWidget.open()
    }
  }

  // Return the button that opens the Upload widget
  return (
    <button type="button" onClick={openUploadWidget} className={className}>
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
      {buttonText}
    </button>
  )
}
