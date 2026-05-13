import { Link } from "@tanstack/react-router";
import { LogoIcon } from "../assets/icons";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-xl">
      <nav className="page-wrap flex items-center justify-between py-3 sm:py-4">
        <Link
          to="/"
          search={{ k: undefined, s: undefined, w: undefined, t: "kalkulator" }}
          className="inline-flex items-center gap-2.5 no-underline"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--sea-ink) shadow-md">
            <LogoIcon className="w-[20px] h-[20px]" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-(--sea-ink)">
            Emasku
          </span>
        </Link>

        <ThemeToggle />
      </nav>
    </header>
  );
}
