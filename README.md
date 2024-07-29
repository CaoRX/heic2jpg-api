# heic2jpg-api

This is a sample application based on [sharp-heic](https://github.com/CaoRX/sharp-heic) library. This pulumi application will create a pulumi stack, and create the infrastructure for an HTTP API with API Gateway and Lambda on Amazon Web Service(AWS).

# Usage

First, you need to install pulumi:
```sh
brew install pulumi
```
and if you have not used pulumi before, you need to register an account on pulumi.com. Also, you need to install aws-cli, and ensure your aws-cli can connect to your AWS account with correct credentials. You can check the credentials in ~/.aws folder.

Then you can create your infrastructure by following commands:
```sh
npm install
pulumi up # You need to choose a name for your stack
```
and if everything goes well, an endpoint should be shown. Also one lambda function will be shown as the tokenGenerator: you can find a tokenGenerator-xxx function in your lambda function. Each time you run the function, one API token will be added to the token table with credits.

You can then test your HTTP API endpoint by scripts like following:
```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const fileBuffer = fs.readFileSync('sample1.heic');
const base64Image = fileBuffer.toString('base64');
const token = "<YOUR-API-TOKEN>";

axios.post("<YOUR-API-ENDPOINT>", {
  image: base64Image,
  token: token,
})
.then(response => {
  const imageBuffer = Buffer.from(response.data, 'base64');
  fs.writeFileSync('output.jpeg', imageBuffer);
})
.catch(error => {
  console.error(error);
});
```
with an .heic file named sample.heic. If your API works fine, an "output.jpeg" file should be created with the data from API endpoint.
