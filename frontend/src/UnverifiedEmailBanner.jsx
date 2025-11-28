import React from 'react';
import { AlertCircle, Mail } from 'lucide-react';

export default function UnverifiedEmailBanner({ email, onResend }) {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Please verify your email to start creating content
              </p>
              <p className="text-xs text-yellow-800">
                We sent a verification link to <strong>{email}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onResend}
            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition"
          >
            <Mail size={16} />
            Resend Email
          </button>
        </div>
      </div>
    </div>
  );
}
