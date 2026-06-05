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

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter attachments
  const todaysFiles = state.files.filter(f => f.date === selectedDate);
  const allFiles = state.files;

  // Handles manual local base64 compression file generation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject files larger than 1MB to avoid raw local storage quota crash
    if (file.size > 1024 * 1024) {
      setAlertMessage("File exceeds 1MB. Local state database constraints require files to be smaller than 1MB to guarantee responsive local cache speed.");
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

    // If it's an image, let's downsafe compress it using Canvas to stay under 60KB!
    if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 300; // tiny thumbnail image scale
          const scale = max_width / img.width;
          canvas.width = max_width;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg
            
            // Check compressed size
            const compSize = Math.round(compressedBase64.length * 0.75);
            commitFileToState(file.name, compSize, 'image/jpeg', compressedBase64);
          }
        };
      };
      reader.readAsDataURL(file);
    } else {
      // For any PDF/Text file, store dummy base64 template to prevent storage corruption, represent with beautiful vector shapes!
      reader.onload = () => {
        commitFileToState(file.name, file.size, file.type, "pdf-representation-token");
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
          className="relative min-h-[160px] border-2 border-dashed border-gray-200.5 hover:border-teal-500 rounded-2xl p-5 flex flex-col justify-center items-center text-center cursor-pointer bg-gray-50/20 hover:bg-teal-50/10 transition-all group"
          id="dropzone-area"
        >
          <UploadCloud className="w-10 h-10 text-gray-300 group-hover:text-teal-600 transition-colors" />
          <h4 className="text-xs font-bold text-gray-700 mt-3 group-hover:text-teal-700">Click to Select Daily File attachment</h4>
          <p className="text-[10px] text-gray-400 mt-1">Image or Document smaller than 1MB</p>
          <p className="text-[9px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md font-mono mt-3">Date: {selectedDate}</p>

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/plain"
            className="hidden" 
          />
        </div>

        {selectedFileMeta && (
          <div className="p-3 bg-teal-50/40 border border-teal-100 rounded-xl space-y-2">
            <div className="text-xs text-teal-800 font-bold">Compressing & uploading:</div>
            <div className="text-[10px] text-gray-600 font-mono truncate">{selectedFileMeta.name}</div>
            <div className="text-[9px] text-gray-400">Formatted size: {formatSize(selectedFileMeta.size)}</div>
          </div>
        )}

        <div className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl text-gray-500 leading-relaxed font-sans mt-2" id="attachment-tips">
          <strong className="text-slate-700 font-bold">💡 Local storage tips:</strong> Any image attachment logged here is auto-downscaled and compressed using HTML5 Canvasses. This reduces LocalStorage pressure, keeping cycles lightweight and crash-proof.
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
          <span className="text-[10px] bg-teal-50 text-teal-600 font-extrabold px-2 py-0.5 rounded-full font-mono">
            {todaysFiles.length} files
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1" id="files-cards-grid">
          {todaysFiles.length > 0 ? (
            todaysFiles.map((file) => {
              const isImage = file.type.startsWith('image/') && file.dataUrl !== 'pdf-representation-token';
              return (
                <div 
                  key={file.id} 
                  className="bg-gray-55/10 border border-gray-100 hover:border-gray-200.5 rounded-xl p-3 flex flex-col justify-between space-y-3 relative group"
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
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 shrink-0 flex items-center justify-center border">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0" id="file-names-holder text-left">
                      <div className="text-xs font-bold text-gray-800 truncate text-left" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mt-0.5 text-left">
                        {formatSize(file.size)} · {file.date}
                      </div>
                    </div>
                  </div>

                  {/* Actions toolbars row */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50/50">
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>

                    {isImage && (
                      <button
                        onClick={() => {
                          setActivePreviewUrl(file.dataUrl);
                          setActivePreviewName(file.name);
                        }}
                        className="p-1 px-2 bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-20 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-200">
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
              className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-3 z-50 cursor-pointer"
              id="lightbox-overlay"
            >
              <div className="relative max-w-lg w-full bg-white rounded-2xl p-4 cursor-default space-y-3" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 truncate">{activePreviewName}</span>
                  <button 
                    onClick={() => setActivePreviewUrl(null)}
                    className="text-xs text-gray-400 hover:text-gray-800 font-bold"
                  >
                    Close
                  </button>
                </div>
                <div className="w-full h-auto max-h-[300px] overflow-hidden rounded-xl border bg-gray-50 flex items-center justify-center">
                  <img 
                    src={activePreviewUrl} 
                    alt={activePreviewName}
                    className="max-h-[300px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
