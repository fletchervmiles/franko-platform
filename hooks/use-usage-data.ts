import { useState, useEffect } from 'react';
import { UiUsageData } from '@/lib/utils/usage-formatter';

interface UsageDataResponse {
  data: UiUsageData;
  lastUpdated: string;
}

export function useUsageData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<UsageDataResponse | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/usage');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const usageData = await response.json();
        setData(usageData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/usage');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const usageData = await response.json();
      setData(usageData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data: data?.data,
    lastUpdated: data?.lastUpdated ? new Date(data.lastUpdated) : null,
    refreshData,
  };
} 