import React from 'react';
import { Cookie, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicyPage = () => {
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
              <Cookie className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Cookie Policy</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ChessStrive uses cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. We use the following types of cookies:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Essential Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Performance Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the way our website works.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Functionality Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Targeting/Advertising Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant content on other sites.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements, and so on. These include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Google Analytics for website analytics</li>
                <li>Stripe for payment processing</li>
                <li>Social media platforms for sharing features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Managing Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.allaboutcookies.org</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about our Cookie Policy, please contact us at <a href="mailto:support@chesstrive.com" className="text-blue-600 hover:underline">support@chesstrive.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;

