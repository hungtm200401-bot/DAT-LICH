// Match contact identifiers, never a display name: two clients may share a name.
export function normalizeCustomerPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('84') && digits.length === 11 ? '0' + digits.slice(2) : digits;
}

export function customerAppointments(customer, appointments = []) {
  const phone = normalizeCustomerPhone(customer.phone);
  const email = String(customer.email || '').trim().toLowerCase();
  return appointments.filter(appointment => {
    const other = normalizeCustomerPhone(appointment.phone);
    if (phone) return other === phone;
    return !other && !!email && String(appointment.email || '').trim().toLowerCase() === email;
  }).sort((a, b) => `${b.date || ''}T${b.time || ''}`.localeCompare(`${a.date || ''}T${a.time || ''}`) || String(a.code).localeCompare(String(b.code)));
}

export function customerPayment(appointment, transactions = []) {
  const amount = value => Math.max(0, Number(value) || 0);
  const entries = transactions.filter(entry => entry.appointmentCode === appointment.code);
  let received, refunded;
  if (appointment.finance) {
    received = amount(appointment.finance.received);
    refunded = amount(appointment.finance.refunded);
  } else if (entries.length) {
    received = entries.filter(e => ['deposit', 'balance', 'opening'].includes(e.kind)).reduce((sum, e) => sum + amount(e.amount), 0);
    refunded = entries.filter(e => ['refund', 'opening_refund'].includes(e.kind)).reduce((sum, e) => sum + amount(e.amount), 0);
  } else {
    received = amount(appointment.deposit);
    refunded = 0;
  }
  const net = received - refunded;
  return { received, refunded, net, remaining: appointment.status === 'cancelled' ? 0 : Math.max(0, amount(appointment.total) - net) };
}

export function customerSummary(customer, state) {
  const appointments = customerAppointments(customer, state.appointments);
  const payments = appointments.map(a => customerPayment(a, state.paymentTransactions));
  return {
    appointments, count: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    received: payments.reduce((sum, p) => sum + p.received, 0),
    refunded: payments.reduce((sum, p) => sum + p.refunded, 0),
    net: payments.reduce((sum, p) => sum + p.net, 0),
    remaining: payments.reduce((sum, p) => sum + p.remaining, 0),
  };
}
