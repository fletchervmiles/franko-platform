import { redirect } from 'next/navigation'

export default function DemoPage() {
  // Redirect to demo dashboard by default
  redirect('/demo/dashboard')
} 