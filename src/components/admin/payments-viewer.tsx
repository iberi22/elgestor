'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge" // For status

interface PaymentView {
  id: number
  student_name: string | null
  fee_year: number | null
  amount_paid: number
  status: string
  payment_date: string | null
  transaction_id: string | null
}

export default function PaymentsViewer() {
  const [payments, setPayments] = useState<PaymentView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    // This query needs to join payments with students (for name) and fees (for year)
    // RLS policies must allow these joins for the authenticated admin user.
    // The select string might need adjustment based on actual foreign key relations and desired fields.
    // Example: payments(id, amount_paid, status, payment_date, transaction_id, students(full_name), fees(year))
    const { data, error: fetchError } = await supabase
      .from('payments')
      .select(`
        id,
        amount_paid,
        status,
        payment_date,
        transaction_id,
        students ( full_name ),
        fees ( year )
      `)
      .order('payment_date', { ascending: false })

    if (fetchError) {
      console.error("Error fetching payments:", fetchError);
      setError(`Error fetching payments: ${fetchError.message}. Check console for details. Ensure RLS is set up for admins to read related tables.`)
    } else if (data) {
      const formattedData = data.map((p: unknown) => ({ // Use 'unknown' for simplicity with Supabase joined data
        id: p.id,
        student_name: p.students?.full_name || 'N/A',
        fee_year: p.fees?.year || 'N/A',
        amount_paid: p.amount_paid,
        status: p.status,
        payment_date: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A',
        transaction_id: p.transaction_id || 'N/A'
      }))
      setPayments(formattedData as PaymentView[])
    }
    setLoading(false)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success'; // Assuming you have a 'success' variant or default green
      case 'pending':
        return 'secondary'; // Or 'warning' if you have one
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  }


  return (
    <Card className="md:col-span-2"> {/* Adjusted span to fit typical dashboard layouts */}
      <CardHeader>        <CardTitle>Vista General de Pagos</CardTitle>
        <CardDescription>Lista de todas las transacciones de pago.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Cargando pagos...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && payments.length === 0 && <p>No se encontraron pagos.</p>}

        {!loading && !error && payments.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>                <TableHead>Estudiante</TableHead>
                <TableHead>Año de Cuota</TableHead>
                <TableHead>Monto Pagado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Pago</TableHead>
                <TableHead>ID de Transacción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.student_name}</TableCell>
                  <TableCell>{payment.fee_year}</TableCell>
                  <TableCell>${payment.amount_paid.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status) as unknown}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell>{payment.payment_date}</TableCell>
                  <TableCell className="truncate max-w-xs">{payment.transaction_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
