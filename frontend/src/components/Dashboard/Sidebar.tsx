import { Home, Users, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
}

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'user-data', label: 'User Management', icon: Users },
    { id: 'subscription-plan-analytics', label: 'Audit Overview', icon: PieChart },
  ]

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      </div>
      <nav>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              'flex w-full items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100',
              activePage === item.id && 'bg-gray-200 font-semibold'
            )}
            onClick={() => setActivePage(item.id)}
          >
            <item.icon className="mr-2 h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

