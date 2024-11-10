const express = require('express');
const collectionsRouter = require('./collectionsRoute');

const app = express();
app.use(express.json());

app.use('/api/collections', collectionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
