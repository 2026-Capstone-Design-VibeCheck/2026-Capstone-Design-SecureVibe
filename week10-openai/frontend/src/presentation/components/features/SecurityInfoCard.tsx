'use client'

import { useState } from 'react'
import { SecurityFeature } from '../../../domain/entities/SecurityFeature'
import { BrainCircuit, ShieldCheck, Lock } from 'lucide-react'

interface Props {
  feature: SecurityFeature
}

export default function SecurityInfoCard({ feature }: Props) {
  const [isHovered, setIsHovered] = useState(false)

  const getIcon = () => {
    switch (feature.iconType) {
      case 'ai': return <BrainCircuit className="w-8 h-8 text-obsidian-green" />
      case 'shield': return <ShieldCheck className="w-8 h-8 text-obsidian-green" />
      case 'lock': return <Lock className="w-8 h-8 text-obsidian-green" />
      default: return null
    }
  }

  return (
    <div
      data-testid={`security-card-${feature.id}`}
      className="relative p-6 border rounded-2xl bg-white hover:shadow-xl transition-all cursor-crosshair group h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-4 bg-gray-50 p-3 rounded-xl w-fit group-hover:bg-teal-50 transition-colors">
        {getIcon()}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
      
      {/* Base description that could be truncated */}
      <p className="text-gray-500 line-clamp-2">{feature.description}</p>
      
      {/* Tooltip that appears on hover for full detail */}
      <div className={`absolute left-0 bottom-full mb-4 w-full p-4 bg-gray-900 text-white text-sm rounded-lg shadow-2xl transition-all duration-300 z-50 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <div className="font-semibold mb-1">{feature.title}</div>
        <div>{feature.description}</div>
        {/* Triangle pointer */}
        <div className="absolute left-6 top-full w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-900 border-r-[8px] border-r-transparent"></div>
      </div>
    </div>
  )
}
