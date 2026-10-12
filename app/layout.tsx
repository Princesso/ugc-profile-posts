import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { UserProvider } from './context/UserContext'
import Link from 'next/link'
import NavAvatar from './components/nav-avatar'
import NavLinks from './components/nav-links'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'UGC Profile Pictures and Posts',
  description: 'A Next.js app that moderates, crops, and optimizes user-generated images with Cloudinary',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <UserProvider>
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm" aria-hidden="true">
                  U
                </span>
                <span className="hidden sm:inline">UGC Studio</span>
              </Link>
              <NavLinks />
              <div className="flex rounded-full bg-slate-900 p-0.5 ring-2 ring-brand-500/40 dark:bg-slate-800">
                <NavAvatar />
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full flex-1 max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
          <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            Images moderated, cropped, and optimized with Cloudinary
          </footer>
        </UserProvider>
        <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="beforeInteractive" />
      </body>
    </html>
  )
}