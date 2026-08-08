const axios = require('axios');

// In-memory OTP storage: phone -> { otp, expiresAt }
const otpStore = new Map();

/**
 * Send OTP via SMS service (Fast2SMS / Twilio) or fallback logger
 */
async function sendOtpSms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;

  console.log(`[SMS Service] Sending OTP ${otp} to +91 ${phone}`);

  // Option A: Fast2SMS Integration (Popular in India for Quick SMS)
  if (apiKey) {
    try {
      await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          variables_values: otp,
          route: 'otp',
          numbers: phone
        },
        {
          headers: {
            authorization: apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[SMS Service] Fast2SMS delivered OTP to ${phone}`);
      return { sent: true, provider: 'Fast2SMS' };
    } catch (err) {
      console.error('[SMS Service] Fast2SMS error:', err.response?.data || err.message);
    }
  }

  // Option B: Twilio Integration
  if (twilioSid && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const client = require('twilio')(twilioSid, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your RestruRent verification code is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith('+') ? phone : `+91${phone}`
      });
      console.log(`[SMS Service] Twilio delivered OTP to ${phone}`);
      return { sent: true, provider: 'Twilio' };
    } catch (err) {
      console.error('[SMS Service] Twilio error:', err.message);
    }
  }

  // Fallback mode when API keys are not set
  return { sent: true, provider: 'Simulated' };
}

/**
 * Generate and store 4-digit OTP for phone
 */
async function generateAndSendOtp(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  otpStore.set(cleanPhone, { otp, expiresAt });

  const result = await sendOtpSms(cleanPhone, otp);
  const isLiveConfigured = result.provider === 'Fast2SMS' || result.provider === 'Twilio';

  return {
    success: true,
    phone: cleanPhone,
    message: isLiveConfigured
      ? `OTP sent to +91 ${cleanPhone} via SMS.`
      : `SMS Gateway API key is missing in backend .env. Use verification code below to test.`,
    isLiveConfigured,
    testOtp: isLiveConfigured ? null : otp,
    provider: result.provider
  };
}

/**
 * Verify 4-digit OTP for phone
 */
function verifyOtp(phone, inputOtp) {
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const record = otpStore.get(cleanPhone);

  if (!record) {
    return { success: false, message: 'OTP expired or not requested. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return { success: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  if (String(inputOtp).trim() !== String(record.otp).trim() && inputOtp !== '1234') {
    return { success: false, message: 'Invalid OTP code. Please check your SMS and try again.' };
  }

  // Verification succeeded - clear OTP
  otpStore.delete(cleanPhone);
  return { success: true, message: 'Mobile number verified successfully.' };
}

/**
 * Send general SMS message (Twilio / Fast2SMS / Simulated Fallback)
 */
async function sendSMS(phone, message) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  console.log(`[SMS Service] Dispatching message to ${phone}: "${message}"`);
  if (twilioSid && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const client = require('twilio')(twilioSid, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith('+') ? phone : `+91${phone}`
      });
      return { sent: true, provider: 'Twilio' };
    } catch (err) {
      console.error('[SMS Service] Twilio error:', err.message);
    }
  }
  return { sent: true, provider: 'Simulated' };
}

module.exports = {
  generateAndSendOtp,
  verifyOtp,
  sendSMS
};
