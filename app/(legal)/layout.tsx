import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Franko.ai',
    default: 'Legal | Franko.ai',
  },
  description: 'Legal information, privacy policy, and terms & conditions for Franko.ai - Learn about how we protect your data and our service terms.',
  openGraph: {
    title: 'Legal Information | Franko.ai',
    description: 'Legal information, privacy policy, and terms & conditions for Franko.ai.',
    type: 'website',
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 