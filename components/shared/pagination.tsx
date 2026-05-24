"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 w-full">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className="min-w-[44px] min-h-[44px] rounded-xl border border-glass bg-glass hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Pages Info Indicator */}
      <span className="text-sm font-semibold tracking-wider text-gray-400 px-4 min-h-[44px] flex items-center bg-glass border border-glass rounded-xl">
        Page <span className="text-white mx-1.5">{currentPage}</span> of{" "}
        <span className="text-white ml-1.5">{totalPages}</span>
      </span>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        className="min-w-[44px] min-h-[44px] rounded-xl border border-glass bg-glass hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed"
        aria-label="Next Page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
