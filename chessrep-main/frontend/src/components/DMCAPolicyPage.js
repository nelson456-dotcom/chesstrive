import React from 'react';
import { Copyright, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DMCAPolicyPage = () => {
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
              <Copyright className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">DMCA & Copyright Policy</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Copyright Protection</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ChessStrive respects the intellectual property rights of others and expects our users to do the same. We will respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA) and other applicable intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Reporting Copyright Infringement</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you believe that content on ChessStrive infringes your copyright, please provide our Copyright Agent with the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>A physical or electronic signature of the copyright owner or authorized agent</li>
                <li>Identification of the copyrighted work claimed to have been infringed</li>
                <li>Identification of the material that is claimed to be infringing and information reasonably sufficient to permit us to locate the material</li>
                <li>Your contact information, including address, telephone number, and email</li>
                <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner</li>
                <li>A statement that the information in the notification is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Please send DMCA notices to: <a href="mailto:dmca@chesstrive.com" className="text-blue-600 hover:underline">dmca@chesstrive.com</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Counter-Notification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you believe that your content was removed in error, you may submit a counter-notification. Your counter-notification must include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Your physical or electronic signature</li>
                <li>Identification of the material that has been removed and its location before removal</li>
                <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
                <li>Your name, address, and telephone number</li>
                <li>Consent to the jurisdiction of the federal court in your district</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Repeat Infringers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ChessStrive will terminate, in appropriate circumstances, the accounts of users who are repeat infringers of intellectual property rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For copyright-related inquiries, please contact our Copyright Agent at <a href="mailto:dmca@chesstrive.com" className="text-blue-600 hover:underline">dmca@chesstrive.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMCAPolicyPage;

