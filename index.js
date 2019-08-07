'use strict';

const ensureString = require('es5-ext/object/validate-stringifiable-value');
const isValue = require('es5-ext/object/is-value');
const d = require('d');
const memoizee = require('memoizee');
const log = require('log').get('aws-ssm-parameter');
const SSM = require('aws-sdk/clients/ssm');

const { SSM_PARAMETERS_PATH, SSM_MAX_AGE } = process.env;

const ssm = new SSM({
  maxRetries: 5,
  retryDelayOptions: {
    base: 300,
  },
});

function strictGetMethod(name) {
  name = ensureString(name);
  const value = Map.prototype.get.call(this, name);
  if (!value) throw Object.assign(new Error(`${name} parameter not found`), { code: 'PARAMETER_NOT_FOUND' });
  return value;
}

module.exports = {
  resolve: memoizee(
    async (path = null) => {
      const result = Object.defineProperty(new Map(), 'strictGet', d(strictGetMethod));
      let nextToken;
      do {
        const awsResult = await ssm
          .getParametersByPath({ Path: path, Recursive: true, WithDecryption: true, NextToken: nextToken })
          .promise();
        for (const { Name: name, Value: value } of awsResult.Parameters) {
          result.set(name.slice(path.length), value);
        }
        nextToken = awsResult.NextToken;
      } while (nextToken);
      log.debug('%s resolved %o', path, result);
      return result;
    },
    {
      length: 1,
      maxAge: SSM_MAX_AGE,
      promise: true,
      resolvers: [
        path => {
          if (!isValue(path)) {
            if (!SSM_PARAMETERS_PATH) {
              throw Object.assign(new Error('Missing SSM_PARAMETERS_PATH environment variable'), {
                code: 'PARAMETERS_PATH_UNDEFINED',
              });
            }
            path = SSM_PARAMETERS_PATH;
          } else {
            path = ensureString(path);
          }
          if (!path.endsWith('/')) path += '/';
          return path;
        },
      ],
    }
  ),
};
