import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>©2024</span>
          <span>-</span>
          <Link href="https://franko.ai" className="hover:underline">
            Service provided by Franko.ai
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            T&Cs
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}