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
  console.log(API_KEY);
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
    res.json({ ip: response.data.ip }); // Sends it as a responseFCX
  } catch (err) {
    console.error('Error fetching IP:', err.message);
    res.status(500).send('Failed to fetch outbound IP');
  }
});

// Start the server
// Add the get_quote endpoint
app.get('/v1/get_quote', async (req, res) => {
  try {
    // Extract required parameters from query
    const { 
      pickup_details, 
      drop_details, 
      customer 
    } = req.query;

    // Check for required parameters
    if (!pickup_details || !drop_details || !customer) {
      return res.status(400).json({
        error: 'Missing required parameters. pickup_details, drop_details, and customer are required.'
      });
    }

    // Parse JSON parameters if they are provided as strings
    let pickupDetailsObj, dropDetailsObj, customerObj;
    
    try {
      pickupDetailsObj = typeof pickup_details === 'string' ? JSON.parse(pickup_details) : pickup_details;
      dropDetailsObj = typeof drop_details === 'string' ? JSON.parse(drop_details) : drop_details;
      customerObj = typeof customer === 'string' ? JSON.parse(customer) : customer;
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON format in parameters',
        details: parseError.message
      });
    }

    // Validate pickup_details
    if (!pickupDetailsObj.lat || !pickupDetailsObj.lng) {
      return res.status(400).json({
        error: 'pickup_details must include lat and lng with at least 4 decimal places'
      });
    }

    // Validate drop_details
    if (!dropDetailsObj.lat || !dropDetailsObj.lng) {
      return res.status(400).json({
        error: 'drop_details must include lat and lng with at least 4 decimal places'
      });
    }

    // Validate customer
    if (!customerObj.name || !customerObj.mobile) {
      return res.status(400).json({
        error: 'customer must include name and mobile details'
      });
    }

    // Validate customer.mobile
    if (!customerObj.mobile.country_code || !customerObj.mobile.number) {
      return res.status(400).json({
        error: 'customer.mobile must include country_code and number'
      });
    }

    console.log(`Getting quote for pickup at ${pickupDetailsObj.lat},${pickupDetailsObj.lng} 
      and drop at ${dropDetailsObj.lat},${dropDetailsObj.lng}`);

    // Make request to Porter API
    const response = await axios({
      method: 'GET',
      url: `${PORTER_BASE_URL}/v1/get_quote`,
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      params: {
        pickup_details: pickupDetailsObj,
        drop_details: dropDetailsObj,
        customer: customerObj
      }
    });

    console.log('Response from Porter API:', response.data);
    
    // Return the response from the Porter API
    return res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Error calling Porter API for quote:', error.message);
    
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





app.listen(PORT, () => {
  console.log(`Porter Proxy Server running at http://localhost:${PORT}`);
});