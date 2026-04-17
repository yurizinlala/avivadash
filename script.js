const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ntjxhmdfzdsbvxukwgvb:yuri91717737@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  return client.query('ALTER TABLE "people" ADD COLUMN "cpf" TEXT; ALTER TABLE "people" ADD CONSTRAINT "people_cpf_key" UNIQUE ("cpf");');
}).then(() => {
  console.log('Success');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
