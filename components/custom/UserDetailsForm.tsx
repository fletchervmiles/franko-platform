'use client';

import { useState } from 'react';

interface UserDetailsFormProps {
  onSubmit: (data: { fullName: string; email: string }) => void;
  chatId: string;
}

export function UserDetailsForm({ onSubmit, chatId }: UserDetailsFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    submit: ''
  });

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      email: '',
      submit: ''
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return !newErrors.fullName && !newErrors.email;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      <div className="space-y-2">
        <label 
          htmlFor="fullName" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          className={`
            w-full px-4 py-2 
            border rounded-lg 
            bg-white dark:bg-gray-900
            focus:border-gray-300 dark:focus:border-gray-600
            focus:shadow-sm
            outline-none
            transition-all duration-200
            ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
          placeholder="Enter your full name"
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={`
            w-full px-4 py-2 
            border rounded-lg 
            bg-white dark:bg-gray-900
            focus:border-gray-300 dark:focus:border-gray-600
            focus:shadow-sm
            outline-none
            transition-all duration-200
            ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
          placeholder="Enter your email address"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        className={`
          w-full px-4 py-2
          text-sm 
          text-white
          bg-gray-900 dark:bg-gray-800
          rounded-lg
          shadow-sm
          hover:bg-gray-800 dark:hover:bg-gray-700
          transition-all duration-200
          disabled:opacity-50
          ${errors.submit ? 'bg-red-500 hover:bg-red-600' : ''}
        `}
      >
        Submit
      </button>
    </form>
  );
} 