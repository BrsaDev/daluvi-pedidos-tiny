const db = require('./db')

const Skus = db.sequelize.define('skus', {
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

// Skus.sync({force:true})

module.exports = Skus
