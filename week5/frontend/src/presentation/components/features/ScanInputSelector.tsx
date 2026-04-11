'use client'

/**
 * [입력 방식 선택기]
 * 파일을 올릴 것인지, 아니면 코드를 직접 창에 붙여넣을 것인지 
 * 분석할 위협 대상을 어떤 방식으로 전달할지 선택하는 탭 메뉴입니다.
 */


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
