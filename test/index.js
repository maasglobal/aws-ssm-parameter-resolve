/* eslint-disable class-methods-use-this */

'use strict';

const { expect } = require('chai');
const proxyquire = require('proxyquire');

class SSMMock {
  getParametersByPath(options) {
    return {
      promise() {
        if (options.Path === '/default-path/') {
          return Promise.resolve({
            Parameters: [
              {
                Name: '/default-path/ENDPOINT_KEY',
                Type: 'SecureString',
                Value: 'some-fii',
                Version: 1,
                LastModifiedDate: new Date(),
                ARN: 'arn:aws:ssm:eu-west-1:756207178743:parameter/default-path/ENDPOINT_KEY',
              },
              {
                Name: '/default-path/ENDPOINT_URL',
                Type: 'SecureString',
                Value: 'some-elo',
                Version: 1,
                LastModifiedDate: new Date(),
                ARN: 'arn:aws:ssm:eu-west-1:756207178743:parameter/default-path/ENDPOINT_URL',
              },
            ],
          });
        }
        if (options.Path === '/custom-path/') {
          return Promise.resolve({
            Parameters: [
              {
                Name: '/custom-path/CUSTOM_KEY',
                Type: 'SecureString',
                Value: 'some-fii-custom',
                Version: 1,
                LastModifiedDate: new Date(),
                ARN: 'arn:aws:ssm:eu-west-1:756207178743:parameter/custom-path/ENDPOINT_KEY',
              },
              {
                Name: '/custom-path/ENDPOINT_URL',
                Type: 'CustomSecureString',
                Value: 'some-custom-elo',
                Version: 1,
                LastModifiedDate: new Date(),
                ARN: 'arn:aws:ssm:eu-west-1:756207178743:parameter/custom-path/ENDPOINT_URL',
              },
            ],
          });
        }
        return Promise.reject(new Error('No mock resolved'));
      },
    };
  }
}

process.env.SSM_PARAMETERS_PATH = '/default-path/';
const parameterResolve = proxyquire('../', { 'aws-sdk/clients/ssm': SSMMock });

describe('aws-ssm-parameter-resolve', () => {
  it('Should resolve secret values by default from SSM_PARAMETERS_PATH', async () => {
    const params = await parameterResolve();
    expect(params.get('ENDPOINT_KEY')).to.equal('some-fii');
    expect(params.get('ENDPOINT_URL')).to.equal('some-elo');
  });

  it('Should resolve secret values from custom path', async () => {
    const params = await parameterResolve('/custom-path/');
    expect(params.get('CUSTOM_KEY')).to.equal('some-fii-custom');
    expect(params.get('ENDPOINT_URL')).to.equal('some-custom-elo');
  });

  it('Should crash if secret is not resolved', async () => {
    const params = await parameterResolve();
    try {
      params.get('NOT_EXISTING');
      throw new Error('Not really');
    } catch (error) {
      expect(error.code).to.equal('SECRET_NOT_FOUND');
    }
  });
});
