const axios = require("axios")
let OrdersTemp = require("../models/OrdersTemp")
let Skus = require("../models/Skus")
let EmailsEnviados = require("../models/EmailsEnviados")
const { sendEmail } = require("./email")
const { check_email_enviado } = require("../helpers/verifyEmail")
const { Op, literal, fn, col, where } = require('sequelize')

const token = ""

const tipoPagamento = {
    "1": "Boleto", "2": "Cartão de Crédito", "3": "Boleto Parcelado", "4": "Grátis", "5": "Pix"
}

module.exports = {
    Tiny: {
        create_order: async (pedido) => {
            let getSkus = await Skus.findAll()
            getSkus = JSON.parse(JSON.stringify(getSkus, null, 2))
            let baseSkus = {}
            for ( let base of getSkus ) { baseSkus[base.key] = base.sku }
            let body = {
                "pedido": {
                    "data_pedido": pedido.trans_createdate,
                    "data_prevista": "22/10/2014",
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
            for ( let item of pedido.trans_items ) {
                if ( typeof baseSkus[item.plan_key] == "undefined" ) {
                    skuNaoEncontrados.push(item.plan_key)
                }
                body.pedido.itens.push(
                    {
                        "item": {
                            "codigo": baseSkus[item.plan_key],
                            "descricao": item.product_name,
                            "unidade": "UN",
                            "quantidade": item.plan_amount,
                            "valor_unitario": item.plan_value
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
            let options = {
                method: "post",
                payload: `pedido=${JSON.stringify(body)}`
            }
            let response = await axios(`https://api.tiny.com.br/api2/pedido.incluir.php?token=${token}&formato=json`, options)
            if ( response.retorno.status == "OK" ) {
                return body.pedido
            }
            return false
        }
    }
}

function diferencaHoras(dtPartida, dtChegada) {
  var date1 = new Date(dtPartida),
  date2 = new Date(dtChegada);

  var diffMs = (date2 - date1);
  var diffHrs = Math.floor((diffMs % 86400000) / 3600000);
  var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
  return { hora: diffHrs, minutos: diffMins }
}

  
