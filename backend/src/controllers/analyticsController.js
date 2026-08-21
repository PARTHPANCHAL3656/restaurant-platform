import Invoice from "../models/Invoice.js"

// -------------------------------------------------------
// SHARED GROUND RULE FOR ALL ANALYTICS:
// Every endpoint here reads ONLY status: "paid" invoices.
// A paid invoice is a confirmed, completed visit — the same
// event that already updates the Customer record (Part 1).
// Unpaid/refunded invoices never count toward revenue, AOV,
// footfall, rush hours, or item performance.
// -------------------------------------------------------

// GET /api/analytics/revenue?period=day|week|month&range=30
// Buckets paid invoice totals by period, and compares the most
// recent bucket to the one before it for a growth %.
// "range" = how many buckets to return (default 14 for day, 12 for week/month)
export const getRevenueStats = async (req, res) => {
  try {
    const period = ["day", "week", "month"].includes(req.query.period)
      ? req.query.period
      : "day"

    const defaultRange = period === "day" ? 14 : 12
    const range = Math.min(parseInt(req.query.range) || defaultRange, 90)

    // $dateTrunc buckets createdAt into clean period boundaries.
    // "week" starts Monday to match typical restaurant staffing weeks.
    const buckets = await Invoice.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$createdAt",
              unit: period,
              ...(period === "week" ? { startOfWeek: "monday" } : {})
            }
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: range }
    ])

    // Sort back to chronological order for charting
    buckets.sort((a, b) => a._id - b._id)

    const series = buckets.map((b) => ({
      period: b._id,
      revenue: b.revenue,
      orders: b.orders
    }))

    const current = series[series.length - 1]?.revenue || 0
    const previous = series[series.length - 2]?.revenue || 0
    const growthPercent = previous === 0
      ? (current > 0 ? 100 : 0)
      : Number((((current - previous) / previous) * 100).toFixed(1))

    res.json({
      period,
      series,
      currentPeriodRevenue: current,
      previousPeriodRevenue: previous,
      growthPercent
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/analytics/aov?period=day|week|month&range=30
// Average order value = revenue / paid invoice count, bucketed the same
// way as revenue so it can sit on the same trend chart.
export const getAOV = async (req, res) => {
  try {
    const period = ["day", "week", "month"].includes(req.query.period)
      ? req.query.period
      : "day"
    const defaultRange = period === "day" ? 14 : 12
    const range = Math.min(parseInt(req.query.range) || defaultRange, 90)

    const buckets = await Invoice.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$createdAt",
              unit: period,
              ...(period === "week" ? { startOfWeek: "monday" } : {})
            }
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: range }
    ])

    buckets.sort((a, b) => a._id - b._id)

    const series = buckets.map((b) => ({
      period: b._id,
      aov: b.orders === 0 ? 0 : Number((b.revenue / b.orders).toFixed(2))
    }))

    const totalRevenue = buckets.reduce((sum, b) => sum + b.revenue, 0)
    const totalOrders = buckets.reduce((sum, b) => sum + b.orders, 0)
    const overallAOV = totalOrders === 0 ? 0 : Number((totalRevenue / totalOrders).toFixed(2))

    res.json({ period, series, overallAOV })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/analytics/footfall?range=30
// Covers per day = count of paid invoices per day. This counts VISITS,
// not unique people — a guest without a phone on file still shows up
// here (they just won't appear in Customer-based CRM metrics in Part 3).
export const getFootfall = async (req, res) => {
  try {
    const range = Math.min(parseInt(req.query.range) || 30, 90)

    const buckets = await Invoice.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$createdAt", unit: "day" } },
          covers: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: range }
    ])

    buckets.sort((a, b) => a._id - b._id)

    const series = buckets.map((b) => ({ date: b._id, covers: b.covers }))
    const totalCovers = series.reduce((sum, b) => sum + b.covers, 0)
    const avgCoversPerDay = series.length === 0
      ? 0
      : Number((totalCovers / series.length).toFixed(1))

    res.json({ series, totalCovers, avgCoversPerDay })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/analytics/rush-hours
// Heatmap grid: rows = day of week (1=Sunday..7=Saturday, Mongo's $dayOfWeek
// convention), cols = hour of day (0-23). Value = paid invoice count.
// Free to compute — pure aggregation on Invoice.createdAt.
export const getRushHours = async (req, res) => {
  try {
    const raw = await Invoice.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$createdAt" },
            hour: { $hour: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      }
    ])

    // Fill a dense 7x24 grid so the frontend never has to handle
    // missing cells — empty slots are just 0.
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0))
    raw.forEach((r) => {
      const dayIndex = r._id.dayOfWeek - 1 // Mongo is 1-indexed (Sun=1)
      grid[dayIndex][r._id.hour] = r.count
    })

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    res.json({ dayLabels, grid })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/analytics/items?limit=10
// Top sellers by revenue and by quantity, plus slow movers (items that
// exist on paid invoices but rank lowest by quantity sold).
// Pulled from Invoice.items — the final, actually-billed line items —
// rather than Order.items, since an Order can carry unbilled rounds.
export const getItemPerformance = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)

    const items = await Invoice.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qtySold: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
        }
      },
      { $project: { _id: 0, name: "$_id", qtySold: 1, revenue: 1 } }
    ])

    const topByRevenue = [...items].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
    const topByQty = [...items].sort((a, b) => b.qtySold - a.qtySold).slice(0, limit)
    const slowMovers = [...items].sort((a, b) => a.qtySold - b.qtySold).slice(0, limit)

    res.json({ topByRevenue, topByQty, slowMovers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}