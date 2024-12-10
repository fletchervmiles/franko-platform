import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-4">Could not find the requested demo page</p>
      <Link 
        href="/demo/dashboard"
        className="text-primary hover:underline"
      >
        Return to Demo Dashboard
      </Link>
    </div>
  )
} 