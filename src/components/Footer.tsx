export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-(--line) px-4 pb-14 pt-10 text-(--sea-ink-soft)">
      <div className="page-wrap flex flex-col items-center justify-center gap-4 text-center sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} Emasku. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

