// ============================================================================
// Payment Form Component Unit Tests
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from '../payment/PaymentForm';
import { paymentService } from '../../services/payment/PaymentService';

// Mock services
jest.mock('../../services/payment/PaymentService');

// Mock PaymentErrorBoundary
jest.mock('../common/PaymentErrorBoundary', () => ({
  PaymentErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="payment-error-boundary">{children}</div>
  ),
}));

const mockPaymentService = paymentService as jest.Mocked<typeof paymentService>;

describe('PaymentForm', () => {
  const defaultProps = {
    orderId: 'order_123',
    amount: 100.5,
    currency: 'MYR',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render payment form with correct amount', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    expect(screen.getByText('MYR 100.50')).toBeInTheDocument();
    expect(screen.getByLabelText(/customer email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<PaymentForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });

    expect(submitButton).toBeDisabled();
  });

  it('should validate phone format', async () => {
    render(<PaymentForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '123' } });

    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button with valid inputs', async () => {
    render(<PaymentForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should show loading state during payment processing', async () => {
    mockPaymentService.createPayment.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<PaymentForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Processing Your Payment')).toBeInTheDocument();
    expect(
      screen.getByText('Please wait while we securely process your payment...')
    ).toBeInTheDocument();
  });

  it('should call onSuccess when payment succeeds', async () => {
    const onSuccessMock = jest.fn();

    mockPaymentService.createPayment.mockResolvedValue({
      success: true,
      paymentId: 'pay_123',
      redirectUrl: undefined,
      status: 'COMPLETED',
    });

    render(<PaymentForm {...defaultProps} onSuccess={onSuccessMock} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith('pay_123');
    });
  });

  it('should handle payment redirect', async () => {
    const mockWindowLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true,
    });

    mockPaymentService.createPayment.mockResolvedValue({
      success: true,
      paymentId: 'pay_123',
      redirectUrl: 'https://payment.gateway.com/redirect',
      status: 'PENDING',
    });

    render(<PaymentForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockWindowLocation.href).toBe('https://payment.gateway.com/redirect');
    });
  });

  it('should call onError when payment fails', async () => {
    const onErrorMock = jest.fn();

    mockPaymentService.createPayment.mockResolvedValue({
      success: false,
      error: 'Payment failed',
    });

    render(<PaymentForm {...defaultProps} onError={onErrorMock} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith('Payment failed');
    });
  });

  it('should handle network errors', async () => {
    const onErrorMock = jest.fn();

    mockPaymentService.createPayment.mockRejectedValue(new Error('Network error'));

    render(<PaymentForm {...defaultProps} onError={onErrorMock} />);

    const emailInput = screen.getByLabelText(/customer email/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /pay myr 100.50/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+60123456789' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith('Network error');
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancelMock = jest.fn();

    render(<PaymentForm {...defaultProps} onCancel={onCancelMock} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancelMock).toHaveBeenCalled();
  });

  it('should be wrapped with PaymentErrorBoundary', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByTestId('payment-error-boundary')).toBeInTheDocument();
  });

  it('should display security notice', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(
      screen.getByText(/your payment is secured with bank-level encryption/i)
    ).toBeInTheDocument();
  });

  it('should show Curlec payment method selection', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText('Curlec Payment Gateway')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /curlec payment gateway/i })).toBeChecked();
  });
});
