import { Button } from "@/components/ui/button"

export default function DemoModeButton() {
  return (
    <Button 
      variant="outline" 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
    >
      Demo Account
    </Button>
  )
}