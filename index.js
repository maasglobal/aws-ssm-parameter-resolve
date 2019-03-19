'use strict';

const ensureString = require('es5-ext/object/validate-stringifiable-value');
const isObject = require('es5-ext/object/is-object');
const memoizee = require('memoizee');
const log = require('log').get('maas-secrets');
const SSM = require('aws-sdk/clients/ssm');

const { SSM_SECRETS_PATH } = process.env;

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
        path = ensureString(path);
        if (!path.endsWith('/')) path += '/';
        return path;
      },
    ],
  }
);

module.exports = async (name, options = {}) => {
  name = ensureString(name);
  if (!isObject(options)) options = {};
  const path = (() => {
    if (options.path) return options.path;
    if (!SSM_SECRETS_PATH) throw new Error('Missing SSM_SECRETS_PATH environment variable');
    return SSM_SECRETS_PATH;
  })();
  const secrets = await resolveFromPath(path);
  const secret = secrets.get(name);
  if (!secret) throw new Error(`${name} secret not found`);
  return secret;
};
