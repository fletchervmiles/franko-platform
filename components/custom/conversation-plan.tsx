"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Clock, Target, List, MessageCircle, BookOpen } from "lucide-react";

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
    const numericDuration = typeof duration === "string" ? 
      Number.parseInt(duration.replace(/[^0-9]/g, "")) : duration;
    
    if (numericDuration <= 5) return "text-green-700 bg-green-100";
    if (numericDuration <= 10) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  };

  return (
    <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Conversation Plan (Draft)
            </span>
            {localPlan && (
              <span className={`text-sm px-2 py-1 rounded-full flex items-center ${getDurationColor(localPlan.duration)}`}>
                <Clock className="w-4 h-4 mr-1" />
                {localPlan.duration} min
              </span>
            )}
          </div>
        </div>
        {localPlan && (
          <div className="mt-4 space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">{localPlan.title}</h2>
            <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-white p-4 rounded-lg shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Overview</span>
              </div>
              <p className="text-base text-gray-700">{localPlan.summary}</p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {localPlan ? (
          <div className="space-y-2">
            <Accordion type="single" collapsible className="space-y-2">
              {localPlan.objectives.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200
                    data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline transition-all duration-200
                    hover:border-l-2 hover:border-l-blue-200">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                          Step {index + 1}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-700">{item.keyLearningOutcome}</p>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Target className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">Objective</h4>
                          <p className="text-sm text-gray-700 mt-1">
                            {item.objective || item.obj1 || item.obj2 || item.obj3}
                          </p>
                        </div>
                      </div>

                      {item.focusPoints && item.focusPoints.length > 0 && (
                        <div className="flex items-start gap-2">
                          <List className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">Focus Points</h4>
                            <ul className="space-y-2 mt-1">
                              {item.focusPoints.map((point, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {item.expectedConversationTurns && (
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">Approx Conversation Turns</h4>
                            <p className="text-sm text-gray-700 mt-1">{item.expectedConversationTurns}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add animation styles
const styles = `
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideDown {
  animation: slideDown 0.2s ease-out;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}