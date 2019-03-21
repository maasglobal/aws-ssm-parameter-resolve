# aws-ssm-parameter-resolve

## Automated parameters resolution from [AWS Systems Manager Parameter Store](https://aws.amazon.com/systems-manager/features/#Parameter_Store)

## Installation

```sh
npm install aws-ssm-paramter-resolve
```

## Usage

On first call all parameters (stored at some specified common path) are resolved from AWS, then for all further requests parameters are resolved from cached response.

### Working with one common secrets path

If all secrets are stored at one common path, define it at `SSM_PARAMETERS_PATH` env variable.

Having that resolve needed parameter value by calling an util with trailing parameter path:

```javascript
const ssmParameterResolve = require('aws-ssm-paramter-resolve');

ssmParameterResolve('api-key').then(apiKey => {
  // Assuming that process.env.SSM_PARAMETERS_PATH was '/secrets/foo/'
  // We resolved /secrets/foo/api-key parameter value
  console.log(`Resolved /secrets/foo/api-key: ${apiKey}`);
});
```

### Working with many common secrets path

Default path may be defined at `SSM_PARAMETERS_PATH` env variable (but it's not mandatory)

Resolution of any secret from non default path, should be accompanied with `path` option:

```javascript
const ssmParameterResolve = require('aws-ssm-paramter-resolve');

ssmParameterResolve('api-key', { path: '/secrets/bar/' }).then(apiKey =>
  // We resolved /secrets/foo/api-key parameter value
  console.log(`Resolved /secrets/bar/api-key ${apiKey}`)
);
```

## Test & coverage

```sh
npm run check-coverage
```
