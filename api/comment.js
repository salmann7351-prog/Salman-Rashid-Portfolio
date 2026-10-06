export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  try {
    const body = req.body || {};
    const { name, email, affiliation = '', comment, website = '', 'cf-turnstile-response': token } = body;
    if (website) return res.status(400).json({ ok: false, message: 'Unable to submit.' });
    if (!name || !email || !comment || !token) return res.status(400).json({ ok: false, message: 'Please complete the required fields and CAPTCHA.' });
    if (String(name).length > 120 || String(email).length > 200 || String(affiliation).length > 180 || String(comment).length > 4000) {
      return res.status(400).json({ ok: false, message: 'One or more fields are too long.' });
    }
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return res.status(503).json({ ok: false, message: 'Comment service is not configured yet.' });
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token })
    });
    const verification = await verify.json();
    if (!verification.success) return res.status(400).json({ ok: false, message: 'CAPTCHA verification failed.' });
    const to = process.env.COMMENTS_TO_EMAIL || 'salmann7351@gmail.com';
    const from = process.env.COMMENTS_FROM_EMAIL || 'onboarding@resend.dev';
    const resend = process.env.RESEND_API_KEY;
    if (!resend) return res.status(503).json({ ok: false, message: 'Comment service is not configured yet.' });
    const safe = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const html = `<h2>New portfolio comment awaiting review</h2><p><strong>Name:</strong> ${safe(name)}</p><p><strong>Email:</strong> ${safe(email)}</p><p><strong>Affiliation:</strong> ${safe(affiliation || 'Not provided')}</p><hr><p>${safe(comment).replace(/\n/g,'<br>')}</p><p><em>This submission is not published automatically. Review and approve manually.</em></p>`;
    const send = await fetch('https://api.resend.com/emails', { method:'POST', headers:{'Authorization':`Bearer ${resend}`,'Content-Type':'application/json'}, body:JSON.stringify({from,to,reply_to:email,subject:'Portfolio comment awaiting review',html}) });
    if (!send.ok) return res.status(502).json({ ok:false, message:'The comment could not be sent for review.' });
    return res.status(200).json({ ok:true, message:'Thank you. Your comment has been submitted for review.' });
  } catch (e) { return res.status(500).json({ ok:false, message:'Unable to submit at the moment.' }); }
}
