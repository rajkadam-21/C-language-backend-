import Docker from 'dockerode';
const docker = new Docker(); // Connects to the local Docker daemon. Ensure it's running.

export const compileAndRunC = async (req, res, next) => {
  const { code, input = '' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
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
    next(error);
  }
};