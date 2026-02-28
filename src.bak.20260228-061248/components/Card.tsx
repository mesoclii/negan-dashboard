import { ReactNode } from "react"

interface CardProps {
  title?: string
  children: ReactNode
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="panel p-6 rounded-md shadow-[0_0_20px_rgba(220,38,38,0.15)]">
      
      {title && (
        <h2 className="text-lg font-bold tracking-widest uppercase mb-4 glow-text">
          {title}
        </h2>
      )}

      <div className="text-sm text-red-500">
        {children}
      </div>

    </div>
  )
}
