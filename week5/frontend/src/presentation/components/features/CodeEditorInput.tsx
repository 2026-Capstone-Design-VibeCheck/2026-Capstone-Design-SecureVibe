'use client'

/**
 * [코드 입력창 컴포넌트]
 * 사용자가 보안 분석을 원하는 코드를 직접 타이핑하거나 
 * 복사해서 붙여넣을 수 있는 커다란 입력 상자입니다.
 */


interface Props {
  value: string
  onChange: (val: string) => void
}

export default function CodeEditorInput({ value, onChange }: Props) {
  return (
    <div className="w-full h-64 border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-obsidian-green transition-shadow focus-within:border-transparent">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your code here..."
        className="w-full h-full p-4 resize-none outline-none font-mono text-sm bg-gray-50 text-gray-800"
      />
    </div>
  )
}
