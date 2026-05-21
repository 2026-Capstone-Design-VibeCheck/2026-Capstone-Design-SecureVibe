'use client'

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
