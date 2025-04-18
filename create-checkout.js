const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { total, shipping, email } = data;

    // Convert to cents and apply surcharges
    const baseAmount = Math.round(parseFloat(total) * 100);
    const surcharge = 75; // 75 cents in cents
    const shippingFee = shipping ? 400 : 0; // $4.00 in cents
    const finalAmount = baseAmount + surcharge + shippingFee;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Bracelet Order',
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        }
      ],
      success_url: 'https://yourdomain.com/success.html',
      cancel_url: 'https://yourdomain.com/cancel.html',
      customer_email: email || undefined
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
