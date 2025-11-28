import React from 'react';
import { CheckCircle, Mail } from 'lucide-react';

export default function EmailVerificationModal({ email, onClose, onResend }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-green-600" size={32} />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email!
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            We've sent a verification link to:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="font-medium text-gray-900">{email}</p>
          </div>

          <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-800 space-y-1 ml-4">
              <li>1. Check your inbox (and spam folder)</li>
              <li>2. Click the "Verify Email" button</li>
              <li>3. You'll be logged in automatically</li>
              <li>4. Start creating content!</li>
            </ol>
          </div>

          {/* Resend */}
          <div className="text-sm text-gray-600 mb-6">
            Didn't receive the email?{' '}
            <button
              onClick={onResend}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Resend verification email
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
