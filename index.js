const express = require('express');
const cors = require('cors');
const porterRoutes = require('./routers/porter'); // adjust path as needed

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/porter', porterRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
