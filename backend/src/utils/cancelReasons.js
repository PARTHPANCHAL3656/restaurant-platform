// The quick reasons staff pick when they turn an order away before the kitchen
// starts it. Staff never type a reason: each code maps to a friendly line the
// guest sees. Keep the codes in step with
// src/components/staff/RejectOrderDialog.jsx.
export const REJECT_REASONS = {
  closing: {
    label: "Kitchen closing soon",
    guest: "We're sorry, the kitchen is closing soon and can't take your order."
  },
  busy: {
    label: "Too many orders right now",
    guest: "We're sorry, the kitchen is too busy to take your order right now. Please try again a little later."
  },
  unavailable: {
    label: "An item isn't available",
    guest: "We're sorry, an item in your order isn't available right now."
  },
  later: {
    label: "Please order another time",
    guest: "We're sorry we can't take your order right now. We'd love to serve you another time."
  },
  guest_called: {
    label: "Guest called to cancel",
    guest: "Your order has been cancelled at your request."
  }
}

// The line a guest sees when their order was cancelled, with the restaurant's
// number so they always have somewhere to turn.
export function guestMessageForCancelled(order, phone) {
  let line = "This order was cancelled."
  if (order.noShowReason) {
    line = "Your order was cancelled because it wasn't collected."
  } else if (REJECT_REASONS[order.cancelReason]) {
    line = REJECT_REASONS[order.cancelReason].guest
  }
  return phone ? `${line} Please call us on ${phone} if you need help.` : line
}