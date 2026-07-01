const bcrypt = require("bcrypt");
const db = require("../config/db");
const crypto = require("crypto");

async function createFirstSuperAdmin() {
    try {
        const email = "admin@greeneye.com";
        const cpf = "01234567890"; // 👈 COLOQUE O SEU CPF AQUI (apenas os 11 números)
        const tempPassword = crypto.randomBytes(8).toString("hex");

        console.log("🔐 Criando superadmin...");
        console.log("📧 Email:", email);
        console.log("🆔 CPF:", cpf);
        console.log("🔑 Senha temporária:", tempPassword);

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const result = await db.query(
            "INSERT INTO users (email, password, cpf, is_temp_password, role) VALUES ($1, $2, $3, TRUE, 'superadmin') RETURNING id",
            [email, hashedPassword, cpf]
        );

        console.log("✅ Superadmin criado com sucesso!");
        console.log("🆔 ID do superadmin:", result.rows[0].id);

        console.log("\n📋 DADOS PARA LOGIN:");
        console.log("CPF:", cpf);
        console.log("SENHA:", tempPassword);

    } catch (error) {
        console.error("❌ Erro ao criar superadmin:", error.message);
    } finally {
        process.exit(0);
    }
}

createFirstSuperAdmin();
