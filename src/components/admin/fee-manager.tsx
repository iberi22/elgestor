'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Tentatively include Table components, assuming they can be added/are present
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Tentatively include Dialog components for a modal form
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Fee {
  id?: number
  year: number
  amount: number
  due_date: string // YYYY-MM-DD
}

export default function FeeManager() {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentFee, setCurrentFee] = useState<Partial<Fee> | null>(null) // For editing or adding
  const [formYear, setFormYear] = useState<number | ''>('')
  const [formAmount, setFormAmount] = useState<number | ''>('')
  const [formDueDate, setFormDueDate] = useState('')

  useEffect(() => {
    fetchFees()
  }, [])

  const fetchFees = async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('fees')
      .select('id, year, amount, due_date')
      .order('year', { ascending: false })

    if (fetchError) {
      setError(`Error fetching fees: ${fetchError.message}`)
    } else if (data) {
      const formattedData = data.map(fee => ({
        ...fee,
        due_date: fee.due_date ? new Date(fee.due_date).toISOString().split('T')[0] : '' // Ensure YYYY-MM-DD
      }))
      setFees(formattedData)
    }
    setLoading(false)
  }

  const handleOpenDialog = (fee: Partial<Fee> | null = null) => {
    setCurrentFee(fee)
    if (fee && fee.year && fee.amount && fee.due_date) {
      setFormYear(fee.year)
      setFormAmount(fee.amount)
      setFormDueDate(fee.due_date)
    } else {
      setFormYear(new Date().getFullYear()) // Default to current year for new fee
      setFormAmount('')
      setFormDueDate('')
    }
    setError(null)
    setMessage(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formYear === '' || formAmount === '' || formDueDate === '') {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)

    const feeData = {
      year: Number(formYear),
      amount: Number(formAmount),
      due_date: formDueDate,
    }

    let query
    if (currentFee && currentFee.id) {
      // Update existing fee
      query = supabase.from('fees').update(feeData).eq('id', currentFee.id)
    } else {
      // Create new fee
      query = supabase.from('fees').insert(feeData)
    }

    const { error: saveError } = await query

    if (saveError) {
      setError(`Error saving fee: ${saveError.message}`)
    } else {
      setMessage(`Fee for ${feeData.year} ${currentFee && currentFee.id ? 'updated' : 'created'} successfully.`)
      setIsDialogOpen(false)
      fetchFees() // Refresh the list
    }
    setLoading(false)
  }

  const handleDelete = async (feeId: number) => {
    if (!confirm("Are you sure you want to delete this fee? This action cannot be undone.")) {
        return;
    }
    setLoading(true); setError(null);
    const { error: deleteError } = await supabase.from('fees').delete().eq('id', feeId);
    if (deleteError) {
        setError(`Error deleting fee: ${deleteError.message}`);
    } else {
        setMessage("Fee deleted successfully.");
        fetchFees(); // Refresh list
    }
    setLoading(false);
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Annual Fees</CardTitle>
          <CardDescription>Define or update school fees for each year.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>Add New Fee</Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {loading && fees.length === 0 && <p>Loading fees...</p>}
        {!loading && fees.length === 0 && <p>No fees defined yet.</p>}

        {fees.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.year}</TableCell>
                  <TableCell>${fee.amount.toFixed(2)}</TableCell>
                  <TableCell>{fee.due_date}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(fee)} className="mr-2">Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => fee.id && handleDelete(fee.id)} disabled={loading}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentFee?.id ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
              <DialogDescription>
                {currentFee?.id ? `Update the details for the ${currentFee.year} fee.` : 'Set the amount and due date for a new annual fee.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">Year</Label>
                  <Input id="year" type="number" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount ($)</Label>
                  <Input id="amount" type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(Number(e.target.value))} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="due_date" className="text-right">Due Date</Label>
                  <Input id="due_date" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="col-span-3" required />
                </div>
              </div>
               {error && <p className="text-red-500 mb-2 text-sm px-1">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Fee'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
