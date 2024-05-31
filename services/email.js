var nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'daluvi.dev@gmail.com',
        pass: ''
    }
});


module.exports = {
    sendEmail: (pedido) => {
        var mailOptions = {
            from: 'daluvi.dev@gmail.com',
            to: 'brsilvaaraujo@gmail.com', // adm@daluvi.com
            subject: 'Aviso! Pedido não enviado',
            html: `<h2 style="color: #c20000;">Informação urgente!</h2>
<h3 style="font-style: italic; color: #c20000;">O pedido não foi enviado, pois não encontrou o sku correspondente.</h3>
<br>
<strong>
PlanKey:     ${pedido.numero}<br>
ProductName: ${pedido.produto}<br>
Documento:   ${pedido.cpf}<br>
Skus:        ${pedido.skus}<br>
Data:        ${pedido.data}<br>
</strong><br><br>

<strong>OBS:</strong> <span style="font-style: italic;">Inserir ou ajustar o sku correspondente ao pedido para enviar.</span>
            `
        };

        return {mailOptions, transporter}
    }
}

