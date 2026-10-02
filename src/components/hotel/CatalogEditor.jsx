import { useRef, useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogService } from '@/services/catalogService';
import { today, addDays } from '@/utils/hotel';
import { Modal, Field, Button, Alert } from './UI';
const names = {
  'room-types': 'loại phòng',
  rooms: 'phòng',
  services: 'dịch vụ',
  staff: 'nhân viên',
  'rate-periods': 'đợt giá mùa',
};
const defaults = {
  'room-types': { name: '', capacity: 2, base_rate: 0, active: true },
  rooms: { room_no: '', floor: 1, type_id: '', active: true },
  services: { name: '', unit: '', price: 0, active: true },
  staff: { name: '', phone: '', role: 'receptionist', password: '', is_active: true },
  'rate-periods': {
    name: '',
    type_id: '',
    start_date: today(),
    end_date: addDays(today(), 1),
    amount: 0,
  },
};
export default function CatalogEditor({ resource, item, roomTypes = [], onClose, onDone }) {
  const initial = Object.fromEntries(
    Object.keys(defaults[resource]).map((key) => [key, item?.[key] ?? defaults[resource][key]])
  );
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  const change = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const payload = { ...form };
    for (const key of ['capacity', 'base_rate', 'floor', 'type_id', 'price', 'amount'])
      if (key in payload) payload[key] = Number(payload[key]);
    if (resource === 'staff' && item && !payload.password) delete payload.password;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await catalogService.save(resource, payload, item?.id);
      toast.success('Đã lưu ' + names[resource] + '.');
      onDone();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  };
  return (
    <Modal title={(item ? 'Chỉnh sửa ' : 'Thêm ') + names[resource]} busy={busy} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <fieldset disabled={busy} className="form-grid border-0 m-0 p-0">
          {'name' in form && (
            <Field
              className="span-full"
              label={resource === 'staff' ? 'Họ và tên' : 'Tên ' + names[resource]}
              required
              maxLength={resource === 'room-types' ? 50 : resource === 'staff' ? 255 : 100}
              value={form.name}
              onChange={change('name')}
            />
          )}
          {resource === 'room-types' && (
            <>
              <Field
                label="Sức chứa"
                type="number"
                required
                min="1"
                max="1000"
                step="1"
                value={form.capacity}
                onChange={change('capacity')}
              />
              <Field
                label="Giá cơ bản mỗi đêm (VNĐ)"
                type="number"
                min="0"
                max="99999999999999"
                required
                step="1"
                value={form.base_rate}
                onChange={change('base_rate')}
              />
            </>
          )}
          {resource === 'rooms' && (
            <>
              <Field
                label="Số phòng"
                required
                maxLength={20}
                value={form.room_no}
                onChange={change('room_no')}
              />
              <Field
                label="Tầng"
                type="number"
                required
                min="1"
                max="1000"
                step="1"
                value={form.floor}
                onChange={change('floor')}
              />
            </>
          )}
          {'type_id' in form && (
            <Field
              className="span-full"
              label="Loại phòng"
              as="select"
              required
              value={form.type_id}
              onChange={change('type_id')}
            >
              <option value="">Chọn loại phòng</option>
              {roomTypes.map((type) => (
                <option value={type.id} key={type.id}>
                  {type.name}
                </option>
              ))}
            </Field>
          )}
          {resource === 'services' && (
            <>
              <Field
                label="Đơn vị tính"
                required
                maxLength={50}
                value={form.unit}
                onChange={change('unit')}
              />
              <Field
                label="Đơn giá (VNĐ)"
                type="number"
                required
                min="0"
                max="99999999999999"
                step="1"
                value={form.price}
                onChange={change('price')}
              />
            </>
          )}
          {resource === 'staff' && (
            <>
              <Field
                label="Số điện thoại đăng nhập"
                type="tel"
                required
                pattern="0[0-9]{9}"
                maxLength={10}
                value={form.phone}
                onChange={change('phone')}
              />
              <Field label="Vai trò" as="select" value={form.role} onChange={change('role')}>
                <option value="receptionist">Lễ tân</option>
                <option value="housekeeping">Buồng phòng</option>
              </Field>
              <Field
                className="span-full"
                label={item ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'}
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required={!item}
                value={form.password}
                onChange={change('password')}
                hint="Tối thiểu 8 ký tự."
              />
            </>
          )}
          {resource === 'rate-periods' && (
            <>
              <Field
                label="Ngày bắt đầu"
                type="date"
                required
                value={form.start_date}
                onChange={change('start_date')}
              />
              <Field
                label="Ngày kết thúc"
                type="date"
                required
                min={addDays(form.start_date || today(), 1)}
                value={form.end_date}
                onChange={change('end_date')}
                hint="Không áp dụng giá mùa cho đêm này."
              />
              <Field
                className="span-full"
                label="Đơn giá mỗi đêm (VNĐ)"
                type="number"
                required
                min="0"
                max="99999999999999"
                step="1"
                value={form.amount}
                onChange={change('amount')}
              />
            </>
          )}
          {'active' in form && (
            <label className="check-label span-full">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />
              Đang kinh doanh
            </label>
          )}
          {'is_active' in form && (
            <label className="check-label span-full">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              Cho phép đăng nhập
            </label>
          )}
        </fieldset>
        <Alert error={error} />
        <div className="modal-footer">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" icon={Save} busy={busy}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
