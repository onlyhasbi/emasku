import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-xl">
      <nav className="page-wrap flex items-center justify-between py-3 sm:py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 no-underline"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-gold to-gold-dark shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-(--sea-ink)">
            Emasku
          </span>
        </Link>

        <ThemeToggle />
      </nav>
    </header>
  )
}
