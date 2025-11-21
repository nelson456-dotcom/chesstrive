import React from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RefundPolicyPage = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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
              <RefreshCw className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Refund Policy</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-sm text-gray-500 mb-8">Last updated: {currentDate}</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Refund Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ChessStrive offers refunds for premium subscriptions under the following conditions:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Refund requests must be made within 30 days of the original purchase date</li>
                <li>Refunds are available for monthly and annual premium subscriptions</li>
                <li>Refunds are not available for partially used subscriptions after 7 days of purchase</li>
                <li>Refunds are not available for gift subscriptions or promotional purchases</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How to Request a Refund</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request a refund, please contact our support team:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Email: <a href="mailto:support@chesstrive.com" className="text-blue-600 hover:underline">support@chesstrive.com</a></li>
                <li>Include your account email and order number in your request</li>
                <li>Provide a brief reason for the refund request</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will process your refund request within 5-10 business days. Refunds will be issued to the original payment method used for the purchase.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription Cancellation</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. You will continue to have access to premium features until the end of the period you've already paid for.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Canceling your subscription does not automatically entitle you to a refund. Refunds are only available as described in Section 1.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Chargebacks</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you initiate a chargeback or dispute a charge with your payment provider, your account may be suspended until the dispute is resolved. We encourage you to contact us directly first so we can resolve any issues quickly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about our Refund Policy, please contact us at <a href="mailto:support@chesstrive.com" className="text-blue-600 hover:underline">support@chesstrive.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;

