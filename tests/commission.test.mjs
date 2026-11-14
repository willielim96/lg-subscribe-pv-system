import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCommission } from '../lib/commission.mjs';
const order = {agent:'A', installed_on:'2026-11-14', cancelled:false, sale_type:'subscribe', pv:15000};
const calc = orders => calculateCommission(orders,'A','2026-11');
test('15000 PV pays full 15 percent basic and confirmed benefits', () => {
  const result = calc([order]);
  assert.equal(result.basic,2250); assert.equal(result.bonus,1200);
  assert.equal(result.allowance,2500); assert.equal(result.support,1000); assert.equal(result.total,6950);
});
test('cash contributes to targets and pays 13 percent once', () => {
  const result=calc([{...order,sale_type:'cash',cash_price:5000}]);
  assert.equal(result.basic,0); assert.equal(result.cash,650); assert.equal(result.bonus,1200); assert.equal(result.total,5350);
});
test('pending cancelled different agents and months excluded', () => {
  assert.equal(calc([{...order,cancelled:true},{...order,installed_on:null},{...order,agent:'B'},{...order,installed_on:'2026-10-14'}]).total,0);
});
test('tier boundaries and support expiration', () => {
  for(const [pv,rate,allowance,support] of [[4999,.05,0,0],[5000,.05,800,0],[5100,.06,800,0],[7500,.06,800,500],[8500,.06,1000,500],[10200,.08,1000,500],[12000,.08,1500,500],[15000,.08,2500,1000],[17000,.10,2500,1000],[20000,.10,3000,1000],[22100,.12,3000,1000],[30000,.12,4000,1000]]) {
    const r=calc([{...order,pv}]); assert.equal(r.bonusRate,rate);assert.equal(r.allowance,allowance);assert.equal(r.support,support);
  }
  assert.equal(calculateCommission([{...order,installed_on:'2027-01-01'}],'A','2027-01').support,0);
});
test('missing cash prices flagged',()=>assert.equal(calc([{...order,sale_type:'cash'}]).missingCashPrices,1));
