'use strict';

const ensureString = require('es5-ext/object/validate-stringifiable-value');
const log = require('log').get('maas-secrets');
const SSM = require('aws-sdk/clients/ssm');

const { SSM_SECRETS_PATH } = process.env;
if (!SSM_SECRETS_PATH) throw new Error('Missing SSM_SECRETS_PATH environment variable');

const ssm = new SSM();

const secretsDeferred = ssm
  .getParametersByPath({
    Path: SSM_SECRETS_PATH,
    Recursive: true,
    WithDecryption: true,
  })
  .promise()
  .then(response => {
    const result = new Map();
    const sliceLength = SSM_SECRETS_PATH.length + (SSM_SECRETS_PATH.endsWith('/') ? 0 : 1);
    for (const parameter of response.Parameters) {
      result.set(parameter.Name.slice(sliceLength), parameter.Value);
    }
    log.debug('resolved %o', result);
  });

module.exports = async name => {
  name = ensureString(name);
  const secrets = await secretsDeferred;
  const secret = secrets.get(name);
  if (!secret) throw new Error(`${name} secret not found`);
  return secret;
};
