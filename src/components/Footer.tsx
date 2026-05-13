export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-(--line)/30 px-4 py-6 text-(--sea-ink-soft)">
      <div className="page-wrap flex items-center justify-center">
        <p className="m-0 text-xs opacity-60">
          &copy; {year} Emasku
        </p>
      </div>
    </footer>
  );
}
