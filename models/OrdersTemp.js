const db = require('./db')

const OrdersTemp = db.sequelize.define('orders_temp', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    documento: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    tipo_pagamento: {
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

// OrdersTemp.sync({force:true})

module.exports = OrdersTemp

