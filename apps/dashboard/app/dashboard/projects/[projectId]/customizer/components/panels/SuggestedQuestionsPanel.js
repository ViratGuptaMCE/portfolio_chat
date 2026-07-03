"use client";

import React, { useState } from "react";

export default function SuggestedQuestionsPanel({ draftConfig, onChange }) {
  const suggestedQuestions = draftConfig?.suggestedQuestions || [];
  const [newQuestionText, setNewQuestionText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    if (suggestedQuestions.length >= 6) {
      setErrorMessage("Maximum limit of 6 starter prompt chips reached.");
      return;
    }

    onChange({
      ...draftConfig,
      suggestedQuestions: [...suggestedQuestions, newQuestionText.trim()]
    });

    setNewQuestionText("");
    setErrorMessage("");
  };

  const handleRemoveQuestion = (index) => {
    const updated = suggestedQuestions.filter((_, i) => i !== index);
    onChange({
      ...draftConfig,
      suggestedQuestions: updated
    });
    setErrorMessage("");
  };

  const handleEditQuestion = (index, value) => {
    const updated = [...suggestedQuestions];
    updated[index] = value;
    onChange({
      ...draftConfig,
      suggestedQuestions: updated
    });
  };

  return (
    <div className="flex flex-col gap-6 text-xs text-black dark:text-white">
      <div className="flex flex-col gap-1">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Starter Prompt Chips (Max 6)
        </label>
        <span className="text-[11px] text-[#666] dark:text-[#aaa]">
          Quick-click suggestion chips shown to visitors at the start of a chat session.
        </span>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="hover:opacity-70">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Add New Question Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
          placeholder="e.g. 🛠️ What is your tech stack?"
          className="flex-1 bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
        />
        <button
          type="button"
          disabled={suggestedQuestions.length >= 6 || !newQuestionText.trim()}
          onClick={handleAddQuestion}
          className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-2.5 font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          Add Chip
        </button>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* List of Prompt Chips */}
      <div className="flex flex-col gap-2.5">
        <span className="font-semibold text-xs text-[#888] font-mono">
          Current Prompt Chips ({suggestedQuestions.length}/6)
        </span>

        {suggestedQuestions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#e5e5e5] dark:border-[#333] text-center text-[#888] text-xs font-mono">
            No starter prompt chips configured. Add one above to guide your visitors!
          </div>
        ) : (
          suggestedQuestions.map((qText, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="material-symbols-outlined text-base text-[#888]">
                  label
                </span>
                <input
                  type="text"
                  value={qText}
                  onChange={(e) => handleEditQuestion(idx, e.target.value)}
                  className="w-full bg-transparent font-mono text-xs outline-none text-black dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                className="text-[#888] hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
