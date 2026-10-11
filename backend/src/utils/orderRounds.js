// Helpers for dine-in orders that are cooked and served round by round.

export const STEPS = ["Received", "Preparing", "Ready", "Served"]

// Orders created before rounds existed have no `rounds` list. Build one from
// what the order already says (items carry their round number, and
// servedThroughRound says which are done). Does not save; the caller decides.
export function ensureRounds(order) {
  if (order.orderType === "takeout") return false
  let changed = false

  // One entry per round number. If a round was ever recorded twice, keep the
  // most advanced copy so nothing shows up twice on the kitchen board.
  if (order.rounds && order.rounds.length > 1) {
    const best = new Map()
    for (const r of order.rounds) {
      const kept = best.get(r.round)
      if (!kept || STEPS.indexOf(r.status) > STEPS.indexOf(kept.status)) best.set(r.round, r)
    }
    if (best.size !== order.rounds.length) {
      order.rounds = [...best.values()]
        .sort((a, b) => a.round - b.round)
        .map(r => (typeof r.toObject === "function" ? r.toObject() : { ...r }))
      changed = true
    }
  }

  // Make sure every round that has items has an entry. An order with no rounds
  // list at all (made before rounds existed) is rebuilt from what it already
  // says; a missing round inside an otherwise-tracked order starts as Received
  // so someone sees it.
  const maxRound = order.items.reduce((m, i) => Math.max(m, i.round || 1), 0)
  const legacy = !order.rounds || order.rounds.length === 0
  const have = new Set((order.rounds || []).map(r => r.round))
  for (let r = 1; r <= maxRound; r++) {
    if (have.has(r)) continue
    const served = legacy && (r <= order.servedThroughRound || order.status === "Served")
    order.rounds.push({
      round: r,
      status: served ? "Served" : legacy ? order.status : "Received",
      placedAt: order.createdAt,
      servedAt: served ? order.updatedAt : null
    })
    changed = true
  }
  return changed
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