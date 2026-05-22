import './globals.css'

export const metadata = {
  title: 'FinApp - Controle Financeiro',
  description: 'Gerencie suas financas pessoais com inteligencia',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  )
}
