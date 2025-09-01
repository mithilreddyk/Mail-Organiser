
import React, { useState, useCallback } from 'react';
import type { OrganizedEmailGroup, Email } from '../types';
import { ChevronDownIcon, ClipboardIcon, CheckIcon, CalendarIcon, TrashIcon } from './Icons';

interface EmailGroupProps {
  group: OrganizedEmailGroup;
  onDeleteEmail: (senderEmail: string, emailIndex: number) => void;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [textToCopy]);

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="Copy email summary"
        >
            {copied ? (
                <CheckIcon className="w-5 h-5 text-green-500" />
            ) : (
                <ClipboardIcon className="w-5 h-5" />
            )}
        </button>
    );
};

const EmailCard: React.FC<{ email: Email, onDelete: () => void }> = ({ email, onDelete }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <CopyButton textToCopy={`Subject: ${email.subject}\n\n${email.summary}`} />
            <button
                onClick={onDelete}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
                aria-label="Delete email"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 pr-20">{email.subject}</h4>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{email.date || 'No date found'}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{email.summary}</p>
    </div>
);

const EmailGroup: React.FC<EmailGroupProps> = ({ group, onDeleteEmail }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const emailCount = group.emails.length;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                {group.senderName ? group.senderName.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{group.senderName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{group.senderEmail}</p>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <span className="text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2.5 py-1 rounded-full">
                {emailCount} email{emailCount > 1 ? 's' : ''}
            </span>
            <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {group.emails.map((email, index) => (
                <EmailCard key={index} email={email} onDelete={() => onDeleteEmail(group.senderEmail, index)} />
            ))}
        </div>
      )}
    </div>
  );
};

export default EmailGroup;