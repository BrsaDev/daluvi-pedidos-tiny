const db = require('./db')

const Orders = db.sequelize.define('orders', {
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
    },
    pedido: {
        type: db.Sequelize.TEXT,
        allowNull: false
    },
    time_entrada: {
        type: db.Sequelize.DATE(6),
        allowNull: false
    }
}, { timestamps: false } )

// Orders.sync({force:true})

module.exports = Orders

