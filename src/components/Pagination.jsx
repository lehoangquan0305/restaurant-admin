import React from 'react'
import '../styles/pagination.css'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5

  // Tính toán range trang hiển thị
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  // Trang đầu
  if (startPage > 1) {
    pages.push(
      <button key="first" onClick={() => onPageChange(1)} className="pagination-btn pagination-nav">
        «
      </button>
    )
    if (startPage > 2) {
      pages.push(
        <span key="ellipsis-start" className="pagination-ellipsis">...</span>
      )
    }
  }

  // Trang giữa
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`pagination-btn ${i === currentPage ? 'pagination-active' : ''}`}
      >
        {i}
      </button>
    )
  }

  // Trang cuối
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="ellipsis-end" className="pagination-ellipsis">...</span>
      )
    }
    pages.push(
      <button key="last" onClick={() => onPageChange(totalPages)} className="pagination-btn pagination-nav">
        »
      </button>
    )
  }

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn pagination-prev"
      >
        ← Trước
      </button>

      <div className="pagination-pages">
        {pages}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-next"
      >
        Tiếp →
      </button>
    </div>
  )
}
