const axios = require("axios")
let OrdersTemp = require("../models/OrdersTemp")
let Skus = require("../models/Skus")
let EmailsEnviados = require("../models/EmailsEnviados")
const { sendEmail } = require("./email")
const { check_email_enviado } = require("../helpers/verifyEmail")
const { Op, literal, fn, col, where } = require('sequelize')

const token = "35bddacc3d9f40f54162fe228cfbaf944dfc79760e95904f60c31f8915c641f9"

const tipoPagamento = {
    "1": "Boleto", "2": "Cartão de Crédito", "3": "Boleto Parcelado", "4": "Grátis", "5": "Pix"
}

module.exports = {
    Tiny: {
        create_order: async (pedido) => {
            let baseSkus = await Skus.findAll()
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
                if ( typeof baseSkus[item.product_key] == "undefined" ) {
                    skuNaoEncontrados.push(item.product_key)
                }
                body.pedido.itens.push(
                    {
                        "item": {
                            "codigo": baseSkus[item.product_key],
                            "descricao": item.product_name,
                            "unidade": "UN",
                            "quantidade": item.plan_amount,
                            "valor_unitario": item.plan_value
                        }
                    }
                )
            }
            if ( skuNaoEncontrados.length > 0 ) {
                if ( check_email_enviado(pedido) ) return true
                let skus = ""
                for ( let skuNaoEncontrado of skuNaoEncontrados ) {
                    skus += " " + skuNaoEncontrado
                }
                let email = sendEmail({
                    data: pedido.trans_createdate, 
                    skus: skus.slice(1), 
                    cpf: pedido.client_documment, 
                    numero: pedido.plan_key,
                    produto: pedido.product_name
                })
                if ( email ) {
                    EmailsEnviados.create({
                        plan_key: pedido.plan_key,
                        documento: pedido.client_documment
                    })
                }
                return false
            }
            console.log(body.pedido)
            // let options = {
            //     method: "post",
            //     payload: `pedido=${JSON.stringify(body)}`
            // }
            // let response = await axios("https://api.tiny.com.br/api2/pedido.incluir.php", options)
            // if ( response.retorno.status == "OK" ) {
            //      return true
            // }
            // return false
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

let pedidoPlataforma = {
    "basic_authentication": "51dfd96eea8cc2b62785275bca3278",
    "type": "STATUS_ALTERADO",
    "currency": "BRL",
    "plan_name": "Plano Exemplo",
    "plan_key": "pla49nkx",
    "plan_amount": 2,
    "product_name": "Produto Exemplo",
    "product_key": "pro5w34kz",
    "product_type": 1,
    "trans_createdate": "2018-10-03 11:33:28",
    "trans_updatedate": "2018-10-03 11:33:28",
    "trans_key": "ven9po34ds",
    "trans_status": "Aguardando Pagamento",
    "trans_status_code": "1",
    "trans_value": "23569",
    "trans_total_value": "24000",
    "trans_discount_value": "3399",
    "trans_freight": "6944",
    "trans_freight_type": "SEDEX",
    "trans_payment": "1",
    "trans_payment_line": "00000000000000000000000000000000000000000000000",
    "trans_payment_bar_code": "00000000000000000000000000000000000000000000",
    "trans_payment_url": "https://ev.braip.com/checkout/boleto/codigo_da_venda",
    "trans_qrcode_pix": "00020101021226700014",
    "trans_url_pix": "https://ev.braip.com/checkout/pix/xxxx",
    "trans_installments": 3,
    "trans_payment_date": null,
    "is_upsell": "0",
    "meta": {
        "src": ""
    },
    "have_order_bump": 1,
    "subs_key": "xxx",
    "tracking_code": "CODIGO_RASTREIO",
    "shipping_company": "Nome da Transportadora",
    "postback_type": "Afiliado",
    "trans_items": [
        {
            "plan_name": "xxxx",
            "plan_key": "yyyy",
            "plan_amount": 1,
            "plan_value": 1443,
            "product_key": "xxxx",
            "main": true,
            "product_type": 1,
            "product_name": "xxxxxx"
        },
        {
            "plan_name": "xxxx",
            "plan_key": "yyyy",
            "plan_amount": 1,
            "plan_value": 1223,
            "main": false,
            "product_key": "xxxx",
            "product_type": 2,
            "product_name": "xxxxxx"
        }
    ],
    "parent_sale": null,
    "client_name": "XXXXXXXXX XXXXXX XXXXXXXX",
    "client_email": "example@example.com",
    "client_cel": "00000000000",
    "client_documment": "00000000000",
    "client_address": "XXX XXXXXXX XXXXXXX XXXXXXXXX",
    "client_address_city": "XXXXXXXX XXXXXXX",
    "client_address_comp": "Apto 3",
    "client_address_district": "XXXXXXXX",
    "client_address_number": "000",
    "client_address_state": "MG",
    "client_address_country": "BR",
    "client_zip_code": "00000000",
    "trans_total_paid": 0,
    "trans_bank_slips": [
        {
            "installment": 1,
            "value": 1000,
            "status_code": 1,
            "status": "Aguardando Pagamento",
            "value_paid": 0,
            "due_date": "2020-07-20"
        }
    ],
    "producer_company_name": "XXXXX",
    "producer_trade_name": "XXXX",
    "producer_document": "00000000000",
    "producer_state_tax_number": "xxxx",
    "producer_address": "xxxx",
    "producer_adress_city": "xxxxx",
    "producer_address_comp": "xxxxx",
    "producer_address_district": "xxxxxxxx",
    "producer_address_number": "1231",
    "producer_address_state": "MG",
    "producer_zip_code": "35000000",
    "producer_tel": "0000000",
    "commissions_release_date": "2018-11-03 11:33:28",
    "commissions": [
        {
            "type": "Sistema",
            "document": "00000000000",
            "name": "Braip",
            "email": "example@example.com",
            "value": "3000"
        },
        {
            "type": "Produtor",
            "document": "00000000000",
            "name": "XXXXXXX XXXXXXX XXXXXXXXX",
            "email": "example@example.com",
            "value": "3000"
        }
    ]
}
let pedidoOrderBump = {
    type: 'STATUS_ALTERADO',
    basic_authentication: '80745f59b717407e11ec37ef2c6f02ad95676ce8',
    currency: 'BRL',
    plan_name: 'Lurevita 1 Mês de Tratamento',
    plan_key: 'pla5k9d1',
    plan_amount: 1,
    product_name: 'Lurevita',
    product_key: 'prolwvzw',
    product_type: 1,
    trans_createdate: '2024-05-29 17:56:06',
    trans_updatedate: '2024-05-29 17:56:08',
    trans_key: 'ven33x0wng',
    trans_status: 'Aguardando Pagamento',
    trans_status_code: 1,
    trans_value: 23790,
    trans_total_value: 23790,
    trans_discount_value: 0,
    trans_freight: 0,
    trans_freight_type: null,
    trans_payment: 1,
    trans_payment_line: '40192024175000000000500002246742597330000023790',
    trans_payment_bar_code: '40195973300000237902024150000000000000224674',
    trans_payment_url: 'https://ev.braip.com/checkout/boleto/ven33x0wng',
    trans_payment_date: null,
    trans_installments: 1,
    trans_qrcode_pix: null,
    trans_url_pix: null,
    parent_sale: null,
    is_upsell: 0,
    meta: {
      split: '12',
      src: 'facediego',
      utm_source: 'cp160400',
      utm_medium: 'direct-pv-face',
      utm_campaign: '240400',
      utm_id: '120209683485600119',
      utm_content: '120209983604690119',
      utm_term: '120209983604720119',
      fbclid: 'IwAR1h1HwSv6IiKLUOnk-M_Yk4T_uOycRB4BbK2cinRIFHPCYQm2FEUJGPKZs_aem_AffqnMBa1UNBKaLzjVPUSsZlY3eeZiLoueU_RpcsbsXMopU_owgx827xL9tVZYcHaZYpk7qQemaLhedPlQveoN8R'
    },
    have_order_bump: 1,
    subs_key: null,
    tracking_code: null,
    shipping_company: null,
    postback_type: 'Produtor',
    client_name: 'Katia cilene Ribeiro dos Santos',
    client_email: 'kc172689@gmail.com',
    client_cel: '55 55991490404',
    client_documment: '98655019291',
    client_address: 'Rua Guerino Marconato',
    client_address_city: 'Santo Ângelo',
    client_address_comp: 'Casa',
    client_address_district: 'José Alcebíades Oliveira',
    client_address_number: '311',
    client_address_state: 'RS',
    client_address_country: 'BR',
    client_zip_code: '98805560',
    producer_company_name: 'Daluvi Comércio de Produtos Naturais',
    producer_trade_name: null,
    producer_document: '34110193000155',
    producer_state_tax_number: 'ISENTO',
    producer_address: 'Avenida dos Pássaros',
    producer_address_city: 'Cabo Frio',
    producer_address_comp: 'casa',
    producer_address_district: 'Praia do Foguete',
    producer_address_number: '67',
    producer_address_state: 'RJ',
    producer_zip_code: '28908550',
    producer_tel: '82988990261',
    trans_items: [
      {
        plan_key: 'pla5k9d1',
        plan_name: 'Lurevita 1 Mês de Tratamento',
        plan_amount: 1,
        plan_value: 19790,
        product_name: 'Lurevita',
        product_key: 'prolwvzw',
        product_type: 1,
        main: 1
      },
      {
        plan_key: 'plapgxy8',
        plan_name: 'Desconto Exclusivo para esta página: 1 Frasco do Lurevita Para Homens',
        plan_amount: 1,
        plan_value: 4000,
        product_name: 'Lurevita',
        product_key: 'prolwvzw',
        product_type: 1,
        main: 0
      }
    ],
    commissions_release_date: null,
    commissions: [
      {
        type: 'Sistema',
        document: '29241879000145',
        name: 'Braip',
        email: 'braip@braip.com',
        value: 1289
      },
      {
        type: 'Afiliado',
        document: '34110193000155',
        name: 'Daluvi comércio de produtos naturais',
        email: 'lkssurfista@gmail.com',
        value: 1
      },
      {
        type: 'Produtor',
        document: '34110193000155',
        name: 'Daluvi Comércio de Produtos Naturais',
        email: 'contato.lucasdahora@hotmail.com',
        value: 22500
      }
    ]
  }
  
