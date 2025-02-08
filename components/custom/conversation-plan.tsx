"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateConversationPlan } from "@/ai_folder/actions";

type Plan = {
  title: string;
  duration: string;
  summary: string;
  objectives: Array<{
    objective: string;
    keyLearningOutcome: string;
  }>;
};

export function ConversationPlan({ plan }: { plan?: Plan }) {
  const [localPlan, setLocalPlan] = useState<Plan | null>(plan || null);
  const [loading, setLoading] = useState(!plan);

  useEffect(() => {
    if (plan) {
      setLocalPlan(plan);
      setLoading(false);
    }
  }, [plan]);

  return (
    <motion.div
      className="p-4 bg-zinc-50 rounded-lg border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {localPlan ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{localPlan.title}</h3>
          <p className="text-sm text-zinc-600">{localPlan.summary}</p>
          <div className="flex gap-2 items-center text-sm">
            <span className="font-medium">Duration:</span>
            <span className="text-zinc-600">{localPlan.duration}</span>
          </div>
          
          <div className="space-y-4">
            {localPlan.objectives.map((item, index) => (
              <div key={index} className="p-3 bg-white rounded border">
                <h4 className="font-medium mb-1">Objective {index + 1}</h4>
                <p className="text-sm mb-2">{item.objective}</p>
                <div className="flex gap-2">
                  <span className="text-xs font-medium">Outcome:</span>
                  <span className="text-xs text-zinc-600">
                    {item.keyLearningOutcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-6 w-48 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-zinc-200 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-white rounded border">
                <div className="h-4 w-32 bg-zinc-200 rounded mb-2 animate-pulse" />
                <div className="h-3 w-48 bg-zinc-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}