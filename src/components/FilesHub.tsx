/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Image, Paperclip, Trash2, Plus, Download, Eye, UploadCloud, AlertCircle, FilePlus
} from 'lucide-react';
import { TrackerState, UserFile } from '../types';

interface FilesProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function FilesHub({ state, updateState, selectedDate }: FilesProps) {
  const [fileCategory, setFileCategory] = useState<'study' | 'gym' | 'meals' | 'general'>('general');
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string, size: number, type: string } | null>(null);
  
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewName, setActivePreviewName] = useState<string>('');
  const [activePreviewType, setActivePreviewType] = useState<string>('');

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter attachments for current date
  const todaysFiles = state.files.filter(f => f.date === selectedDate);

  // Safely decodes base64 back into characters supporting international characters
  const getPlainTextFromDataUrl = (dataUrl: string): string => {
    if (!dataUrl) return '';
    if (dataUrl === 'pdf-representation-token') {
      return 'No plain-text version available. This is a default placeholder document.';
    }
    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) return 'No raw content found.';
      const base64Parts = parts[1];
      const binary = atob(base64Parts);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (err) {
      return 'Unable to render file content inline due to complex formatting or encoding.';
    }
  };

  // Check file styles and icons dynamically
  const getFileStyleMeta = (type: string, name: string) => {
    const nameLower = name.toLowerCase();
    if (type.startsWith('image/')) {
      return { icon: Image, bg: 'bg-rose-50 border-rose-100', text: 'text-rose-600', label: 'Image' };
    }
    if (type === 'application/pdf' || nameLower.endsWith('.pdf')) {
      return { icon: FileText, bg: 'bg-red-50 border-red-100', text: 'text-red-500', label: 'PDF Document' };
    }
    if (
      type.startsWith('text/') || 
      nameLower.endsWith('.txt') || 
      nameLower.endsWith('.json') || 
      nameLower.endsWith('.md') || 
      nameLower.endsWith('.csv') ||
      nameLower.endsWith('.js') ||
      nameLower.endsWith('.ts')
    ) {
      return { icon: FileText, bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600', label: 'Text File' };
    }
    return { icon: Paperclip, bg: 'bg-slate-50 border-slate-100', text: 'text-slate-600', label: 'Attachment' };
  };

  const isImageFile = (type: string, name: string) => {
    return type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
  };

  const isTextFile = (type: string, name: string) => {
    return type.startsWith('text/') || /\.(txt|json|md|csv|js|ts|css|html)$/i.test(name);
  };

  // Handles manual local base64 compression file generation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject files larger than 1.5MB to stay within safe LocalStorage quotas
    if (file.size > 1.5 * 1024 * 1024) {
      setAlertMessage("File exceeds 1.5MB. Please choose a smaller document or compress your images first to guarantee quick storage sync.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAlertMessage(null);
    setSelectedFileMeta({
      name: file.name,
      size: file.size,
      type: file.type
    });

    const reader = new FileReader();

    // If it's an image, let's downscale compress it using Canvas to maintain crispness and optimize local persistence
    if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 800; // Good resolution but safe size
          const scale = Math.min(1, max_width / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75); // 75% quality Jpeg
            const compSize = Math.round(compressedBase64.length * 0.75);
            commitFileToState(file.name, compSize, 'image/jpeg', compressedBase64);
          }
        };
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF, text, and other documents, store actual base64 URL so user can read/download it!
      reader.onload = (event) => {
        const base64Data = event.target?.result as string || '';
        commitFileToState(file.name, file.size, file.type, base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const commitFileToState = (name: string, size: number, type: string, dataUrl: string) => {
    const newAttach: UserFile = {
      id: 'fil_' + Date.now(),
      name,
      size,
      type,
      dataUrl,
      date: selectedDate
    };

    updateState({
      ...state,
      files: [newAttach, ...state.files]
    });

    setSelectedFileMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (id: string) => {
    const remaining = state.files.filter(f => f.id !== id);
    updateState({ ...state, files: remaining });
  };

  const handleDownloadFile = (file: { name: string; dataUrl: string; type: string }) => {
    if (!file.dataUrl) return;

    // Handle Unsplash mock placeholder or remote images
    if (file.dataUrl.startsWith('http')) {
      window.open(file.dataUrl, '_blank');
      return;
    }

    if (file.dataUrl === 'pdf-representation-token') {
      alert("This is a template placeholder. Upload your own documents to download them successfully.");
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Opening in browser window as backup download route...");
      window.open(file.dataUrl, '_blank');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="files-hub-view">
      
      {/* Left Column: Attachment Uploader form (Cols: 5) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="upload-files-panel">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-teal-600" /> Storage Attachment Hub
          </h2>
          <p className="text-xs text-gray-400">Bind key study sheets, routine photos or screenshots to any selected calendar date</p>
        </div>

        {alertMessage && (
          <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex gap-2 items-start border border-rose-100" id="file-warning">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p>{alertMessage}</p>
          </div>
        )}

        {/* Drag and drop panel layout */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative min-h-[160px] border-2 border-dashed border-gray-200.5 hover:border-teal-500 rounded-2xl p-5 flex flex-col justify-center items-center text-center cursor-pointer bg-gray-50/20 hover:bg-teal-50/10 transition-all group animate-[fadeIn_0.2s_ease-out]"
          id="dropzone-area"
        >
          <UploadCloud className="w-10 h-10 text-gray-300 group-hover:text-teal-600 transition-colors" />
          <h4 className="text-sm font-bold text-gray-700 mt-3 group-hover:text-teal-700">Click to Select Daily File attachment</h4>
          <p className="text-xs text-gray-400 mt-1">Image, PDF or Text Document up to 1.5MB</p>
          <p className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md font-mono mt-3 font-semibold">Target date: {selectedDate}</p>

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/*,application/json"
            className="hidden" 
          />
        </div>

        {selectedFileMeta && (
          <div className="p-3 bg-teal-50/40 border border-teal-100 rounded-xl space-y-1">
            <div className="text-xs text-teal-800 font-bold">Compressing & storing in local archive:</div>
            <div className="text-xs text-gray-600 font-mono truncate">{selectedFileMeta.name}</div>
            <div className="text-[10px] text-gray-400">Total Size: {formatSize(selectedFileMeta.size)}</div>
          </div>
        )}

        <div className="text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl text-gray-500 leading-relaxed font-sans mt-2" id="attachment-tips">
          <strong className="text-slate-700 font-bold">💡 Infinite Files View:</strong> All assets are loaded natively in Base64 encoding. You can **Preview them directly** or click **Download / Save** to safely retrieve the exact files locally anytime.
        </div>
      </div>

      {/* Right Column: Files listing (Cols: 7) */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="view-files-list">
        
        {/* Toggle all vs today files tab */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Attached File Archives</h3>
            <p className="text-[11px] text-gray-400">Attachments bound specifically to {selectedDate}</p>
          </div>
          <span className="text-xs bg-teal-50 text-teal-600 font-extrabold px-3 py-1 rounded-full font-mono">
            {todaysFiles.length} files
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1" id="files-cards-grid">
          {todaysFiles.length > 0 ? (
            todaysFiles.map((file) => {
              const fileMeta = getFileStyleMeta(file.type, file.name);
              const isImage = isImageFile(file.type, file.name);
              const IconComponent = fileMeta.icon;

              return (
                <div 
                  key={file.id} 
                  className="bg-gray-50/30 hover:bg-gray-50/80 border border-gray-100 hover:border-gray-250 rounded-xl p-3 flex flex-col justify-between space-y-3 relative group transition-all"
                  id={`attach-${file.id}`}
                >
                  <div className="flex gap-2.5 items-start">
                    {/* Visual Thumb representation */}
                    {isImage ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border bg-gray-50 flex items-center justify-center">
                        <img 
                          src={file.dataUrl} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-lg ${fileMeta.bg} ${fileMeta.text} shrink-0 flex items-center justify-center border`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0" id="file-names-holder">
                      <div className="text-xs font-bold text-gray-800 truncate text-left" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium font-mono mt-0.5 text-left">
                        {formatSize(file.size)} · {fileMeta.label}
                      </div>
                    </div>
                  </div>

                  {/* Actions toolbars row */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1 px-2 border border-blue-200 bg-blue-50/30 hover:bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Save
                      </button>

                      <button
                        onClick={() => {
                          setActivePreviewUrl(file.dataUrl);
                          setActivePreviewName(file.name);
                          setActivePreviewType(file.type);
                        }}
                        className="p-1 px-2 bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-20 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-100">
              No daily file attachment logged. Use the uploader pane!
            </div>
          )}
        </div>

        {/* Lightbox popup screen block */}
        <AnimatePresence>
          {activePreviewUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreviewUrl(null)}
              className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-50 cursor-pointer"
              id="lightbox-overlay"
            >
              <div className="relative max-w-2xl w-full bg-white rounded-3xl p-5 cursor-default space-y-4 shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="min-w-0 pr-4">
                    <span className="text-xs font-bold text-gray-800 block truncate" title={activePreviewName}>
                      {activePreviewName}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">
                      Format: {activePreviewType || 'unknown/binary'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleDownloadFile({ name: activePreviewName, dataUrl: activePreviewUrl, type: activePreviewType })}
                      className="p-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Save File
                    </button>
                    <button 
                      onClick={() => setActivePreviewUrl(null)}
                      className="p-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="w-full h-auto max-h-[400px] overflow-hidden rounded-2xl border bg-gray-50 flex items-center justify-center">
                  {isImageFile(activePreviewType, activePreviewName) ? (
                    <img 
                      src={activePreviewUrl} 
                      alt={activePreviewName}
                      className="max-h-[400px] object-contain w-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : isTextFile(activePreviewType, activePreviewName) ? (
                    <div className="w-full text-left p-4 overflow-auto max-h-[400px] bg-slate-900 text-slate-150 rounded-2xl font-mono text-xs whitespace-pre-wrap leading-relaxed select-text">
                      {getPlainTextFromDataUrl(activePreviewUrl)}
                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 w-full">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border shadow-xs animate-bounce">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="text-sm font-bold text-gray-800">Inline Media Preview Unavailable</div>
                      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                        This is a formatted document (such as a PDF or spreadsheet). Click the green <strong className="text-teal-600">"Save File"</strong> button in the top right to download or review it natively.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
