// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Base URL for Porter API (UAT environment)
const PORTER_BASE_URL = process.env.PFE_API_GW_URL ;
const API_KEY = process.env.TOKEN ; // Fallback to hardcoded key if env var not set

// Root endpoint
app.get('/', (req, res) => {
  res.send('Porter API Proxy Server');
});

// Porter initiate_order_flow endpoint
app.post('/v1/simulation/initiate_order_flow', async (req, res) => {
  try {
    const { order_id, flow_type } = req.body;
    
    // Validate required parameters
    if (!order_id || flow_type === undefined) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Both order_id and flow_type are required.' 
      });
    }
    
    console.log(`Forwarding request to initiate order flow for order: ${order_id} with flow type: ${flow_type}`);
    
    // Make request to Porter API
    const response = await axios({
      method: 'POST',
      url: `${PORTER_BASE_URL}/v1/simulation/initiate_order_flow`,
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        order_id,
        flow_type
      }
    });
    
    console.log('Response from Porter API:', response.data);
    
    // Forward the response back to the client
    return res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Error calling Porter API:', error.message);
    
    // Handle error response from Porter API
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Porter API error',
        details: error.response.data
      });
    }
    
    // Handle network errors
    return res.status(500).json({
      error: 'Failed to communicate with Porter API',
      message: error.message
    });
  }
});
app.post('/api/create_order', async (req, res) => {
  try {
    const porterUrl = `${PORTER_BASE_URL}/v1/orders/create`;

    const response = await axios.post(porterUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error creating order:', error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: 'Server Error' };
    res.status(status).json(data);
  }
});
app.get('/my-ip', async (req, res) => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    console.log('Outbound IP:', response.data.ip); // Logs to console
    res.json({ ip: response.data.ip }); // Sends it as a response
  } catch (err) {
    console.error('Error fetching IP:', err.message);
    res.status(500).send('Failed to fetch outbound IP');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Porter Proxy Server running at http://localhost:${PORT}`);
});