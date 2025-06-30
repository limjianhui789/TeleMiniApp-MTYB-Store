import React, { useState, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface RatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
  allowHalf?: boolean;
  showValue?: boolean;
  showLabels?: boolean;
  labels?: string[];
  emptyIcon?: string;
  fillIcon?: string;
  halfIcon?: string;
  color?: string;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value = 0,
  onChange,
  max = 5,
  size = 'medium',
  readonly = false,
  allowHalf = false,
  showValue = false,
  showLabels = false,
  labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  emptyIcon = '☆',
  fillIcon = '★',
  halfIcon = '⭐',
  color,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const triggerHaptic = useCallback(() => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  const handleStarClick = useCallback(
    (rating: number) => {
      if (readonly) return;

      triggerHaptic();
      onChange?.(rating);
    },
    [readonly, onChange, triggerHaptic]
  );

  const handleStarHover = useCallback(
    (rating: number) => {
      if (readonly) return;
      setHoverValue(rating);
    },
    [readonly]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
  }, []);

  const getStarIcon = (starIndex: number, currentValue: number) => {
    if (allowHalf) {
      if (currentValue >= starIndex) {
        return fillIcon;
      } else if (currentValue >= starIndex - 0.5) {
        return halfIcon;
      } else {
        return emptyIcon;
      }
    } else {
      return currentValue >= starIndex ? fillIcon : emptyIcon;
    }
  };

  const getStarSize = () => {
    switch (size) {
      case 'small':
        return 'var(--text-base)';
      case 'medium':
        return 'var(--text-xl)';
      case 'large':
        return 'var(--text-3xl)';
      default:
        return 'var(--text-xl)';
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;
  const currentLabel = labels[Math.ceil(displayValue) - 1] || '';

  return (
    <div className={`rating ${className}`} onMouseLeave={handleMouseLeave}>
      <div className="rating__stars">
        {Array.from({ length: max }, (_, index) => {
          const starIndex = index + 1;
          const isActive = displayValue >= starIndex;
          const isHalf = allowHalf && displayValue >= starIndex - 0.5 && displayValue < starIndex;

          return (
            <button
              key={starIndex}
              className={`rating__star ${isActive ? 'active' : ''} ${isHalf ? 'half' : ''}`}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              disabled={readonly}
              aria-label={`Rate ${starIndex} ${starIndex === 1 ? 'star' : 'stars'}`}
              style={{
                fontSize: getStarSize(),
                color:
                  color ||
                  (isActive || isHalf ? 'var(--color-warning)' : 'var(--color-text-tertiary)'),
              }}
            >
              {getStarIcon(starIndex, displayValue)}
            </button>
          );
        })}
      </div>

      {(showValue || showLabels) && (
        <div className="rating__info">
          {showValue && (
            <span className="rating__value">{displayValue.toFixed(allowHalf ? 1 : 0)}</span>
          )}
          {showLabels && currentLabel && <span className="rating__label">{currentLabel}</span>}
        </div>
      )}

      <style>{`
        .rating {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-family: var(--font-family-base);
        }

        .rating__stars {
          display: flex;
          gap: var(--space-1);
        }

        .rating__star {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: var(--touch-target-min);
          min-height: var(--touch-target-min);
        }

        .rating__star:disabled {
          cursor: default;
        }

        .rating__star:not(:disabled):hover {
          transform: scale(1.1);
          background: var(--color-muted);
        }

        .rating__star:not(:disabled):active {
          transform: scale(0.95);
        }

        .rating__info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .rating__value {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .rating__label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        /* 防止选择 */
        .rating * {
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

// 反馈表单组件
interface FeedbackFormProps {
  onSubmit: (feedback: {
    rating: number;
    category: string;
    message: string;
    email?: string;
  }) => Promise<void>;
  categories?: string[];
  showEmail?: boolean;
  title?: string;
  placeholder?: string;
  className?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  categories = ['General', 'Bug Report', 'Feature Request', 'Performance', 'UI/UX'],
  showEmail = false,
  title = 'Share Your Feedback',
  placeholder = 'Tell us about your experience...',
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (rating === 0 || !message.trim()) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit({
          rating,
          category,
          message: message.trim(),
          email: showEmail ? email.trim() : undefined,
        });

        // 重置表单
        setRating(0);
        setMessage('');
        setEmail('');
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [rating, category, message, email, showEmail, onSubmit]
  );

  return (
    <form className={`feedback-form ${className}`} onSubmit={handleSubmit}>
      <div className="feedback-form__header">
        <h3 className="feedback-form__title">{title}</h3>
      </div>

      <div className="feedback-form__field">
        <label className="feedback-form__label">Overall Rating</label>
        <Rating value={rating} onChange={setRating} showLabels size="large" />
      </div>

      <div className="feedback-form__field">
        <label className="feedback-form__label">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="feedback-form__select"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="feedback-form__field">
        <label className="feedback-form__label">Your Feedback</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={placeholder}
          className="feedback-form__textarea"
          rows={4}
          required
        />
      </div>

      {showEmail && (
        <div className="feedback-form__field">
          <label className="feedback-form__label">Email (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="feedback-form__input"
          />
        </div>
      )}

      <div className="feedback-form__actions">
        <button
          type="submit"
          disabled={rating === 0 || !message.trim() || isSubmitting}
          className="feedback-form__submit"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>

      <style>{`
        .feedback-form {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          max-width: 500px;
          margin: 0 auto;
          font-family: var(--font-family-base);
        }

        .feedback-form__header {
          margin-bottom: var(--space-6);
          text-align: center;
        }

        .feedback-form__title {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .feedback-form__field {
          margin-bottom: var(--space-4);
        }

        .feedback-form__label {
          display: block;
          margin-bottom: var(--space-2);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .feedback-form__select,
        .feedback-form__input,
        .feedback-form__textarea {
          width: 100%;
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-input-background);
          color: var(--color-text-primary);
          font-size: var(--text-base);
          font-family: var(--font-family-base);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .feedback-form__select:focus,
        .feedback-form__input:focus,
        .feedback-form__textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .feedback-form__textarea {
          resize: vertical;
          min-height: 100px;
          line-height: var(--leading-normal);
        }

        .feedback-form__actions {
          text-align: center;
          margin-top: var(--space-6);
        }

        .feedback-form__submit {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: var(--touch-target-min);
          min-width: 120px;
        }

        .feedback-form__submit:hover:not(:disabled) {
          background: var(--color-primary-dark);
          transform: translateY(-1px);
        }

        .feedback-form__submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .feedback-form__submit:disabled {
          background: var(--color-muted);
          color: var(--color-text-tertiary);
          cursor: not-allowed;
          transform: none;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .feedback-form {
            padding: var(--space-4);
            margin: var(--space-4);
          }

          .feedback-form__submit {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
};
