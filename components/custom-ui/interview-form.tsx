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
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

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
  // North America
  { code: '+1', name: 'US/CA' },  // United States & Canada
  
  // Other Common
  { code: '+61', name: 'AU' },    // Australia
  { code: '+44', name: 'UK' },    // United Kingdom
  { code: '+66', name: 'TH' },    // Thailand

  // Asia & Oceania
  { code: '+81', name: 'JP' },    // Japan
  { code: '+86', name: 'CN' },    // China
  { code: '+91', name: 'IN' },    // India
  { code: '+65', name: 'SG' },    // Singapore
  { code: '+82', name: 'KR' },    // South Korea
  { code: '+84', name: 'VN' },    // Vietnam
  { code: '+60', name: 'MY' },    // Malaysia
  { code: '+63', name: 'PH' },    // Philippines
  { code: '+852', name: 'HK' },   // Hong Kong
  { code: '+64', name: 'NZ' },    // New Zealand
  { code: '+886', name: 'TW' },   // Taiwan (New)
  { code: '+855', name: 'KH' },   // Cambodia (New)
  { code: '+95', name: 'MM' },    // Myanmar (New)
  { code: '+62', name: 'ID' },    // Indonesia (New)
  
  // Europe
  { code: '+49', name: 'DE' },    // Germany
  { code: '+33', name: 'FR' },    // France
  { code: '+39', name: 'IT' },    // Italy
  { code: '+34', name: 'ES' },    // Spain
  { code: '+31', name: 'NL' },    // Netherlands
  { code: '+46', name: 'SE' },    // Sweden
  { code: '+47', name: 'NO' },    // Norway
  { code: '+45', name: 'DK' },    // Denmark
  { code: '+41', name: 'CH' },    // Switzerland
  { code: '+353', name: 'IE' },   // Ireland
  { code: '+358', name: 'FI' },   // Finland (New)
  { code: '+48', name: 'PL' },    // Poland (New)
  { code: '+43', name: 'AT' },    // Austria (New)
  { code: '+32', name: 'BE' },    // Belgium (New)
  { code: '+351', name: 'PT' },   // Portugal (New)
  
  // Middle East
  { code: '+971', name: 'AE' },   // UAE
  { code: '+966', name: 'SA' },   // Saudi Arabia
  { code: '+972', name: 'IL' },   // Israel (New)
  { code: '+974', name: 'QA' },   // Qatar (New)
  { code: '+973', name: 'BH' },   // Bahrain (New)
  
  // Others
  { code: '+7', name: 'RU' },     // Russia
  { code: '+55', name: 'BR' },    // Brazil
  { code: '+52', name: 'MX' },    // Mexico
  { code: '+27', name: 'ZA' },    // South Africa
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
    try {
      const numberWithCode = `${countryCode}${phoneNumber}`
      if (!isValidPhoneNumber(numberWithCode)) {
        throw new Error('Invalid phone number')
      }
      const parsed = parsePhoneNumber(numberWithCode)
      return parsed.format('E.164')
    } catch (error) {
      console.error('Phone number formatting error:', error)
      return `${countryCode}${phoneNumber}`
    }
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
      
      // Debug logging
      console.log('Country Code:', formData.countryCode)
      console.log('Original Number:', formData.phoneNumber)
      console.log('Formatted Number:', formattedPhoneNumber)
      
      const payload = {
        client_name: clientProfile.companyName,
        interviewee_name: formData.firstName,
        interviewee_last_name: formData.lastName,
        interviewee_email: formData.email,
        interviewee_number: formattedPhoneNumber,
        client_company_description: clientProfile.companyDescription,
        agent_name: clientProfile.agentInterviewerName || 'Brittany',
        voice_id: clientProfile.voiceId || 'kPzsL2i3teMYv0FxEYQ6',
        unique_customer_identifier: clientProfile.userId,
        use_case: useCase
      }

      try {
        const response = await fetch('/api/proxy/call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to initiate call')
        }

        const responseData = await response.json()
        console.log('Response data:', responseData)

        onSubmitSuccess?.()
      } catch (error) {
        console.error('Detailed error:', error)
        setSubmitError('Failed to initiate call. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
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