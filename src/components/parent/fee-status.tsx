'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // Assuming Card is available
import { Badge } from '@/components/ui/badge' // Assuming Badge is available

interface StudentWithFeeStatus {
  student_id: number
  student_name: string
  class_name: string // Assuming we can get class name
  fee_id: number | null
  fee_year: number | null
  fee_amount: number | null
  payment_status: 'Paid' | 'Pending' | 'Not Applicable' | 'No Fee Defined'
  payment_id: number | null
}

export default function FeeStatus() {
  const [feeStatuses, setFeeStatuses] = useState<StudentWithFeeStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setLoading(false)
        setError("User not authenticated.")
        return
      }
      fetchFeeStatuses(currentUser.id)
    }
    initialize()
  }, [])

  const fetchFeeStatuses = async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Get the latest fee defined (assuming this is the "current" fee)
      //    More complex logic might be needed if fees are tied to school years / student grades differently.
      const { data: latestFeeData, error: feeError } = await supabase
        .from('fees')
        .select('id, year, amount')
        .order('year', { ascending: false })
        .limit(1)
        .single() // Expect one or no current fee globally

      if (feeError && feeError.code !== 'PGRST116') { // PGRST116: "Query returned 0 rows" (not an error for us here)
        throw new Error(`Error fetching current fee: ${feeError.message}`)
      }

      const currentFee = latestFeeData;

      // 2. Get parent's students and their classes
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          classes ( name )
        `)
        .eq('parent_id', userId)

      if (studentsError) {
        throw new Error(`Error fetching students: ${studentsError.message}`)
      }
      if (!studentsData || studentsData.length === 0) {
        setFeeStatuses([]) // No students, so no fees to show
        setLoading(false)
        return
      }

      if (!currentFee) { // No fee defined in the system at all
        const statuses = studentsData.map((student: unknown) => ({
          student_id: student.id,
          student_name: student.full_name,
          class_name: student.classes?.name || 'N/A',
          fee_id: null,
          fee_year: null,
          fee_amount: null,
          payment_status: 'No Fee Defined' as const,
          payment_id: null,
        }))
        setFeeStatuses(statuses)
        setLoading(false)
        return
      }

      // 3. For each student, check their payment status for the currentFee
      const studentFeePromises = studentsData.map(async (student: unknown) => {
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('id, status')
          .eq('student_id', student.id)
          .eq('fee_id', currentFee.id)
          // .eq('status', 'paid') // We want any payment record for this fee to determine status
          .limit(1)
          .single()

        if (paymentError && paymentError.code !== 'PGRST116') { // PGRST116 is ok, means no payment record
          console.error(`Error fetching payment for student ${student.id}, fee ${currentFee.id}: ${paymentError.message}`)
          // Decide how to handle this: treat as pending or show error? For now, treat as pending if fee exists.
        }

        let status: StudentWithFeeStatus['payment_status'] = 'Pending';
        if (payment && payment.status === 'paid') {
            status = 'Paid';
        } else if (!currentFee) {
            status = 'No Fee Defined';
        }
        // If payment record exists but not 'paid', it's still 'Pending' (or 'Failed' if we had that status)

        return {
          student_id: student.id,
          student_name: student.full_name,
          class_name: student.classes?.name || 'N/A',
          fee_id: currentFee.id,
          fee_year: currentFee.year,
          fee_amount: currentFee.amount,
          payment_status: status,
          payment_id: payment?.id || null,
        }
      })

      const results = await Promise.all(studentFeePromises)
      setFeeStatuses(results)

    } catch (e: unknown) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: StudentWithFeeStatus['payment_status']) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning'; // Assuming 'warning' is a variant or maps to yellow/orange
      case 'No Fee Defined': return 'secondary';
      case 'Not Applicable': return 'outline';
      default: return 'default';
    }
  }


  if (loading) return <p>Loading fee status...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Fee Status</CardTitle>
        <CardDescription>Status of the current annual school fee for your children.</CardDescription>
      </CardHeader>
      <CardContent>
        {feeStatuses.length === 0 && <p>No children found for your profile, or no fees applicable at this time. Please add your children in your <a href="/profile" className="underline">profile</a>.</p>}
        <div className="space-y-4">
          {feeStatuses.map(status => (
            <div key={status.student_id} className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <p className="font-semibold">{status.student_name} <span className="text-sm text-gray-500">({status.class_name})</span></p>
                {status.fee_year && status.fee_amount && (
                  <p className="text-sm">
                    Fee for {status.fee_year}: ${status.fee_amount.toFixed(2)}
                  </p>
                )}
              </div>
              <Badge variant={getStatusBadgeVariant(status.payment_status) as "default" | "secondary" | "destructive" | "outline"}>{status.payment_status}</Badge>
            </div>
          ))}
        </div>
        {/* "Pay Fee" button will be added to dashboard page, conditional on these statuses */}
      </CardContent>
    </Card>
  )
}
