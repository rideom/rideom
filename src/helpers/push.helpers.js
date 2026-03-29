async function sendPushNotification({ pushToken, title, body, data }) {
  if (!pushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:       pushToken,
        title,
        body,
        data,
        sound:    'default',
        priority: 'high',
      }),
    });
  } catch (err) {
    console.log('Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };