'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  TrendingUp,
  LineChart,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/dashboard/accounts', label: 'Contas', icon: Wallet },
  { href: '/dashboard/categories', label: 'Categorias', icon: Tag },
  { href: '/dashboard/investments', label: 'Investimentos', icon: TrendingUp },
  { href: '/dashboard/mercado', label: 'Mercado', icon: LineChart },
  { href: '/dashboard/portfolio', label: 'Portifólio Pessoal', icon: User },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-4 py-6 space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <Icon
              size={18}
              className={isActive ? 'text-white' : 'group-hover:text-indigo-600'}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
