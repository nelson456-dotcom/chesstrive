import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is ChessStrive?",
      answer: "ChessStrive is a comprehensive chess training platform that helps players improve their game through puzzles, opening trainers, game analysis, and various training tools. We offer both free and premium features to help players of all levels enhance their chess skills."
    },
    {
      question: "How do I create an account?",
      answer: "Click on the 'Sign Up' button in the top navigation bar. You can create an account using your email address or sign up with Google/Facebook for faster registration."
    },
    {
      question: "What's the difference between free and premium?",
      answer: "Free accounts have access to basic features like limited puzzles and analysis. Premium accounts unlock unlimited puzzles, advanced analysis tools, 40-game reports, opening trainers, and all premium training modules. See our Pricing page for full details."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your Profile page. Go to Account Settings and click 'Cancel Subscription'. Your premium access will continue until the end of your current billing period."
    },
    {
      question: "Can I get a refund?",
      answer: "Yes, we offer refunds for premium subscriptions within 30 days of purchase. Please contact support@chesstrive.com with your account details and reason for refund. See our Refund Policy for complete details."
    },
    {
      question: "How does the game analysis work?",
      answer: "Our analysis tool uses Stockfish, a powerful chess engine, to evaluate positions and suggest the best moves. Simply paste a game in PGN format or set up a position, and our engine will provide detailed analysis with move evaluations and suggestions."
    },
    {
      question: "What are puzzle themes?",
      answer: "Puzzle themes categorize tactical puzzles by type (e.g., forks, pins, skewers, back-rank mates). This helps you focus on specific tactical patterns to improve your tactical vision."
    },
    {
      question: "How do I improve my rating?",
      answer: "Consistent practice is key! Use our puzzle trainers daily, study openings relevant to your playing style, analyze your games to learn from mistakes, and play regularly. Our 40-game report can help identify areas for improvement."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security seriously. We use industry-standard encryption, secure payment processing, and never share your personal information with third parties without your consent. See our Privacy Policy for details."
    },
    {
      question: "Can I use ChessStrive on mobile?",
      answer: "Yes! ChessStrive is fully responsive and works on mobile devices, tablets, and desktops. You can access all features from any device with a web browser."
    },
    {
      question: "How do I report a bug or issue?",
      answer: "Please contact us at support@chesstrive.com with details about the issue, including what you were doing when it occurred and any error messages you saw. We'll investigate and fix it as soon as possible."
    },
    {
      question: "Do you offer gift subscriptions?",
      answer: "Yes! You can purchase gift subscriptions for friends or family. Contact support@chesstrive.com for more information about gifting premium subscriptions."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-8">
            Can't find what you're looking for? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a> and we'll be happy to help!
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

