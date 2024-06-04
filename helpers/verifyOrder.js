const { Op, literal, fn, col, where } = require("sequelize")
const OrdersTemp = require("../models/OrdersTemp")
const Orders = require("../models/Orders")


const check_time_orders_temp = async () => {
    try {
        let pedidos = await OrdersTemp.findAll({
            where: {
                [Op.and] : [
                    where(
                        fn( "timestampdiff", literal("minute"), col("time_entrada"),literal("CURRENT_TIMESTAMP")), 
                        {
                            // [Op.lt] : 120 // lt é = "menor que"
                            [Op.gte] : 120 // gte é = "maior ou igual que"
                        }
                    )
                ]
            }
        })
        pedidos = JSON.parse(JSON.stringify(pedidos, null, 2))
        return { pedidos }
    }catch(erro) {
        return { erro }
    }
}
const check_time_orders = async (documento) => {
    try {
        let pedidos = await Orders.findAll({
            where: {
                [Op.and] : [
                    where(
                        fn( "timestampdiff", literal("minute"), col("time_entrada"), literal("CURRENT_TIMESTAMP")), 
                        {
                            [Op.lt] : 122
                        }
                    ),
                    { documento }
                ]
            }
        })
        pedidos = JSON.parse(JSON.stringify(pedidos, null, 2))
        return { pedidos }
    }catch(erro) {
        return { erro }
    }
}


module.exports = {
    verifica_pedidos_pronto_envio: async () => {
        let pedidos = await check_time_orders_temp()
        if ( !pedidos.erro && pedidos.pedidos.length > 0 ) {
            return {pedidos: pedidos.pedidos}
        }
        return {pedidos: false}
    },
    chech_exists_order_temp: async (pedido) => { // pedido chega como obj
        try {
            let resPedido = await OrdersTemp.findOne({ 
                where:{ 
                    [Op.and]: {
                        documento: pedido.client_documment, 
                        status: "Pagamento Aprovado"
                    } 
                } 
            })
            resPedido = JSON.parse(JSON.stringify(resPedido, null, 2))
            return resPedido || false
        } catch(erro) {
            return { erro }
        }        
    },
    chech_exists_order: async (pedido) => {
        try {
            let orderTime = await check_time_orders(pedido[0].client_documment || pedido[1].client_documment)
            if ( orderTime.pedidos.length == 0 ) return false
            return orderTime.pedidos[0]
        } catch(erro) {
            return { erro }
        }        
    },
    isUpsell: (pedido) => { // pedido vem como array
        let upSell = null
        for ( let item of pedido ) {
            if ( typeof item.is_upsell != "undefined" && item.is_upsell == "1" ) {
                upSell = item
                break
            }
        }
        return upSell
    },
    isPedidoAprovado: (pedido) => { // pedido chega como array
        let formaPagamento = {"2": "Cartão de Crédito", "5": "Pix"}
        let aprovado = null
        for ( let item of pedido ) {
            if ( typeof item.trans_status != "undefined" && item.trans_status == "Pagamento Aprovado" && typeof item.trans_payment != "undefined" && formaPagamento[item.trans_payment] ) {
                aprovado = item
                break
            }
        }
        return aprovado
    }
}

    