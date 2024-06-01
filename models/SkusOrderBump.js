const db = require('./db')

const SkusOrderBump = db.sequelize.define('skus_order_bumps', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    key: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    sku: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// SkusOrderBump.sync({force:true})

module.exports = SkusOrderBump
