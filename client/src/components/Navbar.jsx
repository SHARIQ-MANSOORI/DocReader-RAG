import React from 'react';
import { useAuth } from '../lib/authContext.jsx';
import { FileText, LogOut, User } from 'lucide-react';
import { Button } from './ui/Button.jsx';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-base">DocuMind</span>
          <span className="ml-2 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            RAG Assistant
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-200">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium truncate max-w-[200px]">
                {user.displayName || user.email}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-slate-600 hover:text-slate-900 border-slate-200"
              aria-label="Sign out of application"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
