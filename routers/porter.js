const express = require('express');
const axios = require('axios');

const router = express.Router();

const BASE_URL = "https://pfe-apigw-uat.porter.in";
const API_KEY = "659d4aaf-3797-4186-b7c3-2c231f5d0e22"; // from screenshot

router.post('/simulate', async (req, res) => {
  const { order_id, flow_type } = req.body;

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/simulation/initiate_order_flow`,
      {
        order_id,
        flow_type,
      },
      {
        headers: {
          'X-API-KEY': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Porter API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to call Porter API',
    });
  }
});

module.exports = router;
