import axios from 'axios'; // Added missing import

export const compileAndRunC = async (req, res, next) => {
  const { code, input = '' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '10.2.0',
      files: [{ content: code }],
      stdin: input,
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1
    });

    const result = response.data;
    
    res.json({
      output: result.run.output || result.run.stderr || 'No output',
      exitCode: result.run.code,
      status: result.run.signal ? 'Runtime Error' : 'Success'
    });

  } catch (error) {
    console.error('Piston API error:', error.message);
    res.status(500).json({ error: 'Compilation service error' });
  }
};