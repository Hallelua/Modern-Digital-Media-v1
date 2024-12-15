import React from 'react';
import { Loader } from 'lucide-react';

interface MediaProgressProps {
  progress: number;
  status: string;
}

const MediaProgress = ({ progress, status }: MediaProgressProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-3">
        <Loader className="animate-spin h-5 w-5 text-indigo-600" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">{status}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaProgress;