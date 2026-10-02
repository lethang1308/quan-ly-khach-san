import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResource } from '@/hooks/useResource';
import { stayService } from '@/services/stayService';
import { requestIdentity } from '@/utils/hotel';
import { Modal, Button, Alert, ResourceState } from '@/components/hotel/UI';
import BillDetails from '@/components/hotel/BillDetails';
export default function CheckoutModal({ booking, onClose, onDone }) {
  const navigate = useNavigate();
  const preview = useResource(['checkout', booking.id], (signal) =>
    stayService.preview(booking.id, signal)
  );
  const [method, setMethod] = useState('CASH');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const identity = useRef(null);
  const submitting = useRef(false);
  const bill = preview.data?.data;
  const pay = async () => {
    if (!bill || submitting.current) return;
    const payload = { booking_id: bill.id, amount: bill.total, method };
    identity.current = requestIdentity(identity.current, payload);
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await stayService.checkOut(bill.id, {
        amount: bill.total,
        method,
        request_key: identity.current.key,
      });
      toast.success('Đã thanh toán và trả phòng.');
      onDone();
      onClose();
      navigate('/reception/invoices/' + response.data.invoice.id);
    } catch (err) {
      setError(err);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      title={'Thanh toán & trả phòng · ' + booking.booking_code}
      description="Kiểm tra bảng kê trước khi xác nhận đã thu đủ tiền."
      wide
      busy={busy}
      onClose={onClose}
    >
      <ResourceState resource={preview}>
        {bill && (
          <div className="stack">
            <div className="between">
              <h3>{bill.customer.name}</h3>
              <span className="muted text-xs">CCCD: {bill.customer.document_no}</span>
            </div>
            <BillDetails booking={bill} />
            {bill.state === 'IN_HOUSE' && (
              <>
                <h3>Phương thức thanh toán</h3>
                <div className="inline">
                  <label className="quote-room">
                    <input
                      type="radio"
                      name="method"
                      value="CASH"
                      checked={method === 'CASH'}
                      disabled={busy}
                      onChange={() => setMethod('CASH')}
                    />
                    <Banknote size={18} />
                    Tiền mặt
                  </label>
                  <label className="quote-room">
                    <input
                      type="radio"
                      name="method"
                      value="TRANSFER"
                      checked={method === 'TRANSFER'}
                      disabled={busy}
                      onChange={() => setMethod('TRANSFER')}
                    />
                    <CreditCard size={18} />
                    Chuyển khoản
                  </label>
                </div>
                <p className="note">
                  Chỉ xác nhận sau khi đã nhận tiền. Sau trả phòng, tất cả phòng của đơn được chuyển
                  sang cần dọn dẹp.
                </p>
              </>
            )}
            <Alert error={error} />
            <div className="modal-footer">
              <Button variant="secondary" disabled={busy} onClick={onClose}>
                Đóng
              </Button>
              {bill.state === 'IN_HOUSE' ? (
                <Button busy={busy} icon={Check} onClick={pay}>
                  Xác nhận thanh toán & trả phòng
                </Button>
              ) : (
                bill.invoice && (
                  <Button onClick={() => navigate('/reception/invoices/' + bill.invoice.id)}>
                    Mở hóa đơn
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </ResourceState>
    </Modal>
  );
}
