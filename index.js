'use strict';

const ensureString = require('es5-ext/object/validate-stringifiable-value');
const isValue = require('es5-ext/object/is-value');
const isObject = require('es5-ext/object/is-object');
const memoizee = require('memoizee');
const log = require('log').get('maas-secrets');
const SSM = require('aws-sdk/clients/ssm');

const { SSM_PARAMETERS_PATH } = process.env;

const ssm = new SSM();

const resolveFromPath = memoizee(
  async path => {
    const { Parameters: parameters } = await ssm
      .getParametersByPath({
        Path: path,
        Recursive: true,
        WithDecryption: true,
      })
      .promise();
    const result = new Map(parameters.map(({ Name: name, Value: value }) => [name.slice(path.length), value]));
    log.debug('%s resolved %o', path, result);
    return result;
  },
  {
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

module.exports = async (name, options = {}) => {
  name = ensureString(name);
  if (!isObject(options)) options = {};
  const secrets = await resolveFromPath(options.path);
  const secret = secrets.get(name);
  if (!secret) throw Object.assign(new Error(`${name} secret not found`), { code: 'SECRET_NOT_FOUND' });
  return secret;
};
