const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

function buildWhere(req) {
  const category = req.query.category || null;
  const supplierId = req.query.supplierId || null;
  const where = { isActive: true };
  if (category) where.category = category;
  if (supplierId) where.supplierId = supplierId;
  return where;
}

exports.getInventorySummary = async (req, res) => {
  try {
    const { InventoryItem, StockHistory } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildWhere(req);

    const items = await InventoryItem.findAll({ where });
    const totalItems = items.length;
    const totalValue = items.reduce((s, i) => s + Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0), 0);
    const lowStockCount = items.filter((i) => Number(i.currentStock || 0) < Number(i.reorderLevel || 0)).length;

    const today = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(today + 'T00:00:00');
    const todayEnd = new Date(today + 'T23:59:59');
    const todayHistory = await StockHistory.findAll({
      where: {
        movementType: 'OUT',
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });
    const stockConsumedToday = todayHistory.reduce((s, h) => s + Number(h.quantity || 0), 0);

    res.json({
      totalItems,
      totalInventoryValue: totalValue,
      lowStockItems: lowStockCount,
      stockConsumedToday,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getInventorySummary error:', error);
    res.status(500).json({ message: 'Failed to load inventory summary', error: error.message });
  }
};

exports.getCurrentStock = async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const where = buildWhere(req);

    const items = await InventoryItem.findAll({ where, order: [['name', 'ASC']] });

    const currentStock = items.map((i) => {
      const qty = Number(i.currentStock || 0);
      const reorder = Number(i.reorderLevel || 0);
      return {
        id: i.id,
        itemName: i.name,
        category: i.category || 'Uncategorized',
        currentQuantity: qty,
        reorderLevel: reorder,
        unit: i.unit || '-',
        stockStatus: qty < reorder ? (qty <= reorder * 0.5 ? 'Critical' : 'Low') : 'OK',
      };
    });

    res.json({ currentStock, totalItems: items.length });
  } catch (error) {
    console.error('getCurrentStock error:', error);
    res.status(500).json({ message: 'Failed to load current stock', error: error.message });
  }
};

exports.getLowStockItems = async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const where = buildWhere(req);

    const items = await InventoryItem.findAll({ where, order: [['currentStock', 'ASC']] });
    const lowStock = items
      .filter((i) => Number(i.currentStock || 0) < Number(i.reorderLevel || 0))
      .map((i) => ({
        id: i.id,
        itemName: i.name,
        category: i.category || 'Uncategorized',
        remainingQuantity: Number(i.currentStock || 0),
        minimumRequiredLevel: Number(i.reorderLevel || 0),
        unit: i.unit || '-',
      }));

    res.json({ lowStock });
  } catch (error) {
    console.error('getLowStockItems error:', error);
    res.status(500).json({ message: 'Failed to load low stock items', error: error.message });
  }
};

exports.getStockMovement = async (req, res) => {
  try {
    const { StockHistory, InventoryItem } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const history = await StockHistory.findAll({ where: dateFilter, order: [['createdAt', 'DESC']], limit: 300 });

    const itemMap = {};
    const items = await InventoryItem.findAll({ attributes: ['id', 'name'] });
    items.forEach((i) => { itemMap[i.id] = i.name; });

    const stockAdded = history.filter((h) => h.movementType === 'IN').reduce((s, h) => s + Number(h.quantity || 0), 0);
    const stockUsed = history.filter((h) => h.movementType === 'OUT').reduce((s, h) => s + Number(h.quantity || 0), 0);
    const stockAdjustments = history.filter((h) => h.movementType === 'ADJUSTMENT').length;

    const movements = history.slice(0, 100).map((h) => ({
      id: h.id,
      itemName: itemMap[h.itemId] || 'Unknown',
      movementType: h.movementType,
      quantity: Number(h.quantity || 0),
      previousStock: Number(h.previousStock || 0),
      newStock: Number(h.newStock || 0),
      date: (h.createdAt || '').toString().slice(0, 10),
      notes: (h.notes || '').slice(0, 80),
    }));

    res.json({
      stockAdded,
      stockUsed,
      stockAdjustments,
      movements,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getStockMovement error:', error);
    res.status(500).json({ message: 'Failed to load stock movement', error: error.message });
  }
};

exports.getInventoryConsumption = async (req, res) => {
  try {
    const { StockHistory, InventoryItem } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] }, movementType: 'OUT' };
    const history = await StockHistory.findAll({ where: dateFilter });

    const byItem = {};
    const itemMap = {};
    const items = await InventoryItem.findAll({ attributes: ['id', 'name', 'category'] });
    items.forEach((i) => { itemMap[i.id] = i; });

    history.forEach((h) => {
      const id = h.itemId;
      if (!byItem[id]) byItem[id] = { itemId: id, quantity: 0 };
      byItem[id].quantity += Number(h.quantity || 0);
    });

    const consumption = Object.values(byItem)
      .map((r) => ({
        itemName: (itemMap[r.itemId] && itemMap[r.itemId].name) || 'Unknown',
        category: (itemMap[r.itemId] && itemMap[r.itemId].category) || 'Uncategorized',
        quantityConsumed: r.quantity,
      }))
      .sort((a, b) => b.quantityConsumed - a.quantityConsumed);

    const byCategory = {};
    consumption.forEach((c) => {
      const cat = c.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + c.quantityConsumed;
    });

    res.json({
      consumption: consumption.slice(0, 80),
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getInventoryConsumption error:', error);
    res.status(500).json({ message: 'Failed to load consumption', error: error.message });
  }
};

exports.getInventoryValuation = async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const where = buildWhere(req);

    const items = await InventoryItem.findAll({ where, order: [['name', 'ASC']] });

    let totalStockValue = 0;
    const valuation = items.map((i) => {
      const qty = Number(i.currentStock || 0);
      const cost = Number(i.unitPrice || i.costPrice || 0);
      const value = qty * cost;
      totalStockValue += value;
      return {
        itemName: i.name,
        category: i.category || 'Uncategorized',
        itemCost: cost,
        quantity: qty,
        totalStockValue: value,
      };
    });

    const byCategory = {};
    valuation.forEach((v) => {
      const cat = v.category;
      if (!byCategory[cat]) byCategory[cat] = 0;
      byCategory[cat] += v.totalStockValue;
    });

    res.json({
      totalStockValue,
      valuation: valuation.slice(0, 150),
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
    });
  } catch (error) {
    console.error('getInventoryValuation error:', error);
    res.status(500).json({ message: 'Failed to load valuation', error: error.message });
  }
};

