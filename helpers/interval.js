const { verifica_pedidos_pronto_envio } = require("./verifyOrder")
const { delete_order_temp } = require("./saveOrdersBd")
const { Tiny } = require("../services/tinyApi")

module.exports = {
    interval_create_order: () => {
        setInterval(async () => {
            let response = await verifica_pedidos_pronto_envio()
            console.log(response.pedidos)
            if ( response.pedidos ) {
                for ( let pedido of response.pedidos ) {
                    let pedidoCriado = await Tiny.create_order(JSON.parse(pedido.pedido))
                    if ( pedidoCriado ) {
                       await delete_order_temp(pedidoCriado.cliente.cpf_cnpj)
                    }
                }
            }
        }, 60000)
    }
}
