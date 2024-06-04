const express = require('express')
const fs = require('fs')
const path = require('path')
const { Op, literal, fn, col, where } = require('sequelize')
let { create_order_temp, update_order_temp, create_order, update_order } = require("./helpers/saveOrdersBd")
const { chech_exists_order_temp, chech_exists_order, isPedidoAprovado, isUpsell } = require("./helpers/verifyOrder")
const { interval_create_order } = require("./helpers/interval")
let Skus = require("./models/Skus")
let SkusOrderBump = require("./models/SkusOrderBump")

interval_create_order()

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
        let pedido = await chech_exists_order_temp(pedidoAprovado)
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
        let { orderBump } = req.query
        if ( orderBump ) {
            var skus = await SkusOrderBump.findAll()
        }else {
            var skus = await Skus.findAll()
        }
        skus = JSON.parse(JSON.stringify(skus, null, 2))
        return res.json({ skus })
    }catch(erro) { return res.json({erro, msg: "Erro no buscar os skus"})}
})

app.post("/delete-sku", async (req, res) => {
    let { sku, orderBump } = req.body
    if ( orderBump ) {
        var resSku = await SkusOrderBump.destroy({ where:{ sku } }) 
    }else {
       var resSku = await Skus.destroy({ where:{ sku } }) 
    }
    resSku = JSON.parse(JSON.stringify(resSku, null, 2))
    if ( resSku ) return res.json({msg: "Sku deletado"})
    res.json({msg: "Erro"})
})

app.post("/cadastrar-sku", async (req, res) => {
    try {
        let { sku, key, orderBump } = req.body
        if ( orderBump ) var SkusBd = SkusOrderBump
        else var SkusBd = Skus

        if ( sku == "" || key == "" ) return res.json({ erro: "OK", msg: "Valores vazios."})
        let resSku = await SkusBd.findOne({ where:{ [Op.or]: {sku, key} } })
        resSku = JSON.parse(JSON.stringify(resSku, null, 2))
        if ( resSku && !orderBump ) {
            if ( resSku.sku == sku ) {
                return res.json({ erro: "OK", msg: "Sku já cadastrado" })
            }
            if ( resSku.key == key ) {
                return res.json({ erro: "OK", msg: "Key já cadastrado" })
            }
        }else {
            let response = await SkusBd.create({
                key,
                sku
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


    

// let r = {
//     "type": "STATUS_ALTERADO",
//     "basic_authentication": "80745f59b717407e11ec37ef2c6f02ad95676ce8",
//     "currency": "BRL",
//     "plan_name": "Lurevita 1 Mês de Tratamento",
//     "plan_key": "pla5k9d1",
//     "plan_amount": 1,
//     "product_name": "Lurevita",
//     "product_key": "prolwvzw",
//     "product_type": 1,
//     "trans_createdate": "2024-05-29 17:56:06",
//     "trans_updatedate": "2024-05-29 17:56:08",
//     "trans_key": "ven33x0wng",
//     "trans_status": "Pagamento Aprovado",
//     "trans_status_code": 1,
//     "trans_value": 23790,
//     "trans_total_value": 23790,
//     "trans_discount_value": 0,
//     "trans_freight": 0,
//     "trans_freight_type": null,
//     "trans_payment": 1,
//     "trans_payment_line": "40192024175000000000500002246742597330000023790",
//     "trans_payment_bar_code": "40195973300000237902024150000000000000224674",
//     "trans_payment_url": "https://ev.braip.com/checkout/boleto/ven33x0wng",
//     "trans_payment_date": null,
//     "trans_installments": 1,
//     "trans_qrcode_pix": null,
//     "trans_url_pix": null,
//     "parent_sale": null,
//     "is_upsell": 0,
//     "meta": {
//       "split": "12",
//       "src": "facediego",
//       "utm_source": "cp160400",
//       "utm_medium": "direct-pv-face",
//       "utm_campaign": "240400",
//       "utm_id": "120209683485600119",
//       "utm_content": "120209983604690119",
//       "utm_term": "120209983604720119",
//       "fbclid": "IwAR1h1HwSv6IiKLUOnk-M_Yk4T_uOycRB4BbK2cinRIFHPCYQm2FEUJGPKZs_aem_AffqnMBa1UNBKaLzjVPUSsZlY3eeZiLoueU_RpcsbsXMopU_owgx827xL9tVZYcHaZYpk7qQemaLhedPlQveoN8R"
//     },
//     "have_order_bump": 1,
//     "subs_key": null,
//     "tracking_code": null,
//     "shipping_company": null,
//     "postback_type": "Produtor",
//     "client_name": "Katia cilene Ribeiro dos Santos",
//     "client_email": "kc172689@gmail.com",
//     "client_cel": "55 55991490404",
//     "client_documment": "98655019291",
//     "client_address": "Rua Guerino Marconato",
//     "client_address_city": "Santo Ângelo",
//     "client_address_comp": "Casa",
//     "client_address_district": "José Alcebíades Oliveira",
//     "client_address_number": "311",
//     "client_address_state": "RS",
//     "client_address_country": "BR",
//     "client_zip_code": "98805560",
//     "producer_company_name": "Daluvi Comércio de Produtos Naturais",
//     "producer_trade_name": null,
//     "producer_document": "34110193000155",
//     "producer_state_tax_number": "ISENTO",
//     "producer_address": "Avenida dos Pássaros",
//     "producer_address_city": "Cabo Frio",
//     "producer_address_comp": "casa",
//     "producer_address_district": "Praia do Foguete",
//     "producer_address_number": "67",
//     "producer_address_state": "RJ",
//     "producer_zip_code": "28908550",
//     "producer_tel": "82988990261",
//     "trans_items": [
//       {
//         "plan_key": "pla5k9d1",
//         "plan_name": "Lurevita 1 Mês de Tratamento",
//         "plan_amount": 1,
//         "plan_value": 19790,
//         "product_name": "Lurevita",
//         "product_key": "prolwvzw",
//         "product_type": 1,
//         "main": 1
//       },
//       {
//         "plan_key": "plapgxy8",
//         "plan_name": "Desconto Exclusivo para esta página: 1 Frasco do Lurevita Para Homens",
//         "plan_amount": 1,
//         "plan_value": 4000,
//         "product_name": "Lurevita",
//         "product_key": "prolwvzw",
//         "product_type": 1,
//         "main": 0
//       }
//     ],
//     "commissions_release_date": null,
//     "commissions": [
//       {
//         "type": "Sistema",
//         "document": "29241879000145",
//         "name": "Braip",
//         "email": "braip@braip.com",
//         "value": 1289
//       },
//       {
//         "type": "Afiliado",
//         "document": "34110193000155",
//         "name": "Daluvi comércio de produtos naturais",
//         "email": "lkssurfista@gmail.com",
//         "value": 1
//       },
//       {
//         "type": "Produtor",
//         "document": "34110193000155",
//         "name": "Daluvi Comércio de Produtos Naturais",
//         "email": "contato.lucasdahora@hotmail.com",
//         "value": 22500
//       }
//     ]
//   }

//   var {Tiny} = require('./services/tinyApi')
//   function d() {
//     Tiny.create_order(r)
//   }
//   d()