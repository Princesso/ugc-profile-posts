# UGC Profile Pictures and Posts

UGC Profile Pictures and Posts is a Next.js 14 social-media sample app that safely accepts user-generated profile pictures and post images, using a Cloudinary unsigned `upload_preset` with the Upload widget's `cropping`, Amazon Rekognition AI Moderation (`aws_rek`), Perception Point malware detection (`perception_point`), `quality_analysis` with `eval`, generative restoration (`e_gen_restore`), AI auto-cropping (`c_auto` with `g_auto:face`), circular avatars (`r_max`), and automatic optimization (`f_auto`, `q_auto`).

The app has two pages:

- **My Profile** — edit your name, location, and birthday, then upload and crop a profile picture. The page shows the circular profile picture and every avatar variant generated from it.
- **My Posts** — write a post and optionally attach an image. Each post shows your circular avatar beside it, and post images load responsively and lazily.

Every image is moderated for explicit content and scanned for malware before it appears in the app. Rejected images are deleted from Cloudinary.

## Cloudinary features used

**Upload lifecycle and moderation**

- `upload_preset` (unsigned) — lets the browser upload directly to Cloudinary without exposing your API secret, with all security settings enforced server-side by the preset
- Upload widget `cropping` with `croppingAspectRatio: 1` — lets users crop their profile picture to a square before uploading; the crop is saved on the asset as `custom_coordinates`
- `moderation: aws_rek` — uses Amazon Rekognition AI to detect explicit, suggestive, violent, or otherwise unsafe content and rejects the image automatically
- `moderation: perception_point` — scans each upload for malware and malicious payloads; it is chained after `aws_rek` with `aws_rek|perception_point`
- `notification_url` — sends a webhook to `/api/moderate` for each moderation result, so the app finds out when an image is approved or rejected
- `X-Cld-Signature` / `verifyNotificationSignature` — verifies that each webhook was signed with your API secret, so forged moderation results are rejected with `401`
- `quality_analysis` — scores each upload's quality (for example, focus) at upload time
- `eval` — runs JavaScript during upload that adds a `poor_quality` tag when `quality_analysis.focus` is below `0.7`
- `transformation` (incoming) `c_limit,h_1000,w_1000/fl_force_strip` — limits stored images to 1000×1000 pixels and strips embedded metadata, such as GPS location, before the image is saved
- `disallow_public_id` and `unique_filename` — generate unguessable public IDs and ignore any public ID a client tries to set
- Admin API `resource` — reads the asset's tags after approval to check for `poor_quality`
- Upload API `destroy` with `invalidate: true` — deletes rejected images and purges them from the CDN

**Avatar cropping and variants**

- `c_crop,g_custom` — applies the user's manual crop from the Upload widget
- `c_auto` with `g_auto:face` — AI auto-cropping that keeps the face in frame, falling back to the most interesting region when there's no face
- `ar_1:1` and `ar_4:5` — produce square and portrait avatar variants from one upload
- `r_max` — rounds a square image into a circle for circular avatars
- `e_outline` — draws a colored outline around circular avatars
- `e_enhance` — improves the color, contrast, and lighting of low-quality uploads
- `e_gen_restore` — uses generative AI to remove compression artifacts and noise from low-quality uploads
- `e_upscale` — increases the resolution of low-quality uploads
- `dpr_2.0` — requests small fixed-size avatars at double resolution so they stay sharp on high-density screens

**Optimized delivery for feeds**

- `f_auto` — automatically serves WebP or AVIF based on the visitor's browser
- `q_auto` — picks the lowest file size that keeps visual quality
- `c_pad` with `ar_3:2` and `b_auto:predominant` — fits the whole post image into a 3:2 frame, padding with its most common color
- `r_8` — rounds the corners of post images
- React SDK `responsive()` — requests a 300, 450, or 600 pixel wide image to match the container width on each device
- React SDK `lazyload()` — loads feed images only when they scroll into view
- React SDK `placeholder()` — shows a blurred low-quality placeholder while the full image loads

## Use cases

