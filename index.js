'use strict';

const ensureString = require('es5-ext/object/validate-stringifiable-value');
const isValue = require('es5-ext/object/is-value');
const d = require('d');
const memoizee = require('memoizee');
const log = require('log').get('maas-secrets');
const SSM = require('aws-sdk/clients/ssm');

const { SSM_PARAMETERS_PATH } = process.env;

const ssm = new SSM();

function strictGetMethod(name) {
  name = ensureString(name);
  const value = Map.prototype.get.call(this, name);
  if (!value) throw Object.assign(new Error(`${name} secret not found`), { code: 'SECRET_NOT_FOUND' });
  return value;
}

module.exports = memoizee(
  async (path = null) => {
    const { Parameters: parameters } = await ssm
      .getParametersByPath({ Path: path, Recursive: true, WithDecryption: true })
      .promise();
    const result = Object.defineProperties(
      new Map(parameters.map(({ Name: name, Value: value }) => [name.slice(path.length), value])),
      { get: d(strictGetMethod) }
    );
    log.debug('%s resolved %o', path, result);
    return result;
  },
  {
    length: 1,
    promise: true,
    resolvers: [
      path => {
        if (!isValue(path)) {
          if (!SSM_PARAMETERS_PATH) {
            throw Object.assign(new Error('Missing SSM_PARAMETERS_PATH environment variable'), {
              code: 'SECRETS_PATH_UNDEFINED',
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
);
