import Container from "@/components/lp-redesign/container";
import Image from "next/image";
import { Code, Send, Link as LinkIcon, MousePointerClick, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function TryItYourselfSection() {
  const [isModalReady, setIsModalReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load ONE generic Franko script on mount and poll for readiness.
  useEffect(() => {
    // This effect should only run once.
    if (typeof window === 'undefined' || (window as any).FrankoModal) {
        setIsModalReady(true);
        setIsLoading(false);
        return;
    }

    // Check if the script is already being loaded to avoid duplicates
    if (document.querySelector('script[data-franko-base]')) {
        return;
    }
    
    const script = document.createElement('script');
    script.setAttribute('data-franko-base', 'true');
    script.innerHTML = `
      (function(){if(!window.FrankoModal){window.FrankoModal=(...a)=>{window.FrankoModal.q=window.FrankoModal.q||[];window.FrankoModal.q.push(a)};window.FrankoModal=new Proxy(window.FrankoModal,{get:(t,p)=>p==="q"?t.q:(...a)=>t(p,...a)})}const l=()=>{const s=document.createElement("script");s.src="https://franko.ai/embed.js";s.setAttribute("data-modal-slug","slack-1753101441774");s.setAttribute("data-mode","manual");document.head.appendChild(s)};document.readyState==="complete"?l():addEventListener("load",l)})();
    `;
    document.body.appendChild(script);

    // Start polling immediately and reliably for the API.
    const pollForApi = setInterval(() => {
        if ((window as any).FrankoModal && typeof (window as any).FrankoModal.open === 'function') {
            clearInterval(pollForApi);
            setIsModalReady(true);
            setIsLoading(false);
        }
    }, 100);
    
    // Safety cleanup
    return () => clearInterval(pollForApi);

  }, []);

  const demoCards = [
    {
      id: "slack",
      logo: "/assets/slack-icon.jpeg",
      title: "General Feedback",
      slug: "slack-1753101441774",
      line1: "Collect ongoing product feedback. Includes agents for feature requests, key improvements, and benefits.",
      line2: "Use case: Embed as floating bubble or \"Give Feedback\" button.",
      company: "Slack",
      icon: "embed",
      agents: ["Key benefit agent", "Improvement & friction agent", "Feature request agent"]
    },
    {
      id: "perplexity",
      logo: "/assets/perplexity-icon.png",
      title: "Unconverted Signups",
      slug: "perplexity-1753102485315",
      line1: "Discover why signed-up users haven't upgraded. Active agents focused on uncovering activation hurdles.",
      line2: "Send via email link to users who haven't upgraded.",
      company: "Perplexity",
      icon: "send",
      agents: ["Upgrade Objections Agent", "Improvement & friction agent", ""]
    },
    {
      id: "zapier",
      logo: "/assets/zapier-icon.jpeg",
      title: "Onboarding Flow",
      slug: "zapier-1753102799092",
      line1: "Clarify your customers' persona, key needs, and how they found you. Active persona, discovery and goal-oriented agents.",
      line2: "Place in onboarding flow or email (\"Tell us about yourself\").",
      company: "Zapier",
      icon: "link",
      agents: ["Persona & Problem Agent", "Discovery Trigger Agent", ""]
    }
  ];

  const handleLaunchModal = useCallback(async (slug: string) => {
    if (!isModalReady || !(window as any).FrankoModal) {
      console.warn("FrankoModal is not ready yet. Please wait a moment and try again.");
      return;
    }

    const frankoIframe = document.querySelector('iframe[src*="/embed/"]') as HTMLIFrameElement;

    if (!frankoIframe) {
      console.error("Franko iframe not found. The base script may have failed to load.");
      return;
    }

    const newSrc = `https://franko.ai/embed/${slug}?mode=modal`;
    
    if (frankoIframe.src !== newSrc) {
        frankoIframe.src = newSrc;
        // The onload event for the iframe is crucial to wait for the new content.
        frankoIframe.onload = () => {
            (window as any).FrankoModal.open();
        };
    } else {
        (window as any).FrankoModal.open();
    }
  }, [isModalReady]);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "embed":
        return <Code className="w-4 h-4" />;
      case "send":
        return <Send className="w-4 h-4" />;
      case "link":
        return <LinkIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="py-24 bg-[#1A1919]" data-section="try-it-yourself">
      <Container>
        <div className="text-center mb-10">
          {/* Main heading */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight text-white">
            Try It Yourself
          </h1>
          
          {/* Subheading */}
          <p className="text-xl max-w-4xl mx-auto leading-relaxed" style={{ color: '#FFFFFF99' }}>
          Try live demos configured for each company below. See how Franko would collect feedback for Slack, Perplexity, or Zapier.
          </p>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {demoCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center group">
              <div
                className="w-full max-w-sm rounded-2xl p-6 bg-[rgba(244,242,240,1)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] border border-transparent hover:border-[#E4F222] min-h-[280px] flex flex-col"
                // The card itself is not clickable to prevent issues with disabled buttons
              >
                <p className="uppercase tracking-wide text-[10px] font-semibold text-center mb-2 text-[#0C0A08]/60">Modal configuration</p>
                <h4 className="text-lg font-semibold text-center mb-4 text-[#0C0A08]">{card.title}</h4>
                                  <div className="w-full rounded-xl bg-white p-4 shadow-md flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden">
                          <Image src={card.logo} alt={`${card.company} logo`} width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm text-gray-800 font-medium">{card.company}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-800 font-medium bg-green-100 px-2 py-1 rounded-full">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                      </div>
                    </div>
                    <div className="my-4 h-px bg-gray-100" />
                    <div className="space-y-2 text-xs text-gray-600 flex-1">
                      {card.agents.map((agent, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {agent ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-indigo-500" />
                              <span>{agent}</span>
                            </>
                          ) : (
                            <div className="h-5 w-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className={cn(
                        "mt-4 w-full text-[#0C0A08] bg-[rgba(228,235,246,1)] hover:bg-gray-200 flex items-center justify-center",
                        isLoading && "cursor-not-allowed opacity-50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLoading) handleLaunchModal(card.slug);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading Demo...
                        </>
                      ) : (
                        <>
                            <MousePointerClick className="mr-2 h-4 w-4" /> Launch Modal
                        </>
                      )}
                    </Button>
                  </div>
              </div>
              <button 
                onClick={() => { if (!isLoading) handleLaunchModal(card.slug) }}
                disabled={isLoading}
                className={cn(
                    "mt-6 text-white hover:text-[#E4F222] transition-colors duration-200 flex items-center gap-2 text-sm font-medium",
                    isLoading && "cursor-not-allowed opacity-50"
                )}
              >
                {isLoading ? 'Loading...' : 'Explore live demo'} 
                {!isLoading && <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
              </button>
            </div>
          ))}
        </div>

        {/* Optional disclaimer */}
        <div className="text-center">
          <p className="text-base" style={{ color: '#FFFFFF99', opacity: 0.8 }}>
            Your modals can be embedded as floating chat bubbles, specific buttons, or sent via email links, depending on your use case.
          </p>
        </div>
      </Container>
    </div>
  );
} 