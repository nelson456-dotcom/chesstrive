import { useState, useEffect } from "react";
import { Pricing } from "./ui/pricing";
import { getUserCurrency, convertCurrency } from "../utils/currencyConverter";

// Base prices in USD
const BASE_PRICES = {
  monthly: 4.99,
  yearly: 49.99,
};

const chessPricingPlansBase = [
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
    price: BASE_PRICES.monthly.toString(),
    yearlyPrice: BASE_PRICES.yearly.toString(),
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
  const [plans, setPlans] = useState(chessPricingPlansBase);
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    // Detect user's currency on component mount
    getUserCurrency().then(({ currency: userCurrency, symbol }) => {
      setCurrency(userCurrency);
      setCurrencySymbol(symbol);
      
      // Update plans with converted prices
      const updatedPlans = chessPricingPlansBase.map(plan => {
        if (plan.isFree) {
          return {
            ...plan,
            currency: userCurrency,
            currencySymbol: symbol,
          };
        }
        
        // Convert prices from USD
        const monthlyPrice = parseFloat(plan.price);
        const yearlyPrice = parseFloat(plan.yearlyPrice);
        
        const convertedMonthly = convertCurrency(monthlyPrice, userCurrency);
        const convertedYearly = convertCurrency(yearlyPrice, userCurrency);
        
        // Format numbers (remove decimals for JPY/KRW, 2 decimals for others)
        let monthlyStr, yearlyStr;
        if (userCurrency === 'JPY' || userCurrency === 'KRW') {
          monthlyStr = Math.round(convertedMonthly).toString();
          yearlyStr = Math.round(convertedYearly).toString();
        } else {
          monthlyStr = convertedMonthly.toFixed(2);
          yearlyStr = convertedYearly.toFixed(2);
        }
        
        return {
          ...plan,
          price: monthlyStr,
          yearlyPrice: yearlyStr,
          currency: userCurrency,
          currencySymbol: symbol,
        };
      });
      
      setPlans(updatedPlans);
    }).catch(err => {
      console.error('Error detecting currency:', err);
      // Keep USD as default
    });
  }, []);

  return (
    <div className="w-full">
      <Pricing 
        plans={plans}
        title="Chess Training Plans"
        description="Choose the plan that fits your chess journey\nStart free or upgrade to premium for unlimited access to all features."
        currency={currency}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

export { ChessPricing };
