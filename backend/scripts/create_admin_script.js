const bcrypt = require("bcrypt");
const db = require("./db");
const crypto = require("crypto");

async function createFirstAdmin() {
    try {
        const email = "admin@greeneye.com";
        const cpf = "00000000000"; // 👈 COLOQUE O SEU CPF AQUI (apenas os 11 números)
        const tempPassword = crypto.randomBytes(8).toString("hex");
        
        console.log("🔐 Criando primeiro administrador...");
        console.log("📧 Email:", email);
        console.log("🆔 CPF:", cpf);
        console.log("🔑 Senha temporária:", tempPassword);
        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // ATENÇÃO: Adicionei "cpf" na lista de colunas e o "$3" nos values
        const result = await db.query(
            "INSERT INTO users (email, password, cpf, is_temp_password) VALUES ($1, $2, $3, TRUE) RETURNING id",
            [email, hashedPassword, cpf] // 👈 O CPF entra como o terceiro parâmetro
        );
        
        console.log("✅ Primeiro administrador criado com sucesso!");
        console.log("🆔 ID do administrador:", result.rows.id);
        
        console.log("\n📋 DADOS PARA LOGIN:");
        console.log("CPF:", cpf);
        console.log("SENHA:", tempPassword);
        
    } catch (error) {
        console.error("❌ Erro ao criar administrador:", error.message);
    } finally {
        process.exit(0);
    }
}

createFirstAdmin();