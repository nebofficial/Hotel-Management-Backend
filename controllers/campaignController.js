const { Op } = require('sequelize');
const { sendCredentialsEmail } = require('../utils/emailService');
const { sendSms } = require('../utils/smsService');
const {
  buildUsageTrend,
  buildTopCampaigns,
  buildDistribution,
} = require('../utils/campaignAnalyticsService');

function mapCampaignToDto(c) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    subject: c.subject,
    segment: c.segment,
    status: c.status,
    scheduledAt: c.scheduledAt,
    sentAt: c.sentAt,
    totalRecipients: c.totalRecipients,
    sentCount: c.sentCount,
    opens: c.opens,
    clicks: c.clicks,
    deliveries: c.deliveries,
    failures: c.failures,
    metadata: c.metadata || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

exports.fetchCampaigns = async (req, res) => {
  try {
    const { Campaign } = req.hotelModels;
    await Campaign.sync({ alter: false });

    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.type) {
      where.type = req.query.type;
    }

    const campaigns = await Campaign.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ items: campaigns.map(mapCampaignToDto) });
  } catch (error) {
    console.error('fetchCampaigns error:', error);
    res.status(500).json({ message: 'Failed to load campaigns', error: error.message });
  }
};

async function createCampaign(req, res, type) {
  try {
    const { Campaign } = req.hotelModels;
    await Campaign.sync({ alter: false });

    const {
      name,
      subject,
      content,
      segment,
      filters,
      scheduledAt,
      status = 'draft',
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: 'Campaign name is required' });
    }

    const created = await Campaign.create({
      name: String(name).trim(),
      type,
      subject: subject || null,
      content: content || null,
      segment: segment || null,
      filters: filters || null,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdBy: req.user?.name || req.user?.id || null,
      updatedBy: req.user?.name || req.user?.id || null,
    });

    res.status(201).json({ campaign: mapCampaignToDto(created) });
  } catch (error) {
    console.error('createCampaign error:', error);
    res.status(500).json({ message: 'Failed to create campaign', error: error.message });
  }
}

exports.createEmailCampaign = async (req, res) => {
  return createCampaign(req, res, 'email');
};

exports.createSmsCampaign = async (req, res) => {
  return createCampaign(req, res, 'sms');
};

exports.updateCampaignStatus = async (req, res) => {
  try {
    const { Campaign } = req.hotelModels;
    await Campaign.sync({ alter: false });

    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const { status } = req.body || {};
    if (!status || !['draft', 'scheduled', 'active', 'completed', 'stopped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    campaign.status = status;
    campaign.updatedBy = req.user?.name || req.user?.id || null;
    await campaign.save();

    res.json({ campaign: mapCampaignToDto(campaign) });
  } catch (error) {
    console.error('updateCampaignStatus error:', error);
    res.status(500).json({ message: 'Failed to update campaign status', error: error.message });
  }
};

exports.scheduleCampaign = async (req, res) => {
  try {
    const { Campaign } = req.hotelModels;
    await Campaign.sync({ alter: false });

    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const { scheduledAt } = req.body || {};
    const time = scheduledAt ? new Date(scheduledAt) : new Date();

    campaign.scheduledAt = time;
    campaign.status = 'scheduled';
    campaign.updatedBy = req.user?.name || req.user?.id || null;
    await campaign.save();

    res.json({ campaign: mapCampaignToDto(campaign) });
  } catch (error) {
    console.error('scheduleCampaign error:', error);
    res.status(500).json({ message: 'Failed to schedule campaign', error: error.message });
  }
};

exports.sendBulkCampaign = async (req, res) => {
  try {
    const { Campaign, Guest } = req.hotelModels;
    await Campaign.sync({ alter: false });

    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Simple segmentation: currently all guests; filters can be extended later.
    const guests = await Guest.findAll({
      where: {
        email: { [Op.ne]: null },
      },
      limit: 500,
    });

    let sentCount = 0;
    for (const g of guests) {
      const toEmail = g.email;
      const toPhone = g.phone;
      const name = `${g.firstName || ''} ${g.lastName || ''}`.trim();

      if (campaign.type === 'email' && toEmail) {
        try {
          // Reuse existing email sender with a simple wrapper subject/body.
          await sendCredentialsEmail(
            toEmail,
            name || 'Guest',
            toEmail,
            '****',
            req.hotel?.name || 'Hotel',
          );
          sentCount += 1;
        } catch (e) {
          console.warn('Email campaign send failed for', toEmail, e.message);
        }
      } else if (campaign.type === 'sms' && toPhone) {
        try {
          await sendSms({
            to: toPhone,
            message: campaign.content || '',
          });
          sentCount += 1;
        } catch (e) {
          console.warn('SMS campaign send failed for', toPhone, e.message);
        }
      }
    }

    campaign.sentCount += sentCount;
    campaign.totalRecipients = guests.length;
    campaign.deliveries += sentCount;
    campaign.status = 'completed';
    campaign.sentAt = new Date();
    await campaign.save();

    res.json({ campaign: mapCampaignToDto(campaign) });
  } catch (error) {
    console.error('sendBulkCampaign error:', error);
    res.status(500).json({ message: 'Failed to send campaign', error: error.message });
  }
};

exports.fetchCampaignAnalytics = async (req, res) => {
  try {
    const { Campaign } = req.hotelModels;
    await Campaign.sync({ alter: false });

    const campaigns = await Campaign.findAll({
      order: [['createdAt', 'ASC']],
    });

    const totalEmails = campaigns
      .filter((c) => c.type === 'email')
      .reduce((sum, c) => sum + Number(c.sentCount || 0), 0);
    const totalSms = campaigns
      .filter((c) => c.type === 'sms')
      .reduce((sum, c) => sum + Number(c.sentCount || 0), 0);

    const usageTrend = buildUsageTrend(campaigns);
    const topCampaigns = buildTopCampaigns(campaigns);
    const distribution = buildDistribution(campaigns);

    res.json({
      totals: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
        emailsSent: totalEmails,
        smsSent: totalSms,
      },
      usageTrend,
      topCampaigns,
      distribution,
    });
  } catch (error) {
    console.error('fetchCampaignAnalytics error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load campaign analytics', error: error.message });
  }
};

