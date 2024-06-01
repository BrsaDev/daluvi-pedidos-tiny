const axios = require("axios")
let OrdersTemp = require("../models/OrdersTemp")
let Skus = require("../models/Skus")
let SkusOrderBump = require("../models/SkusOrderBump")
let EmailsEnviados = require("../models/EmailsEnviados")
const { sendEmail } = require("./email")
const { check_email_enviado } = require("../helpers/verifyEmail")
const { Op, literal, fn, col, where } = require('sequelize')

const token = "35bddacc3d9f40f54162fe228cfbaf944dfc79760e95904f60c31f8915c641f9"

const tipoPagamento = {
    "1": "Boleto", "2": "Cartão de Crédito", "3": "Boleto Parcelado", "4": "Grátis", "5": "Pix"
}

function diferencaHoras(dtPartida, dtChegada) {
    var date1 = new Date(dtPartida),
    date2 = new Date(dtChegada);
  
    var diffMs = (date2 - date1);
    var diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    return { hora: diffHrs, minutos: diffMins }
  }

function formateData(data) {
    var data = new Date(data)
    return data.toLocaleDateString()
}
function formateValor(valor) {
    if ( valor.toString().length == 5 ) {
        return parseFloat( valor.toString().slice(0, 3) + '.' + valor.toString().slice(3) )
    }
    if ( valor.toString().length == 6 ) {
        return parseFloat( valor.toString().slice(0, 4) + '.' + valor.toString().slice(4) )
    }
    if ( valor.toString().length == 7 ) {
        return parseFloat( valor.toString().slice(0, 5) + '.' + valor.toString().slice(5) )
    }
}

module.exports = {
    Tiny: {
        create_order: async (pedido) => {
            let getSkus = await Skus.findAll()
            getSkus = JSON.parse(JSON.stringify(getSkus, null, 2))
            let baseSkus = {}
            for ( let base of getSkus ) { baseSkus[base.key] = base.sku }

            let getSkusOrderBump = await SkusOrderBump.findAll()
            getSkusOrderBump = JSON.parse(JSON.stringify(getSkusOrderBump, null, 2))
            let baseSkusOrderBump = {}
            for ( let baseOrderBump  of getSkusOrderBump ) { baseSkusOrderBump[baseOrderBump .key] = baseOrderBump .sku }

            let body = {
                "pedido": {
                    "data_pedido": formateData(pedido.trans_createdate),
                    "cliente": {
                        "nome"         : pedido.client_name,
                        "cpf_cnpj"     : pedido.client_documment,
                        "email"        : pedido.client_email,
                        "pais"         : pedido.client_address_country, 
                        "endereco"     : pedido.client_address,
                        "numero"       : pedido.client_address_number,
                        "complemento"  : pedido.client_address_comp,
                        "bairro"       : pedido.client_address_district,
                        "cep"          : pedido.client_zip_code,
                        "cidade"       : pedido.client_address_city,
                        "uf"           : pedido.client_address_city,
                        "fone"         : pedido.client_cel
                    },
                    "itens": [],
                    "nome_transportador": pedido.shipping_company,
                    "forma_pagamento": tipoPagamento[pedido.trans_payment],
                    "valor_frete": pedido.trans_freight,
                    "valor_desconto": pedido.trans_discount_value,
                    "situacao": "Aprovado",
                    "forma_envio": pedido.trans_freight_type,
                    "forma_frete": pedido.trans_freight_type
                }
            }
            let skuNaoEncontrados = []
            if ( typeof pedido.trans_items != 'undefined' ) {
                for ( let item of pedido.trans_items ) {
                    if ( typeof baseSkus[item.product_key] == "undefined" && typeof baseSkusOrderBump[item.plan_key] == "undefined" ) {
                        skuNaoEncontrados.push(item.product_key)
                    }
                    let codigo = typeof baseSkus[item.product_key] == 'undefined' ? baseSkusOrderBump[item.plan_key] : baseSkus[item.product_key]
                    let descricao = typeof baseSkus[item.product_key] == 'undefined' ? item.plan_name : item.product_name
                    body.pedido.itens.push(
                        {
                            "item": {
                                "codigo": codigo,
                                "descricao": descricao,
                                "unidade": "UN",
                                "quantidade": item.plan_amount,
                                "valor_unitario": formateValor(item.plan_value)
                            }
                        }
                    )
                }
            }else {
                if ( typeof baseSkus[pedido.product_key] == "undefined" && typeof baseSkusOrderBump[pedido.plan_key] == "undefined" ) {
                    skuNaoEncontrados.push(pedido.product_key)
                }
                let codigo = typeof baseSkus[pedido.product_key] == 'undefined' ? baseSkusOrderBump[pedido.plan_key] : baseSkus[pedido.product_key]
                let descricao = typeof baseSkus[pedido.product_key] == 'undefined' ? pedido.plan_name : pedido.product_name
                body.pedido.itens.push(
                    {
                        "item": {
                            "codigo": codigo,
                            "descricao": descricao,
                            "unidade": "UN",
                            "quantidade": pedido.plan_amount,
                            "valor_unitario": formateValor(pedido.trans_value)
                        }
                    }
                )
            }
            if ( skuNaoEncontrados.length > 0 ) {
                let checkEmail = await check_email_enviado(pedido)
                if ( checkEmail.erro || !checkEmail ) {
                    let skus = ""
                    for ( let skuNaoEncontrado of skuNaoEncontrados ) {
                        skus += " " + skuNaoEncontrado
                    }
                    let responseEmail = sendEmail({
                        data: pedido.trans_createdate, 
                        skus: skus.slice(1), 
                        cpf: pedido.client_documment, 
                        numero: pedido.plan_key,
                        produto: pedido.product_name
                    })
                    responseEmail.transporter.sendMail(responseEmail.mailOptions, async function (erro, info) {
                        if (erro) {
                            return false
                        } else {
                            await EmailsEnviados.create({
                                plan_key: pedido.plan_key,
                                documento: pedido.client_documment
                            })
                            return true
                        }
                    });
                }
            }
            let response = await axios.post(`https://api.tiny.com.br/api2/pedido.incluir.php?token=${token}&formato=json&pedido=${JSON.stringify(body)}`)
            
            if ( response.data.retorno.status == "OK" ) {
                return body.pedido
            }
            return false
        }
    }
}

  
