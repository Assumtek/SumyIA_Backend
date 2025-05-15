
export class WebhookService {
    async handleTransaction(payload: any): Promise<void> {
        console.log("Nova transação aprovada:", payload.status, payload.payment?.method);

        const cliente = payload.contact;
        const produto = payload.product;
        const valor = payload.payment?.total;

        // Aqui você pode implementar a lógica de negócio
        // Por exemplo, salvar no banco de dados, enviar email, etc.
        console.log(`Cliente: ${cliente?.name}, Produto: ${produto?.name}, Valor: R$${valor}`);
    }

    async handleSubscription(payload: any): Promise<void> {
        console.log("Assinatura recebida/atualizada:", payload.subscription);
        // Implementar lógica de negócio para assinaturas
    }

    async handleCancellation(payload: any): Promise<void> {
        console.log("Assinatura cancelada:", payload.subscription);
        // Implementar lógica de negócio para cancelamentos
    }
} 