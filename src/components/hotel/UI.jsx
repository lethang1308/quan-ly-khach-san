import { useId, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, X, AlertCircle, ArrowRight, Hotel, Inbox } from 'lucide-react';
import { errorMessage } from '@/utils/hotel';
import { BOARD_STATES, BOOKING_STATES } from '@/constants/hotel';

export function Brand({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Hotel size={22} />
      </span>
      <div>
        <strong>EduMatch</strong>
        {!compact && <small>Quản lý khách sạn</small>}
      </div>
    </div>
  );
}
export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  busy,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      className={'btn btn-' + variant + ' ' + className}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}
export function Field({
  label,
  as: Component = 'input',
  hint,
  children,
  className = '',
  ...props
}) {
  const id = useId();
  return (
    <div className={'field ' + className}>
      <label htmlFor={id}>
        {label}
        {props.required && (
          <span aria-hidden="true" className="required">
            {' '}
            *
          </span>
        )}
      </label>
      <Component
        id={id}
        className="control"
        aria-describedby={hint ? id + '-hint' : undefined}
        onInput={props.type === 'date' ? props.onChange : undefined}
        {...props}
      >
        {children}
      </Component>
      {hint && <small id={id + '-hint'}>{hint}</small>}
    </div>
  );
}
export function Modal({ title, description, children, onClose, busy, wide = false }) {
  const [returnFocus] = useState(() => document.activeElement);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={'modal-content ' + (wide ? 'modal-wide' : '')}
          onPointerDownOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            if (returnFocus?.isConnected) {
              event.preventDefault();
              returnFocus.focus();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          {...(!description ? { 'aria-describedby': undefined } : {})}
        >
          <div className="modal-header">
            <div>
              <Dialog.Title asChild>
                <h2>{title}</h2>
              </Dialog.Title>
              {description && (
                <Dialog.Description className="muted">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" aria-label="Đóng hộp thoại" disabled={busy}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          <div className="modal-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Alert({ error, children }) {
  if (!error && !children) return null;
  return (
    <div className="alert" role="alert">
      <AlertCircle size={18} />
      <div>{children || errorMessage(error)}</div>
    </div>
  );
}
export function Empty({ title = 'Chưa có dữ liệu', description, action }) {
  return (
    <div className="empty">
      <Inbox size={32} />
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {action}
    </div>
  );
}
export function Skeleton({ rows = 3 }) {
  return (
    <div aria-label="Đang tải dữ liệu" role="status" className="skeleton-group">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function ResourceState({ resource, children, rows }) {
  if (resource.loading) return <Skeleton rows={rows} />;
  if (resource.error)
    return (
      <div className="stack">
        <Alert error={resource.error} />
        <Button variant="secondary" onClick={resource.reload}>
          Thử lại
        </Button>
      </div>
    );
  return children;
}
export function PageTitle({ title, description, action }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
export function Status({ state, board = false }) {
  const config = board
    ? BOARD_STATES[state]
    : { label: BOOKING_STATES[state] || state, className: 'booking-' + state?.toLowerCase() };
  return <span className={'status ' + (config?.className || '')}>{config?.label || state}</span>;
}
export function Pagination({ data, page, onChange }) {
  if (!data || data.last_page <= 1) return null;
  return (
    <div className="pagination">
      <span>
        {data.total} kết quả · Trang {page}/{data.last_page}
      </span>
      <div className="inline">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Trước
        </Button>
        <Button
          variant="secondary"
          disabled={page >= data.last_page}
          onClick={() => onChange(page + 1)}
          icon={ArrowRight}
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
}
