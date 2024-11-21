'use client'

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone } from "lucide-react"
import { SelectProfile } from "@/db/schema"

interface FormData {
  firstName: string
  lastName: string
  email: string
  countryCode: string
  phoneNumber: string
  acknowledgment: boolean
  agreement: boolean
}

const countryCodes = [
  { code: '+1', name: 'US' },
  { code: '+61', name: 'AU' },
  { code: '+44', name: 'UK' },
  { code: '+81', name: 'JP' },
  { code: '+86', name: 'CN' },
  { code: '+91', name: 'IN' },
  { code: '+49', name: 'DE' },
  { code: '+33', name: 'FR' },
  { code: '+39', name: 'IT' },
  { code: '+7', name: 'RU' },
]

interface InterviewFormProps {
  clientProfile: SelectProfile;
  useCase: string;
  onSubmitSuccess?: () => void;
}

export default function InterviewForm({ 
  clientProfile,
  useCase,
  onSubmitSuccess
}: InterviewFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+1",
    phoneNumber: "",
    acknowledgment: false,
    agreement: false,
  })

  const [errors, setErrors] = useState<Record<keyof FormData, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    countryCode: false,
    phoneNumber: false,
    acknowledgment: false,
    agreement: false
  })

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const formatPhoneNumber = (countryCode: string, phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '')
    const formattedNumber = digits.startsWith('0') ? digits.slice(1) : digits
    return `${countryCode}${formattedNumber}`
  }

  const validateForm = () => {
    const newErrors: Record<keyof FormData, boolean> = {
      firstName: !formData.firstName,
      lastName: !formData.lastName,
      email: !formData.email || !/\S+@\S+\.\S+/.test(formData.email),
      countryCode: false, // This is always selected, so no validation needed
      phoneNumber: !formData.phoneNumber,
      acknowledgment: !formData.acknowledgment,
      agreement: !formData.agreement,
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    
    if (validateForm()) {
      setIsSubmitting(true)
      const formattedPhoneNumber = formatPhoneNumber(formData.countryCode, formData.phoneNumber)
      
      const payload = {
        client_name: clientProfile.companyName,
        interviewee_name: formData.firstName,
        interviewee_last_name: formData.lastName,
        interviewee_email: formData.email,
        interviewee_number: formattedPhoneNumber,
        client_company_description: clientProfile.companyDescription,
        agent_name: clientProfile.agentInterviewerName,
        voice_id: clientProfile.voiceId,
        userId: clientProfile.userId,
        use_case: useCase
      }

      console.log('Submitting form with payload:', payload)

      try {
        console.log('Making POST request...')
        const response = await fetch('https://app.franko.ai/call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        console.log('Response status:', response.status)
        const responseData = await response.json()
        console.log('Response data:', responseData)

        if (!response.ok) {
          throw new Error(`Failed to initiate call: ${response.status} ${response.statusText}`)
        }

        onSubmitSuccess?.()
      } catch (error) {
        console.error('Detailed error:', error)
        setSubmitError('Failed to initiate call. Please try again.')
        setIsSubmitted(false)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      console.log('Form validation failed', errors)
    }
  }

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
      <CardContent className="pt-6">
        <div className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name*</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              {errors.firstName && <p className="text-sm text-red-500">This field is required</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name*</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
              {errors.lastName && <p className="text-sm text-red-500">This field is required</p>}
            </div>
            <div>
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && <p className="text-sm text-red-500">Please enter a valid email address</p>}
            </div>
            <div>
              <Label htmlFor="phoneNumber">Contact Number*</Label>
              <div className="flex space-x-2">
                <Select onValueChange={(value) => handleSelectChange("countryCode", value)} value={formData.countryCode}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="flex-grow"
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-red-500">This field is required</p>}
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledgment"
                checked={formData.acknowledgment}
                onCheckedChange={(checked: boolean | 'indeterminate') => 
                  handleCheckboxChange("acknowledgment", checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="acknowledgment" className="font-normal text-muted-foreground">
                  Note: The interviewer will pause for 2-3 seconds after your response to ensure you&apos;ve finished.
                </Label>
                {errors.acknowledgment && <p className="text-sm text-red-500">This field is required</p>}
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreement"
                checked={formData.agreement}
                onCheckedChange={(checked: boolean | 'indeterminate') => 
                  handleCheckboxChange("agreement", checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="agreement" className="font-normal text-muted-foreground">
                  I agree to participate in {clientProfile.companyName}&apos;s AI interview and receive a call upon form submission.
                </Label>
                {errors.agreement && <p className="text-sm text-red-500">This field is required</p>}
              </div>
            </div>
            {submitError && (
              <p className="text-sm text-red-500 mb-2">{submitError}</p>
            )}
            <Button 
              type="submit" 
              size="sm"
              disabled={isSubmitted || isSubmitting}
              className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
            >
              {isSubmitting ? (
                <>
                  <Phone className="w-3 h-3 mr-0.5 animate-pulse" />
                  Initiating Call...
                </>
              ) : isSubmitted ? (
                <>
                  <Phone className="w-3 h-3 mr-0.5" />
                  Submitted
                </>
              ) : (
                <>
                  <Phone className="w-3 h-3 mr-0.5" />
                  Submit to Receive Call Now
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}