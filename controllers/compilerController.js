import axios from 'axios'; // Added missing import

export const compileAndRunC = async (req, res, next) => {
  const { code, input = '' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    // Check if the code contains input functions
    const hasInputFunctions = /scanf|gets|fgets|getchar|fgetc|getc/.test(code);
    
    // If the code has input functions and no input is provided, 
    // we need to handle it differently
    if (hasInputFunctions && !input) {
      // Return a special marker indicating the program is waiting for input
      return res.json({
        output: '@@WAITING_FOR_INPUT@@Program is waiting for input...',
        exitCode: 0,
        status: 'Waiting for input'
      });
    }

    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'c',
      version: '10.2.0',
      files: [{ content: code }],
      stdin: input,
      args: [],
      compile_timeout: 10000,
      run_timeout: 10000, // Increased timeout
      compile_memory_limit: -1,
      run_memory_limit: -1
    });

    const result = response.data;
    
    // Check if the program might need more input
    if (result.run.stderr && result.run.stderr.includes('EOF') && 
        result.run.code !== 0 && input) {
      return res.json({
        output: '@@WAITING_FOR_INPUT@@' + (result.run.output || result.run.stderr),
        exitCode: result.run.code,
        status: 'Waiting for input'
      });
    }
    
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