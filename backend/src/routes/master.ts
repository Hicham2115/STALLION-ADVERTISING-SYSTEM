import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const MASTER_EMAIL = 'advertisingstallion@gmail.com';

function guardMaster(req: AuthRequest, res: Response): boolean {
  if (req.user!.email !== MASTER_EMAIL) {
    res.status(403).json({ message: 'Access denied' });
    return false;
  }
  return true;
}

// GET /api/master/overview — all agencies with stats
router.get('/overview', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!guardMaster(req, res)) return;

  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        select: {
          id: true, name: true, email: true, role: true,
          avatar: true, active: true, suspended: true,
          lastLogin: true, createdAt: true, isCloser: true,
        },
      },
      clients: { select: { id: true, archived: true } },
      leads: { select: { id: true, stage: true } },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString('en-US', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    };
  });

  const result = await Promise.all(agencies.map(async (agency) => {
    const superAdmin = agency.users.find((u) => u.role === 'SUPER_ADMIN') ?? null;
    const activeClients = agency.clients.filter((c) => !c.archived).length;
    const openLeads = agency.leads.filter((l) => l.stage !== 'CLOSED_WON' && l.stage !== 'CLOSED_LOST').length;
    const wonLeads = agency.leads.filter((l) => l.stage === 'CLOSED_WON').length;

    // Revenue totals
    const [revenueAgg, monthRevenueAgg] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { client: { agencyId: agency.id } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { client: { agencyId: agency.id }, date: { gte: startOfMonth } },
      }),
    ]);

    // CRM order counts
    const [totalOrders, confirmedOrders, shippedOrders, deliveredOrders] = await Promise.all([
      (prisma as any).crmOrder.count({ where: { client: { agencyId: agency.id } } }),
      (prisma as any).crmOrder.count({ where: { client: { agencyId: agency.id }, status: 'CONFIRMED' } }),
      (prisma as any).crmOrder.count({ where: { client: { agencyId: agency.id }, status: 'SHIPPED' } }),
      (prisma as any).crmOrder.count({ where: { client: { agencyId: agency.id }, status: 'DELIVERED' } }),
    ]);

    // 6-month revenue chart
    const revenueChart = await Promise.all(months.map(async (m) => {
      const agg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { client: { agencyId: agency.id }, date: { gte: m.start, lte: m.end } },
      });
      return { month: m.label, revenue: Number(agg._sum.amount ?? 0) };
    }));

    return {
      id: agency.id,
      name: agency.name,
      createdAt: agency.createdAt,
      superAdmin,
      teamCount: agency.users.filter((u) => u.role !== 'SUPER_ADMIN').length,
      totalMembers: agency.users.length,
      activeClients,
      totalClients: agency.clients.length,
      openLeads,
      wonLeads,
      totalLeads: agency.leads.length,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      monthRevenue: Number(monthRevenueAgg._sum.amount ?? 0),
      orders: { total: totalOrders, confirmed: confirmedOrders, shipped: shippedOrders, delivered: deliveredOrders },
      revenueChart,
      members: agency.users,
    };
  }));

  res.json(result);
});

export default router;
