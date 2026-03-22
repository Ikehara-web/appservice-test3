const http = require('http');
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');

const port = process.env.PORT || 3000;

async function getAccessToken() {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken("https://database.windows.net/.default");
  return tokenResponse.token;
}

const server = http.createServer(async (req, res) => {
  try {
    const token = await getAccessToken();

    const pool = await sql.connect({
      server: 'ikehara.database.windows.net',
      database: 'free-sql-db-4004134 (ikehara/free-sql-db-4004134)',
      options: {
        encrypt: true
      },
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: token   // 🔥 ここが重要
        }
      }
    });

    const result = await pool.request().query('SELECT GETDATE() AS currentTime');

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`DB接続成功！現在時刻: ${result.recordset[0].currentTime}`);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`エラー: ${err.message}`);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
