const {createClient}=require('./node_modules/@libsql/client');
const c=createClient({url:'file:C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db'});
async function main() {
  const data = await c.execute('SELECT COUNT(*) as cnt FROM insurance_products');
  console.log('Total products:', data.rows[0].cnt);
  const sample = await c.execute('SELECT product_code, product_name, provider, monthly_premium_min FROM insurance_products');
  console.log('Products:', JSON.stringify(sample.rows, null, 2));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
