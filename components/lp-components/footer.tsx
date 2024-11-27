import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto">
        <div className="px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>©{new Date().getFullYear()}</span>
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
              <a href="mailto:fletcher@franko.ai" className="hover:underline">
                Contact
              </a>
            </nav>
          </div>
        </div>
        <div className="relative w-full h-40">
          <Image
            src="/assets/footer-logo.png"
            alt="Footer Logo"
            fill
            className="object-scale-down"
            sizes="100vw"
            priority
          />
        </div>
      </div>
    </footer>
  )
}

