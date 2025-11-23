// src/services/emailService.js
const sgMail = require('@sendgrid/mail');

// Настройка SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@gameio.com';

// Проверяем, что API ключ настроен и не является placeholder'ом
const isValidApiKey = SENDGRID_API_KEY &&
                      SENDGRID_API_KEY.startsWith('SG.') &&
                      !SENDGRID_API_KEY.includes('your-sendgrid-api-key');

const isValidFromEmail = FROM_EMAIL &&
                         !FROM_EMAIL.includes('example.com') &&
                         !FROM_EMAIL.includes('your-verified-email');

if (isValidApiKey && isValidFromEmail) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✅ Email service configured (SendGrid)');
    console.log('📧 Письма будут отправляться на реальные email адреса');
    console.log('📬 Отправитель:', FROM_EMAIL);
} else {
    console.log('⚠️  SendGrid не настроен - письма будут выводиться в консоль');
    console.log('💡 Для отправки реальных email:');
    console.log('   1. Зарегистрируйтесь на https://sendgrid.com (бесплатно)');
    console.log('   2. Получите API ключ');
    console.log('   3. Добавьте в .env:');
    console.log('      SENDGRID_API_KEY=SG.ваш_ключ');
    console.log('      FROM_EMAIL=ваш_email@gmail.com');
    console.log('   4. См. инструкцию в SENDGRID_SETUP.md');
}

/**
 * Генерация HTML шаблона письма
 */
const generateEmailHTML = (username, resetLink) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Восстановление пароля</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎮 GameIO</h1>
                            <p style="color: #ffffff; margin: 10px 0 0; opacity: 0.9;">Магазин игровых аккаунтов</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; margin: 0 0 20px;">Восстановление пароля</h2>
                            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Здравствуйте, <strong>${username}</strong>!
                            </p>
                            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Мы получили запрос на восстановление пароля. Нажмите кнопку ниже, чтобы создать новый пароль:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                    Восстановить пароль
                                </a>
                            </div>
                            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                                Или скопируйте ссылку: <br><span style="color: #667eea; word-break: break-all;">${resetLink}</span>
                            </p>
                            <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 4px;">
                                <p style="color: #856404; font-size: 14px; margin: 0;">
                                    ⏰ Ссылка действительна <strong>15 минут</strong>
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © 2025 GameIO. Все права защищены.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

/**
 * Отправка письма для восстановления пароля
 */
const sendPasswordResetEmail = async (email, username, resetToken) => {
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    // Если SendGrid настроен - отправляем реальное письмо
    if (isValidApiKey && isValidFromEmail) {
        try {
            const msg = {
                to: email,
                from: FROM_EMAIL,
                subject: '🔐 Восстановление пароля - GameIO',
                html: generateEmailHTML(username, resetLink),
                text: `Здравствуйте, ${username}!\n\nДля восстановления пароля перейдите по ссылке:\n${resetLink}\n\nСсылка действительна 15 минут.\n\nС уважением,\nКоманда GameIO`
            };

            await sgMail.send(msg);
            console.log('✅ Email отправлен на:', email);

            return {
                success: true,
                messageId: 'sendgrid-' + Date.now(),
                sent: true
            };
        } catch (error) {
            console.error('❌ Ошибка отправки через SendGrid:', error.message);
            // Fallback - выводим в консоль
        }
    }

    // Fallback: выводим ссылку в консоль
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📧 ПИСЬМО ДЛЯ ВОССТАНОВЛЕНИЯ ПАРОЛЯ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('👤 Получатель:', email);
    console.log('📝 Имя:', username);
    console.log('');
    console.log('🔗 ССЫЛКА:');
    console.log(resetLink);
    console.log('');
    console.log('💡 Откройте эту ссылку в браузере');
    console.log('⏰ Действительна 15 минут');
    console.log('═══════════════════════════════════════════════════════════════\n');

    return {
        success: true,
        messageId: 'console-' + Date.now(),
        sent: false
    };
};

module.exports = {
    sendPasswordResetEmail,
};
