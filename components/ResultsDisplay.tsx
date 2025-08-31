import React from 'react';
import type { OrganizedEmailGroup, SortOrder } from '../types';
import EmailGroup from './EmailGroup';
import { InboxIcon, AlertIcon } from './Icons';

interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  data: OrganizedEmailGroup[] | null;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                </div>
            </div>
        ))}
    </div>
);

const SortControls: React.FC<{ sortOrder: SortOrder; setSortOrder: (order: SortOrder) => void; }> = ({ sortOrder, setSortOrder }) => (
    <div className="flex items-center space-x-2 md:space-x-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
        <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button 
                onClick={() => setSortOrder('newest')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-all duration-200 ${sortOrder === 'newest' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                aria-pressed={sortOrder === 'newest'}
            >
                Newest
            </button>
            <button 
                onClick={() => setSortOrder('oldest')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-all duration-200 ${sortOrder === 'oldest' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/50'}`}
                aria-pressed={sortOrder === 'oldest'}
            >
                Oldest
            </button>
        </div>
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, data, sortOrder, setSortOrder }) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
        <AlertIcon className="w-12 h-12 mb-4"/>
        <p className="text-lg font-semibold">An Error Occurred</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <InboxIcon className="w-16 h-16 mb-4"/>
        <h3 className="text-xl font-semibold">Your organized emails will appear here.</h3>
        <p>Paste your content above and click "Organize Emails" to start.</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <InboxIcon className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold">No emails found.</h3>
            <p>The AI couldn't find any valid emails in the provided content.</p>
        </div>
    );
  }


  return (
    <div className="space-y-4">
       <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Organized Emails</h2>
        {data.length > 0 && (
             <SortControls sortOrder={sortOrder} setSortOrder={setSortOrder} />
        )}
      </div>
      {data.map((group, index) => (
        <EmailGroup key={`${group.senderEmail}-${index}`} group={group} />
      ))}
    </div>
  );
};

export default ResultsDisplay;