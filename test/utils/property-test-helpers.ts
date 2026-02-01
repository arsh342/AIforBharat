/**
 * Property-based testing helpers and configuration
 */

export const PropertyTestConfig = {
  iterations: process.env.CI ? 1000 : 100,
  timeout: 30000,
  maxShrinks: 100,
  seed: process.env.PROPERTY_TEST_SEED
    ? parseInt(process.env.PROPERTY_TEST_SEED)
    : undefined,
};

/**
 * Run a property test with custom configuration
 */
export const runPropertyTest = async (
  testFn: (input: any) => Promise<boolean> | boolean,
  generator: () => any,
  options: {
    examples?: number;
    timeout?: number;
    description?: string;
  } = {},
) => {
  const examples = options.examples || PropertyTestConfig.iterations;
  const timeout = options.timeout || PropertyTestConfig.timeout;

  const startTime = Date.now();
  let passedExamples = 0;
  let failedExamples: any[] = [];

  for (let i = 0; i < examples; i++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Property test timed out after ${timeout}ms`);
    }

    try {
      const input = generator();
      const result = await testFn(input);

      if (result) {
        passedExamples++;
      } else {
        failedExamples.push(input);
        if (failedExamples.length > 10) break; // Stop after 10 failures
      }
    } catch (error) {
      failedExamples.push({ input: generator(), error: String(error) });
      if (failedExamples.length > 10) break;
    }
  }

  return {
    passed: failedExamples.length === 0,
    passedExamples,
    failedExamples,
    totalExamples: Math.min(examples, passedExamples + failedExamples.length),
  };
};

/**
 * Shrink a failing example to find minimal case
 */
export const shrinkExample = (
  example: any,
  testFn: (input: any) => boolean,
): any => {
  // Simple shrinking strategy
  if (typeof example === "string" && example.length > 1) {
    const shorter = example.slice(0, Math.floor(example.length / 2));
    if (!testFn(shorter)) {
      return shrinkExample(shorter, testFn);
    }
  }

  if (typeof example === "number" && Math.abs(example) > 1) {
    const smaller = Math.floor(example / 2);
    if (!testFn(smaller)) {
      return shrinkExample(smaller, testFn);
    }
  }

  return example;
};
