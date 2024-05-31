const db = require('./db')

const EmailsEnviados = db.sequelize.define('emails_enviados', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    plan_key: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    documento: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// EmailsEnviados.sync({force:true})

module.exports = EmailsEnviados
