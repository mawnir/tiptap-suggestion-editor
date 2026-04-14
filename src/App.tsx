/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TiptapEditor } from './components/Editor/TiptapEditor';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            AI Suggestion Editor
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A powerful writing assistant that tracks changes like Google Docs. 
            Select text and click "Improve with AI" to see suggestions.
          </p>
        </div>

        <TiptapEditor />

        <div className="max-w-3xl mx-auto bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">How it works</h3>
          <ul className="text-sm text-indigo-800 space-y-2 list-disc list-inside">
            <li><strong>Selection:</strong> Highlight any text you want to improve.</li>
            <li><strong>AI Magic:</strong> Click the "Improve with AI" button in the bubble menu.</li>
            <li><strong>Suggestions:</strong> AI changes appear as green (additions) or red (deletions).</li>
            <li><strong>Review:</strong> Click on a suggestion to Accept or Reject it.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
