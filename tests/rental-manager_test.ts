import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Equipment can be added by owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('rental-manager', 'add-equipment', [
                types.uint(1),
                types.ascii("Lawn Mower"),
                types.uint(1000),
                types.uint(50)
            ], deployer.address),
            
            Tx.contractCall('rental-manager', 'add-equipment', [
                types.uint(2),
                types.ascii("Power Drill"),
                types.uint(500),
                types.uint(25)
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr(types.uint(100)); // err-owner-only
    }
});

Clarinet.test({
    name: "Equipment can be rented with sufficient deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('rental-manager', 'add-equipment', [
                types.uint(1),
                types.ascii("Lawn Mower"),
                types.uint(1000),
                types.uint(50)
            ], deployer.address),
            
            Tx.contractCall('rental-manager', 'rent-equipment', [
                types.uint(1)
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectOk();
    }
});

Clarinet.test({
    name: "Equipment can be returned by renter",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('rental-manager', 'add-equipment', [
                types.uint(1),
                types.ascii("Lawn Mower"),
                types.uint(1000),
                types.uint(50)
            ], deployer.address),
            
            Tx.contractCall('rental-manager', 'rent-equipment', [
                types.uint(1)
            ], wallet1.address),
            
            Tx.contractCall('rental-manager', 'return-equipment', [
                types.uint(1)
            ], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectOk();
        block.receipts[2].result.expectOk();
    }
});
