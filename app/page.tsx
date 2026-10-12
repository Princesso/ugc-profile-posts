"use client"

import { useState, useCallback } from "react"
import { useUser } from "./context/UserContext"
import { RotatingLines } from "react-loader-spinner"
import UploadWidget, { UploadResult } from "./components/upload-widget"
import { AdvancedImage, placeholder } from "@cloudinary/react"
import {
  AVATAR_VARIANTS,
  AvatarVariant,
  avatarHeight,
  avatarImage,
} from "./components/transformations"

// The avatar variants previewed under the profile picture.
const PREVIEW_VARIANTS: AvatarVariant[] = ["post", "nav", "square", "portrait"]

// The Profile page lets the user input their personal information and upload a profile picture.
export default function MyProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const {
    profilePublicId,
    setProfilePublicId,
    name,
    setName,
    location,
    setLocation,
    birthday,
    setBirthday,
    profileIsPoorQuality,
    setProfileIsPoorQuality,
    profileIsCropped,
    setProfileIsCropped,
  } = useUser()
  const [loading, setLoading] = useState(false)

  const avatar = {
    publicId: profilePublicId,
    poorQuality: profileIsPoorQuality,
    cropped: profileIsCropped,
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(false)
  }

  const handleUploadSuccess = useCallback(
    ({ publicId, poorQuality, cropped }: UploadResult) => {
      setLoading(false)
      setUploadError("")
      setProfilePublicId(publicId)
      setProfileIsPoorQuality(poorQuality)
      setProfileIsCropped(cropped)
    },
    [setProfilePublicId, setProfileIsPoorQuality, setProfileIsCropped]
  )

  const handleUploadError = useCallback((error: string) => {
    setLoading(false)
    setUploadError(error)
  }, [])

  const handleImageUpload = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent form submission
    // The actual upload logic is handled in the UploadWidget component
  }

  const details = [
    { label: "Name", value: name },
    { label: "Location", value: location },
    { label: "Birthday", value: birthday },
  ]

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          My Profile
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Manage your personal details and profile picture. Every upload is moderated and
          automatically optimized for each place it appears.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-2" aria-labelledby="picture-heading">
          <h2 id="picture-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
            Profile Picture
          </h2>
          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="grid aspect-square w-full max-w-[300px] place-items-center rounded-full bg-gradient-to-br from-brand-100 via-white to-brand-50 p-1 dark:from-brand-950 dark:via-slate-900 dark:to-brand-900">
              {loading ? (
                <RotatingLines
                  visible={true}
                  width="96"
                  strokeColor="#3448c5"
                  strokeWidth="5"
                  animationDuration="0.75"
                />
              ) : (
                <AdvancedImage
                  cldImg={avatarImage(avatar, "profile")}
                  plugins={[placeholder({ mode: "blur" })]}
                  width={AVATAR_VARIANTS.profile.width}
                  height={avatarHeight("profile")}
                  alt="Profile"
                  className="h-auto w-full"
                />
              )}
            </div>
            <UploadWidget
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              setLoading={setLoading}
              buttonText="Edit Profile Picture"
              onClick={handleImageUpload}
              croppingAspectRatio={1}
            />
          </div>
          {uploadError && (
            <p role="alert" className="callout-error mt-6">
              {uploadError}
            </p>
          )}
          <div className="callout-info mt-6">
            <InfoIcon />
            <div className="space-y-1">
              <p>Upload an image for your profile picture, then crop it to a square.</p>
              <p>
                We&apos;ll check that it&apos;s not offensive and doesn&apos;t
                contain malware.
              </p>
            </div>
          </div>
        </section>

        <section className="card lg:col-span-3" aria-labelledby="details-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="details-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              Personal details
            </h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-secondary">
                Edit Profile
              </button>
            )}
          </div>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="name" className="field-label">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="location" className="field-label">Location</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="birthday" className="field-label">Birthday</label>
                <input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="field [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <button type="submit" className="btn-success">
                Save
              </button>
            </form>
          ) : (
            <dl className="mt-6 divide-y divide-slate-200 dark:divide-slate-800">
              {details.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-3 gap-4 py-4">
                  <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</dt>
                  <dd
                    className={`col-span-2 text-sm ${
                      value
                        ? "font-medium text-slate-900 dark:text-white"
                        : "italic text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {value || "Not set"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      <section aria-labelledby="variants-heading">
        <div className="mb-6">
          <h2 id="variants-heading" className="text-xl font-semibold text-slate-900 dark:text-white">
            Avatar variants
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            One upload, delivered in every shape and size your app needs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PREVIEW_VARIANTS.map((variant) => (
            <figure
              key={variant}
              className="card flex flex-col items-center justify-between gap-4 p-4"
            >
              <div className="grid min-h-[180px] w-full flex-1 place-items-center rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <AdvancedImage
                  cldImg={avatarImage(avatar, variant)}
                  width={AVATAR_VARIANTS[variant].width}
                  height={avatarHeight(variant)}
                  alt={`${variant} avatar`}
                  className="h-auto max-h-[240px] w-auto max-w-full"
                />
              </div>
              <figcaption className="flex items-center gap-2 text-sm">
                <span className="font-semibold capitalize text-slate-900 dark:text-white">{variant}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  {AVATAR_VARIANTS[variant].aspectRatio}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-300"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-3a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 6a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 13z"
        clipRule="evenodd"
      />
    </svg>
  )
}
