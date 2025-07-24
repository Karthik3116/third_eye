import { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function FeedbackForm({ onClose }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg w-80 max-w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Send Feedback</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <textarea
        rows={3}
        className="w-full p-2 border rounded-md mb-3"
        placeholder="What do you think of the app?"
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {submitting ? 'Sending...' : 'Submit'}
      </button>
    </div>
  );
}
