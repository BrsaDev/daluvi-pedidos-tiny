const { Op, literal, fn, col, where } = require('sequelize')
const EmailsEnviados = require("../models/EmailsEnviados")

module.exports = {
    check_email_enviado: async (pedido) => {
        try {
            let email = await EmailsEnviados.findOne({ 
                where:{ 
                    [Op.or]: {
                        documento: pedido.client_documment, 
                        plan_key: pedido.plan_key
                    } 
                } 
            })
            email = JSON.parse(JSON.stringify(email, null, 2))
            return email || false
        } catch(erro) {
            return { erro }
        } 
    }
}
