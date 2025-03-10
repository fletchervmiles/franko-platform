import { useEffect, useState } from 'react';
import { UiUsageData } from '@/lib/utils/usage-formatter';

// A hook to fetch and check user quota availability
export function useQuotaAvailability() {
  const [usageData, setUsageData] = useState<UiUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchUsageData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/usage');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setUsageData(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsageData();
  }, []);
  
  // Check if the user has available conversation plan quota
  const hasAvailablePlanQuota = !isLoading && usageData && 
    (usageData.conversationPlans.used < usageData.conversationPlans.total);
  
  // Check if the user has available responses quota
  const hasAvailableResponsesQuota = !isLoading && usageData && 
    (usageData.responses.used < usageData.responses.total);
  
  // Check if the user has available Q&A messages quota
  const hasAvailableQAQuota = !isLoading && usageData && 
    (usageData.qaMessages.used < usageData.qaMessages.total);
    
  return {
    isLoading,
    error,
    usageData,
    hasAvailablePlanQuota,
    hasAvailableResponsesQuota,
    hasAvailableQAQuota,
    // Return the percentage used as well for potential warning states
    planQuotaPercentage: usageData?.conversationPlans.percentage || 0
  };
} 