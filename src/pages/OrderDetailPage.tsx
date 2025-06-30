import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { orderService } from '../services/order/OrderService';
import { paymentService } from '../services/payment/PaymentService';
import type { Order } from '../types';
import { OrderStatus, PaymentStatus } from '../types';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not provided');
      setLoading(false);
      return;
    }

    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const orderData = await orderService.getOrder(orderId);
      
      if (!orderData) {
        setError('Order not found');
        return;
      }

      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'var(--success-color, #10b981)';
      case OrderStatus.FAILED:
      case OrderStatus.CANCELLED:
        return 'var(--error-color, #ef4444)';
      case OrderStatus.PROCESSING:
        return 'var(--info-color, #3b82f6)';
      case OrderStatus.PENDING:
      default:
        return 'var(--warning-color, #f59e0b)';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return '✅';
      case OrderStatus.FAILED:
        return '❌';
      case OrderStatus.CANCELLED:
        return '🚫';
      case OrderStatus.PROCESSING:
        return '⏳';
      case OrderStatus.PENDING:
      default:
        return '🔄';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h2>Order Not Found</h2>
            <p style={{ color: 'var(--text-secondary, #6b7280)', margin: '1rem 0 2rem 0' }}>
              {error || 'The requested order could not be found.'}
            </p>
            <Button onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="order-detail-page">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            style={{ marginBottom: '1rem' }}
          >
            ← Back
          </Button>
          <h1>Order Details</h1>
        </div>

        {/* Order Status */}
        <Card style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{getStatusIcon(order.status)}</span>
              <div>
                <h2 style={{ margin: 0, color: getStatusColor(order.status) }}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary, #6b7280)' }}>
                  Order #{order.id}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Order Date:</strong>
                <br />
                {order.createdAt.toLocaleDateString()}
              </div>
              <div>
                <strong>Payment Method:</strong>
                <br />
                {order.paymentMethod}
              </div>
              <div>
                <strong>Total Amount:</strong>
                <br />
                {order.currency} {order.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        {/* Order Items */}
        <Card style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>Order Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.productName || `Product ${item.productId}`}</div>
                    <div style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
                      Quantity: {item.quantity}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {order.currency} {(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
                      {order.currency} {item.price.toFixed(2)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payment Information */}
        {order.paymentId && (
          <Card style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '2rem' }}>
              <h3 style={{ marginTop: 0 }}>Payment Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Payment ID:</strong>
                  <br />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {order.paymentId}
                  </span>
                </div>
                <div>
                  <strong>Payment Status:</strong>
                  <br />
                  {order.paymentStatus || 'Unknown'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button
            variant="primary"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </Button>
          
          {order.status === OrderStatus.FAILED && (
            <Button
              variant="outline"
              onClick={() => navigate('/cart')}
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
};