// @swiftshopr/sdk/src/core/branding.js

/**
 * Fetch retailer branding for white-label theming.
 *
 * @param {Object} params
 * @param {string} params.storeId - Required. Retailer store ID
 * @param {string} params.apiBaseUrl - Required. Backend base URL
 * @param {string} params.apiKey - Required. Retailer API key (x-swiftshopr-key)
 * @returns {Promise<Object>} Branding configuration
 */
export const getBranding = async ({
  storeId,
  apiBaseUrl,
  apiKey,
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for branding');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey for branding');
  }
  if (!storeId) {
    throw new Error('Missing storeId for branding');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/onramp/branding/${encodeURIComponent(storeId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-swiftshopr-key': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: false,
        error: 'not_found',
        message: 'Store not found or no branding configured',
      };
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Branding fetch failed (${response.status})`);
  }

  const payload = await response.json();

  return {
    success: true,
    storeId: payload.store_id,
    branding: {
      name: payload.branding?.name,
      logoUrl: payload.branding?.logo_url,
      theme: {
        primaryColor: payload.branding?.theme?.primary_color,
        secondaryColor: payload.branding?.theme?.secondary_color,
        backgroundColor: payload.branding?.theme?.background_color,
        textColor: payload.branding?.theme?.text_color,
        accentColor: payload.branding?.theme?.accent_color,
        mode: payload.branding?.theme?.mode,
        fontFamily: payload.branding?.theme?.font_family,
      },
      cdpTheme: payload.branding?.cdp_theme,
    },
  };
};

export default {
  getBranding,
};