- You're building a social network, community forum, or marketplace and need to stop explicit content and malware from reaching other users without writing your own moderation pipeline.
- You need consistent profile pictures across your UI, such as circular avatars in a nav bar, a feed, and a profile page, from a single user upload, with the face kept in frame.
- You want user-uploaded images in a feed to load quickly on phones, tablets, and desktops without generating and storing every size yourself.

## Tech stack

- [Next.js 14](https://nextjs.org/) with the App Router and TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudinary Upload widget](https://cloudinary.com/documentation/upload_widget) for browser uploads and cropping
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration) (`@cloudinary/react`, `@cloudinary/url-gen`) for delivery URLs
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration) (`cloudinary`) for webhook verification and the Admin API
- [Amazon Rekognition AI Moderation add-on](https://cloudinary.com/documentation/aws_rekognition_ai_moderation_addon)
- [Perception Point Malware Detection add-on](https://cloudinary.com/documentation/perception_point_malware_detection_addon)

## Environment variables

Copy `.env.example` to `.env.local` in the project root and fill in these values:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ugc-profile-photo
NEXT_PUBLIC_CLOUDINARY_DEFAULT_IMAGE=avatar-pic

CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLOUDINARY_MODERATION=aws_rek|perception_point
APP_URL=https://your-app-domain.example
```

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name, shown at the top of the [Cloudinary Console dashboard](https://console.cloudinary.com/pm/developer-dashboard). Used to build image URLs and to configure the Upload widget.
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: The name of the unsigned upload preset. Defaults to `ugc-profile-photo`.
- `NEXT_PUBLIC_CLOUDINARY_DEFAULT_IMAGE`: The public ID of the image shown before a user uploads a profile picture. Defaults to `avatar-pic`.
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`: Found on the **API Keys** page of the Cloudinary Console settings. The app uses them on the server to verify webhook signatures, read asset tags, and delete rejected images. `npm run setup` also uses them.
- `CLOUDINARY_MODERATION`: The moderation chain configured on the upload preset. Defaults to `aws_rek|perception_point`. The webhook handler waits for every kind in this list to approve an image.
- `APP_URL`: The public HTTPS URL Cloudinary can reach, such as your ngrok tunnel or deployed domain. `npm run setup` sets the preset's notification URL to `<APP_URL>/api/moderate`.

> **Note:** Only variables prefixed with `NEXT_PUBLIC_` are available in the browser. Never add that prefix to `CLOUDINARY_API_KEY` or `CLOUDINARY_API_SECRET`.

If `CLOUDINARY_API_SECRET` isn't set, the app still runs, but it skips webhook signature verification, doesn't detect poor-quality uploads, and doesn't delete rejected images. It logs a warning when this happens.

## Running the app

You need Node.js 20.6 or later and a Cloudinary account. [Sign up for free](https://cloudinary.com/users/register_free) if you don't have one.

1. **Clone the repository and install dependencies:**
   ```sh
   git clone https://github.com/cloudinary-devs/ugc-profile-posts.git
   cd ugc-profile-posts
   npm install
   ```
2. **Register for the moderation add-ons.** In the Cloudinary Console, open **Add-ons** and register for **Amazon Rekognition AI Moderation** and **Perception Point Malware Detection**. Both have free tiers.
3. **Expose your local app to the internet** so Cloudinary can send moderation webhooks to it. In a separate terminal, start a tunnel to port 3000, for example with [ngrok](https://ngrok.com/):
   ```sh
   ngrok http 3000
   ```
   Copy the `https://` forwarding URL that ngrok prints (for example, `https://a-b-c-d.ngrok-free.app`). If you deploy instead, use your deployed domain.
4. **Create your `.env.local` file:**
   ```sh
   cp .env.example .env.local
   ```
   Then fill in the values described in [Environment variables](#environment-variables). Set `APP_URL` to the URL from step 3.
5. **Create the upload preset and default avatar:**
   ```sh
   npm run setup
   ```
   This creates or updates the `ugc-profile-photo` upload preset with these settings, and uploads the default avatar image as `avatar-pic`:

   | Preset setting | Value |
   |----------------|-------|
   | Signing mode | Unsigned |
   | Public ID | Unique, random, and can't be set by the client |
   | Allowed formats | `jpg,jpeg,png,webp,avif,heic,gif` |
   | Incoming transformation | `c_limit,h_1000,w_1000/fl_force_strip` |
   | Moderation | `aws_rek\|perception_point` |
   | Notification URL | `<APP_URL>/api/moderate` |
   | Quality analysis | `true` |
   | Eval | `if (resource_info.quality_analysis.focus < 0.7) { upload_options['tags'] = 'poor_quality' }` |

   Run `npm run setup` again whenever your `APP_URL` changes, such as when you restart ngrok and get a new URL.
6. **Start the development server:**
   ```sh
   npm run dev
   ```
7. **Open [http://localhost:3000](http://localhost:3000)** in your browser. Click **Edit Profile Picture**, choose an image, crop it, and wait for moderation to finish.

To build and run for production:

```sh
npm run build
npm run start
```

### Adjusting moderation thresholds

Amazon Rekognition rejects images based on confidence thresholds for each moderation category. To change them, open **Settings > Upload > Upload presets** in the Cloudinary Console, edit the `ugc-profile-photo` preset, open the **Addons** section, and click **Options** next to Rekognition AI Moderation.

## Production checklist

### 1. Deploy the app

Deploy to any Node.js host that supports Next.js API routes, such as [Vercel](https://vercel.com/new). Set these environment variables in your host's settings:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Same as local. Rebuild after changing it, because it's embedded at build time. |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No | Defaults to `ugc-profile-photo`. |
| `NEXT_PUBLIC_CLOUDINARY_DEFAULT_IMAGE` | No | Defaults to `avatar-pic`. |
| `CLOUDINARY_API_KEY` | Yes | Server only. |
| `CLOUDINARY_API_SECRET` | Yes | Server only. Required for webhook signature verification. |
| `CLOUDINARY_MODERATION` | No | Must match the preset's moderation setting. Defaults to `aws_rek\|perception_point`. |

### 2. Point the upload preset at your deployment

Set `APP_URL` in `.env.local` to your deployed domain, for example `https://your-app.vercel.app`, then run `npm run setup` again.

### 3. Replace the in-memory moderation store

`app/api/moderate/route.ts` keeps moderation results in memory. That works for local development and a single server. On serverless hosts or with several instances, the webhook and the browser's polling request can reach different instances, so replace the in-memory map with a shared store such as Redis or a database.

### 4. Smoke test after deploy

1. Open your production URL and upload a normal profile picture. It should appear as a circle within a few seconds.
2. Upload an image that should be rejected. The app should show a rejection message, and the image should no longer be listed in your Cloudinary Media Library.
3. If uploads stay on the loading spinner and then time out, check that the preset's notification URL matches your domain, and that your host's logs show `POST /api/moderate` requests. A `401` response means `CLOUDINARY_API_SECRET` doesn't match the product environment that sent the webhook.

## Project structure

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Profile page: profile form, profile picture upload with cropping, avatar variant previews |
| `app/posts/page.tsx` | Posts page: post form and responsive, lazy-loaded feed |
| `app/components/upload-widget.tsx` | Upload widget wrapper that polls for the moderation result |
| `app/components/transformations.ts` | Avatar variant definitions and delivery URL builders |
| `app/components/nav-avatar.tsx` | Circular avatar in the navigation bar |
| `app/api/moderate/route.ts` | Signed webhook receiver (`POST`) and moderation status endpoint (`GET`) |
| `app/lib/cloudinary-server.ts` | Server-side Cloudinary SDK configuration |
| `scripts/setup-cloudinary.mjs` | Creates the upload preset and uploads the default avatar |

## Learn more

- [Profile picture sample project](https://cloudinary.com/documentation/profile_picture_sample_project) in the Cloudinary docs
- [Moderating assets](https://cloudinary.com/documentation/moderate_assets)
- [Upload presets](https://cloudinary.com/documentation/upload_presets)
- [Automatic cropping (`c_auto`)](https://cloudinary.com/documentation/resizing_and_cropping#automatic_cropping)
- [Next.js documentation](https://nextjs.org/docs)
