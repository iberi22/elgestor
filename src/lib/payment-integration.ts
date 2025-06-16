// payment-integration.ts
// Sistema de pagos integrado para Chile con múltiples pasarelas

interface PaymentDetails {
  feeId: number;
  studentId: number;
  amount: number;
  currency: string;
  description: string;
  parentId?: string;
  parentEmail?: string;
  paymentMethod?: 'webpay' | 'mercadopago' | 'stripe' | 'khipu' | 'flow';
}

interface PaymentResult {
  success: boolean;
  message?: string;
  redirectUrl?: string;
  error?: string;
  paymentMethod?: string;
}

// Configuración de pasarelas de pago populares en Chile
const PAYMENT_PROVIDERS = {
  webpay: {
    name: 'Webpay Plus (Transbank)',
    description: 'Tarjetas de crédito y débito chilenas',
    currencies: ['CLP'],
    fees: '2.95%',
    popular: true,
    logo: '/images/webpay-logo.png'
  },
  mercadopago: {
    name: 'Mercado Pago',
    description: 'Tarjetas, transferencias y efectivo',
    currencies: ['CLP', 'USD'],
    fees: '3.49%',
    popular: true,
    logo: '/images/mercadopago-logo.png'
  },
  khipu: {
    name: 'Khipu',
    description: 'Transferencias bancarias instantáneas',
    currencies: ['CLP'],
    fees: '1.95%',
    popular: true,
    logo: '/images/khipu-logo.png'
  },
  flow: {
    name: 'Flow',
    description: 'Múltiples medios de pago chilenos',
    currencies: ['CLP'],
    fees: '2.9%',
    popular: true,
    logo: '/images/flow-logo.png'
  },
  stripe: {
    name: 'Stripe',
    description: 'Tarjetas internacionales',
    currencies: ['CLP', 'USD'],
    fees: '3.6%',
    popular: false,
    logo: '/images/stripe-logo.png'
  }
};

export async function initiatePayment(details: PaymentDetails): Promise<PaymentResult> {
  console.log("Iniciando pago con detalles:", details);

  const paymentMethod = details.paymentMethod || 'webpay'; // Default a Webpay para Chile

  switch (paymentMethod) {
    case 'webpay':
      return await initiateWebpayPayment(details);
    case 'mercadopago':
      return await initiateMercadoPagoPayment(details);
    case 'khipu':
      return await initiateKhipuPayment(details);
    case 'flow':
      return await initiateFlowPayment(details);
    case 'stripe':
      return await initiateStripePayment(details);
    default:
      return {
        success: false,
        error: `Método de pago no soportado: ${paymentMethod}`
      };
  }
}

// Webpay Plus (Transbank) - Más popular en Chile
async function initiateWebpayPayment(details: PaymentDetails): Promise<PaymentResult> {
  // --- Integración con Webpay Plus ---
  // const WebpayPlus = require('transbank-sdk').WebpayPlus;
  // const response = await WebpayPlus.Transaction.create(
  //   `order_${details.feeId}_${details.studentId}_${Date.now()}`,
  //   details.amount,
  //   `${process.env.NEXTAUTH_URL}/payment/webpay/return`,
  //   `${process.env.NEXTAUTH_URL}/payment/webpay/final`
  // );
  // return { success: true, redirectUrl: response.url, paymentMethod: 'webpay' };

  // Simulación para desarrollo
  const simulatedUrl = `/payment/simulate?provider=webpay&feeId=${details.feeId}&studentId=${details.studentId}&amount=${details.amount}`;
  return {
    success: true,
    message: "Redirigiendo a Webpay Plus (Transbank)...",
    redirectUrl: simulatedUrl,
    paymentMethod: 'webpay'
  };
}

// Mercado Pago
async function initiateMercadoPagoPayment(details: PaymentDetails): Promise<PaymentResult> {
  // --- Integración con Mercado Pago ---
  // const mercadopago = require('mercadopago');
  // mercadopago.configure({ access_token: process.env.MERCADOPAGO_ACCESS_TOKEN });
  // const preference = {
  //   items: [{
  //     title: details.description,
  //     unit_price: details.amount,
  //     quantity: 1,
  //     currency_id: 'CLP'
  //   }],
  //   back_urls: {
  //     success: `${process.env.NEXTAUTH_URL}/payment/mercadopago/success`,
  //     failure: `${process.env.NEXTAUTH_URL}/payment/mercadopago/failure`,
  //     pending: `${process.env.NEXTAUTH_URL}/payment/mercadopago/pending`,
  //   },
  //   auto_return: 'approved',
  //   external_reference: `fee_${details.feeId}_student_${details.studentId}`,
  // };
  // const response = await mercadopago.preferences.create(preference);
  // return { success: true, redirectUrl: response.body.init_point, paymentMethod: 'mercadopago' };

  // Simulación para desarrollo
  const simulatedUrl = `/payment/simulate?provider=mercadopago&feeId=${details.feeId}&studentId=${details.studentId}&amount=${details.amount}`;
  return {
    success: true,
    message: "Redirigiendo a Mercado Pago...",
    redirectUrl: simulatedUrl,
    paymentMethod: 'mercadopago'
  };
}

