/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Document View Modal (צפייה בפרטי חומר הלימוד)
 */

import React from 'react';
import { X, FileText, Calendar, Trash2, Sparkles, BookOpen, Clock, MessageSquare } from 'lucide-react';
import type { Document } from '../types';

interface DocumentViewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (docId: string) => Promise<void>;
  onStartChat?: (document: Document) => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  document: docItem,
  isOpen,
  onClose,
  onDelete,
  onStartChat,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !docItem) return null;

  const formattedDate = new Date(docItem.created_at).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const wordCount = docItem.raw_text.split(/\s+/).filter(Boolean).length;

  const handleDelete = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק חומר לימוד זה?')) {
      setIsDeleting(true);
      try {
        await onDelete(docItem.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl border border-slate-200 shadow-2xl overflow-hidden text-right flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{docItem.title}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span>{wordCount} מילים</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200/80 text-sm sm:text-base leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
            {docItem.raw_text}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'מוחק...' : 'מחק חומר'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onStartChat && (
              <button
                onClick={() => {
                  onClose();
                  onStartChat(docItem);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>למד עם חברותא</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
