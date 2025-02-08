'use client'

import * as React from "react"
import { Phone } from "lucide-react"
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import { SelectProfile } from "@/db/schema/profiles-schema"

// UI Components
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

// Types
interface FormData {
  firstName: string
  lastName: string
  email: string
  countryCode: string
  phoneNumber: string
  acknowledgment: boolean
  agreement: boolean
}

interface InterviewFormProps {
  clientProfile: SelectProfile
  useCase: string
  onSubmitSuccess?: () => void
  userId?: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  acknowledgment?: string
  agreement?: string
  submit?: string
}

// Constants
const COUNTRY_CODES = [
  { code: '+1', name: 'US/CA' },
  { code: '+61', name: 'AU' },
  { code: '+44', name: 'UK' },
  { code: '+66', name: 'TH' },
  { code: '+81', name: 'JP' },
  { code: '+86', name: 'CN' },
  { code: '+91', name: 'IN' },
  { code: '+65', name: 'SG' },
  { code: '+82', name: 'KR' },
  { code: '+84', name: 'VN' },
  { code: '+60', name: 'MY' },
  { code: '+63', name: 'PH' },
  { code: '+852', name: 'HK' },
  { code: '+64', name: 'NZ' },
] as const

// Form Field Components
const FormField = React.memo(({ 
  label, 
  error, 
  children 
}: { 
  label: string
  error?: string
  children: React.ReactNode 
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
))
FormField.displayName = 'FormField'

const PhoneInput = React.memo(({ 
  countryCode, 
  phoneNumber, 
  onCountryCodeChange, 
  onPhoneNumberChange,
  error
}: {
  countryCode: string
  phoneNumber: string
  onCountryCodeChange: (value: string) => void
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
}) => (
  <FormField label="Phone Number" error={error}>
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={onCountryCodeChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Code" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map(({ code, name }) => (
            <SelectItem key={code} value={code}>
              {code} {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={onPhoneNumberChange}
        placeholder="Phone number"
        className="flex-1"
      />
    </div>
  </FormField>
))
PhoneInput.displayName = 'PhoneInput'

// Utility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
  try {
    const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`
    const parsed = parsePhoneNumber(fullNumber)
    return parsed.formatInternational()
  } catch {
    return `${countryCode} ${phoneNumber}`
  }
}

// Main Component
export default function InterviewForm({ 
  clientProfile,
  useCase,
  onSubmitSuccess,
  userId = clientProfile.userId
}: InterviewFormProps) {
  // State
  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+1',
    phoneNumber: '',
    acknowledgment: false,
    agreement: false,
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Memoized handlers
  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }, [])

  const handleSelectChange = React.useCallback((name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }, [])

  const handleCheckboxChange = React.useCallback((name: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }, [])

  // Form validation
  const validateForm = React.useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required'
    }
    if (!isValidPhoneNumber(`${formData.countryCode}${formData.phoneNumber}`)) {
      newErrors.phoneNumber = 'Valid phone number is required'
    }
    if (!formData.acknowledgment) {
      newErrors.acknowledgment = 'You must acknowledge this'
    }
    if (!formData.agreement) {
      newErrors.agreement = 'You must agree to the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Form submission
  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const formattedPhoneNumber = formatPhoneNumber(formData.countryCode, formData.phoneNumber)
      
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formattedPhoneNumber,
          useCase,
          userId,
          clientProfileId: clientProfile.id,
          organisationName: clientProfile.organisationName,
          organisationDescription: clientProfile.organisationDescription
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      onSubmitSuccess?.()
    } catch (err) {
      console.error('Form submission error:', err)
      setErrors(prev => ({ 
        ...prev, 
        submit: err instanceof Error ? err.message : 'Failed to submit form' 
      }))
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, useCase, userId, clientProfile.id, clientProfile.organisationName, clientProfile.organisationDescription])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.firstName}>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Last Name" error={errors.lastName}>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </FormField>
          </div>

          <FormField label="Email" error={errors.email}>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </FormField>

          <PhoneInput
            countryCode={formData.countryCode}
            phoneNumber={formData.phoneNumber}
            onCountryCodeChange={(value) => handleSelectChange('countryCode', value)}
            onPhoneNumberChange={(e) => handleInputChange(e)}
            error={errors.phoneNumber}
          />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acknowledgment"
                checked={formData.acknowledgment}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('acknowledgment', checked as boolean)
                }
              />
              <Label htmlFor="acknowledgment" className="text-sm">
                I acknowledge that this is a test interview
              </Label>
            </div>
            {errors.acknowledgment && (
              <span className="text-xs text-red-500">{errors.acknowledgment}</span>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreement"
                checked={formData.agreement}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('agreement', checked as boolean)
                }
              />
              <Label htmlFor="agreement" className="text-sm">
                I agree to the terms and conditions
              </Label>
            </div>
            {errors.agreement && (
              <span className="text-xs text-red-500">{errors.agreement}</span>
            )}
          </div>

          {errors.submit && (
            <div className="text-sm text-red-500">{errors.submit}</div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}