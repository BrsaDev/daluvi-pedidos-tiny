const express = require('express')
const fs = require('fs')
const path = require('path')
const { Op, literal, fn, col, where } = require('sequelize')
let { create_order_temp, update_order_temp, create_order, update_order } = require("./helpers/saveOrdersBd")
const { chech_exists_order_temp, chech_exists_order, isPedidoAprovado, isUpsell } = require("./helpers/verifyOrder")
const { interval_create_order } = require("./helpers/interval")
let Skus = require("./models/Skus")

// interval_create_order()

let port = process.env.PORT || 3005
const app = express()
// app.use(express.limit(100000000));
app.use(express.urlencoded({ extended: false, limit: '50mb' }))
app.use(express.json({ limit: '50mb' }));
app.use(express.static('pages'))

app.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, '/pages/home.html'))
})

app.post("/receiver-orders", async (req, res) => {
    var reqBody = req.body
    if ( !Array.isArray(req.body) ) {
        reqBody = [req.body]
    }
    let oldPedido = await chech_exists_order(reqBody)
    if ( !oldPedido.erro && oldPedido ) {
        await update_order(oldPedido, reqBody)
    }else {
        await create_order(reqBody) 
    }     
    let pedidoAprovado = isPedidoAprovado(reqBody)
    if ( pedidoAprovado ) {
        let pedido = chech_exists_order_temp(pedidoAprovado)
        if ( !pedido.erro && pedido ) {
            let pedidoUpsell = isUpsell(reqBody)
            if ( pedidoUpsell ) {
               await update_order_temp(pedido, pedidoUpsell) 
            }      
        }else {
            await create_order_temp(pedidoAprovado)      
        }
    }
    return res.status(200).json({resultado: "OK"})
})

app.get("/buscar-skus", async (req, res) => {
    try {
        let skus = await Skus.findAll()
        skus = JSON.parse(JSON.stringify(skus, null, 2))
        return res.json({ skus })
    }catch(erro) { return res.json({erro, msg: "Erro no buscar os skus"})}
})

app.post("/cadastrar-sku", async (req, res) => {
    try {
        let { sku, key, produto, upsell } = req.body
        if ( sku == "" || key == "" || produto == "" ) return res.json({ erro: "OK", msg: "Valores vazios."})
        let resSku = await Skus.findOne({ where:{ [Op.or]: {sku, key} } })
        resSku = JSON.parse(JSON.stringify(resSku, null, 2))
        if ( resSku ) {
            if ( resSku.sku == sku ) {
                return res.json({ erro: "OK", msg: "Sku já cadastrado" })
            }
            if ( resSku.key == key ) {
                return res.json({ erro: "OK", msg: "Key já cadastrado" })
            }
        }else {
            let response = await Skus.create({
                key,
                sku,
                produto, 
                upsell
            })
            if ( response.erro ) {
                return res.json({ erro: "OK", msg: response.erro })
            }
            return res.json({ resultado: response })
        }
    }catch(erro) { return res.json({erro, msg: "Erro no cadastro"})}
})

app.listen(port, () => { console.log('Rodando as rotas na porta: ' + port) })

process.on('SIGINT', (e) => { console.log(e); process.exit() })
process.on('SIGQUIT', (e) => { console.log(e); process.exit() })
process.on('SIGTERM', (e) => { console.log(e); process.exit() })
process.on('exit', (code) => {
    console.log('Fechando o processo com o código: ', code);
});


