'use client'

import { ScanMode } from '../../../domain/entities/ScanType'

interface Props {
  currentMode: ScanMode
  onChange: (mode: ScanMode) => void
}

export default function ScanInputSelector({ currentMode, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg w-fit mx-auto mb-8">
      <button
        type="button"
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          currentMode === 'UPLOAD_FILES'
            ? 'bg-gray-800 text-white shadow'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange('UPLOAD_FILES')}
      >
        UPLOAD FILES
      </button>
      <button
        type="button"
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          currentMode === 'DIRECT_CODE'
            ? 'bg-gray-800 text-white shadow'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange('DIRECT_CODE')}
      >
        DIRECT CODE
      </button>
    </div>
  )
}
