'use client'

import { ReactNode } from 'react'
import GlobalSidebar from './GlobalSidebar'

interface Props {
  children: ReactNode
}

export default function EngineLayout({ children }: Props) {
  return (
    <div className="flex h-screen possum-bg text-white">
      <aside className="w-72 min-w-72">
        <GlobalSidebar />
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
