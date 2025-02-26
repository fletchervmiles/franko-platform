'use client';

import { OptionButtons } from '@/components/OptionButtons';
import { UserDetailsForm } from '@/components/UserDetailsForm';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Option Buttons Test</h1>
      
      <OptionButtons 
        options={[
          'Short option',
          'Another option',
          'A third choice',
          'Something else',
          'Final option',
          'One more'
        ]}
        chatId="test-123"
        text="Please select one of these options:"
      />

      {/* Test long options */}
      <div className="mt-8">
        <h2 className="text-xl mb-4">Long Options Test</h2>
        <OptionButtons 
          options={[
            'This is a very long option that should wrap to multiple lines and show how the component handles lengthy content',
            'Another long option to see how multiple cards with lots of content look together',
            'A shorter one for contrast'
          ]}
          chatId="test-456"
          text="Long options example:"
        />
      </div>

      {/* Test numeric options */}
      <div className="mt-8">
        <h2 className="text-xl mb-4">Numeric Options Test</h2>
        <OptionButtons 
          options={Array.from({length: 10}, (_, i) => String(i + 1))}
          chatId="test-789"
          text="Please select a number from 1 to 10:"
        />
      </div>

      {/* Test range with labels */}
      <div className="mt-8">
        <h2 className="text-xl mb-4">Labeled Range Test</h2>
        <OptionButtons 
          options={[
            '1 - Not at all',
            '2 - Slightly',
            '3 - Moderately',
            '4 - Very',
            '5 - Extremely'
          ]}
          chatId="test-scale"
          text="How would you rate your experience?"
        />
      </div>

      {/* Test User Details Form */}
      <div className="mt-8">
        <h2 className="text-xl mb-4">User Details Form</h2>
        <UserDetailsForm 
          chatId="test-form"
          onSubmit={(data) => {
            console.log('Form submitted:', data);
            // Handle form submission
          }}
        />
      </div>
    </div>
  );
} 