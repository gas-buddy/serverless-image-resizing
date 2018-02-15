# Serverless Image Resizing

## Description

Resizes images on the fly using Amazon S3, AWS Lambda, and Amazon API Gateway.
Using a conventional URL structure and S3 static website hosting with
redirection rules, requests for resized images are redirected to a Lambda
function via API Gateway which will resize the image, upload it to S3, and
redirect the requestor to the resized image. The next request for the resized
image will be served from S3 directly.

This is a serverless fork of the awslabs example. Though we take only the lambda
function from that, the rest of it's architecture we produce via serverless.yaml.

## Usage

1. Build the Lambda function

   The Lambda function uses [sharp][sharp] for image resizing which requires
   native extensions. In order to run on Lambda, it must be packaged on Amazon
   Linux. You can accomplish this as follows:

   ```
   run-gb-service
   npm install
   ```

2. Deploy the serverless stack

    From the same container in which you built the lambda function, run:
    ```
    npm install -g serverless
    export AWS_ACCESS_KEY_ID=<your dev credentials>
    export AWS_SECRET_ACCESS_KEY=<your dev credentials>
    serverless deploy --stage <dev | stage | prod>
    ```
    - To view your saved dev credentials, if any, run `cat ~/.aws/credentials`

    Once complete, at the end of the output check the `endpoints:` heading
    for the url of the API Gateway that performs the dynamic resizing.

3. Test the endpoint

    Make a rest call to "<endpoint url from deploy output>?key=<dimensions>/<s3-image-path>"
    either via a curl GET, or just pasting it in your browser.
    For example: "<endpoint url from deploy output>?key=300x300/b/2007/android/hdpi/logo"

4. (Optional) Restrict resize dimensions

    To restrict the dimensions the function will create, set the environment
    variable `ALLOWED_DIMENSIONS` to a string in the format
    *(HEIGHT)x(WIDTH),(HEIGHT)x(WIDTH),...*.

    For example: *300x300,90x90,40x40*.

## License

This reference architecture sample is [licensed][license] under Apache 2.0.

[license]: LICENSE
[sharp]: https://github.com/lovell/sharp
[amazon-linux]: https://aws.amazon.com/blogs/compute/nodejs-packages-in-lambda/
[cli]: https://aws.amazon.com/cli/
