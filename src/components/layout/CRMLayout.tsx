'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <TopBar 
          onMenuClick={handleMenuClick}
          isCollapsed={isCollapsed}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
