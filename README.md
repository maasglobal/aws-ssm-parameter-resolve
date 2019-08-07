[![*nix build status][nix-build-image]][nix-build-url]
[![npm version][npm-image]][npm-url]

# aws-ssm-parameter-resolve

## Automated parameters resolution from [AWS Systems Manager Parameter Store](https://aws.amazon.com/systems-manager/features/#Parameter_Store)

## Installation

```sh
npm install aws-ssm-paramter-resolve
```

## Usage

Resolve parameters from common path, if not passed as an argument, it is read from `SSM_PARAMETERS_PATH` env variable.

```javascript
const ssmParameterResolver = require('aws-ssm-parameter-resolve');

ssmParameterResolver.resolve().then(parameters => {
  // Assuming process.env.SSM_PARAMETERS_PATH is '/secrets/foo/'
  console.log(`Param for /secrets/foo/api-key: ${parameters.get('api-key')}`);
});

ssmParameterResolver
  .resolve('/secrets/bar/')
  .then(parameters => console.log(`Resolved /secrets/bar/api-key ${parameters.get('api-key')}`));
```

## Test & coverage

```sh
npm run check-coverage
```

[nix-build-image]: https://travis-ci.org/maasglobal/aws-ssm-parameter-resolve.svg?branch=master
[nix-build-url]: https://travis-ci.org/maasglobal/aws-ssm-parameter-resolve
[npm-image]: https://img.shields.io/npm/v/aws-ssm-parameter-resolve.svg
[npm-url]: https://www.npmjs.com/package/aws-ssm-parameter-resolve
