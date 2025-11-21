import { buttonVariants } from "./button";
import { Label } from "./label";
import { Switch } from "./switch";
import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Icons8Icons from "../Icons8Icons";
import { useState, useRef } from "react";
import { stripeService } from "../../services/stripeService";
import { useNavigate } from "react-router-dom";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  yearlyPeriod?: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  isFree?: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
  currency?: string;
  currencySymbol?: string;
}

// Simple confetti effect using CSS animations
const createConfettiEffect = () => {
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '50%';
  confettiContainer.style.left = '50%';
  confettiContainer.style.transform = 'translate(-50%, -50%)';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '9999';
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)];
    confetti.style.borderRadius = '50%';
    confetti.style.left = Math.random() * 200 - 100 + 'px';
    confetti.style.top = Math.random() * 200 - 100 + 'px';
    confetti.style.animation = `confetti-fall ${Math.random() * 2 + 1}s ease-out forwards`;
    confettiContainer.appendChild(confetti);
  }
  
  document.body.appendChild(confettiContainer);
  
  setTimeout(() => {
    document.body.removeChild(confettiContainer);
  }, 3000);
};

// Add confetti animation CSS
const addConfettiCSS = () => {
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
  currency = 'USD',
  currencySymbol = '$',
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked) {
      addConfettiCSS();
      createConfettiEffect();
    }
  };

  const handlePlanClick = async (plan: PricingPlan) => {
    // Check if this is the free plan
    const isFreePlan = plan.name === 'FREE' || (plan as any).isFree;
    
    if (isFreePlan) {
      // Free plan just redirects to signup
      if (plan.href) {
        navigate(plan.href);
      }
      return;
    }

    // Map plan names to Stripe plan identifiers
    const planMap: { [key: string]: string } = {
      'PREMIUM': 'premium'
    };

    const stripePlan = planMap[plan.name];
    if (!stripePlan) {
      // If it's not a Stripe plan, use the href
      if (plan.href) {
        navigate(plan.href);
      }
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to signup/login
      navigate('/signup', { state: { redirectTo: '/pricing', plan: stripePlan } });
      return;
    }

    try {
      setLoading(plan.name);
      const billingPeriod = isMonthly ? 'monthly' : 'yearly';
      const response = await stripeService.createCheckoutSession(stripePlan, billingPeriod);
      
      // Redirect to Stripe Checkout
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-16 overflow-x-hidden">
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center mb-6">
          <div className="border border-primary py-1 px-4 rounded-lg text-primary text-sm font-medium">
            Pricing
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      <div className="flex justify-center items-center mb-10 gap-4">
        <span className={`font-semibold text-base ${isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className={`font-semibold text-base ${!isMonthly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Yearly <span className="text-primary">(Save 17%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -10 : 0,
                    opacity: 1,
                    scale: plan.isPopular ? 1.02 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              `rounded-xl border-[1px] p-4 bg-background text-center relative`,
              plan.isPopular ? "border-primary border-2" : "border-border",
              "flex flex-col",
              !plan.isPopular && "mt-5"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                <Icons8Icons.Star className="text-primary-foreground h-4 w-4 fill-current" />
                <span className="text-primary-foreground ml-1 font-sans font-semibold">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-muted-foreground">
                {plan.name}
              </p>
              <div className="mt-4 flex items-center justify-center gap-x-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {plan.price === "0" ? "Free" : `${(plan as any).currencySymbol || currencySymbol}${isMonthly ? plan.price : plan.yearlyPrice}`}
                </span>
                {plan.period !== "Next 3 months" && plan.period !== "forever" && (
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                    / {isMonthly ? plan.period : ((plan as any).yearlyPeriod || plan.period)}
                  </span>
                )}
              </div>

              {plan.price !== "0" && (
                <p className="text-xs leading-5 text-muted-foreground">
                  {isMonthly ? "billed monthly" : "billed annually"}
                </p>
              )}

              <ul className="mt-4 gap-1 flex flex-col">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Icons8Icons.Check className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-left">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4" />

              <button
                onClick={() => handlePlanClick(plan)}
                disabled={loading === plan.name}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "group relative w-full gap-2 overflow-hidden text-sm font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground",
                  loading === plan.name && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading === plan.name 
                  ? 'Loading...' 
                  : plan.isFree 
                    ? plan.buttonText 
                    : isMonthly 
                      ? plan.buttonText 
                      : `Upgrade to Premium (Yearly)`}
              </button>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}