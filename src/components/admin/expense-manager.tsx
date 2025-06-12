'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea' // For description
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // For listing expenses

interface Expense {
  id?: number
  description: string
  amount: number
  expense_date: string // YYYY-MM-DD
}

export default function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false) // Combined loading state
  const [formLoading, setFormLoading] = useState(false) // Specific for form submission
  const [listLoading, setListLoading] = useState(true) // Specific for list fetching
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]) // Default to today

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setListLoading(true)
    setError(null) // Clear previous errors specific to list fetching
    const { data, error: fetchError } = await supabase
      .from('expenses')
      .select('id, description, amount, expense_date')
      .order('expense_date', { ascending: false })

    if (fetchError) {
      setError(`Error fetching expenses: ${fetchError.message}`)
    } else if (data) {
      const formattedData = data.map(exp => ({
        ...exp,
        expense_date: exp.expense_date ? new Date(exp.expense_date).toISOString().split('T')[0] : '' // Ensure YYYY-MM-DD
      }))
      setExpenses(formattedData)
    }
    setListLoading(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (description === '' || amount === '' || expenseDate === '') {
      setError('All fields are required.')
      return
    }
    setFormLoading(true)
    setError(null) // Clear previous form errors
    setMessage(null)

    const expenseData = {
      description,
      amount: Number(amount),
      expense_date: expenseDate,
    }

    const { error: saveError } = await supabase.from('expenses').insert(expenseData)

    if (saveError) {
      setError(`Error saving expense: ${saveError.message}`)
    } else {
      setMessage('Expense registered successfully.')
      // Clear form
      setDescription('')
      setAmount('')
      setExpenseDate(new Date().toISOString().split('T')[0])
      fetchExpenses() // Refresh the list
    }
    setFormLoading(false)
  }

  const handleDelete = async (expenseId: number) => {
    if (!confirm("Are you sure you want to delete this expense record?")) {
        return;
    }
    setLoading(true); setError(null); // Use general loading for delete
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (deleteError) {
        setError(`Error deleting expense: ${deleteError.message}`);
    } else {
        setMessage("Expense deleted successfully.");
        fetchExpenses(); // Refresh list
    }
    setLoading(false);
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Register New Expense</CardTitle>
          <CardDescription>Record an expense made by the association.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Expense details" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="expense_date">Date of Expense</Label>
                <Input id="expense_date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </div>
            </div>
            {error && !listLoading && <p className="text-red-500 mb-2 text-sm px-1">{error}</p>}
            {message && <p className="text-green-500 mb-2 text-sm px-1">{message}</p>}
            <Button type="submit" disabled={formLoading || loading} className="w-full">
              {formLoading ? 'Saving...' : 'Register Expense'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Registered Expenses</CardTitle>
          <CardDescription>List of all recorded expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading && <p>Loading expenses...</p>}
          {error && listLoading && <p className="text-red-500 mb-4">{error}</p>} {/* Show fetch error if list is loading */}
          {!listLoading && !error && expenses.length === 0 && <p>No expenses registered yet.</p>}

          {!listLoading && expenses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.expense_date}</TableCell>
                    <TableCell className="truncate max-w-xs">{expense.description}</TableCell>
                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => expense.id && handleDelete(expense.id)} disabled={loading || formLoading}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
