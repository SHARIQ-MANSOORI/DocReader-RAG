import React, { useState } from 'react';
import { useAuth } from './lib/authContext.jsx';
import Navbar from './components/Navbar.jsx';
import Auth from './components/Auth.jsx';
import FileUpload from './components/FileUpload.jsx';
import Chat from './components/Chat.jsx';

export function App() {
  const { user, loading } = useAuth();
  const [activeDocument, setActiveDocument] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3"></div>
        <p className="text-xs font-medium text-slate-500">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Upload & Info (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <FileUpload onUploadSuccess={(filename) => setActiveDocument(filename)} />

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs text-slate-600 space-y-2">
            <h3 className="font-semibold text-slate-800">How It Works</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-500">
              <li>Upload a PDF document.</li>
              <li>Document is chunked and indexed into Qdrant vectors.</li>
              <li>Ask natural language questions in the chat.</li>
              <li>Gemini retrieves matching context to answer.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Interactive Chat (8 cols) */}
        <div className="lg:col-span-8">
          <Chat activeDocument={activeDocument} />
        </div>
      </main>
    </div>
  );
}

export default App;
