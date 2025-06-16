'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation' // Corrected import
import FeeManager from '@/components/admin/fee-manager'
import ExpenseManager from '@/components/admin/expense-manager'
import PaymentsViewer from '@/components/admin/payments-viewer'
import FinancialSummary from '@/components/admin/financial-summary'
import EventManager from '@/components/admin/event-manager' // Added import

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('Session error or no session:', sessionError?.message)
        router.push('/signin') // Redirect if no session
        return
      }

      const currentUser = session.user

      if (currentUser) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile for admin check:', profileError)
          setIsAdmin(false)
        } else if (profile && profile.role === 'admin') {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } else {
        router.push('/signin');
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access Denied. You do not have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome to the admin control panel. Financial tools will be available here.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FeeManager />
        </div>
        <div className="md:col-span-2">
          <ExpenseManager />
        </div>
        <div className="md:col-span-2">
          <PaymentsViewer />
        </div>
        <div className="md:col-span-2">
          <FinancialSummary />
        </div>
        {/* EventManager component integrated here, spanning two columns */}
        <div className="md:col-span-2 mt-6"> {/* Added mt-6 for spacing like other blocks */}
          <EventManager />
        </div>
      </div>
    </div>
  )
}
