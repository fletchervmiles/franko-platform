'use client';

import { useState } from 'react';
import { RefreshCw } from "lucide-react";
import { UsageCard } from "./usage-card";
import { Button } from "./ui/button";
import { useUsageData } from "@/hooks/use-usage-data";
import { Skeleton } from "./ui/skeleton";

export function ClientUsageDashboard() {
  const { isLoading, error, data: usageData, refreshData } = useUsageData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  if (error) {
    return (
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-4">
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-xl font-semibold tracking-tight">Usage Dashboard</h1>
          <div className="bg-red-50 border border-red-200 p-4 rounded-md">
            <p className="text-red-700">Error loading usage data. Please try again later.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usage Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your platform usage and limits
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <UsageCardSkeleton />
            <UsageCardSkeleton />
            <UsageCardSkeleton />
          </>
        ) : usageData ? (
          <>
            <UsageCard
              title="API Responses"
              used={usageData.responses.used}
              total={usageData.responses.total}
              percentage={usageData.responses.percentage}
            />
            <UsageCard
              title="Conversation Plans"
              used={usageData.conversationPlans.used}
              total={usageData.conversationPlans.total}
              percentage={usageData.conversationPlans.percentage}
            />
            <UsageCard
              title="Q&A Messages"
              used={usageData.qaMessages.used}
              total={usageData.qaMessages.total}
              percentage={usageData.qaMessages.percentage}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function UsageCardSkeleton() {
  return (
    <div className="rounded-[6px] border bg-white shadow-sm p-5 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
} 