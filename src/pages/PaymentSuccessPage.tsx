import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentStatus } from '../components/payment/PaymentStatus';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get payment ID and order ID from URL params
    const paymentIdParam = searchParams.get('payment_id');
    const orderIdParam = searchParams.get('order_id');
    
    if (paymentIdParam) {
      setPaymentId(paymentIdParam);
    }
    
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }

    // If no payment ID provided, this might be an invalid access
    if (!paymentIdParam && !orderIdParam) {
      setTimeout(() => {
        navigate('/products');
      }, 3000);
    }
  }, [searchParams, navigate]);

  if (!paymentId && !orderId) {
    return (
      <Card className="payment-success-error">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>⚠️ Invalid Access</h2>
          <p>No payment information found. Redirecting to products...</p>
          <Button onClick={() => navigate('/products')}>
            Go to Products Now
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="payment-success-page">
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        {paymentId ? (
          <PaymentStatus
            paymentId={paymentId}
            orderId={orderId || undefined}
            onSuccess={() => {
              // Payment completed successfully
              console.log('Payment completed successfully');
            }}
            onFailure={() => {
              // Payment failed
              console.log('Payment failed');
            }}
            onRetry={() => {
              // Retry payment
              navigate('/cart');
            }}
          />
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2>✅ Order Received</h2>
              <p>Your order has been received and is being processed.</p>
              {orderId && (
                <div style={{ margin: '1rem 0' }}>
                  <strong>Order ID: {orderId}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/orders/${orderId}`)}
                >
                  View Order Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};