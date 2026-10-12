'use client'

import { useState, useCallback } from 'react'
import { useUser } from '../context/UserContext'
import { RotatingLines } from 'react-loader-spinner'
import UploadWidget, { UploadResult } from '../components/upload-widget'
import { AdvancedImage, lazyload, placeholder, responsive } from '@cloudinary/react'
import { AVATAR_VARIANTS, avatarHeight, avatarImage, postImage } from '../components/transformations'

// Width breakpoints requested by the responsive() plugin, capped at the post image's base width.
const POST_IMAGE_STEPS = [300, 450, 600]

interface Post {
  id: number
  content: string
  image?: string
}

// The Posts page lets users write a post and optionally upload an image.
export default function MyPosts() {
  const [newPost, setNewPost] = useState('')
  const [newImage, setNewImage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [loading, setLoading] = useState(false)
  const { profilePublicId, name, posts, setPosts, profileIsPoorQuality, profileIsCropped } = useUser()
  const avatar = { publicId: profilePublicId, poorQuality: profileIsPoorQuality, cropped: profileIsCropped }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPost.trim() !== '') {
      setPosts(prevPosts => [
        { id: Date.now(), content: newPost, image: newImage },
        ...prevPosts,
      ])
      setNewPost('')
      setNewImage('')
      setUploadError('')
    }
  }

  const handleUploadSuccess = useCallback(({ publicId }: UploadResult) => {
    setLoading(false)
    setNewImage(publicId)
    setUploadError('')
  }, [])

  const handleUploadError = useCallback((error: string) => {
    setLoading(false)
    setUploadError(error)
  }, [])

  const handleImageUpload = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent form submission
    // The actual upload logic is handled in the UploadWidget component
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="eyebrow">Feed</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          My Posts
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Share an update with an optional image. Images are moderated and delivered responsively.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <label htmlFor="new-post" className="sr-only">New post</label>
        <textarea
          id="new-post"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          className="field resize-y"
        />
        {loading ? (
          <div className="grid aspect-[3/2] w-full max-w-[600px] place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <RotatingLines
              visible={true}
              width="72"
              strokeColor="#3448c5"
              strokeWidth="5"
              animationDuration="0.75"
            />
          </div>
        ) : (
          newImage && (
            <div className="w-full max-w-[600px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <AdvancedImage
                cldImg={postImage(newImage)}
                plugins={[responsive({ steps: POST_IMAGE_STEPS }), placeholder({ mode: 'blur' })]}
                alt="New post"
                className="w-full h-auto aspect-[3/2]"
              />
            </div>
          )
        )}
        {uploadError && (
          <p role="alert" className="callout-error">
            {uploadError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <UploadWidget
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            setLoading={setLoading}
            buttonText="Upload Image"
            onClick={handleImageUpload}
            className="btn-secondary"
          />
          <button type="submit" className="btn-primary px-8">
            Post
          </button>
        </div>
      </form>

      <div className="callout-info">
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
        <div className="space-y-1">
          <p>Write a message in the text field and optionally upload an image before posting.</p>
          <p>We&apos;ll check that the image is not offensive and doesn&apos;t contain malware.</p>
        </div>
      </div>

      <section aria-label="Posts" className="space-y-4">
        {posts.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
            <p className="font-medium text-slate-900 dark:text-white">No posts yet</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your posts will appear here.</p>
          </div>
        )}
        {posts.map((post: Post) => (
          <article key={post.id} className="card flex items-start gap-4">
            <div className="flex-shrink-0 w-[75px] h-[75px]">
              <AdvancedImage
                cldImg={avatarImage(avatar, 'post')}
                width={AVATAR_VARIANTS.post.width}
                height={avatarHeight('post')}
                alt="Profile"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-slate-900 dark:text-white">{name || 'You'}</span>
                <time dateTime={new Date(post.id).toISOString()} className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(post.id).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">{post.content}</p>
              {post.image && (
                <div className="mt-3 w-full max-w-[600px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <AdvancedImage
                    cldImg={postImage(post.image)}
                    plugins={[lazyload(), responsive({ steps: POST_IMAGE_STEPS }), placeholder({ mode: 'blur' })]}
                    alt="Post"
                    className="w-full h-auto aspect-[3/2]"
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
