'use client'

import { useState, DragEvent, useRef } from 'react'
import { UploadCloud } from 'lucide-react'
import { isValidExtension } from '../../../domain/entities/ScanType'

interface Props {
  onFilesSelected: (files: File[]) => void
  onError: (msg: string) => void
}

export default function FileDropzone({ onFilesSelected, onError }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = (files: File[]) => {
    const validFiles: File[] = []
    
    for (const file of files) {
      if (isValidExtension(file.name)) {
        validFiles.push(file)
      } else {
        onError(`Unsupported file type: ${file.name}. Allowed: .js, .ts, .py, .go, .rs`)
        return
      }
    }
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  return (
    <div
      data-testid="file-dropzone"
      className={`border-2 rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer bg-white ${
        isDragging 
          ? 'border-solid border-obsidian-green bg-teal-50 shadow-md' 
          : 'border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileInput}
        className="hidden"
        multiple
        accept=".js,.ts,.py,.go,.rs"
      />
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <UploadCloud className="w-8 h-8 text-obsidian-green" />
      </div>
      <p className="text-gray-800 font-medium mb-1">
        Drag & Drop your files here
      </p>
      <p className="text-sm text-gray-500 mb-4">
        or click to browse from your computer
      </p>
      <div className="flex space-x-2 text-xs text-gray-400 font-mono">
        <span className="bg-gray-100 px-2 py-1 rounded">JS/TS</span>
        <span className="bg-gray-100 px-2 py-1 rounded">Python</span>
        <span className="bg-gray-100 px-2 py-1 rounded">Golang</span>
        <span className="bg-gray-100 px-2 py-1 rounded">Rust</span>
      </div>
    </div>
  )
}
