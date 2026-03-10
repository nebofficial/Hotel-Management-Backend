/**
 * Helper to provide default POS settings shape on first load.
 */

function defaultPOSSettings() {
  return {
    defaultTerminalName: "Main POS",
    terminalLocation: "RESTAURANT",
    autoLoginEnabled: false,
    printerConfig: {
      device: "Default Printer",
      type: "THERMAL_80MM",
      autoPrint: true,
    },
    tableLayout: {
      tables: [
        { id: "T1", name: "T1", capacity: 4, zone: "Indoor" },
        { id: "T2", name: "T2", capacity: 4, zone: "Indoor" },
      ],
    },
    menuCategories: [
      { id: "starters", name: "Starters", sortOrder: 1 },
      { id: "mains", name: "Mains", sortOrder: 2 },
      { id: "desserts", name: "Desserts", sortOrder: 3 },
      { id: "beverages", name: "Beverages", sortOrder: 4 },
    ],
    orderNotifications: {
      kitchenAlerts: true,
      soundAlerts: true,
      screenPopups: true,
    },
    taxSettings: {
      applyGST: true,
      applyServiceCharge: true,
      taxInclusive: false,
    },
    receiptFormat: {
      header: "Thank you for dining with us!",
      showOrderDetails: true,
      showTaxBreakdown: true,
      footerMessage: "Powered by HMS POS",
    },
  };
}

module.exports = {
  defaultPOSSettings,
};

