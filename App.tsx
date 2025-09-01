import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { OrganizedEmailGroup, SortOrder, UserProfile } from './types';
import { organizeEmails } from './services/geminiService';
import { LogoIcon, SparklesIcon, SignOutIcon, AlertIcon } from './components/Icons';
import ResultsDisplay from './components/ResultsDisplay';

// Extend the Window interface for Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const signInButtonRef = useRef<HTMLDivElement>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [gsiError, setGsiError] = useState<string | null>(null);

  const [rawEmails, setRawEmails] = useState<string>('');
  const [organizedData, setOrganizedData] = useState<OrganizedEmailGroup[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const decodeJwtResponse = (token: string): UserProfile => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding JWT", e);
      throw new Error("Invalid JWT token received");
    }
  };

  const handleCredentialResponse = (response: any) => {
      const userProfile = decodeJwtResponse(response.credential);
      setUser(userProfile);
      if (signInButtonRef.current) {
          signInButtonRef.current.style.display = 'none';
      }
  };

  const handleSignOut = () => {
      setUser(null);
      setGsiError(null); // Clear any GSI errors on sign out
      if (signInButtonRef.current) {
          signInButtonRef.current.style.display = 'block';
      }
      if (window.google) {
          window.google.accounts.id.disableAutoSelect();
      }
  };

  useEffect(() => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        setConfigError("Configuration error: The Google Client ID is missing. Please ensure the GOOGLE_CLIENT_ID environment variable is set.");
        return;
    }

    const initializeGsi = () => {
      try {
        if (window.google && signInButtonRef.current) {
          window.google.accounts.id.initialize({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            callback: handleCredentialResponse
          });
          window.google.accounts.id.renderButton(
            signInButtonRef.current,
            { theme: "outline", size: "large", type: "standard", text: "signin_with" }
          );
          setGsiError(null); // Clear previous errors on success
        }
      } catch (err) {
        console.error("Google Sign-In initialization error:", err);
        setGsiError("Google Sign-In failed to initialize. Please check that your Client ID is correct and the website origin is authorized in your Google Cloud Console.");
      }
    };
    
    // The GSI script is loaded asynchronously, so we poll for its availability.
    if (window.google) {
      initializeGsi();
    } else {
      const intervalId = setInterval(() => {
        if (window.google) {
          clearInterval(intervalId);
          initializeGsi();
        }
      }, 100);
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleOrganizeClick = async () => {
    if (!rawEmails.trim()) {
      setError("Please paste some email content first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setOrganizedData(null);

    try {
      const result = await organizeEmails(rawEmails);
      setOrganizedData(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmail = (senderEmail: string, emailIndex: number) => {
    setOrganizedData(currentData => {
      if (!currentData) return null;

      const newData = currentData
        .map(group => {
          if (group.senderEmail === senderEmail) {
            // Filter out the email at the specified index
            const updatedEmails = group.emails.filter((_, index) => index !== emailIndex);
            // Return a new group object with the updated emails
            return { ...group, emails: updatedEmails };
          }
          return group;
        })
        .filter(group => group.emails.length > 0); // Filter out groups that are now empty

      return newData;
    });
  };

  const sortedData = useMemo(() => {
    if (!organizedData) return null;

    const groupsWithSortedEmails = organizedData.map(group => ({
      ...group,
      emails: [...group.emails].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        
        const validA = !isNaN(timeA);
        const validB = !isNaN(timeB);

        if (validA && validB) {
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        }
        // Place invalid dates at the end
        if (validA) return -1; // a is valid, b is not, a comes first
        if (validB) return 1;  // b is valid, a is not, b comes first
        return 0; // both invalid
      }),
    }));
    
    return [...groupsWithSortedEmails].sort((a, b) => {
      const firstEmailA = a.emails[0];
      const firstEmailB = b.emails[0];

      if (!firstEmailA && !firstEmailB) return 0;
      if (!firstEmailA) return 1; // groups with no emails go to the end
      if (!firstEmailB) return -1;

      const timeA = new Date(firstEmailA.date).getTime();
      const timeB = new Date(firstEmailB.date).getTime();

      const validA = !isNaN(timeA);
      const validB = !isNaN(timeB);

      if (validA && validB) {
          return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      }
      if (validA) return -1;
      if (validB) return 1;
      return 0;
    });
  }, [organizedData, sortOrder]);

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
        <div className="text-center text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-lg">
          <AlertIcon className="w-16 h-16 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Application Error</h1>
          <p className="text-gray-600 dark:text-gray-300">{configError}</p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Please contact the administrator to configure the required environment variables for the application to function.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-100 dark:bg-gray-900 dark:text-gray-200 transition-colors duration-300">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {!user ? (
          <div className="text-center">
            <header className="flex items-center justify-center space-x-3 mb-8">
              <LogoIcon className="w-12 h-12 text-red-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-700 dark:text-gray-200">
                AI Email Organizer
              </h1>
            </header>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-6 max-w-lg mx-auto">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Sign in with your Google account to securely organize your emails using the power of AI.
              </p>
              <div ref={signInButtonRef} className="flex justify-center"></div>
              {gsiError && (
                <div className="mt-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="font-semibold">Sign-In Error</p>
                    <p className="text-sm">{gsiError}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <LogoIcon className="w-10 h-10 text-red-500" />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-700 dark:text-gray-200">
                  AI Email Organizer
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600"/>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  aria-label="Sign out"
                >
                  <SignOutIcon className="w-5 h-5"/>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </header>
            
            <main className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
              <div>
                <label htmlFor="email-input" className="block text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Paste Email Content Below
                </label>
                <textarea
                  id="email-input"
                  value={rawEmails}
                  onChange={(e) => setRawEmails(e.target.value)}
                  placeholder="From: John Doe <john.doe@example.com>&#10;Subject: Project Update&#10;Date: Mon, 29 Jul 2024 10:00:00 -0400&#10;&#10;Hi Team,&#10;Here's the latest update on the project..."
                  className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-y text-sm leading-6"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleOrganizeClick}
                  disabled={isLoading || !rawEmails.trim()}
                  className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Organizing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Organize Emails
                    </>
                  )}
                </button>
              </div>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <ResultsDisplay 
                  isLoading={isLoading}
                  error={error}
                  data={sortedData}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  onDeleteEmail={handleDeleteEmail}
                />
              </div>
            </main>
          </>
        )}
        <footer className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Google Gemini. Your data is not stored.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;