const bcrypt = require('bcrypt');
const db = require('./db');
const crypto = require('crypto');

async function createFirstAdmin() {
    try {
        const email = 'admin@greeneye.com';
        const tempPassword = crypto.randomBytes(8).toString('hex');
        
        console.log('🔐 Criando primeiro administrador...');
        console.log('📧 Email:', email);
        console.log('🔑 Senha temporária:', tempPassword);
        
        const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  Administrador já existe! Gerando nova senha temporária...');
            
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
            
            console.log('✅ Senha temporária atualizada com sucesso!');
        } else {
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            const result = await db.query(
                'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
                [email, hashedPassword]
            );
            
            console.log('✅ Primeiro administrador criado com sucesso!');
            console.log('🆔 ID do administrador:', result.rows[0].id);
        }
        
        console.log('\n📋 INFORMAÇÕES IMPORTANTES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email de login:', email);
        console.log('🔑 Senha temporária:', tempPassword);
        console.log('🌐 URL de login: http://localhost:3000/admin_login.html');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANTE: Anote essas credenciais em local seguro!');
        console.log('');
        
    } catch (error) {
        console.error('❌ Erro ao criar administrador:', error.message);
    } finally {
        process.exit(0);
    }
}

createFirstAdmin();