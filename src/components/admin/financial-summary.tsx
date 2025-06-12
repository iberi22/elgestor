'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryData {
  totalCollected: number
  totalExpenses: number
  balance: number
}

export default function FinancialSummary() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinancialSummary()
  }, [])

  const fetchFinancialSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch total collected from 'paid' payments
      // Note: Supabase sum() returns { data: number | null, error, count }
      // The actual value is in data.sum, not data directly if using aggregate functions.
      // However, using rpc might be easier for multiple aggregates or if direct sum() is tricky.
      // For simplicity, let's try with two separate queries.

      const { data: collectedData, error: collectedError } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('status', 'paid')

      if (collectedError) throw collectedError
      const totalCollected = collectedData?.reduce((acc, p) => acc + p.amount_paid, 0) || 0

      // Fetch total expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')

      if (expensesError) throw expensesError
      const totalExpenses = expensesData?.reduce((acc, e) => acc + e.amount, 0) || 0

      setSummary({
        totalCollected,
        totalExpenses,
        balance: totalCollected - totalExpenses,
      })

    } catch (e: any) {
      console.error("Error fetching financial summary:", e)
      setError(`Error fetching summary: ${e.message}. Ensure RLS allows admins to read payments and expenses.`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    // Consider making currency configurable or using a local currency later.
  }

  return (
    <Card className="md:col-span-2"> {/* Adjusted span */}
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
        <CardDescription>Overview of total collections and expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading summary...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {summary && !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalCollected)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold" style={{ color: summary.balance >= 0 ? 'green' : 'red' }}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
