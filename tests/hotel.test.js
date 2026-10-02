import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  requestIdentity,
  today,
  addDays,
  nights,
  canCheckIn,
  dailyRevenue,
  errorMessage,
} from '../src/utils/hotel.js';
import { ROUTE_ROLES, canAccess, roleHome } from '../src/constants/hotel.js';
test('rate limit errors explain Retry-After without encouraging immediate retries', () => {
  assert.match(
    errorMessage({ response: { status: 429, data: {}, headers: { 'retry-after': '23' } } }),
    /23 giây/
  );
  assert.match(errorMessage({ response: { status: 429, data: { retry_after: 18 } } }), /18 giây/);
  assert.match(errorMessage({ response: { status: 429 } }), /một phút/);
});
test('frontend role matrix grants only the intended workspace capabilities', () => {
  for (const role of ['manager', 'receptionist', 'housekeeping'])
    assert.equal(canAccess(role, ROUTE_ROLES.board), true);
  assert.equal(canAccess('manager', ROUTE_ROLES.bookings), false);
  assert.equal(canAccess('housekeeping', ROUTE_ROLES.invoice), false);
  assert.equal(canAccess('receptionist', ROUTE_ROLES.manager), false);
  assert.equal(canAccess('housekeeping', ROUTE_ROLES.housekeeping), true);
  assert.equal(canAccess('admin', ROUTE_ROLES.manager), false);
  assert.equal(roleHome('receptionist'), '/reception/room-board');
});
test('booking and payment retries keep the same key until payload changes', () => {
  const first = requestIdentity(null, { amount: 2620000, method: 'CASH' }, () => 'first-key');
  const retry = requestIdentity(first, { amount: 2620000, method: 'CASH' }, () => 'retry-key');
  assert.equal(retry.key, first.key);
  const changed = requestIdentity(
    first,
    { amount: 2620000, method: 'TRANSFER' },
    () => 'changed-key'
  );
  assert.equal(changed.key, 'changed-key');
});
test('Vietnam timezone changes day before UTC and half-open nights remain correct', () => {
  assert.equal(today(new Date('2026-12-23T18:30:00Z')), '2026-12-24');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(nights('2026-12-23', '2026-12-26'), 3);
  assert.equal(nights('2026-12-26', '2026-12-23'), -3);
});
test('check-in is restricted to arrival today for every room in the booking', () => {
  const booking = {
    state: 'CONFIRMED',
    rooms: [{ start_date: '2026-12-23' }, { start_date: '2026-12-24' }],
  };
  assert.equal(canCheckIn(booking, '2026-12-23'), false);
  booking.rooms[1].start_date = '2026-12-23';
  assert.equal(canCheckIn(booking, '2026-12-23'), true);
  booking.state = 'COMPLETED';
  assert.equal(canCheckIn(booking, '2026-12-23'), false);
});
test('revenue groups real payments by local Vietnam payment day', () => {
  assert.deepEqual(
    dailyRevenue([
      { paid_at: '2026-12-23T18:30:00Z', amount: 2400000 },
      { paid_at: '2026-12-24T08:00:00+07:00', amount: 220000 },
    ]),
    [{ date: '2026-12-24', amount: 2620000 }]
  );
});
test('check-in follows the server business day even if the browser clock is different', () => {
  const booking = {
    state: 'CONFIRMED',
    business_date: '2026-12-23',
    rooms: [{ start_date: '2026-12-23' }],
  };
  assert.equal(canCheckIn(booking), true);
  booking.business_date = '2026-12-24';
  assert.equal(canCheckIn(booking), false);
});
test('not-ready room errors explain the actual room and actionable state in Vietnamese', () => {
  const message = (state) =>
    errorMessage({
      response: {
        status: 409,
        data: { code: 'ROOM_NOT_READY', details: { room_no: '101', state } },
      },
    });
  assert.match(message('DIRTY'), /Phòng 101.*đang dọn dẹp/);
  assert.match(message('MAINTENANCE'), /Phòng 101.*đang bảo trì/);
});
