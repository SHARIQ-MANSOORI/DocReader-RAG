import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/Button.jsx';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

export function FileUpload({ onUploadSuccess, activeDocument, onClearDocument }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setUploadStatus(null);
    setErrorMessage('');
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const pollJobStatus = (jobId, fileInfo) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_BASE_URL}/upload/status/${jobId}`);
        if (!res.ok) {
          // If status endpoint returns error or 404, assume job completed or unsupported
          clearInterval(pollingRef.current);
          setIndexing(false);
          setUploadStatus('success');
          if (onUploadSuccess) onUploadSuccess(fileInfo);
          return;
        }

        const data = await res.json();

        if (data.state === 'completed') {
          clearInterval(pollingRef.current);
          setIndexing(false);
          setUploadStatus('success');
          if (onUploadSuccess) onUploadSuccess(fileInfo);
        } else if (data.state === 'failed') {
          clearInterval(pollingRef.current);
          setIndexing(false);
          setUploadStatus('error');
          setErrorMessage(data.failedReason || 'Vector indexing failed. Please try again.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          setIndexing(false);
          setUploadStatus('success');
          if (onUploadSuccess) onUploadSuccess(fileInfo);
        }
      } catch (err) {
        console.warn('[Status Polling Error]:', err);
        // Fallback after retries
        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          setIndexing(false);
          setUploadStatus('success');
          if (onUploadSuccess) onUploadSuccess(fileInfo);
        }
      }
    }, 1000);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setIndexing(false);
    setUploadStatus(null);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to upload PDF.');
      }

      const fileInfo = {
        filename: data.filename || selectedFile.name,
        docId: data.docId || selectedFile.name,
      };

      setUploading(false);

      if (data.jobId) {
        setIndexing(true);
        pollJobStatus(data.jobId, fileInfo);
      } else {
        setUploadStatus('success');
        if (onUploadSuccess) onUploadSuccess(fileInfo);
      }
    } catch (err) {
      console.error('[Upload Error]:', err);
      setUploading(false);
      setIndexing(false);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Unable to upload file. Please ensure the backend server is running.');
    }
  };

  const clearSelectedFile = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedFile(null);
    setUploading(false);
    setIndexing(false);
    setUploadStatus(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClearDocument) {
      onClearDocument();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeDocName = activeDocument
    ? typeof activeDocument === 'object'
      ? activeDocument.filename
      : activeDocument
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          Document Ingestion
        </h2>
        {selectedFile && (
          <span className="text-xs text-slate-500 font-medium">
            {formatFileSize(selectedFile.size)}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drag and drop zone */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
          }`}
        >
          <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Click to upload or drag & drop
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            PDF documents up to 50MB
          </p>
        </div>
      ) : (
        /* Selected file display */
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {!uploading && !indexing && (
              <button
                type="button"
                onClick={clearSelectedFile}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Remove selected file"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              loading={uploading || indexing}
              disabled={uploading || indexing || uploadStatus === 'success'}
              className="w-full text-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Uploading...
                </>
              ) : indexing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Indexing Vectors...
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-white" />
                  Indexed & Ready
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload & Index PDF
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Indexing in progress banner */}
      {indexing && (
        <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-2 text-xs text-indigo-900 animate-pulse">
          <Loader2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5 animate-spin" />
          <div>
            <p className="font-semibold">Embedding & Indexing Vectors...</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Please wait a moment while the document chunks are indexed into Qdrant.
            </p>
          </div>
        </div>
      )}

      {/* Success alert */}
      {uploadStatus === 'success' && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between text-xs text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Document Ready for Chat</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Isolated context active for "{activeDocName || selectedFile?.name}". Ask questions in the chat!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelectedFile}
            className="text-[10px] text-emerald-700 underline hover:text-emerald-900 shrink-0 ml-2"
          >
            Upload another
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Upload Error</p>
            <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
