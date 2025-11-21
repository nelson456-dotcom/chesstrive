import { Pricing } from "./ui/pricing";

const chessPricingPlans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "forever",
    features: [
      "Basic game analysis",
      "Limited puzzles per day",
      "Opening explorer access",
      "Community support",
      "Basic statistics",
    ],
    description: "Perfect for getting started",
    buttonText: "Get Started Free",
    href: "/signup",
    isPopular: false,
    isFree: true,
  },
  {
    name: "PREMIUM",
    price: "4.99",
    yearlyPrice: "49.99",
    period: "per month",
    yearlyPeriod: "per year",
    features: [
      "Unlimited puzzles",
      "Advanced game analysis",
      "Live analysis during games",
      "Endgame trainer",
      "Priority support",
      "Study tools & annotations",
      "Custom opening repertoires",
      "Detailed statistics",
      "Advanced position analysis",
      "Chess engine integration",
    ],
    description: "Unlock all features",
    buttonText: "Upgrade to Premium",
    href: "/signup",
    isPopular: true,
    isFree: false,
  },
];

function ChessPricing() {

  return (
    <div className="w-full">
      <Pricing 
        plans={chessPricingPlans}
        title="Chess Training Plans"
        description="Choose the plan that fits your chess journey\nStart free or upgrade to premium for unlimited access to all features."
      />
    </div>
  );
}

export { ChessPricing };
