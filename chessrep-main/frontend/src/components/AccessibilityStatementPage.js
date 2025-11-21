import React from 'react';
import { Accessibility, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessibilityStatementPage = () => {
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
              <Accessibility className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Accessibility Statement</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ChessStrive is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to achieve these goals.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Standards</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA standards. These guidelines explain how to make web content more accessible for people with disabilities and user-friendly for everyone.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The guidelines have three levels of accessibility (A, AA, and AAA). We've chosen Level AA as the target for our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Features</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our website includes the following accessibility features:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Keyboard navigation support throughout the site</li>
                <li>Alt text for images and visual content</li>
                <li>Proper heading structure for screen readers</li>
                <li>High contrast color schemes for better visibility</li>
                <li>Responsive design that works on various devices</li>
                <li>Clear and consistent navigation</li>
                <li>Form labels and error messages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Known Issues</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are aware that some parts of our website may not be fully accessible. We are working to address these issues and improve accessibility. Known areas we're working on include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Enhanced keyboard navigation for complex interactive elements</li>
                <li>Improved screen reader compatibility for dynamic content</li>
                <li>Better color contrast in some areas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We welcome your feedback on the accessibility of ChessStrive. If you encounter accessibility barriers, please let us know:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Email: <a href="mailto:accessibility@chesstrive.com" className="text-blue-600 hover:underline">accessibility@chesstrive.com</a></li>
                <li>Phone: Available upon request</li>
                <li>Postal address: Available upon request</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                We aim to respond to accessibility feedback within 5 business days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Content</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Some content on our website may be provided by third parties. We cannot guarantee the accessibility of third-party content, but we work with our partners to encourage accessibility.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ongoing Efforts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Accessibility is an ongoing effort. We regularly review our website and make improvements to ensure we meet accessibility standards. We also conduct periodic accessibility audits and user testing with people who have disabilities.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityStatementPage;

