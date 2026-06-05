/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Plus, Trash2, Edit3, ArrowRight, HelpCircle, 
  Layers, CheckCircle, Clock, CalendarDays, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';
import { TrackerState, SubjectItem, StudySession, Flashcard, StudyDeadline } from '../types';

interface StudyHubProps {
  state: TrackerState;
  updateState: (newState: TrackerState) => void;
  selectedDate: string;
}

export default function StudyHub({ state, updateState, selectedDate }: StudyHubProps) {
  // Tabs within Study Hub
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'subjects' | 'flashcards' | 'deadlines'>('sessions');

  // Selected subject for notes edit or session additions
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(state.subjects[0]?.id || '');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#3B82F6');
  const [newSubjectCategory, setNewSubjectCategory] = useState('Computer Science');

  // Study log form
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);
  const [sessionNotes, setSessionNotes] = useState('');

  // Flashcards
  const [flashQuestion, setFlashQuestion] = useState('');
  const [flashAnswer, setFlashAnswer] = useState('');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Deadlines
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDueDate, setDeadlineDueDate] = useState('');

  // Editing state for subjects
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectColor, setEditSubjectColor] = useState('#3B82F6');
  const [editSubjectCategory, setEditSubjectCategory] = useState('');

  // Editing state for flashcards
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFlashQuestion, setEditFlashQuestion] = useState('');
  const [editFlashAnswer, setEditFlashAnswer] = useState('');

  const startEditingFlashcard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setEditFlashQuestion(card.question);
    setEditFlashAnswer(card.answer);
  };

  const saveFlashcardEdit = (id: string) => {
    if (!editFlashQuestion.trim() || !editFlashAnswer.trim()) return;
    const updated = state.flashcards.map(c => {
      if (c.id === id) {
        return { ...c, question: editFlashQuestion, answer: editFlashAnswer };
      }
      return c;
    });
    updateState({ ...state, flashcards: updated });
    setEditingCardId(null);
  };

  const startEditingSubject = (item: SubjectItem) => {
    setEditingSubjectId(item.id);
    setEditSubjectName(item.name);
    setEditSubjectColor(item.color);
    setEditSubjectCategory(item.category || '');
  };

  const saveSubjectEdit = (id: string) => {
    if (!editSubjectName.trim()) return;
    const updated = state.subjects.map(s => {
      if (s.id === id) {
        return {
          ...s,
          name: editSubjectName,
          color: editSubjectColor,
          category: editSubjectCategory
        };
      }
      return s;
    });
    updateState({ ...state, subjects: updated });
    setEditingSubjectId(null);
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#6366F1', '#06B6D4'
  ];

  // Current sub-selected Subject
  const curSubject = state.subjects.find(s => s.id === selectedSubjectId) || state.subjects[0];

  // Handlers for SUBJECTS
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSub: SubjectItem = {
      id: 'sub_' + Date.now(),
      name: newSubjectName,
      color: newSubjectColor,
      notes: 'Initial course notes. Click edit to compile formulas, links, or definitions here.',
      category: newSubjectCategory
    };

    const nextSubjects = [...state.subjects, newSub];
    updateState({ ...state, subjects: nextSubjects });
    
    setSelectedSubjectId(newSub.id);
    setNewSubjectName('');
  };

  const handleDeleteSubject = (id: string) => {
    const nextSubjects = state.subjects.filter(s => s.id !== id);
    const remainingSessions = state.studySessions.filter(s => s.subjectId !== id);
    const remainingCards = state.flashcards.filter(c => c.subjectId !== id);
    const remainingDeadlines = state.deadlines.filter(d => d.subjectId !== id);

    // If we are deleting the currently selected subject, pick a new one first
    if (selectedSubjectId === id && nextSubjects.length > 0) {
      setSelectedSubjectId(nextSubjects[0].id);
    }

    updateState({
      ...state,
      subjects: nextSubjects,
      studySessions: remainingSessions,
      flashcards: remainingCards,
      deadlines: remainingDeadlines
    });
  };

  const handleUpdateSubjectNotes = (notes: string) => {
    const updated = state.subjects.map(s => {
      if (s.id === selectedSubjectId) {
        return { ...s, notes };
      }
      return s;
    });
    updateState({ ...state, subjects: updated });
  };

  // Handlers for STUDY SESSIONS
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;

    const newSession: StudySession = {
      id: 'ses_' + Date.now(),
      subjectId: selectedSubjectId,
      date: selectedDate,
      durationMinutes: Number(sessionDurationMinutes),
      notes: sessionNotes
    };

    updateState({
      ...state,
      studySessions: [...state.studySessions, newSession]
    });

    setSessionNotes('');
  };

  const handleDeleteSession = (id: string) => {
    const remaining = state.studySessions.filter(s => s.id !== id);
    updateState({ ...state, studySessions: remaining });
  };

  // Handlers for FLASHCARDS
  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !flashQuestion.trim() || !flashAnswer.trim()) return;

    const newCard: Flashcard = {
      id: 'crd_' + Date.now(),
      subjectId: selectedSubjectId,
      question: flashQuestion,
      answer: flashAnswer
    };

    updateState({
      ...state,
      flashcards: [...state.flashcards, newCard]
    });

    setFlashQuestion('');
    setFlashAnswer('');
  };

  const handleDeleteFlashcard = (id: string) => {
    const remaining = state.flashcards.filter(c => c.id !== id);
    updateState({ ...state, flashcards: remaining });
    if (activeCardIndex >= remaining.length && remaining.length > 0) {
      setActiveCardIndex(remaining.length - 1);
    }
  };

  // Handlers for DEADLINES
  const handleAddDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !deadlineTitle.trim() || !deadlineDueDate) return;

    const newDeadline: StudyDeadline = {
      id: 'dl_' + Date.now(),
      subjectId: selectedSubjectId,
      title: deadlineTitle,
      dueDate: deadlineDueDate,
      completed: false
    };

    updateState({
      ...state,
      deadlines: [...state.deadlines, newDeadline]
    });

    setDeadlineTitle('');
    setDeadlineDueDate('');
  };

  const toggleDeadlineStatus = (dlId: string) => {
    const updated = state.deadlines.map(d => {
      if (d.id === dlId) {
        return { ...d, completed: !d.completed };
      }
      return d;
    });
    updateState({ ...state, deadlines: updated });
  };

  const handleDeleteDeadline = (dlId: string) => {
    const remaining = state.deadlines.filter(d => d.id !== dlId);
    updateState({ ...state, deadlines: remaining });
  };

  // Get lists filtering for current subject context
  const subjectSessions = state.studySessions.filter(s => s.subjectId === selectedSubjectId);
  const subjectCards = state.flashcards.filter(c => c.subjectId === selectedSubjectId);
  const subjectDeadlines = state.deadlines.filter(d => d.subjectId === selectedSubjectId);

  // Time calculations for active subject
  const totalSubjectHours = (subjectSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="study-hub-main-container">

      {/* Left Column: Subject Browser (Cols: 4) */}
      <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="subject-selector-panel">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase font-mono tracking-wider">Subjects & Courses</h2>
          <p className="text-xs text-gray-400">Select, create and manage your study tracks</p>
        </div>

        {/* Subjects list */}
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 flex-1" id="subjects-list-scroll">
          {state.subjects.map((item) => {
            const isSelected = item.id === selectedSubjectId;
            const isEditing = editingSubjectId === item.id;

            if (isEditing) {
              return (
                <div 
                  key={item.id}
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 rounded-xl border border-teal-500 bg-teal-50/10 space-y-2 text-left"
                  id={`subject-item-edit-${item.id}`}
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase font-mono">Track Name</label>
                    <input 
                      type="text"
                      value={editSubjectName}
                      onChange={e => setEditSubjectName(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-250 rounded-md text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase font-mono">Category</label>
                    <input 
                      type="text"
                      value={editSubjectCategory}
                      onChange={e => setEditSubjectCategory(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-250 rounded-md text-xs focus:ring-1 focus:ring-teal-500"
                      placeholder="Computer Science, Maths..."
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex gap-1">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditSubjectColor(c)}
                          className={`w-4 h-4 rounded-full border transition ${editSubjectColor === c ? 'scale-125 ring-1 ring-teal-500' : 'opacity-85'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={() => setEditingSubjectId(null)}
                        className="px-2 py-0.5 text-[9px] font-bold text-gray-500 bg-white border border-gray-200.5 rounded-md"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => saveSubjectEdit(item.id)}
                        className="px-2 py-0.5 text-[9px] font-black bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={item.id}
                onClick={() => {
                  setSelectedSubjectId(item.id);
                  setActiveCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-50/40 border-teal-500/30 font-semibold' 
                    : 'border-transparent hover:bg-gray-50 text-gray-600'
                }`}
                id={`subject-item-${item.id}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                  <div className="text-left">
                    <div className="text-xs text-gray-800 font-bold">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono tracking-wider">{item.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      startEditingSubject(item);
                    }}
                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent rounded-md transition-all cursor-pointer"
                    title={`Edit track: ${item.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {state.subjects.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteSubject(item.id);
                      }}
                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-md transition-all cursor-pointer"
                      title={`Delete track: ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Add Subject */}
        <form onSubmit={handleAddSubject} className="border-t border-gray-100 pt-3 space-y-2" id="add-subject-form">
          <div className="text-xs font-bold text-gray-600">Add Study Track</div>
          <input 
            type="text" 
            placeholder="Course Name..." 
            value={newSubjectName}
            onChange={e => setNewSubjectName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
          />
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1 max-w-[150px]">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewSubjectColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${newSubjectColor === c ? 'scale-120 ring-1 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            
            <select
              value={newSubjectCategory}
              onChange={e => setNewSubjectCategory(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-500"
            >
              <option value="Computer Science">Computer Sci</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Humanities">Humanities</option>
              <option value="Languages">Languages</option>
              <option value="Research">Research</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Course
          </button>
        </form>
      </div>

      {/* Right Column: Focus and Hub Stats & Deck (Cols: 8) */}
      <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col space-y-4" id="course-details-panel">
        
        {/* Course Core Panel Header */}
        {curSubject ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: curSubject.color }} />
                <h1 className="text-lg font-extrabold text-gray-800">{curSubject.name}</h1>
              </div>
              <p className="text-xs text-gray-400">Total Study Time: <strong className="text-gray-700 font-bold">{totalSubjectHours} hours</strong> logged total</p>
            </div>

            {/* Hub tabs selector */}
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100.5 self-stretch sm:self-auto scrollbar-none overflow-x-auto text-nowrap" id="subtab-selector">
              {(['sessions', 'subjects', 'flashcards', 'deadlines'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeSubTab === tab 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 italic text-xs">
            Create or select a study track to start logs!
          </div>
        )}

        {/* Tab Specific Content */}
        {curSubject && (
          <div className="flex-1" id="study-panel-tab-body">
            
            {/* SUB TAB: LOGS / SESSIONS */}
            {activeSubTab === 'sessions' && (
              <div className="space-y-4" id="study-sessions-tab">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logger Form */}
                  <form onSubmit={handleAddSession} className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Log Study Session</h3>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Session Date</label>
                      <input 
                        type="text" 
                        disabled 
                        value={selectedDate}
                        className="w-full px-3 py-1.5 bg-gray-100/50 border border-gray-200 rounded-lg text-xs text-gray-500 focus:outline-hidden cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Duration (Minutes)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max="480"
                          value={sessionDurationMinutes}
                          onChange={e => setSessionDurationMinutes(Number(e.target.value))}
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                        />
                        <span className="text-xs text-gray-400 px-1 font-semibold">min</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Study Notes / Learnings</label>
                      <textarea
                        rows={2}
                        placeholder="What specific concepts, theories or algorithms did you practice?"
                        value={sessionNotes}
                        onChange={e => setSessionNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs"
                    >
                      Log {sessionDurationMinutes} mins to Day Target
                    </button>
                  </form>

                  {/* Sessions logs feed */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">History for Course</h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {subjectSessions.length > 0 ? (
                        subjectSessions.map(sec => (
                          <div key={sec.id} className="p-3 bg-white border border-gray-100 rounded-xl group hover:border-gray-200 flex justify-between items-start">
                            <div>
                              <div className="text-xs text-gray-800 font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" /> {sec.durationMinutes} minutes
                                <span className="text-[10px] text-gray-400 font-mono tracking-wider">({sec.date})</span>
                              </div>
                              {sec.notes && <p className="text-[10px] text-gray-500 mt-1 pl-4.5">{sec.notes}</p>}
                            </div>
                            <button
                              onClick={() => handleDeleteSession(sec.id)}
                              className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-400 italic text-xs bg-gray-50/20 border border-dashed rounded-xl border-gray-200">
                          No logged cycles for this track yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB TAB: CORE COURSE STUDY NOTES */}
            {activeSubTab === 'subjects' && (
              <div className="space-y-3" id="study-notes-tab">
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Course Syllabus, Formulae & Key Points</h3>
                  <p className="text-[11px] text-gray-400">Keep syllabus indexes, crucial definitions, and links readily available.</p>
                </div>
                <textarea
                  rows={10}
                  value={curSubject.notes}
                  onChange={(e) => handleUpdateSubjectNotes(e.target.value)}
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono leading-relaxed focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  placeholder="Paste Markdown, lists, or custom studying links here..."
                />
                <div className="text-right text-[10px] text-teal-600 font-semibold font-mono">
                  Changes save automatically to local cache
                </div>
              </div>
            )}

            {/* SUB TAB: ACTIVE RECALL / FLASHCARDS */}
            {activeSubTab === 'flashcards' && (
              <div className="space-y-4" id="study-flashcards-tab">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create card Form */}
                  <form onSubmit={handleAddFlashcard} className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Create Active Recall Card</h3>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Front / Question</label>
                      <input 
                        type="text" 
                        placeholder="e.g., What is dynamic binding?" 
                        value={flashQuestion}
                        onChange={e => setFlashQuestion(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Back / Answer</label>
                      <textarea
                        rows={2}
                        placeholder="Answer details..." 
                        value={flashAnswer}
                        onChange={e => setFlashAnswer(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold shadow-sm hover:shadow-md transition-all"
                    >
                      Commit Flashcard
                    </button>
                  </form>

                  {/* Active Card interactive slider */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Active Deck ({subjectCards.length} cards)</h3>
                    </div>

                    {subjectCards.length > 0 ? (
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        {/* Flip Card Sandbox */}
                        {editingCardId === subjectCards[activeCardIndex].id ? (
                          <div className="min-h-[140px] border border-indigo-300 bg-indigo-50/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 text-left">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-500 uppercase font-mono">Question</label>
                              <input 
                                type="text"
                                value={editFlashQuestion}
                                onChange={e => setEditFlashQuestion(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-gray-250 rounded-md text-xs focus:ring-1 focus:ring-teal-500"
                                placeholder="e.g. What is polymorphism?"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-500 uppercase font-mono">Answer</label>
                              <textarea
                                rows={2}
                                value={editFlashAnswer}
                                onChange={e => setEditFlashAnswer(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-gray-250 rounded-md text-xs focus:ring-1 focus:ring-teal-500"
                                placeholder="Answer explanation..."
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1 border-t border-indigo-100/50">
                              <button 
                                type="button"
                                onClick={() => setEditingCardId(null)}
                                className="px-2 py-0.5 text-[9px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button 
                                type="button"
                                onClick={() => saveFlashcardEdit(subjectCards[activeCardIndex].id)}
                                className="px-2 py-0.5 text-[9px] font-black bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
                              >
                                Save Card
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setIsFlipped(!isFlipped)}
                            className={`min-h-[140px] border rounded-2xl p-5 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 transform ${
                              isFlipped 
                                ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400 rotate-y-180' 
                                : 'bg-white border-blue-100 shadow-2xs hover:border-blue-300'
                            }`}
                          >
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${isFlipped ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {isFlipped ? 'Answer Key' : 'Reveal Question'}
                            </span>
                            
                            <p className={`text-xs mt-3 ${isFlipped ? 'text-gray-700 font-sans' : 'text-gray-800 font-bold font-sans'}`}>
                              {isFlipped ? subjectCards[activeCardIndex].answer : subjectCards[activeCardIndex].question}
                            </p>

                            <div className="text-[9px] text-gray-400 italic mt-4">
                              Tap card to flip details
                            </div>
                          </div>
                        )}

                        {/* Card Slidewipe Controls */}
                        <div className="flex justify-between items-center bg-gray-50 py-1.5 px-3 rounded-xl border border-gray-100">
                          <button
                            disabled={activeCardIndex === 0}
                            onClick={() => {
                              setActiveCardIndex(prev => Math.max(0, prev - 1));
                              setIsFlipped(false);
                            }}
                            className="p-1 px-2.5 text-xs text-gray-600 font-bold bg-white border border-gray-200.5 hover:bg-gray-50 rounded-lg disabled:opacity-40"
                          >
                            Prev
                          </button>
                          
                          <div className="text-[10px] text-gray-500 font-mono">
                            {activeCardIndex + 1} / {subjectCards.length}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingFlashcard(subjectCards[activeCardIndex])}
                              className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                              title="Edit current card"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFlashcard(subjectCards[activeCardIndex].id)}
                              className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                              title="Delete current card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            disabled={activeCardIndex === subjectCards.length - 1}
                            onClick={() => {
                              setActiveCardIndex(prev => Math.min(subjectCards.length - 1, prev + 1));
                              setIsFlipped(false);
                            }}
                            className="p-1 px-2.5 text-xs text-gray-600 font-bold bg-white border border-gray-200.5 hover:bg-gray-50 rounded-lg disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50/30 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 italic min-h-[140px]">
                        Add cards on the left to start revising!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB TAB: DEADLINES & TARGETS */}
            {activeSubTab === 'deadlines' && (
              <div className="space-y-4" id="study-deadlines-tab">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create deadline form */}
                  <form onSubmit={handleAddDeadline} className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Track Assignment / Deadline</h3>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Goal / Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Submit Thesis Proposal Draft" 
                        value={deadlineTitle}
                        onChange={e => setDeadlineTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-mono font-bold">Due Date</label>
                      <input 
                        type="date" 
                        value={deadlineDueDate}
                        onChange={e => setDeadlineDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold shadow-xs"
                    >
                      Pin Deadline
                    </button>
                  </form>

                  {/* Deadlines list */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase font-mono tracking-wider">Course Deadlines & Exams</h3>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {subjectDeadlines.length > 0 ? (
                        subjectDeadlines.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(dl => {
                          const isOverdue = dl.dueDate < selectedDate && !dl.completed;
                          return (
                            <div 
                              key={dl.id} 
                              className={`p-3 rounded-xl border flex justify-between items-center group transition-all text-xs ${
                                dl.completed 
                                  ? 'bg-gray-50 border-gray-100 text-gray-400' 
                                  : isOverdue 
                                    ? 'bg-rose-50/50 border-rose-200 text-rose-800' 
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input 
                                  type="checkbox"
                                  checked={dl.completed}
                                  onChange={() => toggleDeadlineStatus(dl.id)}
                                  className="w-4 h-4 rounded-sm border-gray-300 text-teal-600 cursor-pointer"
                                />
                                <div>
                                  <div className={`font-bold ${dl.completed ? 'line-through' : ''}`}>{dl.title}</div>
                                  <div className="text-[9px] text-gray-400 font-semibold font-mono mt-0.5">
                                    Due: {dl.dueDate} {isOverdue && '⚠️ Overdue'}
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleDeleteDeadline(dl.id)}
                                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 text-gray-400 italic text-xs border border-dashed rounded-xl border-gray-200 bg-gray-50/10">
                          All clear! No impending deadlines.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
