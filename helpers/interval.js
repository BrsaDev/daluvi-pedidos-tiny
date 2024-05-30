const {verifica_pedidos_pronto_envio} = require("./verifyOrder")
const { Tiny } = require("../services/tinyApi")

module.exports = {
    interval_create_order: () => {
        setInterval(async () => {
            let response = await verifica_pedidos_pronto_envio()
            if ( response.pedidos ) {
                for ( let pedido of response.pedidos ) {
                    // Tiny.create_order(JSON.parse(pedido.pedido))
                    console.log(JSON.parse(pedido.pedido))
                }
            }
        }, 60000)
    }
}
