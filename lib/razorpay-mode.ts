// lib/razorpay-mode.ts
/* MOCK MODE */
export const isRazorpayReady = () => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  return !!key && key !== 'rzp_test_placeholder' && key.startsWith('rzp_');
};
