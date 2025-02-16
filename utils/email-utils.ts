// Common email providers to exclude
const COMMON_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'me.com',
  'msn.com'
]);

type OrganisationData = {
  organisationName: string | undefined;
  organisationUrl: string | undefined;
};

export function processOrganisationFromEmail(email: string): OrganisationData {
  try {
    const domain = email.split('@')[1].toLowerCase();
    
    // Return undefined if it's a common email provider
    if (COMMON_EMAIL_PROVIDERS.has(domain)) {
      return { organisationName: undefined, organisationUrl: undefined };
    }

    // Extract organization name (remove TLD and capitalize)
    const orgName = domain
      .split('.')[0] // Take first part before TLD
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Create organization URL
    const orgUrl = `https://${domain}`;

    return {
      organisationName: orgName,
      organisationUrl: orgUrl
    };
  } catch (error) {
    console.error('Error processing email domain:', error);
    return { organisationName: undefined, organisationUrl: undefined };
  }
} 