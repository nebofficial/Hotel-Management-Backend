function defaultThemeSettings() {
  return {
    themeName: 'modern',
    mode: 'light',
    brandColors: {
      primary: '#2563eb',
      secondary: '#0f172a',
      accent: '#22c55e',
      background: '#f8fafc',
    },
    fontSettings: {
      family: 'Inter',
      size: 'medium',
      headingStyle: 'semibold',
      lineSpacing: 1.5,
    },
    buttonSettings: {
      shape: 'rounded',
      shadow: true,
      variants: ['solid', 'outline'],
    },
    sidebarLayout: {
      variant: 'collapsible',
      position: 'fixed',
    },
    logoConfig: {
      url: null,
      size: 'md',
      position: 'sidebar',
      faviconUrl: null,
    },
  };
}

module.exports = {
  defaultThemeSettings,
};

