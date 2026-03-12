const {
  buildTodayCheckins,
  buildTodayCheckouts,
  quickCheckin,
  quickCheckout,
} = require('../utils/todayActivityService');

exports.getTodayCheckins = async (req, res) => {
  try {
    const { Booking, Room } = req.hotelModels;
    const status = req.query.status || null;
    const items = await buildTodayCheckins({ Booking, Room, statusFilter: status });
    res.json({ items });
  } catch (error) {
    console.error('todayActivity.getTodayCheckins error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to load today check-ins', error: error.message });
  }
};

exports.getTodayCheckouts = async (req, res) => {
  try {
    const { Booking, Room } = req.hotelModels;
    const status = req.query.status || null;
    const items = await buildTodayCheckouts({ Booking, Room, statusFilter: status });
    res.json({ items });
  } catch (error) {
    console.error('todayActivity.getTodayCheckouts error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to load today check-outs', error: error.message });
  }
};

exports.processQuickCheckin = async (req, res) => {
  try {
    const { Booking, Room } = req.hotelModels;
    const { id } = req.params;
    const booking = await quickCheckin({ Booking, Room, bookingId: id });
    res.json({ item: booking });
  } catch (error) {
    console.error('todayActivity.processQuickCheckin error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to process quick check-in', error: error.message });
  }
};

exports.processQuickCheckout = async (req, res) => {
  try {
    const { Booking, Room } = req.hotelModels;
    const { id } = req.params;
    const booking = await quickCheckout({ Booking, Room, bookingId: id });
    res.json({ item: booking });
  } catch (error) {
    console.error('todayActivity.processQuickCheckout error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to process quick check-out', error: error.message });
  }
};

