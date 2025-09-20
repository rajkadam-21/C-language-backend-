import axios from 'axios'; // Added missing import

export const compileAndRunC = async (req, res, next) => {
  const { code, input = '' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Validate environment variables
  if (!process.env.JUDGE0_RAPIDAPI_KEY || !process.env.JUDGE0_RAPIDAPI_HOST) {
    return res.status(500).json({ 
      error: 'Server configuration error: Missing Judge0 API credentials' 
    });
  }

  // Judge0 API parameters
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions',
    params: {
      base64_encoded: 'false',
      wait: 'true', // Wait for result, no polling needed for simplicity
      fields: '*'
    },
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.JUDGE0_RAPIDAPI_HOST,
    },
    data: {
      source_code: code,
      language_id: 50, // Language ID for C (GCC 9.4.0)
      stdin: input,
      cpu_time_limit: 5, // 5 second timeout
      memory_limit: 128000, // 128MB memory limit
    }
  };

  try {
    const response = await axios.request(options);
    const result = response.data;

    // Handle compilation and runtime errors gracefully
    let output = '';
    if (result.compile_output) {
      output = result.compile_output;
    } else if (result.stderr) {
      output = result.stderr;
    } else {
      output = result.stdout || 'No output';
    }

    res.json({ 
      output: output,
      exitCode: result.status?.id || 0,
      status: result.status?.description 
    });

  } catch (error) {
    console.error('Judge0 API error:', error.response?.data || error.message);
    
    // More specific error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(502).json({ 
        error: 'Compiler service unavailable',
        details: error.response.data 
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({ 
        error: 'Compiler service not responding' 
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }
};