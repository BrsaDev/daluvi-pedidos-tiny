const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('pedidos_tiny_daluvi', 'root', 'Deus2127*', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: false
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
}
