const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.NODE_ENV === 'production') {
        transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('📧 Ethereal configurado:', testAccount.user);
    }

    return transporter;
}

async function sendPasswordResetEmail({ to, nome, resetLink, userType }) {
    const transport = await getTransporter();

    const tipoLabel = userType === 'company' ? 'Empresa/ONG' : 'Gestor';

    const info = await transport.sendMail({
        from: `"Green Eye" <${process.env.MAIL_USER || 'noreply@greeneye.com'}>`,
        to,
        subject: 'Redefinição de senha — Green Eye',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2e7d32;">Green Eye</h2>
                <p>Olá, <strong>${nome}</strong>!</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta <strong>${tipoLabel}</strong>.</p>
                <p>Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #2e7d32; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                        Redefinir minha senha
                    </a>
                </div>
                <p style="font-size: 12px; color: #888;">Se você não solicitou essa alteração, ignore este e-mail. Sua senha permanece a mesma.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #aaa; text-align: center;">Green Eye — Sistema de Gestão Ambiental</p>
            </div>
        `,
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Preview do e-mail:', nodemailer.getTestMessageUrl(info));
    }

    return info;
}

async function sendTempPasswordEmail({ to, senha }) {
    const transport = await getTransporter();

    const info = await transport.sendMail({
        from: `"Green Eye" <${process.env.MAIL_USER || 'noreply@greeneye.com'}>`,
        to,
        subject: 'Seu acesso ao Green Eye — senha temporária',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2e7d32;">Green Eye</h2>
                <p>Olá! Sua conta de gestor foi criada no sistema <strong>Green Eye</strong>.</p>
                <p>Use as credenciais abaixo para fazer seu primeiro acesso:</p>
                <div style="background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>E-mail:</strong> ${to}</p>
                    <p style="margin: 0; font-size: 20px; font-family: monospace; letter-spacing: 2px; color: #2e7d32;"><strong>${senha}</strong></p>
                </div>
                <p style="color: #f57c00;"><strong>⚠️ Esta é uma senha temporária.</strong> Você será solicitado a criar uma nova senha no primeiro login.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #aaa; text-align: center;">Green Eye — Sistema de Gestão Ambiental</p>
            </div>
        `,
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Preview do e-mail (senha temporária):', nodemailer.getTestMessageUrl(info));
    }

    return info;
}

module.exports = { sendPasswordResetEmail, sendTempPasswordEmail };
