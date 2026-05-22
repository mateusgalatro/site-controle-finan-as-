'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function redirectBySession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      router.replace(user ? '/dashboard' : '/login')
    }

    redirectBySession()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Carregando...</p>
    </div>
  )
}
