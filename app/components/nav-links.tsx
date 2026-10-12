'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'My Profile' },
  { href: '/posts', label: 'My Posts' },
]

// The main navigation links, highlighting the current page.
export default function NavLinks() {
  const pathname = usePathname()

  return (
    <ul className="flex items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`block rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
