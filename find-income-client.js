const {createClient}=require('./node_modules/@libsql/client');
const c=createClient({url:'file:C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db'});
async function main() {
  const r = await c.execute(`
    SELECT c.id, c.full_name, c.annual_income, c.age, c.ic_number, c.user_id
    FROM clients c INNER JOIN users u ON c.user_id = u.id
    WHERE c.annual_income IS NOT NULL AND c.annual_income > 0
    LIMIT 5
  `);
  console.log(JSON.stringify(r.rows,null,2));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
