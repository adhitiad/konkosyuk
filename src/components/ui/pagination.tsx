"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <span aria-hidden="true">&laquo;</span>
      </Button>
      <span className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span aria-hidden="true">&raquo;</span>
      </Button>
    </nav>
  )
}

export { Pagination }
