(async () => {
  const AWS = require('aws-sdk');
  const res = {};
  const ssm = new AWS.SSM();
  const appMoniker = process.env.APP_MONIKER;
  if (!appMoniker) {
    return undefined;
  }
  const Path = '/' + appMoniker + '/';
  const pathPrefixLength = Path.length;
  let nextToken = null;
  
  do {
    const params = {
      Path,
      NextToken: nextToken,
      WithDecryption: true,
    };
    const data = await ssm.getParametersByPath(params).promise();
    if (data) {
      nextToken = data.NextToken;
      data.Parameters.forEach(param => {
        if (param.Name && param.Value) {
          res[param.Name.substr(pathPrefixLength)] = param.Value; // /moniker/name -> name
        }
      });
    } else {
      nextToken = null;
    }
  } while (nextToken);

  Object.entries(res).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
})();