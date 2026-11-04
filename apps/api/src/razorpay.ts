import Razorpay from "razorpay";

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (razorpayClient) {
    return razorpayClient;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayClient;
}

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error("Razorpay key ID is not configured.");
  }

  return keyId;
}
