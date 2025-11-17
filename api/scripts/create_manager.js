// Скрипт для создания пользователя-менеджера
const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'manager123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Hash:', hash);
}

generateHash();
