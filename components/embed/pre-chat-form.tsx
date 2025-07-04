"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface PreChatFormProps {
  onSubmit: (data: { name: string; email: string }) => void
  theme?: "light" | "dark"
  isLoading?: boolean
}

export function PreChatForm({ onSubmit, theme = "light", isLoading = false }: PreChatFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: { name?: string; email?: string } = {}
    
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(email.trim())) {
      newErrors.email = "Please enter a valid email address"
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ name: name.trim(), email: email.trim() })
    }
  }

  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const inputBg = theme === "dark" ? "bg-gray-700 placeholder-gray-400 border-gray-600" : "bg-white"

  return (
    <div className="flex items-center justify-center p-4 inset-0 absolute">
      <Card className={`w-full max-w-[400px] ${cardBg}`}>        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={textColor}>Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`${errors.name ? "border-red-500" : ""} ${inputBg}`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className={textColor}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`${errors.email ? "border-red-500" : ""} ${inputBg}`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Starting conversation..." : "Start conversation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 