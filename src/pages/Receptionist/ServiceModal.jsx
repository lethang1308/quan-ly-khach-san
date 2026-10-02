import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogService } from '@/services/catalogService';
import { stayService } from '@/services/stayService';
import { useResource } from '@/hooks/useResource';
import { money } from '@/utils/hotel';
import { Modal, Field, Button, Alert, ResourceState } from '@/components/hotel/UI';
export default function ServiceModal({ booking, onClose, onDone }) {
  const [room, setRoom] = useState(
    String(booking.rooms.find((stay) => stay.state === 'IN_HOUSE')?.id || '')
  );
  const [service, setService] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  const services = useResource('stay-services', (signal) => catalogService.all('services', signal));
  const selected = services.data?.find((item) => String(item.id) === service);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await stayService.service(room, { service_id: Number(service), quantity: Number(quantity) });
      toast.success('Đã ghi nhận dịch vụ.');
      onDone();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Ghi nhận dịch vụ"
      description={booking.booking_code + ' · ' + booking.customer.name}
      busy={busy}
      onClose={onClose}
    >
      <ResourceState resource={services}>
        <form className="stack" onSubmit={submit}>
          <fieldset disabled={busy} className="stack border-0 p-0 m-0">
            <Field
              label="Phòng sử dụng"
              as="select"
              required
              value={room}
              onChange={(event) => setRoom(event.target.value)}
            >
              {booking.rooms
                .filter((stay) => stay.state === 'IN_HOUSE')
                .map((stay) => (
                  <option value={stay.id} key={stay.id}>
                    Phòng {stay.room.room_no}
                  </option>
                ))}
            </Field>
            <Field
              label="Dịch vụ"
              as="select"
              required
              value={service}
              onChange={(event) => setService(event.target.value)}
            >
              <option value="">Chọn dịch vụ</option>
              {services.data
                ?.filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({money(item.price)} / {item.unit})
                  </option>
                ))}
            </Field>
            <Field
              label="Số lượng"
              type="number"
              min="1"
              max="1000000"
              step="1"
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            {selected && (
              <div className="total-line">
                <span>Thành tiền</span>
                <strong className="money">{money(selected.price * Number(quantity))}</strong>
              </div>
            )}
          </fieldset>
          <Alert error={error} />
          <Button type="submit" icon={Plus} busy={busy} disabled={!service || !room}>
            Ghi nhận dịch vụ
          </Button>
        </form>
      </ResourceState>
    </Modal>
  );
}
