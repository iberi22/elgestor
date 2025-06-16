'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAvailablePaymentMethods, formatCLP, validatePaymentAmount, initiatePayment } from '@/lib/payment-integration'

interface PaymentMethodSelectorProps {
  feeId: number;
  studentId: number;
  amount: number;
  description: string;
  parentId?: string;
  parentEmail?: string;
  onPaymentInitiated?: (result: any) => void;
}

export default function PaymentMethodSelector({
  feeId,
  studentId,
  amount,
  description,
  parentId,
  parentEmail,
  onPaymentInitiated
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('webpay')
  const [loading, setLoading] = useState(false)
  
  const paymentMethods = getAvailablePaymentMethods()

  const handlePayment = async () => {
    setLoading(true)
    
    // Validar monto mínimo
    const validation = validatePaymentAmount(amount, selectedMethod)
    if (!validation.valid) {
      alert(validation.message)
      setLoading(false)
      return
    }

    try {
      const result = await initiatePayment({
        feeId,
        studentId,
        amount,
        currency: 'CLP',
        description,
        parentId,
        parentEmail,
        paymentMethod: selectedMethod as any
      })

      if (result.success && result.redirectUrl) {
        // Redirigir a la pasarela de pago
        window.location.href = result.redirectUrl
      } else {
        alert(result.error || 'Error al iniciar el pago')
      }

      if (onPaymentInitiated) {
        onPaymentInitiated(result)
      }
    } catch (error) {
      console.error('Error al procesar pago:', error)
      alert('Error al procesar el pago. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Seleccionar Método de Pago</CardTitle>
        <CardDescription>
          Elige tu método de pago preferido para pagar {formatCLP(amount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métodos de pago populares en Chile */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Métodos Populares en Chile</h3>
          {Object.entries(paymentMethods)
            .filter(([_, method]) => method.popular)
            .map(([key, method]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMethod(key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      checked={selectedMethod === key}
                      onChange={() => setSelectedMethod(key)}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      Comisión: {method.fees}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {method.currencies.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Métodos adicionales */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Otros Métodos</h3>
          {Object.entries(paymentMethods)
            .filter(([_, method]) => !method.popular)
            .map(([key, method]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMethod(key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      checked={selectedMethod === key}
                      onChange={() => setSelectedMethod(key)}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      Comisión: {method.fees}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {method.currencies.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Resumen del pago */}
        <div className="border-t pt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Resumen del Pago</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Concepto:</span>
                <span>{description}</span>
              </div>
              <div className="flex justify-between">
                <span>Monto:</span>
                <span className="font-medium">{formatCLP(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Método:</span>
                <span>{paymentMethods[selectedMethod as keyof typeof paymentMethods]?.name}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Comisión estimada:</span>
                <span>{paymentMethods[selectedMethod as keyof typeof paymentMethods]?.fees}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de pago */}
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Procesando...' : `Pagar ${formatCLP(amount)}`}
        </Button>

        {/* Información de seguridad */}
        <div className="text-xs text-gray-500 text-center">
          <p>🔒 Todos los pagos son procesados de forma segura</p>
          <p>Los datos de tu tarjeta son encriptados y no se almacenan en nuestros servidores</p>
        </div>
      </CardContent>
    </Card>
  )
}
