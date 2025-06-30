import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-cancel-page">
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
            <h2>Payment Cancelled</h2>
            <p style={{ color: 'var(--text-secondary, #6b7280)', margin: '1rem 0 2rem 0' }}>
              Your payment was cancelled. No charges were made to your account.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                onClick={() => navigate('/cart')}
              >
                Return to Cart
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </div>
            
            <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>
              <p>Need help? Contact our support team for assistance.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};