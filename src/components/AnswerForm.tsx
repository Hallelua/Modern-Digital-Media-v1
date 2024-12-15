import React, { useState } from 'react';
import { compareAnswers } from '../lib/tensorflow';

interface AnswerFormProps {
  postId: string;
  correctAnswer: string;
  onCorrectAnswer: () => void;
}

const AnswerForm = ({ postId, correctAnswer, onCorrectAnswer }: AnswerFormProps) => {
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isCorrect = await compareAnswers(answer, correctAnswer);
      
      if (isCorrect) {
        setFeedback('Correct answer! You can now upload media.');
        onCorrectAnswer();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 2) {
          setFeedback(`The correct answer is: ${correctAnswer}`);
        } else {
          setFeedback('The answer is not correct. Find the best answer.');
        }
      }
    } catch (error) {
      setFeedback('Error validating answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
          Your Answer
        </label>
        <textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
          required
        />
      </div>
      
      {feedback && (
        <p className={`text-sm ${feedback.includes('Correct') ? 'text-green-600' : 'text-red-600'}`}>
          {feedback}
        </p>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Validating...' : 'Submit Answer'}
      </button>
    </form>
  );
};

export default AnswerForm;