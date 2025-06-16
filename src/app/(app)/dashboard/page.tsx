'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Link from 'next/link' // For navigation links
import FeeStatus from '@/components/parent/fee-status'
import { initiatePayment } from '@/lib/payment-integration'
import EventViewer from '@/components/parent/event-viewer'
import PaymentMethodSelector from '@/components/parent/payment-method-selector'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'admin_unauthorized') {
        setProfileError('You are not authorized to access admin pages.');
        // Optionally clear the query param
        // router.replace('/dashboard', undefined);
    }

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }
      setUser(session.user)

      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', session.user.id)
        .limit(1)

      if (studentError) {
        console.error("Error checking for students:", studentError.message)
      } else if (!students || students.length === 0) {
        console.log("User has no students registered. Consider prompting to visit profile.")
      }

      setLoading(false)
    }
    fetchUser()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting to sign in...</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      router.push('/signin');
    }
    setLoading(false);
  };

  const handlePayFees = async () => {
    const placeholderPaymentDetails = {
      feeId: 1,
      studentId: 1,
      amount: 5000,
      currency: "usd",
      description: "Placeholder Annual Fee Payment"
    };
    if (user) {
      // @ts-expect-error: user puede ser null y no tiene id/email en el tipado
      placeholderPaymentDetails.parentId = user.id;
      // @ts-expect-error: user puede ser null y no tiene id/email en el tipado
      placeholderPaymentDetails.parentEmail = user.email;
    }

    const result = await initiatePayment(placeholderPaymentDetails);
    if (result.success) {
      console.log(result.message);
    } else {
      alert(result.message || "Payment initiation failed.");
    }
  };


  return (
    <div className="container mx-auto p-4">
      {profileError && (
        <div className="mb-4 p-3 text-center text-red-700 bg-red-100 border border-red-300 rounded-md">
          {profileError}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Button onClick={handleSignOut} variant="outline" disabled={loading}>
            {loading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>

      <p className="mb-4">Welcome, {user.email}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-transparent">
          <FeeStatus />
          <div className="mt-4">
            <Button onClick={handlePayFees} variant="primary" disabled={loading}>
              Pay Outstanding Fees (Placeholder)
            </Button>
          </div>
        </div>

        {/* EventViewer component integrated here */}
        <div className="bg-transparent"> {/* Container for EventViewer */}
          <EventViewer />
        </div>

        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">Your Profile</h2>
          <p className="text-gray-600 mb-3">Manage your children and personal details.</p>
          <Link href="/profile" legacyBehavior>
            <a className="text-blue-600 hover:underline">Go to Profile</a>
          </Link>
        </div>
      </div>
    </div>
  )
}

const Button = ({ onClick, children, variant = 'primary', disabled = false }: { onClick: () => void, children: React.ReactNode, variant?: string, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded font-semibold
      ${variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);
