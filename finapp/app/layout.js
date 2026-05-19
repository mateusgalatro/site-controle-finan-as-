import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  title: 'FinApp — Controle Financeiro',
  description: 'Gerencie suas finanças pessoais com inteligência',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  )
}
