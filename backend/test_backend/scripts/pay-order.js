const crypto = require('crypto');

async function main() {
  const [, , tenantId, orderId] = process.argv;

  if (!tenantId || !orderId) {
    console.error('Usage: node scripts/pay-order.js <tenantId> <orderId>');
    process.exit(1);
  }

  const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3002/api';
  const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev_payment_secret_change_me';
  const payload = JSON.stringify({
    eventId: `evt-${orderId}-${Date.now()}`,
    tenantId,
    orderId,
    status: 'paid',
  });
  const signature =
    'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const response = await fetch(`${baseUrl}/webhooks/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-payment-signature': signature,
    },
    body: payload,
  });

  const body = await response.text();
  console.log(`${response.status} ${response.statusText}`);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