// Khipu - Transferencias bancarias
async function initiateKhipuPayment(details: PaymentDetails): Promise<PaymentResult> {
  // --- Integración con Khipu ---
  // const khipu = require('khipu');
  // const client = new khipu.PaymentsApi();
  // const payment = await client.paymentsPost({
  //   amount: details.amount,
  //   currency: 'CLP',
  //   subject: details.description,
  //   transaction_id: `fee_${details.feeId}_student_${details.studentId}`,
  //   return_url: `${process.env.NEXTAUTH_URL}/payment/khipu/return`,
  //   notify_url: `${process.env.NEXTAUTH_URL}/api/webhooks/khipu`
  // });
  // return { success: true, redirectUrl: payment.payment_url, paymentMethod: 'khipu' };

  // Simulación para desarrollo
  const simulatedUrl = `/payment/simulate?provider=khipu&feeId=${details.feeId}&studentId=${details.studentId}&amount=${details.amount}`;
  return {
    success: true,
    message: "Redirigiendo a Khipu (Transferencia bancaria)...",
    redirectUrl: simulatedUrl,
    paymentMethod: 'khipu'
  };
}

// Flow
async function initiateFlowPayment(details: PaymentDetails): Promise<PaymentResult> {
  // --- Integración con Flow ---
  // const flow = require('flow-sdk');
  // const payment = await flow.createPayment({
  //   amount: details.amount,
  //   currency: 'CLP',
  //   subject: details.description,
  //   commerceOrder: `fee_${details.feeId}_student_${details.studentId}`,
  //   urlConfirmation: `${process.env.NEXTAUTH_URL}/api/webhooks/flow`,
  //   urlReturn: `${process.env.NEXTAUTH_URL}/payment/flow/return`
  // });
  // return { success: true, redirectUrl: payment.url, paymentMethod: 'flow' };

  // Simulación para desarrollo
  const simulatedUrl = `/payment/simulate?provider=flow&feeId=${details.feeId}&studentId=${details.studentId}&amount=${details.amount}`;
  return {
    success: true,
    message: "Redirigiendo a Flow...",
    redirectUrl: simulatedUrl,
    paymentMethod: 'flow'
  };
}

// Stripe (para tarjetas internacionales)
async function initiateStripePayment(details: PaymentDetails): Promise<PaymentResult> {
  // --- Integración con Stripe ---
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   line_items: [{
  //     price_data: {
  //       currency: details.currency.toLowerCase(),
  //       product_data: { name: details.description },
  //       unit_amount: details.amount * 100, // Stripe expects amount in cents
  //     },
  //     quantity: 1,
  //   }],
  //   mode: 'payment',
  //   success_url: `${process.env.NEXTAUTH_URL}/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${process.env.NEXTAUTH_URL}/payment/stripe/cancel`,
  //   metadata: {
  //     feeId: details.feeId.toString(),
  //     studentId: details.studentId.toString(),
  //     parentId: details.parentId || '',
  //   },
  // });
  // return { success: true, redirectUrl: session.url, paymentMethod: 'stripe' };

  // Simulación para desarrollo
  const simulatedUrl = `/payment/simulate?provider=stripe&feeId=${details.feeId}&studentId=${details.studentId}&amount=${details.amount}`;
  return {
    success: true,
    message: "Redirigiendo a Stripe...",
    redirectUrl: simulatedUrl,
    paymentMethod: 'stripe'
  };
}

// Función para obtener métodos de pago disponibles
export function getAvailablePaymentMethods() {
  return PAYMENT_PROVIDERS;
}

// Función para obtener el método de pago recomendado para Chile
export function getRecommendedPaymentMethod(): string {
  return 'webpay'; // Webpay Plus es el más usado en Chile
}

// Función para formatear montos en pesos chilenos
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Función para validar montos mínimos por pasarela
export function validatePaymentAmount(amount: number, method: string): { valid: boolean; message?: string } {
  const minimums = {
    webpay: 50,      // $50 CLP mínimo
    mercadopago: 100, // $100 CLP mínimo
    khipu: 100,      // $100 CLP mínimo
    flow: 50,        // $50 CLP mínimo
    stripe: 500      // $500 CLP mínimo (por comisiones internacionales)
  };

  const minimum = minimums[method as keyof typeof minimums] || 50;

  if (amount < minimum) {
    return {
      valid: false,
      message: `El monto mínimo para ${PAYMENT_PROVIDERS[method as keyof typeof PAYMENT_PROVIDERS]?.name} es ${formatCLP(minimum)}`
    };
  }

  return { valid: true };
}
