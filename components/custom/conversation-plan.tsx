"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Plan = {
  title: string;
  duration: string | number;
  summary: string;
  objectives: Array<{
    objective?: string;
    obj1?: string;
    obj2?: string;
    obj3?: string;
    keyLearningOutcome: string;
    focusPoints?: string[];
    expectedConversationTurns?: string | number;
  }>;
};

type PlanResponse = Plan | {
  type: string;
  display?: Plan;
  plan?: Plan;
};

export function ConversationPlan({ plan }: { plan?: PlanResponse }) {
  const [localPlan, setLocalPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(!plan);

  useEffect(() => {
    if (plan) {
      const actualPlan = 'display' in plan ? plan.display : 
                        'plan' in plan ? plan.plan : 
                        plan as Plan;
      setLocalPlan(actualPlan || null);
      setLoading(false);
    }
  }, [plan]);

  // Helper function to get duration color
  const getDurationColor = (duration: string | number) => {
    const numericDuration = typeof duration === 'string' ? 
      parseInt(duration.replace(/[^0-9]/g, '')) : duration;
    
    if (numericDuration <= 5) return "bg-green-50";
    if (numericDuration <= 10) return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
      <CardHeader className="pb-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Conversation Plan</h2>
          <p className="text-sm text-gray-500">Structured approach for gathering insights and feedback.</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {localPlan ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Objectives</h3>
                <p className="text-2xl font-semibold">{localPlan.objectives.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
                <p className="text-2xl font-semibold">
                  <span className={`${getDurationColor(localPlan.duration)} px-2 py-0.5 rounded`}>
                    {localPlan.duration}
                  </span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Purpose</h3>
                <p className="text-sm text-gray-700 line-clamp-2">{localPlan.summary}</p>
              </div>
            </div>

            {/* Objectives Section */}
            <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
              {localPlan.objectives.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-4 ${index !== localPlan.objectives.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Objective {index + 1}
                      </h4>
                      <p className="mt-1 text-base text-gray-700">
                        {item.objective || item.obj1 || item.obj2 || item.obj3}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-gray-700">Key Learning Outcome</h5>
                      <p className="mt-1 text-sm text-gray-600">{item.keyLearningOutcome}</p>
                    </div>

                    {item.focusPoints && item.focusPoints.length > 0 && (
                      <div className="pl-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Focus Points</h5>
                        <ul className="space-y-1">
                          {item.focusPoints.map((point, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2 text-gray-400">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.expectedConversationTurns && (
                      <div className="text-sm text-gray-500">
                        Expected turns: {item.expectedConversationTurns}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Loading State */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-lg border">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border-b last:border-b-0">
                  <div className="space-y-4">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-20 w-full bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}