import os, razorpay
from dotenv import load_dotenv

load_dotenv('d:/EBR/.env')
key_id = os.getenv('RAZORPAY_KEY_ID')
key_secret = os.getenv('RAZORPAY_KEY_SECRET')
client = razorpay.Client(auth=(key_id, key_secret))

order = client.order.create({
    'amount': 59900,
    'currency': 'INR',
    'receipt': 'rcpt_inspect_upi',
    'notes': {'test': 'true'}
})

html_template = """<!DOCTYPE html>
<html>
<head>
    <title>Razorpay Standard Checkout Test</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; }
        button { padding: 14px 28px; font-size: 18px; font-weight: bold; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>SMARTIFY - Razorpay Standard Checkout Test</h1>
    <p>Order ID: __ORDER_ID__ (Amount: Rs 599.00)</p>
    <button id="pay-btn">Open Razorpay Checkout</button>
    <div id="result" style="margin-top: 20px; font-weight: bold;"></div>

    <script>
        const options = {
            key: "__KEY_ID__",
            amount: 59900,
            currency: "INR",
            name: "SMARTIFY",
            description: "Order __ORDER_ID__",
            order_id: "__ORDER_ID__",
            prefill: {
                name: "Gaurav Kumar",
                email: "gaurav.kumar@example.com",
                contact: "9876543210"
            },
            theme: {
                color: "#059669"
            },
            handler: function(response) {
                document.getElementById('result').innerText = 'Payment Success: ' + response.razorpay_payment_id;
                console.log('Payment success response:', response);
            },
            modal: {
                ondismiss: function() {
                    document.getElementById('result').innerText = 'Checkout dismissed';
                }
            }
        };

        document.getElementById('pay-btn').onclick = function() {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(resp) {
                document.getElementById('result').innerText = 'Payment Failed: ' + resp.error.description;
            });
            rzp.open();
        };
    </script>
</body>
</html>
"""

html_content = html_template.replace('__ORDER_ID__', order['id']).replace('__KEY_ID__', key_id)

with open('d:/EBR/test_rzp.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print('Generated d:/EBR/test_rzp.html with Order ID:', order['id'])
