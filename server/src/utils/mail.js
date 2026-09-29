// Without SMTP_URL (development) the email is printed to the server console instead of sent.
export async function sendMail(to, subject, text) {
  if (!process.env.SMTP_URL) { console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`); return; }
  const {default: nm} = await import('nodemailer');
  await nm.createTransport(process.env.SMTP_URL).sendMail({from: process.env.MAIL_FROM || 'Atelier <no-reply@localhost>', to, subject, text});
}
