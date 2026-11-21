import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs md:text-sm text-amber-800 flex items-center justify-between">
      <div className="flex items-center space-x-2 mx-auto">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <strong>Medical Disclaimer:</strong> Meditrace is a tracking and management aid and does not replace professional medical advice, diagnosis, or treatment. Always consult your physician.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-900 ml-2"
        aria-label="Dismiss disclaimer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
