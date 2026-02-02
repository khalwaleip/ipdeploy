
import { UserInfo } from '../types';

export interface MpesaResponse {
    success: boolean;
    message: string;
    checkoutRequestID?: string;
}

export const mpesaService = {
    /**
     * Initiates an STK Push to the user's phone.
     * This is a simulated implementation for the demo.
     */
    async initiateStkPush(userInfo: UserInfo, amount: number): Promise<MpesaResponse> {
        console.log(`[M-PESA] Initiating STK Push for ${userInfo.name} to ${userInfo.whatsapp} for KSH ${amount}`);

        // Simulate API network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            message: "An M-Pesa prompt has been sent to your phone. Please enter your PIN to complete the transaction.",
            checkoutRequestID: `KCA-STK-${Math.floor(Math.random() * 1000000)}`
        };
    },

    /**
     * Verifies if the payment was successful.
     */
    async verifyPayment(checkoutRequested: string): Promise<boolean> {
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 5000));
        return true;
    }
};
