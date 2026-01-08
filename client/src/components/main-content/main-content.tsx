import React from 'react';
import './main-content.css'

export default function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="main-content">
      {children}
    </main>
  )
}
