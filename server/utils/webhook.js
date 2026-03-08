const axios = require("axios");

/**
 * Sends a webhook notification to a hospital's external system.
 *
 * This function is designed to NEVER throw — if the webhook call fails
 * for any reason (network error, timeout, non-2xx response, missing config),
 * it logs the error and returns silently. This ensures the main application
 * flow (e.g. ambulance dispatch) is never disrupted by a webhook failure.
 *
 * @param {Object} hospital   - Hospital document (must have webhookUrl, webhookEnabled, _id)
 * @param {string} eventType  - Event identifier, e.g. 'AMBULANCE_DISPATCHED', 'TEST'
 * @param {Object} payload    - Arbitrary data to include in the webhook body under `data`
 * @returns {Promise<Object|null>} - Response summary on success, null on skip/failure
 */
async function sendWebhook(hospital, eventType, payload) {
  try {
    // ── Guard: skip silently if webhooks are not configured or disabled ──
    if (!hospital) return null;
    if (!hospital.webhookEnabled) return null;
    if (!hospital.webhookUrl) return null;

    const body = {
      event: eventType,
      timestamp: new Date().toISOString(),
      hospitalId: hospital._id,
      data: payload,
    };

    const response = await axios.post(hospital.webhookUrl, body, {
      headers: {
        "Content-Type": "application/json",
        "X-MedManage-Event": eventType,
        "X-MedManage-Version": "1.0",
      },
      timeout: 5000, // 5 second timeout
      // Don't follow too many redirects
      maxRedirects: 3,
    });

    return {
      success: true,
      statusCode: response.status,
      message: `Webhook delivered to ${hospital.webhookUrl}`,
    };
  } catch (error) {
    // ── NEVER throw — log and return null ──
    const url = hospital && hospital.webhookUrl ? hospital.webhookUrl : "unknown";
    const status =
      error.response && error.response.status ? error.response.status : "N/A";
    const msg = error.message || "Unknown error";

    console.error(
      `Webhook failed: event=${eventType} url=${url} status=${status} error=${msg}`
    );

    return null;
  }
}

module.exports = { sendWebhook };
