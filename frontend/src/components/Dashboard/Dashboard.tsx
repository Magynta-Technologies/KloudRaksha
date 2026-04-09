'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Home from './Home'
import UserData from './UserData'
import SubscriptionPlanAnalytics from './AuditReport'
import UserProfile from './UserProfile'

export default function Dashboard() {
  const [activePage, setActivePage] = useState('home')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home />
      case 'user-data':
        return selectedUserId ? (
          <UserProfile userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
        ) : (
          <UserData  />
        )
      case 'subscription-plan-analytics':
        return <SubscriptionPlanAnalytics />
      default:
        return <Home />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-y-auto p-8">{renderPage()}</main>
    </div>
  )
}

