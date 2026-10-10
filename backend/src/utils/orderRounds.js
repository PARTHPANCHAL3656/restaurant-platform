// Helpers for dine-in orders that are cooked and served round by round.

export const STEPS = ["Received", "Preparing", "Ready", "Served"]

// Orders created before rounds existed have no `rounds` list. Build one from
// what the order already says (items carry their round number, and
// servedThroughRound says which are done). Does not save; the caller decides.
export function ensureRounds(order) {
  if (order.orderType === "takeout") return false
  if (order.rounds && order.rounds.length > 0) return false

  const maxRound = order.items.reduce((m, i) => Math.max(m, i.round || 1), 0)
  if (maxRound === 0) return false

  for (let r = 1; r <= maxRound; r++) {
    const served = r <= order.servedThroughRound || order.status === "Served"
    order.rounds.push({
      round: r,
      status: served ? "Served" : order.status,
      placedAt: order.createdAt,
      servedAt: served ? order.updatedAt : null
    })
  }
  return true
}

// The order's overall status = the status of its oldest round that hasn't
// been served yet (that's the food arriving at the table next). All rounds
// served = Served. No rounds (a seated table with nothing ordered) = unchanged.
export function deriveStatus(order) {
  if (order.status === "Cancelled") return "Cancelled"
  if (!order.rounds || order.rounds.length === 0) return order.status

  const pending = order.rounds
    .filter(r => r.status !== "Served")
    .sort((a, b) => a.round - b.round)

  return pending.length === 0 ? "Served" : pending[0].status
}

// Highest round N such that every round up to N is served.
export function servedThrough(order) {
  let n = 0
  const sorted = [...order.rounds].sort((a, b) => a.round - b.round)
  for (const r of sorted) {
    if (r.status === "Served") n = r.round
    else break
  }
  return n
}

// Sets a round's status and keeps its timestamps honest: moving forward stamps
// the steps passed, moving back clears the ones undone.
export function applyRoundStatus(round, status, now = new Date()) {
  const to = STEPS.indexOf(status)
  round.status = status
  if (to >= 1 && !round.startedAt) round.startedAt = now
  if (to >= 2 && !round.readyAt) round.readyAt = now
  if (to >= 3 && !round.servedAt) round.servedAt = now
  if (to < 3) round.servedAt = null
  if (to < 2) round.readyAt = null
  if (to < 1) round.startedAt = null
}

// For the whole-order status endpoint: every round that isn't already served
// moves to the new status (all rounds, if the new status is Served).
export function setUnservedRoundsTo(order, status) {
  order.rounds.forEach(r => {
    if (r.status !== "Served" || status === "Served") {
      applyRoundStatus(r, status)
    }
  })
}