exports.getInventoryTrend = async (req, res) => {
  try {
    const { StockHistory, InventoryItem } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const history = await StockHistory.findAll({ where: dateFilter });

    const byDate = {};
    history.forEach((h) => {
      const d = (h.createdAt || '').toString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { in: 0, out: 0 };
      if (h.movementType === 'IN') byDate[d].in += Number(h.quantity || 0);
      if (h.movementType === 'OUT') byDate[d].out += Number(h.quantity || 0);
    });

    const trend = Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, stockIn: v.in, stockOut: v.out }));

    const outHistory = history.filter((h) => h.movementType === 'OUT');
    const byItem = {};
    const itemMap = {};
    const items = await InventoryItem.findAll({ attributes: ['id', 'name', 'category'] });
    items.forEach((i) => { itemMap[i.id] = i; });
    outHistory.forEach((h) => {
      const id = h.itemId;
      if (!byItem[id]) byItem[id] = 0;
      byItem[id] += Number(h.quantity || 0);
    });

    const categoryConsumption = {};
    Object.entries(byItem).forEach(([id, qty]) => {
      const cat = (itemMap[id] && itemMap[id].category) || 'Uncategorized';
      categoryConsumption[cat] = (categoryConsumption[cat] || 0) + qty;
    });

    const categoryDistribution = Object.entries(categoryConsumption).map(([name, value]) => ({ name, value }));

    res.json({ trend, categoryDistribution, startDate, endDate });
  } catch (error) {
    console.error('getInventoryTrend error:', error);
    res.status(500).json({ message: 'Failed to load trend', error: error.message });
  }
};

exports.exportInventoryReport = async (req, res) => {
  try {
    const { InventoryItem, StockHistory } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildWhere(req);

    const items = await InventoryItem.findAll({ where, order: [['name', 'ASC']] });
    const totalValue = items.reduce((s, i) => s + Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0), 0);
    const lowStock = items.filter((i) => Number(i.currentStock || 0) < Number(i.reorderLevel || 0)).length;

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const history = await StockHistory.findAll({ where: dateFilter, limit: 200 });
    const stockAdded = history.filter((h) => h.movementType === 'IN').reduce((s, h) => s + Number(h.quantity || 0), 0);
    const stockUsed = history.filter((h) => h.movementType === 'OUT').reduce((s, h) => s + Number(h.quantity || 0), 0);

    const currentStock = items.slice(0, 150).map((i) => ({
      itemName: i.name,
      category: i.category || 'Uncategorized',
      currentQuantity: Number(i.currentStock || 0),
      reorderLevel: Number(i.reorderLevel || 0),
      unitPrice: Number(i.unitPrice || i.costPrice || 0),
      totalValue: Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0),
    }));

    res.json({
      summary: {
        totalItems: items.length,
        totalInventoryValue: totalValue,
        lowStockItems: lowStock,
        stockAdded,
        stockUsed,
      },
      currentStock,
      filters: { startDate, endDate },
    });
  } catch (error) {
    console.error('exportInventoryReport error:', error);
    res.status(500).json({ message: 'Failed to export inventory report', error: error.message });
  }
};
