let OrdersTemp = require("../models/OrdersTemp")
let Orders = require("../models/Orders")


const tipoPagamento = {
    "1": "Boleto", "2": "Cartão de Crédito", "3": "Boleto Parcelado", "4": "Grátis", "5": "Pix"
}

module.exports = {
    create_order_temp: async (pedido) => {
        let pedidoCriado = await OrdersTemp.create({
            documento: pedido.client_documment,
            status: pedido.trans_status,
            tipo_pagamento: tipoPagamento[pedido.trans_payment],
            pedido: JSON.stringify(pedido),
            time_entrada: new Date()
        })
        if ( pedidoCriado ) return true
        return false
    },
    delete_order_temp: async (documento) => {
        let deletado = await OrdersTemp.destroy({
            where: { documento }
        })
        if ( deletado ) return true
        return false
    },
    create_order: async (pedido) => {
        let pedidoCriado = await Orders.create({
            documento: pedido[0].client_documment,
            plan_key: pedido[0].plan_key,
            pedido: JSON.stringify(pedido),
            time_entrada: new Date()
        })
        if ( pedidoCriado ) return true
        return false
    },
    update_order_temp: async (pedidoDb, pedidoNovo) => { // os dois parametros vem como obj
        var pedido = JSON.parse(pedidoDb.pedido)
        if ( typeof pedido.trans_items != 'undefined' ) {
            if ( typeof pedidoNovo.trans_items != 'undefined' ) {
                for ( let item of pedidoNovo.trans_items ) {
                    if ( item.main == 0 ) {
                       pedido.trans_items.push(item) 
                    }                    
                }
            }else {
                pedido.trans_items.push({
                    plan_key: pedidoNovo.plan_key,
                    plan_name: pedidoNovo.plan_name,
                    plan_amount: pedidoNovo.plan_amount,
                    plan_value: pedidoNovo.trans_value,
                    product_name: pedidoNovo.product_name,
                    product_key: pedidoNovo.product_key,
                    product_type: pedidoNovo.product_type,
                    main: 1
                }) 
            }
        }else {
            pedido.trans_items = []
            if ( typeof pedidoNovo.trans_items != 'undefined' ) {
                pedido.trans_items.push({
                    plan_key: pedido.plan_key,
                    plan_name: pedido.plan_name,
                    plan_amount: pedido.plan_amount,
                    plan_value: pedido.trans_value,
                    product_name: pedido.product_name,
                    product_key: pedido.product_key,
                    product_type: pedido.product_type,
                    main: 1
                })
                for ( let item of pedidoNovo.trans_items ) {
                    if ( item.main == 0 ) {
                       pedido.trans_items.push(item) 
                    }                    
                }
            }else {
                pedido.trans_items.push({
                    plan_key: pedido.plan_key,
                    plan_name: pedido.plan_name,
                    plan_amount: pedido.plan_amount,
                    plan_value: pedido.trans_value,
                    product_name: pedido.product_name,
                    product_key: pedido.product_key,
                    product_type: pedido.product_type,
                    main: 1
                })
                pedido.trans_items.push({
                    plan_key: pedidoNovo.plan_key,
                    plan_name: pedidoNovo.plan_name,
                    plan_amount: pedidoNovo.plan_amount,
                    plan_value: pedidoNovo.trans_value,
                    product_name: pedidoNovo.product_name,
                    product_key: pedidoNovo.product_key,
                    product_type: pedidoNovo.product_type,
                    main: 1
                }) 
            }
        }
        let update = await OrdersTemp.update(
            {
                pedido: JSON.stringify(pedido)
            }, 
            { where: { documento: pedidoNovo.client_documment } }
        )
        if ( update ) return true
        return false
    },
    update_order: async (pedidoBd, pedido) => { // oldPedido = obj | pedido = array
        let oldPedido = JSON.parse(pedidoBd.pedido)
        for ( let item of pedido ) {
            oldPedido.push(item)
        }
        let update = await Orders.update(
            {
                pedido: JSON.stringify(oldPedido)
            }, 
            { where: { documento: pedidoBd.documento } }
        )
        if ( update ) return true
        return false
    }
}
